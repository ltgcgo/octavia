"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";
import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {VoiceBank} from	"./bankReader.js";
import {bankDecoder} from "./bankDecoder.js";
import {
	xgEffType,
	xgPartMode,
	xgSgVocals,
	xgDelOffset,
	xgNormFreq,
	xgLfoFreq,
	getSgKana,
	getXgRevTime,
	getXgDelayOffset,
	getVlCtrlSrc
} from "./xgValues.js";
import {
	gsRevType,
	gsChoType,
	gsDelType,
	gsParts,
	getGsEfx,
	getGsEfxDesc,
	mt32DefProg
} from "./gsValues.js";
import {
	toDecibel,
	gsChecksum,
	korgFilter,
	x5dSendLevel
} from "./utils.js";

const modeIdx = [
	"?",
	"gm", "gs", "xg", "g2",
	"mt32", "ns5r", "x5d", "05rw", "sd",
	"k11", "sg",
	"krs", "s90es", "motif"
];
const substList = [
	[0, 0, 0, 0, 121, 0,   0, 82, 81, 97, 0, 0, 63, 63, 63],
	[0, 0, 4, 0, 0,   127, 0, 0,  0,  0,  0, 0, 0,  0,  0]
];
const drumMsb = [120, 127, 120, 127, 120, 127, 61, 62, 62, 105, 120, 122, 122, 127];
const passedMeta = [0, 3, 81, 84, 88]; // What is meta event 32?
const eventTypes = {
	8: "Off",
	9: "On",
	10: "Note aftertouch",
	11: "cc",
	12: "pc",
	13: "Channel aftertouch",
	14: "Pitch"
};

const useRpnMap = {
	0: 0,
	1: 1,
	2: 3,
	5: 4
},
rpnCap = [
	[0, 24],
	[0, 127],
	[0, 127],
	[40, 88],
	[0, 127],
	[0, 127]
],
useNormNrpn = [36, 37],
useDrumNrpn = [20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 36, 37, 64, 65],
ccAccepted = [
	0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 32,
	38, 64, 65, 66, 67, 68, 69, 70, 71,
	72, 73, 74, 75, 76, 77, 78, 84, 91,
	92, 93, 94, 95, 98, 99, 100, 101,
	128, // Dry level (internal register for Octavia)
	12, 13, // General-purpose effect controllers
	16, 17, 18, 19 // General-purpose sound controllers
], // 96, 97, 120 to 127 all have special functions
aceCandidates = [12, 13, 16, 17, 18, 19],
nrpnCcMap = [33, 99, 100, 32, 102, 8, 9, 10]; // cc71 to cc78

const korgDrums = [0, 16, 25, 40, 32, 64, 26, 48];

let modeMap = {};
modeIdx.forEach((e, i) => {
	modeMap[e] = i;
});
let ccToPos = {
	length: ccAccepted.length
};
ccAccepted.forEach((e, i) => {
	ccToPos[e] = i;
});
let dnToPos = {
	length: useDrumNrpn.length
};
useDrumNrpn.forEach((e, i) => {
	dnToPos[e] = i;
});

let getDebugState = function () {
	return !!self.Bun || self.debugMode || false; // If run on Bun.js, output all possible logs
};
let sysExSplitter = function (seq) {
	let seqArr = [];
	let seqStart = 0;
	seq?.forEach(function (e, i) {
		if (e == 247) {
			// End of SysEx
			seqArr.push(seq.subarray(seqStart, i));
		} else if (e == 240) {
			seqStart = i + 1;
		} else {
			//seqArr[seqArr.length - 1].push(e);
		};
	});
	if (!seqArr.length) {
		seqArr.push(seq.subarray(0));
	};
	if (getDebugState()) {
		console.debug(seqArr);
	};
	return seqArr;
};
let showTrue = function (data, prefix = "", suffix = "", length = 2) {
	return data ? `${prefix}${data.toString().padStart(length, "0")}${suffix}` : "";
};

const allocated = {
	ch: 128, // channels
	cc: ccAccepted.length, // control changes
	nn: 128, // notes per channel
	pl: 512, // polyphony
	tr: 256, // tracks
	cmt: 14, // C/M timbre storage size
	rpn: 6,
	ace: 8, // active custom effect
	drm: 8, // Drum setup slots
	dpn: useDrumNrpn.length, // Drum setup params
	dnc: 128, // drum note 0 to 127
	efx: 7
};

let OctaviaDevice = class extends CustomEventSource {
	// Constants
	NOTE_IDLE = 0;
	NOTE_ATTACK = 1;
	NOTE_DECAY = 2;
	NOTE_SUSTAIN = 3;
	NOTE_HELD = 4;
	NOTE_RELEASE = 5;
	NOTE_SOSTENUTO_ATTACK = 8;
	NOTE_SOSTENUTO_DECAY = 9;
	NOTE_SOSTENUTO_SUSTAIN = 10;
	NOTE_SOSTENUTO_HELD = 11;
	CH_MELODIC = 0;
	CH_DRUMS = 1;
	CH_DRUM1 = 2;
	CH_DRUM2 = 3;
	CH_DRUM3 = 4;
	CH_DRUM4 = 5;
	CH_DRUM5 = 6;
	CH_DRUM6 = 7;
	CH_DRUM7 = 8;
	CH_DRUM8 = 9;
	// Values
	#mode = 0;
	#bitmapPage = 0;
	#bitmapExpire = 0;
	#bitmapStore = new Array(11); // 10 pages of bitmaps, 1 KORG bitmap
	get #bitmap() {
		return this.#bitmapStore[this.#bitmapPage];
	};
	set #bitmap(value) {
		this.#bitmapStore[this.#bitmapPage] = value;
	};
	#chActive = new Uint8Array(allocated.ch); // Whether the channel is in use
	#chReceive = new Uint8Array(allocated.ch); // Determine the receiving channel
	#chType = new Uint8Array(allocated.ch); // Types of channels
	#cc = new Uint8Array(allocated.ch * allocated.cc); // 64 channels, 128 controllers
	#ace = new Uint8Array(allocated.ace); // 4 active custom effects
	#prg = new Uint8Array(allocated.ch);
	#velo = new Uint8Array(allocated.ch * allocated.nn); // 64 channels. 128 velocity registers
	#mono = new Uint8Array(allocated.ch); // Mono/poly mode
	#poly = new Uint16Array(allocated.pl); // 512 polyphony allowed
	#polyState = new Uint8Array(allocated.pl); // State of each active voice.
	#pitch = new Int16Array(allocated.ch); // Pitch for channels, from -8192 to 8191
	#rawStrength = new Uint8Array(allocated.ch);
	#dataCommit = 0; // 0 for RPN, 1 for NRPN
	#rpn = new Uint8Array(allocated.ch * allocated.rpn); // RPN registers (0 pitch MSB, 1 fine tune MSB, 2 fine tune LSB, 3 coarse tune MSB, 4 mod sensitivity MSB, 5 mod sensitivity LSB)
	#nrpn = new Int8Array(allocated.ch * useNormNrpn.length); // Normal section of NRPN registers
	#drum = new Uint8Array(allocated.drm * allocated.dpn * allocated.dnc); // Drum setup
	#bnCustom = new Uint8Array(allocated.ch); // Custom name activation
	#cmTPatch = new Uint8Array(128); // C/M part patch storage
	#cmTTimbre = new Uint8Array(allocated.cmt * 8); // C/M part timbre storage
	#cmPatch = new Uint8Array(1024); // C/M device patch storage
	#cmTimbre = new Uint8Array(allocated.cmt * 64); // C/M device timbre storage (64)
	#efxBase = new Uint8Array(allocated.efx * 3); // Base register for EFX types
	#efxTo = new Uint8Array(allocated.ch); // Define EFX targets for each channel
	#subMsb = 0; // Allowing global bank switching
	#subLsb = 0;
	#masterVol = 100;
	#metaChannel = 0;
	#noteLength = 500;
	#convertLastSyllable = 0;
	#letterDisp = "";
	#letterExpire = 0;
	#selectPort = 0;
	#receiveRS = true; // Receive remote switch
	#modeKaraoke = false;
	#receiveTree;
	// Temporary EFX storage
	#gsEfxSto = new Uint8Array(2);
	// Metadata text events
	#metaTexts = [];
	// GS Track Occupation
	#trkRedir = new Uint8Array(allocated.ch);
	#trkAsReq = new Uint8Array(allocated.tr); // Track Assignment request
	baseBank = new VoiceBank("gm", "gm2", "xg", "gs", "ns5r", "sd", "gmega", "plg-150vl", "plg-150pf", "plg-150dx", "plg-150an", "plg-150dr", "plg-100sg", "kross", "s90es"); // Load all possible voice banks
	userBank = new VoiceBank("gm"); // User-defined bank for MT-32, X5DR and NS5R
	initOnReset = false; // If this is true, Octavia will re-init upon mode switches
	aiEfxName = "";
	chRedir(part, track, noConquer) {
		if (this.#trkAsReq[track]) {
			// Allow part assigning via meta
			let metaChosen = (this.#trkAsReq[track] - 1) * 16 + part;
			return metaChosen;
		} else if ([2, 3].indexOf(this.#subLsb) > -1) {
			// Do not conquer channels if requested.
			if (noConquer == 1) {
				return part;
			};
			let shift = 0, unmet = true;
			while (unmet) {
				if (this.#trkRedir[part + shift] == 0) {
					this.#trkRedir[part + shift] = track;
					console.debug(`Assign track ${track} to channel ${part + shift + 1}.`);
					unmet = false;
				} else if (this.#trkRedir[part + shift] == track) {
					unmet = false;
				} else {
					shift += 16;
					if (shift >= 128) {
						shift = 0;
						unmet = false;
					};
				};
			};
			return part + shift;
		} else {
			return part;
		};
	};
	// Exec Pools
	forceVoiceRefresh() {
		for (let part = 0; part < allocated.ch; part ++) {
			if (this.#chActive[part]) {
				this.dispatchEvent("voice", {
					part
				});
			};
		};
	};
	// Meta event pool
	#metaRun = [];
	// Sequencer specific meta pool
	#metaSeq;
	// Universal actions
	#ua = {
		nOff: (part, note) => {
			// Note off
			let rawNote = part * 128 + note;
			let polyIdx = this.#poly.lastIndexOf(rawNote);
			if (polyIdx > -1) {
				if (this.#cc[allocated.cc * part + ccToPos[64]] > 63) {
					// Held by cc64
					this.#polyState[polyIdx] = this.NOTE_HELD;
					this.dispatchEvent("note", {
						part,
						note,
						velo: this.#velo[rawNote],
						state: this.NOTE_HELD
					});
				} else if (this.#cc[allocated.cc * part + ccToPos[66]] > 63 && this.#polyState[polyIdx] == this.NOTE_SOSTENUTO_SUSTAIN) {
					// Held by cc66
					this.#polyState[polyIdx] = this.NOTE_SOSTENUTO_HELD;
					this.dispatchEvent("note", {
						part,
						note,
						velo: this.#velo[rawNote],
						state: this.NOTE_SOSTENUTO_HELD
					});
				} else {
					this.#poly[polyIdx] = 0;
					this.#velo[rawNote] = 0;
					this.#polyState[polyIdx] = this.NOTE_IDLE;
					this.dispatchEvent("note", {
						part,
						note,
						velo: 0,
						state: this.NOTE_IDLE
					});
				};
			};
		},
		nOn: (part, note, velo) => {
			// Note on
			let rawNote = part * 128 + note;
			let place = 0;
			if (this.#mono[part]) {
				// Shut all previous notes off in mono mode
				this.#ua.ano(part);
			};
			while (this.#polyState[place] > 0 && this.#poly[place] != rawNote) {
				// If just by judging whether a polyphonic voice is occupied,
				// "multi" mode is considered active.
				// If "rawNote" is also taken into consideration,
				// this will be "single" mode instead.
				// 0: idle
				// 1: attack
				// 2: decay
				// 3: sustain (active)
				// 4: hold
				// 5: release
				// 6: sostenuto sustain
				// 7: sostenuto hold
				place ++;
			};
			if (place < allocated.pl) {
				this.#poly[place] = rawNote;
				this.#velo[rawNote] = velo;
				this.#polyState[place] = this.NOTE_SUSTAIN;
				if (this.#rawStrength[part] < velo) {
					this.#rawStrength[part] = velo;
				};
				this.dispatchEvent("note", {
					part,
					note,
					velo,
					state: this.NOTE_SUSTAIN
				});
				//console.debug(place);
			} else {
				console.error("Polyphony exceeded.");
			};
		},
		nAt: (part, note, velo) => {
			// Note/polyphonic aftertouch
		},
		cAt: (part, velo) => {
			// Channel aftertouch
		},
		hoOf: (part) => {
			// Scan and turn off all notes held by cc64
			this.#polyState.forEach((e, i) => {
				if (e == this.NOTE_HELD) {
					// Held by cc64
					let rawNote = this.#poly[i];
					let channel = rawNote >> 7;
					if (part == channel) {
						this.#polyState[i] = this.NOTE_IDLE;
						this.#poly[i] = 0;
						this.#velo[rawNote] = 0;
						this.dispatchEvent("note", {
							part,
							note: rawNote & 127,
							velo: 0,
							state: this.NOTE_IDLE
						});
					};
				};
			});
		},
		soOn: (part) => {
			// Scan and convert all unoccupied active notes to be managed by sostenuto
			this.#polyState.forEach((e, i) => {
				let emitEvent;
				switch (e) {
					case this.NOTE_ATTACK: {
						emitEvent = this.NOTE_SOSTENUTO_ATTACK;
						break;
					};
					case this.NOTE_DECAY: {
						emitEvent = this.NOTE_SOSTENUTO_DECAY;
						break;
					};
					case this.NOTE_SUSTAIN: {
						emitEvent = this.NOTE_SOSTENUTO_SUSTAIN;
						break;
					};
				};
				if (emitEvent) {
					this.#polyState[i] = emitEvent;
					let rawNote = this.#poly[i];
					this.dispatchEvent("note", {
						part,
						note: rawNote & 127,
						velo: this.#velo[rawNote],
						state: emitEvent
					});
				};
			});
		},
		soOf: (part) => {
			// Scan and turn off all notes held by cc66
			this.#polyState.forEach((e, i) => {
				if (e == this.NOTE_SOSTENUTO_HELD) {
					// Held by cc66
					let rawNote = this.#poly[i];
					let channel = rawNote >> 7;
					if (part == channel) {
						this.#polyState[i] = this.NOTE_IDLE;
						this.#poly[i] = 0;
						this.#velo[rawNote] = 0;
						this.dispatchEvent("note", {
							part,
							note: rawNote & 127,
							velo: 0,
							state: this.NOTE_IDLE
						});
					};
				};
			});
		},
		ano: (part) => {
			// All notes off
			// Current implementation uses the static velocity register
			this.#poly.forEach((e, i, a) => {
				let ch = e >> 7, no = e & 127;
				if (e == 0 && this.#velo[0] == 0) {
				} else if (ch == part) {
					this.#ua.nOff(ch, no);
				};
			});
		}
	};
	// Channel event pool
	#runChEvent = {
		8: function (det) {
			let part = det.channel;
			// Note off, velocity should be ignored.
			let rawNote = det.data[0];
			this.#ua.nOff(part, rawNote);
		},
		9: function (det) {
			let part = det.channel;
			// Note on, but should be off if velocity is 0.
			// Set channel active
			this.setChActive(part, 1)
			let rawNote = det.data[0];
			let velocity = det.data[1];
			if (velocity > 0) {
				this.#ua.nOn(part, rawNote, velocity);
			} else {
				this.#ua.nOff(part, rawNote);
			};
		},
		10: function (det) {
			let part = det.channel;
			// Note aftertouch.
			// Currently it directly changes velocity to set value.
			let rawNote = part * 128 + det.data[0];
			let polyIdx = this.#poly.indexOf(rawNote);
			if (polyIdx > -1) {
				this.#velo[rawNote] = data[1];
				this.dispatchEvent("note", {
					part,
					note: det.data[0],
					velo: det.data[1],
					state: this.NOTE_SUSTAIN
				});
			};
		},
		11: function (det) {
			let part = det.channel;
			// CC event, directly assign values to the register.
			if ([0, 32].indexOf(det.data[0]) > -1) {
				(() => {
					switch(this.#mode) {
						case modeMap.s90es:
						case modeMap.motif: {
							if (det.data[0] == 0) {
								([0, 63].indexOf(det.data[1]) > -1) && (this.setChActive(part, 1));
								break;
							};
							det.data[1] && (this.setChActive(part, 1));
							break;
						};
						default: {
							this.setChActive(part, 1);
							break;
						};
					};
				})();
			};
			let chOffset = part * allocated.cc;
			// Non-store CC messages
			switch (det.data[0]) {
				case 96: {
					// RPN Data increment
					return;
					break;
				};
				case 97: {
					// RPN Data decrement
					return;
					break;
				};
				case 120: {
					// All sound off, but keys stay on
					return;
					break;
				};
				case 121: {
					// Reset controllers
					this.#ua.ano(part);
					this.#pitch[part] = 0;
					let chOff = part * allocated.cc;
					// Reset to zero
					this.#cc[chOff + ccToPos[1]] = 0; // Modulation
					this.#cc[chOff + ccToPos[5]] = 0; // Portamento Time
					this.#cc[chOff + ccToPos[64]] = 0; // Sustain
					this.#cc[chOff + ccToPos[65]] = 0; // Portamento
					this.#cc[chOff + ccToPos[66]] = 0; // Sostenuto
					this.#cc[chOff + ccToPos[67]] = 0; // Soft Pedal
					// Reset to full
					this.#cc[chOff + ccToPos[11]] = 127; // Expression
					// RPN/NRPN to null
					this.#cc[chOff + ccToPos[101]] = 127;
					this.#cc[chOff + ccToPos[100]] = 127;
					this.#cc[chOff + ccToPos[99]] = 127;
					this.#cc[chOff + ccToPos[98]] = 127;
					return;
					break;
				};
				case 123: {
					// All notes off
					this.#ua.ano(part);
					return;
					break;
				};
				case 124: {
					// Omni off
					this.#ua.ano(part);
					return;
					break;
				};
				case 125: {
					// Omni on
					this.#ua.ano(part);
					return;
					break;
				};
				case 126: {
					// Mono mode
					this.#mono[part] = 1;
					this.#ua.ano(part);
					return;
					break;
				};
				case 127: {
					// Poly mode
					this.#mono[part] = 0;
					this.#ua.ano(part);
					return;
					break;
				};
			};
			// Check if control change is accepted
			if (ccToPos[det.data[0]] == undefined) {
				console.warn(`cc${det.data[0]} is not accepted.`);
			} else {
				// ACE allocation
				if (aceCandidates.indexOf(det.data[0]) > -1) {
					this.allocateAce(det.data[0]);
				};
				// Stored CC messages
				switch (det.data[0]) {
					case 0: {
						// Detect mode via bank MSB
						if (getDebugState()) {
							console.debug(`${modeIdx[this.#mode]}, CH${part + 1}: ${det.data[1]}`);
						};
						if (this.#mode == 0) {
							if (det.data[1] < 48) {
								// Do not change drum channel to a melodic
								if (this.#chType[part] > 0) {
									det.data[1] = this.#cc[chOffset];
									det.data[1] = 120;
									console.debug(`Forced channel ${part + 1} to stay drums.`);
								};
								if (det.data[1] > 0) {
									console.debug(`Roland GS detected with MSB: ${det.data[1]}`);
									this.switchMode("gs");
								};
							} else if (det.data[1] == 62) {
								this.switchMode("x5d");
							} else if (det.data[1] == 63) {
								this.switchMode("krs");
							} else if (det.data[1] == 64 || det.data[1] == 127) {
								this.switchMode("xg");
							};
						} else if (this.#mode == modeMap.gs) {
							if (det.data[1] < 56) {
								// Do not change drum channel to a melodic
								if (this.#chType[part] > 0) {
									det.data[1] = this.#cc[chOffset];
									det.data[1] = 120;
									console.debug(`Forced channel ${part + 1} to stay drums.`);
								};
							};
						} else if (this.#mode == modeMap.gm) {
							if (det.data[1] < 48) {
								// Do not change drum channel to a melodic
								if (this.#chType[part] > 0) {
									det.data[1] = 120;
									this.switchMode("gs", true);
									console.debug(`Forced channel ${part + 1} to stay drums.`);
								};
							} else if (det.data[1] == 64 || det.data[1] == 127) {
								this.switchMode("xg", true);
							};
						} else if (this.#mode == modeMap.x5d) {
							if (det.data[1] > 0 && det.data[1] < 8) {
								this.switchMode("05rw", true);
							};
						};
						switch (this.#mode) {
							case modeMap.xg: {
								if ([126, 127].indexOf(det.data[1]) > -1) {
									if (this.#chType[part] == 0) {
										this.setChType(part, this.CH_DRUM2);
										console.debug(`CH${part + 1} set to drums by MSB.`);
									};
								} else {
									if (this.#chType[part] > 0) {
										this.setChType(part, this.CH_MELODIC);
										console.debug(`CH${part + 1} set to melodic by MSB.`);
									};
								};
								break;
							};
							case modeMap["05rw"]:
							case modeMap.x5d:
							case modeMap.ns5r: {
								if ([61, 62, 126, 127].indexOf(det.data[1]) > -1) {
									if (this.#chType[part] == 0) {
										this.setChType(part, this.CH_DRUM2);
										console.debug(`CH${part + 1} set to drums by MSB.`);
									};
								} else {
									if (this.#chType[part] > 0) {
										this.setChType(part, this.CH_MELODIC);
										console.debug(`CH${part + 1} set to melodic by MSB.`);
									};
								};
								break;
							};
							case modeMap.sd: {
								if ([104, 105, 106, 107].indexOf(det.data[1]) > -1) {
									if (this.#chType[part] == 0) {
										this.setChType(part, this.CH_DRUM2);
										console.debug(`CH${part + 1} set to drums by MSB.`);
									};
								} else {
									if (this.#chType[part] > 0) {
										this.setChType(part, this.CH_MELODIC);
										console.debug(`CH${part + 1} set to melodic by MSB.`);
									};
								};
								break;
							};
							case modeMap.g2: {
								if (det.data[1] == 120) {
									if (this.#chType[part] == 0) {
										this.setChType(part, this.CH_DRUMS);
										console.debug(`CH${part + 1} set to drums by MSB.`);
									};
								} else {
									if (this.#chType[part] > 0) {
										this.setChType(part, this.CH_MELODIC);
										console.debug(`CH${part + 1} set to melodic by MSB.`);
									};
								};
								break;
							};
						};
						this.dispatchEvent("voice", {
							part
						});
						break;
					};
					case 6: {
						// Show RPN and NRPN
						if (this.#dataCommit) {
							// Commit supported NRPN values
							if ([modeMap.xg, modeMap.gs, modeMap.ns5r].indexOf(this.#mode) < 0) {
								console.warn(`NRPN commits are not available under "${modeIdx[this.#mode]}" mode, even when they are supported in Octavia.`);
							};
							let msb = this.#cc[chOffset + ccToPos[99]],
							lsb = this.#cc[chOffset + ccToPos[98]];
							if (msb == 1) {
								let toCc = nrpnCcMap.indexOf(lsb);
								if (toCc > -1) {
									this.#cc[chOffset + ccToPos[71 + toCc]] = det.data[1];
									getDebugState() && console.debug(`Redirected NRPN 1 ${lsb} to cc${71 + toCc}.`);
									this.dispatchEvent("cc", {
										part,
										cc: 71 + toCc,
										data: det.data[1]
									});
								} else {
									let nrpnIdx = useNormNrpn.indexOf(lsb);
									if (nrpnIdx > -1) {
										this.#nrpn[part * 10 + nrpnIdx] = det.data[1] - 64;
									} else {
										console.warn(`NRPN 0x01${lsb.toString(16).padStart(2, "0")} is not supported.`);
									};
									getDebugState() && console.debug(`CH${part + 1} voice NRPN ${lsb} commit`);
								};
							} else {
								let nrpnIdx = useDrumNrpn.indexOf(msb);
								if (nrpnIdx < 0) {
									let dPref = `NRPN 0x${msb.toString(16).padStart(2, "0")}${lsb.toString(16).padStart(2, "0")} `;
									if (msb == 127) {
										console.warn(`${dPref}is not necessary. Consider removing it.`);
									} else {
										console.warn(`${dPref}is not supported.`);
									};
								} else {
									let targetSlot = this.#chType[part] - 2;
									if (targetSlot < 0) {
										console.warn(`CH${part + 1} cannot accept drum NRPN as type ${xgPartMode[this.#chType[part]]}.`);
									} else {
										this.#drum[(targetSlot * allocated.dpn + dnToPos[msb]) * allocated.dnc + lsb] = det.data[1] - 64;
									};
								};
								getDebugState() && console.debug(`CH${part + 1} (${xgPartMode[this.#chType[part]]}) drum NRPN ${msb} commit`);
							};
						} else {
							// Commit supported RPN values
							let rpnIndex = useRpnMap[this.#cc[chOffset + ccToPos[100]]];
							if (this.#cc[chOffset + ccToPos[101]] == 0 && rpnIndex != undefined) {
								getDebugState() && console.debug(`CH${part + 1} RPN 0 ${this.#cc[chOffset + ccToPos[100]]} commit: ${det.data[1]}`);
								det.data[1] = Math.min(Math.max(det.data[1], rpnCap[rpnIndex][0]), rpnCap[rpnIndex][1]);
								this.#rpn[part * allocated.rpn + rpnIndex] = det.data[1];
							};
						};
						break;
					};
					case 32: {
						if (getDebugState()) {
							console.debug(`${modeIdx[this.#mode]}, CH${part + 1} LSB: ${det.data[1]}`);
						};
						switch (this.#mode) {
							case modeMap.s90es:
							case modeMap.motif: {
								this.setChType(part, ([32, 40].indexOf(det.data[1]) > -1) ? this.CH_DRUMS : this.CH_MELODIC, this.#mode, true);
								break;
							};
						};
						this.dispatchEvent("voice", {
							part
						});
						break;
					};
					case 38: {
						// Show RPN and NRPN
						if (!this.#dataCommit) {
							// Commit supported RPN values
							if (this.#cc[chOffset + 101] == 0 && useRpnMap[this.#cc[chOffset + 100]] != undefined) {
								this.#rpn[part * allocated.rpn + useRpnMap[this.#cc[chOffset + 100]] + 1] = det.data[1];
							};
						} else {
							//console.debug(`${part + 1} LSB ${det.data[1]} ${this.#dataCommit ? "NRPN" : "RPN"} ${this.#dataCommit ? this.#cc[chOffset + 99] : this.#cc[chOffset + 101]} ${this.#dataCommit ? this.#cc[chOffset + 98] : this.#cc[chOffset + 100]}`);
						};
						break;
					};
					case 64: {
						// cc64: hold
						if (det.data[1] < 64) {
							this.#ua.hoOf(part);
						};
						break;
					};
					case 66: {
						// cc66: sostenuto
						if (det.data[1] >> 6) {
							// Sostenuto on
							this.#ua.soOn(part);
						} else {
							// Sostenuto off
							this.#ua.soOf(part);
						};
						break;
					};
					case 98:
					case 99: {
						this.#dataCommit = 1;
						break;
					};
					case 100:
					case 101: {
						this.#dataCommit = 0;
						break;
					};
				};
				this.#cc[chOffset + ccToPos[det.data[0]]] = det.data[1];
				this.dispatchEvent("cc", {
					part,
					cc: det.data[0],
					data: det.data[1]
				});
			};
		},
		12: function (det) {
			let part = det.channel;
			// Program change
			switch (this.#mode) {
				case modeMap.s90es:
				case modeMap.motif: {
					det.data && (this.setChActive(part, 1));
					break;
				};
				default: {
					this.setChActive(part, 1);
				};
			};
			this.#prg[part] = det.data;
			this.#bnCustom[part] = 0;
			if (getDebugState()) {
				console.debug(`T:${det.track} C:${part} P:${det.data}`);
			};
			this.dispatchEvent("voice", {
				part
			});
		},
		13: function (det) {
			// Channel aftertouch
			let upThis = this;
			let part = det.channel;
			this.#poly.forEach(function (e) {
				let realCh = e >> 7;
				if (part == realCh) {
					upThis.#velo[e] = det.data;
					upThis.dispatchEvent("note", {
						part,
						note: e & 127,
						velo: det.data,
						state: upThis.NOTE_SUSTAIN
					});
				};
			});
		},
		14: function (det) {
			let part = det.channel;
			// Pitch bending
			this.#pitch[part] = det.data[1] * 128 + det.data[0] - 8192;
			this.dispatchEvent("pitch", {
				part,
				pitch: this.getPitchShift(part)
			});
		},
		15: function (det) {
			// SysEx
			sysExSplitter(det.data).forEach((seq) => {
				let manId = seq[0],
				deviceId = seq[1];
				(this.#seMan[manId] || function () {
					console.debug(`Unknown manufacturer ${manId}.`);
				})(deviceId, seq.subarray(2), det.track);
				//upThis.#seMain.run(seq, det.track);
			});
		},
		248: function (det) {
			// MIDI clock
		},
		250: function (det) {
			// MIDI start
		},
		251: function (det) {
			// MIDI continue
		},
		252: function (det) {
			// MIDI stop
		},
		254: function (det) {
			// Active sense
		},
		255: function (det) {
			// Meta
			(this.#metaRun[det.meta] || function (data, track, meta) {}).call(this, det.data, det.track, det.meta);
			if (det.meta != 32) {
				this.#metaChannel = 0;
			};
			let useReply = passedMeta.indexOf(det.meta) > -1;
			if (getDebugState()) {
				console.debug(det);
			};
			if (useReply) {
				det.reply = "meta";
				return det;
			};
		}
	};
	// SysEx manufacturer table
	#seMan = {
		64: (id, msg, track) => {
			// Kawai
			this.#seKg.run(msg, track, id);
		},
		65: (id, msg, track) => {
			// Roland
			// CmdId is usually 18 (DT1)
			// D-50: [20, CmdId]
			// C/M: [22, CmdId]
			// GS: [66, CmdId, HH, MM, LL, ...DD, Checksum]
			if (msg[0] < 16) {
				if (msg[1] == 72) {
					let sentCs = msg[msg.length - 1];
					let calcCs = gsChecksum(msg.subarray(3, msg.length - 1));
					if (sentCs == calcCs) {
						this.#seGs.run(msg.subarray(0, msg.length - 1), track, id);
					} else {
						console.warn(`Bad SD checksum ${sentCs}. Should be ${calcCs}.`);
					};
				} else {
					this.#seGs.run(msg, track, id);
				};
				//console.warn(`Unknown device SysEx!`);
			} else {
				let sentCs = msg[msg.length - 1];
				let calcCs = gsChecksum(msg.subarray(2, msg.length - 1));
				if (sentCs == calcCs) {
					this.#seGs.run(msg.subarray(0, msg.length - 1), track, id);
				} else {
					console.warn(`Bad GS checksum ${sentCs}. Should be ${calcCs}.`);
				};
			};
		},
		66: (id, msg, track) => {
			// Korg
			this.#seAi.run(msg, track, id);
		},
		67: (id, msg, track) => {
			// Yamaha
			// XG: [76, HH, MM, LL, ...DD]
			this.#seXg.run(msg, track, id);
		},
		68: (id, msg, track) => {
			// Casio
			this.#seCs.run(msg, track, id);
		},
		71: (id, msg, track) => {
			// Akai
			this.#seSg.run(msg, track, id);
		},
		126: (id, msg, track) => {
			// Universal non-realtime
			this.#seUnr.run(msg, track, id);
		},
		127: (id, msg, track) => {
			// Universal realtime
			this.switchMode("gm");
			this.#seUr.run(msg, track, id);
		}
	};
	#seUnr; // Universal non-realtime
	#seUr; // Universal realtime
	#seXg; // YAMAHA
	#seGs; // Roland
	#seAi; // KORG
	#seKg; // Kawai
	#seSg; // Akai
	#seCs; // Casio
	buildRchTree() {
		// Build a receiving tree from currently set receive channels
		// Now builds from the ground up each time
		// Can be optimized to move elements instead
		let tree = [];
		this.#chReceive.forEach((e, i) => {
			if (!tree[e]?.constructor) {
				tree[e] = [];
			};
			tree[e].push(i);
		});
		this.#receiveTree = tree;
		//console.debug(tree);
	};
	getActive() {
		let result = this.#chActive;
		//if (this.#mode == modeMap.mt32) {
			//result[0] = 0;
		//};
		return result;
	};
	getCc(channel) {
		// Return channel CC registers
		let start = channel * allocated.cc;
		let arr = this.#cc.subarray(start, start + allocated.cc);
		arr[ccToPos[0]] = arr[ccToPos[0]] || this.#subMsb;
		arr[ccToPos[32]] = arr[ccToPos[32]] || this.#subLsb;
		return arr;
	};
	getCcCh(channel, cc) {
		if (ccAccepted.indexOf(cc) < 0) {
			throw(new Error("CC number not accepted"));
		};
		return this.#cc[allocated.cc * channel + ccToPos[cc]];
	};
	getCcAll() {
		// Return all CC registers
		let arr = this.#cc.slice();
		for (let c = 0; c < allocated.ch; c ++) {
			let chOff = c * allocated.cc;
			arr[chOff + ccToPos[0]] = arr[chOff + ccToPos[0]] || this.#subMsb;
			arr[chOff + ccToPos[32]] = arr[chOff + ccToPos[32]] || this.#subLsb;
		};
		return arr;
	};
	getChSource() {
		return this.#chReceive;
	};
	getChType() {
		return this.#chType;
	};
	setChType(part, type, mode = this.#mode, disableMsbSet = false) {
		type &= 15;
		this.#chType[part] = type;
		if (type > 0 && !disableMsbSet) {
			this.#cc[part * allocated.cc + ccToPos[0]] = drumMsb[mode];
		};
	};
	setChActive(part, active = 0) {
		if (this.#chActive[part] != active) {
			this.dispatchEvent("channeltoggle", {
				part,
				active
			});
		};
		this.#chActive[part] = active;
	};
	getPitch() {
		return this.#pitch;
	};
	getProgram() {
		return this.#prg;
	};
	getTexts() {
		return this.#metaTexts.slice();
	};
	getVel(channel) {
		// Return all pressed keys with velocity in a channel
		let notes = new Map();
		let upThis = this;
		upThis.#poly.forEach(function (e, i) {
			let realCh = Math.floor(e / 128),
			realNote = e % 128;
			if (channel == realCh && upThis.#velo[e] > 0) {
				notes.set(realNote, {
					v: upThis.#velo[e], // Short for velocity
					s: upThis.#polyState[i] // Short for state
				});
			};
		});
		return notes;
	};
	getBitmap() {
		return {
			bitmap: this.#bitmap,
			expire: this.#bitmapExpire
		};
	};
	getLetter() {
		return {
			text: this.#letterDisp,
			expire: this.#letterExpire
		};
	};
	getMode() {
		return modeIdx[this.#mode];
	};
	getMaster() {
		return {
			volume: this.#masterVol
		};
	};
	getRawStrength() {
		// 0 to 127
		let upThis = this;
		this.#poly.forEach(function (e) {
			let channel = Math.floor(e / 128);
			if (upThis.#velo[e] > upThis.#rawStrength[channel]) {
				upThis.#rawStrength[channel] = upThis.#velo[e];
			};
		});
		return this.#rawStrength;
	};
	getStrength() {
		// 0 to 255
		// Should later become 0 to 65535
		let str = [], upThis = this;
		this.getRawStrength().forEach(function (e, i) {
			str[i] = Math.floor(e * upThis.#cc[i * allocated.cc + ccToPos[7]] * upThis.#cc[i * allocated.cc + ccToPos[11]] * upThis.#masterVol / 803288);
		});
		return str;
	};
	getRpn() {
		return this.#rpn;
	};
	getNrpn() {
		return this.#nrpn;
	};
	getVoice(msbO, prgO, lsbO, mode) {
		let msb = msbO || this.#subMsb,
		prg = prgO,
		lsb = lsbO || this.#subLsb;
		if (modeIdx[this.#mode] == "ns5r") {
			if (msb > 0 && msb < 56) {
				lsb = 3; // Use SC-88 Pro map
			};
		};
		let bank = this.userBank.get(msb, prg, lsb, mode);
		if (modeIdx[this.#mode] == "mt32") {
			// Reload MT-32 user bank transparently
			if (bank.name.indexOf("MT-m:") == 0) {
				// Device patch
				let patch = parseInt(bank.name.slice(5)),
				timbreOff = patch * allocated.cmt,
				userBank = "";
				this.#cmTimbre.subarray(timbreOff, timbreOff + 10).forEach((e) => {
					if (e > 31) {
						userBank += String.fromCharCode(e);
					};
				});
				this.userBank.load(`MSB\tLSB\tPRG\n0\t127\t${prg}\t${userBank}`, true);
				bank.name = userBank;
				bank.ending = " ";
			};
		};
		if (bank.ending != " " || !bank.name.length) {
			bank = this.baseBank.get(msb, prg, lsb, mode);
		};
		return bank;
	};
	getChVoice(part) {
		let voice = this.getVoice(this.#cc[part * allocated.cc + ccToPos[0]], this.#prg[part], this.#cc[part * allocated.cc + ccToPos[32]], modeIdx[this.#mode]);
		if (this.#bnCustom[part]) {
			switch (this.#mode) {
				case modeMap.mt32: {
					voice.ending = "~";
					voice.name = "";
					this.#cmTTimbre.subarray(14 * (part - 1), 14 * (part - 1) + 10).forEach((e) => {
						if (e > 31) {
							voice.name += String.fromCharCode(e);
						};
					});
				};
			};
		};
		return voice;
	};
	getPitchShift(part) {
		let rpnOff = part * allocated.rpn;
		return this.#pitch[part] / 8192 * this.#rpn[rpnOff] + (this.#rpn[rpnOff + 3] - 64) + ((this.#rpn[rpnOff + 1] << 7) + this.#rpn[rpnOff + 2] - 8192) / 8192;
	};
	getEffectType(slot = 0) {
		let index = 3 * slot + 1;
		return this.#efxBase.subarray(index, index + 2);
	};
	setEffectTypeRaw(slot = 0, isLsb, value) {
		let efxbOff = 3 * slot;
		this.#efxBase[efxbOff] = 1;
		this.#efxBase[efxbOff + 1 + +isLsb] = value;
	};
	setEffectType(slot = 0, msb, lsb) {
		this.setEffectTypeRaw(slot, false, msb);
		this.setEffectTypeRaw(slot, true, lsb);
	};
	getEffectSink() {
		return this.#efxTo;
	};
	setLetterDisplay(data, source, offset = 0, delay = 3200) {
		let upThis = this,
		invalidCp;
		upThis.#letterDisp = " ".repeat(offset);
		data.forEach((e) => {
			upThis.#letterDisp += String.fromCharCode(e > 31 ? e : 32);
			if (e < 32) {
				invalidCp = invalidCp || new Set();
				invalidCp.add(e);
			};
		});
		upThis.#letterExpire = Date.now() + 3200;
		upThis.#letterDisp = upThis.#letterDisp.padEnd(32, " ");
		if (invalidCp) {
			invalidCp = Array.from(invalidCp);
			invalidCp.forEach((e, i, a) => {
				a[i] = e.toString(16).padStart(2, "0");
			});
			console.warn(`${source}${source ? " " : ""}invalid code point${invalidCp.length > 1 ? "s" : ""}: 0x${invalidCp.join(", 0x")}`);

		};
	};
	allocateAce(cc) {
		// Allocate active custom effect
		// Off, cc1~cc95, CAT, velo, PB
		if (!cc || cc > 95) {
			console.warn(`cc${cc} cannot be allocated as an active custom effect.`);
			return;
		};
		let continueScan = true, pointer = 0;
		while (continueScan && pointer < allocated.ace) {
			if (this.#ace[pointer] == cc) {
				continueScan = false;
			} else if (!this.#ace[pointer]) {
				continueScan = false;
				this.#ace[pointer] = cc;
				console.info(`Allocated cc${cc} to ACE slot ${pointer}.`);
			};
			pointer ++;
		};
		if (pointer >= allocated.ace) {
			console.warn(`ACE slots are full.`);
		};
	};
	getAce() {
		return this.#ace;
	};
	getChAce(part, aceSlot) {
		// Get channel ACE value
		if (aceSlot < 0 || aceSlot >= allocated.ace) {
			throw(new RangeError(`No such ACE slot`));
		};
		let cc = this.#ace[aceSlot];
		if (!cc) {
			return 0;
		} else if (ccAccepted.indexOf(cc) >= 0) {
			return this.#cc[part * allocated.cc + ccToPos[cc]];
		} else {
			throw(new Error(`Invalid ACE source: ${cc}`));
		};
	};
	init(type = 0) {
		// Type 0 is full reset
		// Type 1 is almost-full reset
		let upThis = this;
		// Full reset, except the loaded banks
		upThis.dispatchEvent("mode", "?");
		upThis.#mode = 0;
		upThis.#subMsb = 0;
		upThis.#subLsb = 0;
		upThis.#metaChannel = 0;
		upThis.#chActive.fill(0);
		upThis.#cc.fill(0);
		upThis.#ace.fill(0);
		upThis.#prg.fill(0);
		upThis.#velo.fill(0);
		upThis.#poly.fill(0);
		upThis.#rawStrength.fill(0);
		upThis.#pitch.fill(0);
		upThis.#nrpn.fill(0);
		upThis.#drum.fill(0);
		upThis.#masterVol = 100;
		upThis.#metaTexts = [];
		upThis.#noteLength = 500;
		upThis.#convertLastSyllable = 0;
		upThis.#letterExpire = 0;
		upThis.#letterDisp = "";
		upThis.#bitmapExpire = 0;
		upThis.#bitmapPage = 0;
		upThis.#bitmap.fill(0);
		upThis.#modeKaraoke = false;
		upThis.#selectPort = 0;
		upThis.#receiveRS = true;
		// Reset MIDI receive channel
		upThis.#chReceive.forEach(function (e, i, a) {
			a[i] = i;
		});
		upThis.buildRchTree();
		// Reset channel redirection
		if (type == 0) {
			upThis.#trkRedir.fill(0);
			upThis.#trkAsReq.fill(0);
		};
		// Channel 10 to drum set
		upThis.#cc[allocated.cc * 9] = drumMsb[0];
		upThis.#cc[allocated.cc * 25] = drumMsb[0];
		upThis.#cc[allocated.cc * 41] = drumMsb[0];
		upThis.#cc[allocated.cc * 57] = drumMsb[0];
		// Channel types
		upThis.#chType.fill(upThis.CH_MELODIC);
		upThis.#chType[9] = upThis.CH_DRUM1;
		upThis.#chType[25] = upThis.CH_DRUM3;
		upThis.#chType[41] = upThis.CH_DRUMS;
		upThis.#chType[57] = upThis.CH_DRUMS;
		upThis.#chType[73] = upThis.CH_DRUM5;
		upThis.#chType[89] = upThis.CH_DRUM7;
		upThis.#chType[105] = upThis.CH_DRUMS;
		upThis.#chType[121] = upThis.CH_DRUMS;
		// Reset MT-32 user patch and timbre storage
		upThis.#cmPatch.fill(0);
		upThis.#cmTimbre.fill(0);
		upThis.#cmTPatch.fill(0);
		upThis.#cmTTimbre.fill(0);
		upThis.#bnCustom.fill(0);
		// Reset EFX base registers
		upThis.#efxBase.fill(0);
		upThis.#efxTo.fill(0);
		// Reset AI EFX display name
		upThis.aiEfxName = "";
		// Reset MT-32 user bank
		upThis.userBank.clearRange({msb: 0, lsb: 127, prg: [0, 127]});
		for (let ch = 0; ch < allocated.ch; ch ++) {
			let chOff = ch * allocated.cc;
			// Reset to full
			upThis.#cc[chOff + ccToPos[7]] = 100; // Volume
			upThis.#cc[chOff + ccToPos[11]] = 127; // Expression
			// Reset to centre
			upThis.#cc[chOff + ccToPos[10]] = 64; // Pan
			upThis.#cc[chOff + ccToPos[71]] = 64; // Resonance
			upThis.#cc[chOff + ccToPos[72]] = 64; // Release Time
			upThis.#cc[chOff + ccToPos[73]] = 64; // Attack Time
			upThis.#cc[chOff + ccToPos[74]] = 64; // Brightness
			upThis.#cc[chOff + ccToPos[75]] = 64; // Decay Time
			upThis.#cc[chOff + ccToPos[76]] = 64; // Vibrato Rate
			upThis.#cc[chOff + ccToPos[77]] = 64; // Vibrato Depth
			upThis.#cc[chOff + ccToPos[78]] = 64; // Vibrato Delay
			// Extra default values
			upThis.#cc[chOff + ccToPos[91]] = 40; // Reverb
			// RPN/NRPN to null
			upThis.#cc[chOff + ccToPos[101]] = 127;
			upThis.#cc[chOff + ccToPos[100]] = 127;
			upThis.#cc[chOff + ccToPos[99]] = 127;
			upThis.#cc[chOff + ccToPos[98]] = 127;
			// RPN reset
			let rpnOff = ch * allocated.rpn;
			upThis.#rpn[rpnOff] = 2; // Pitch bend sensitivity
			upThis.#rpn[rpnOff + 1] = 64; // Fine tune MSB
			upThis.#rpn[rpnOff + 2] = 0; // Fine tune LSB
			upThis.#rpn[rpnOff + 3] = 64; // Coarse tune MSB
			upThis.#rpn[rpnOff + 4] = 0; // Mod sensitivity MSB
			upThis.#rpn[rpnOff + 5] = 0; // Mod sensitivity LSB
			// NRPN drum section reset
		};
		upThis.dispatchEvent("mastervolume", upThis.#masterVol);
		upThis.dispatchEvent(`efxreverb`, upThis.getEffectType(0));
		upThis.dispatchEvent(`efxchorus`, upThis.getEffectType(1));
		upThis.dispatchEvent(`efxdelay`, upThis.getEffectType(2));
		upThis.dispatchEvent(`efxinsert0`, upThis.getEffectType(3));
		upThis.dispatchEvent(`efxinsert1`, upThis.getEffectType(4));
		upThis.dispatchEvent(`efxinsert2`, upThis.getEffectType(5));
		upThis.dispatchEvent(`efxinsert3`, upThis.getEffectType(6));
		upThis.switchMode("?");
		return;
	};
	switchMode(mode, forced = false) {
		let upThis = this;
		let idx = modeIdx.indexOf(mode);
		if (idx > -1) {
			if (upThis.#mode == 0 || forced) {
				let oldMode = upThis.#mode;
				upThis.#mode = idx;
				upThis.#bitmapPage = 0; // Restore page
				upThis.#subMsb = substList[0][idx];
				upThis.#subLsb = substList[1][idx];
				for (let ch = 0; ch < allocated.ch; ch ++) {
					if (upThis.#chType[ch] > 0 && upThis.#cc[ch * allocated.cc + ccToPos[0]] == drumMsb[oldMode]) {
						// Switch drum MSBs.
						upThis.#cc[ch * allocated.cc] = drumMsb[idx];
					};
					//this.initOnReset && forced && this.#ua.ano(ch);
				};
				if (upThis.initOnReset && forced) {
					//this.init(1);
				};
				// Bank defaults
				switch (idx) {
					case modeMap.mt32: {
						mt32DefProg.forEach((e, i) => {
							let ch = i + 1;
							if (!upThis.#chActive[ch]) {
								upThis.#prg[ch] = e;
								upThis.#cc[ch * allocated.cc + ccToPos[91]] = 127;
							};
						});
						for (let part = 1; part < 10; part ++) {
							upThis.dispatchEvent("voice", {
								part
							});
						};
						break;
					};
				};
				// EFX defaults
				let efxDefault;
				switch (idx) {
					case modeMap["?"]:
					case modeMap.xg: {
						efxDefault = [1, 0, 65, 0, 5, 0, 0, 0];
						break;
					};
					case modeMap.gm:
					case modeMap.gs:
					case modeMap.g2:
					case modeMap.sd: {
						efxDefault = [40, 4, 40, 18, 40, 32, 32, 0];
						break;
					};
					case modeMap["05rw"]:
					case modeMap.x5d:
					case modeMap.ns5r: {
						efxDefault = [44, 1, 44, 19, 44, 0, 44, 0];
						break;
					};
					case modeMap.k11:
					case modeMap.sg: {
						efxDefault = [24, 0, 0, 0, 0, 0, 0, 0];
						break;
					};
					case modeMap.mt32: {
						efxDefault = [40, 4, 0, 0, 0, 0, 0, 0];
						break;
					};
					default: {
						efxDefault = [0, 0, 0, 0, 0, 0, 0, 0];
					};
				};
				for (let i = 0; i < 4; i ++) {
					if (!upThis.#efxBase[3 * i]) {
						upThis.#efxBase[3 * i + 1] = efxDefault[2 * i];
						upThis.#efxBase[3 * i + 2] = efxDefault[2 * i + 1];
						upThis.dispatchEvent(`efx${['reverb', 'chorus', 'delay', 'insert'][i]}`, upThis.getEffectType(i))
					};
				};
				upThis.dispatchEvent("mode", mode);
				upThis.forceVoiceRefresh();
			};
		} else {
			throw(new Error(`Unknown mode ${mode}`));
		};
	};
	newStrength() {
		this.#rawStrength.fill(0);
	};
	runJson(json) {
		// Execute transformed JSON event
		if (json.type > 14) {
			if (json.type == 15 && json.data.constructor != Uint8Array) {
				json.data = Uint8Array.from(json.data);
			};
			return this.#runChEvent[json.type].call(this, json);
		} else {
			// Universal MIDI channel receive support.
			let rcvPart = this.chRedir(json.part, json.track),
			executed = false;
			this.#receiveTree[rcvPart]?.forEach((e) => {
				json.channel = e;
				executed = true;
				this.#runChEvent[json.type].call(this, json);
			});
			/* this.#chReceive.forEach((e, i) => {
				if (e == rcvPart) {
					//json.channel = this.chRedir(i, json.track);
					json.channel = i;
					executed = true;
					this.#runChEvent[json.type].call(this, json);
				};
			}); */
			if (!executed) {
				console.warn(`${eventTypes[json.type] ? eventTypes[json.type] : json.type}${[11, 12].includes(json.type) ? (json.data[0] != undefined ? json.data[0] : json.data).toString() : ""} event sent to CH${rcvPart + 1} without any recipient.`);
			};
		};
		if (this.#metaTexts.length > 100) {
			this.#metaTexts.splice(100, this.#metaTexts.length - 99);
		};
	};
	runRaw(midiArr) {
		// Translate raw byte stream into JSON MIDI event
	};
	async loadBank(format, blob) {
		let upThis = this;
		format = format.toLowerCase();
		switch (format) {
			case "s7e": {
				upThis.userBank.clearRange({msb: 63, lsb: [21, 22]});
				upThis.userBank.clearRange({msb: 63, lsb: [24, 27]});
				break;
			};
			default: {
				throw(new Error(`Unknown bank format ${format}`));
			};
		};
		switch (format) {
			case "s7e": {
				bankDecoder.context = this;
				upThis.userBank.load(await bankDecoder.read(format, blob));
				break;
			};
		};
		upThis.forceVoiceRefresh();
	};
	constructor() {
		super();
		let upThis = this;
		this.#bitmap = new Uint8Array(256);
		this.#bitmapStore[10] = new Uint8Array(512);
		this.#metaSeq = new BinaryMatch();
		this.userBank.strictMode = true;
		// Prevent bank readers from getting stalled
		this.userBank.load(`MSB\tPRG\tLSB\tNME\n062\t000\t000\t\n122\t000\t000\t\n122\t001\t000\t\n122\t002\t000\t\n122\t003\t000\t\n122\t004\t000\t\n122\t005\t000\t\n122\t006\t000\t`);
		this.addEventListener("metacommit", function (ev) {
			//upThis.dispatchEvent("metacommit", ev.data);
			let {data} = ev;
			if (upThis.#metaTexts[0]?.type == data.type && upThis.#metaTexts[0]?.amend) {
				upThis.#metaTexts[0].amend = data.amend;
				upThis.#metaTexts[0].data += data.data;
			} else {
				upThis.#metaTexts.unshift(data);
			};
		});
		// Metadata events
		// Should be moved to somewhere else
		this.#metaRun[1] = function (data) {
			data = data.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
			// Normal text
			switch (data.slice(0, 2)) {
				case "@I": {
					this.#modeKaraoke = true;
					this.dispatchEvent("metacommit", {
						"type": "Kar.Info",
						"data": data.slice(2)?.trimLeft()
					});
					break;
				};
				case "@K": {
					this.#modeKaraoke = true;
					this.dispatchEvent("metacommit", {
						"type": "Kar.Mode",
						"data": data.slice(2)?.trimLeft()
					});
					console.debug(`Karaoke mode active: ${data.slice(2)}`);
					break;
				};
				case "@L": {
					this.#modeKaraoke = true;
					this.dispatchEvent("metacommit", {
						"type": "Kar.Lang",
						"data": data.slice(2)?.trimLeft()
					});
					break;
				};
				case "@T": {
					this.#modeKaraoke = true;
					this.dispatchEvent("metacommit", {
						"type": "KarTitle",
						"data": data.slice(2)?.trimLeft()
					});
					break;
				};
				case "@V": {
					this.#modeKaraoke = true;
					this.dispatchEvent("metacommit", {
						"type": "Kar.Ver.",
						"data": data.slice(2)?.trimLeft()
					});
					break;
				};
				case "XF": {
					// XG File Data section
					let dataArr = data.slice(2).split(":");
					switch (dataArr[0]) {
						case "hd": {
							dataArr.slice(1).forEach((e, i) => {
								e.length && this.dispatchEvent("metacommit", {
									"type": [
										"XfSngDte", "XfSngRgn", "XfSngCat", "XfSongBt",
										"XfSngIns", "XfSngVoc", "XfSngCmp", "XfSngLrc",
										"XfSngArr", "XfSngPer", "XfSngPrg", "XfSngTag"
									][i],
									"data": e
								});
							});
							break;
						};
						case "ln": {
							dataArr.slice(1).forEach((e, i) => {
								e.length && this.dispatchEvent("metacommit", {
									"type": [
										"XfKarLng", "XfKarNme", "XfKarCmp", "XfKarLrc",
										"XfKarArr", "XfKarPer", "XfKarPrg"
									][i],
									"data": e
								});
							});
							break;
						};
						default: {
							this.dispatchEvent("metacommit", {
								"type": "XfUnData",
								"data": data
							});
						};
					};
					break;
				};
				default: {
					if (this.#modeKaraoke) {
						if (data[0] == "\\") {
							// New section
							this.dispatchEvent("metacommit", {
								"type": "KarLyric",
								"data": "",
								"amend": false
							});
							this.dispatchEvent("metacommit", {
								"type": "KarLyric",
								"data": data.slice(1),
								"amend": true
							});
						} else if (data[0] == "/") {
							// New line
							this.dispatchEvent("metacommit", {
								"type": "KarLyric",
								"data": "",
								"mask": true,
								"amend": false
							});
							this.dispatchEvent("metacommit", {
								"type": "KarLyric",
								"data": data.slice(1),
								"mask": true,
								"amend": true
							});
						} else {
							// Normal append
							//this.#metaTexts[0] += data;
							this.dispatchEvent("metacommit", {
								"type": "KarLyric",
								"data": data,
								"amend": true
							});
						};
					} else {
						//this.#metaTexts[0] = data;
						data.split("\n").forEach((e, i) => {
							this.dispatchEvent("metacommit", {
								"type": "Cmn.Text",
								"data": e,
								"mask": i != 0
							});
						});
					};
				};
			};
		};
		this.#metaRun[2] = function (data) {
			this.dispatchEvent("metacommit", {
				"type": "Copyrite",
				"data": data
			});
		};
		this.#metaRun[3] = function (data, track) {
			// Filter overly annoying meta events
			if (track < 1 && this.#metaChannel < 1) {
				this.dispatchEvent("metacommit", {
					"type": "TrkTitle",
					"data": data
				});
			};
		};
		this.#metaRun[4] = function (data, track) {
			//if (track < 1 && this.#metaChannel < 1) {
				//this.#metaTexts.unshift(`${showTrue(this.#metaChannel, "", " ")}Instrmnt: ${data}`);
			//};
			this.dispatchEvent("metacommit", {
				"type": "Instrmnt",
				"data": data
			});
		};
		this.#metaRun[5] = function (data) {
			if (data.trim() == "") {
				this.dispatchEvent("metacommit", {
					"type": "C.Lyrics",
					"data": "",
					"amend": false
				});
			} else {
				this.dispatchEvent("metacommit", {
					"type": "C.Lyrics",
					"data": data,
					"amend": true
				});
			};
		};
		this.#metaRun[6] = function (data) {
			this.dispatchEvent("metacommit", {
				"type": "C.Marker",
				"data": data
			});
		};
		this.#metaRun[7] = function (data) {
			this.dispatchEvent("metacommit", {
				"type": "CuePoint",
				"data": data
			});
		};
		this.#metaRun[32] = function (data) {
			this.#metaChannel = data[0] + 1;
		};
		this.#metaRun[33] = function (data, track) {
			//console.debug(`Track ${track} requests to get assigned to output ${data}.`);
			upThis.#trkAsReq[track] = data + 1;
		};
		this.#metaRun[81] = function (data, track) {
			upThis.#noteLength = data / 1000;
		};
		this.#metaRun[127] = function (data, track) {
			//console.debug(`Sequencer specific on track ${track}: `, data);
			upThis.#metaSeq.run(data, track);
		};
		// Sequencer specific meta event
		// No refactoring needed.
		this.#metaSeq.default = function (seq) {
			console.warn(`Unrecognized sequencer-specific byte sequence: ${seq}`);
		};
		this.#metaSeq.add([67, 0, 1], function (msg, track) {
			//console.debug(`XGworks requests assigning track ${track} to output ${msg[0]}.`);
			upThis.#trkAsReq[track] = msg[0] + 1;
		});
		// Binary match should be avoided in favour of a circular structure
		this.#seUnr = new BinaryMatch("universal non-realtime");
		this.#seUr = new BinaryMatch("universal realtime");
		this.#seXg = new BinaryMatch("Yamaha");
		this.#seGs = new BinaryMatch("Roland");
		this.#seAi = new BinaryMatch("Korg");
		this.#seKg = new BinaryMatch("Kawai");
		this.#seSg = new BinaryMatch("Akai");
		this.#seCs = new BinaryMatch("Casio");
		// Notifies unrecognized SysEx strings with their vendors
		let syxDefaultErr = function (msg) {
			console.info(`Unrecognized SysEx in "${this.name}" set.\n%o`, msg);
		};
		this.#seUnr.default = syxDefaultErr;
		this.#seUr.default = syxDefaultErr;
		this.#seXg.default = syxDefaultErr;
		this.#seGs.default = syxDefaultErr;
		this.#seAi.default = syxDefaultErr;
		this.#seKg.default = syxDefaultErr;
		this.#seSg.default = syxDefaultErr;
		this.#seCs.default = syxDefaultErr;
		// The new SysEx engine only defines actions when absolutely needed.
		// Mode reset section
		this.#seUnr.add([9], (msg) => {
			// General MIDI reset.
			upThis.switchMode(["gm", "?", "g2"][msg[0] - 1], true);
			upThis.#modeKaraoke = upThis.#modeKaraoke || false;
			console.info(`MIDI reset: ${["GM", "Init", "GM2"][msg[0] - 1]}`);
			if (msg[0] == 2) {
				upThis.init();
			};
		});
		// GM SysEx section
		this.#seUr.add([4, 1], (msg) => {
			// Master volume
			upThis.#masterVol = ((msg[1] << 7) + msg[0]) / 16383 * 100;
			upThis.dispatchEvent("mastervolume", upThis.#masterVol);
		}).add([4, 3], (msg) => {
			// Master fine tune
			return (((msg[1] << 7) + msg[0] - 8192) / 8192);
		}).add([4, 4], (msg) => {
			// Master coarse tune
			return (msg[1] - 64);
		});
		// XG SysEx section
		this.#seXg.add([76, 0, 0], (msg) => {
			switch (msg[0]) {
				case 125: {
					// XG drum reset
					console.info(`XG drum setup reset: ${msg}`);
					break;
				};
				case 126: {
					// Yamaha XG reset
					upThis.switchMode("xg", true);
					upThis.#modeKaraoke = false;
					console.info("MIDI reset: XG");
					break;
				};
				default: {
					let mTune = [0, 0, 0, 0];
					let writeTune = (e, i) => {
						// XG master fine tune
						mTune[i] = e;
					};
					msg.subarray(1).forEach((e, i) => {
						let addr = i + msg[0];
						([
							writeTune, writeTune, writeTune, writeTune,
							(e) => {
								// XG master volume
								this.#masterVol = e * 129 / 16383 * 100;
								upThis.dispatchEvent("mastervolume", upThis.#masterVol);
							},
							(e) => {/* XG master attenuator */},
							(e) => {/* XG master coarse tune */}
						][addr] || (() => {}))(e, i);
					});
					if (msg[0] < 4) {
						// Commit master tune
						let rTune = 0;
						mTune.forEach((e) => {
							rTune = rTune << 4;
							rTune += e;
						});
						rTune -= 1024;
					};
				};
			};
		}).add([76, 2, 1], (msg) => {
			// XG reverb, chorus and variation
			let dPref = "XG ";
			if (msg[0] < 32) {
				// XG reverb
				dPref += "reverb ";
				msg.subarray(1).forEach((e, i) => {
					([(e) => {
						upThis.setEffectTypeRaw(0, false, e);
						console.info(`${dPref}main type: ${xgEffType[e]}`);
						upThis.dispatchEvent("efxreverb", upThis.getEffectType(0));
					}, (e) => {
						upThis.setEffectTypeRaw(0, true, e);
						console.debug(`${dPref}sub type: ${e + 1}`);
						upThis.dispatchEvent("efxreverb", upThis.getEffectType(0));
					}, (e) => {
						console.debug(`${dPref}time: ${getXgRevTime(e)}s`);
					}, (e) => {
						console.debug(`${dPref}diffusion: ${e}`);
					}, (e) => {
						console.debug(`${dPref}initial delay: ${e}`);
					}, (e) => {
						console.debug(`${dPref}HPF cutoff: ${xgNormFreq[e]}Hz`);
					}, (e) => {
						console.debug(`${dPref}LPF cutoff: ${xgNormFreq[e]}Hz`);
					}, (e) => {
						console.debug(`${dPref}width: ${e}`);
					}, (e) => {
						console.debug(`${dPref}height: ${e}`);
					}, (e) => {
						console.debug(`${dPref}depth: ${e}`);
					}, (e) => {
						console.debug(`${dPref}wall type: ${e}`);
					}, (e) => {
						console.debug(`${dPref}dry/wet: ${e}`);
					}, (e) => {
						console.debug(`${dPref}send: ${toDecibel(e)}dB`);
					}, (e) => {
						console.debug(`${dPref}pan: ${e - 64}`);
					}, false, false, (e) => {
						console.debug(`${dPref}delay: ${e}`);
					}, (e) => {
						console.debug(`${dPref}density: ${e}`);
					}, (e) => {
						console.debug(`${dPref}balance: ${e}`);
					}, (e) => {
					}, (e) => {
						console.debug(`${dPref}feedback: ${e}`);
					}, (e) => {
					}][msg[0] + i] || function () {
						console.warn(`Unknown XG reverb address: ${msg[0]}.`);
					})(e);
				});
			} else if (msg[0] < 64) {
				// XG chorus
				dPref += "chorus ";
				msg.subarray(1).forEach((e, i) => {
					([(e) => {
						upThis.setEffectTypeRaw(1, false, e);
						console.info(`${dPref}main type: ${xgEffType[e]}`);
						upThis.dispatchEvent("efxchorus", upThis.getEffectType(1));
					}, (e) => {
						upThis.setEffectTypeRaw(1, true, e);
						console.debug(`${dPref}sub type: ${e + 1}`);
						upThis.dispatchEvent("efxchorus", upThis.getEffectType(1));
					}, (e) => {
						console.debug(`${dPref}LFO: ${xgLfoFreq[e]}Hz`);
					}, (e) => {
						//console.debug(`${dPref}LFO phase: ${e}`);
					}, (e) => {
						console.debug(`${dPref}feedback: ${e}`);
					}, (e) => {
						console.debug(`${dPref}delay offset: ${getXgDelayOffset(e)}ms`);
					}, (e) => {
					}, (e) => {
						console.debug(`${dPref}low: ${xgNormFreq[e]}Hz`);
					}, (e) => {
						console.debug(`${dPref}low: ${e - 64}dB`);
					}, (e) => {
						console.debug(`${dPref}high: ${xgNormFreq[e]}Hz`);
					}, (e) => {
						console.debug(`${dPref}high: ${e - 64}dB`);
					}, (e) => {
						console.debug(`${dPref}dry/wet: ${e}`);
					}, (e) => {
						console.debug(`${dPref}send: ${toDecibel(e)}dB`);
					}, (e) => {
						console.debug(`${dPref}pan: ${e - 64}`);
					}, (e) => {
						console.debug(`${dPref}to reverb: ${toDecibel(e)}dB`);
					}, false, (e) => {
					}, (e) => {
					}, (e) => {
					}, (e) => {
						console.debug(`${dPref}LFO phase diff: ${(e - 64) * 3}deg`);
					}, (e) => {
						console.debug(`${dPref}input mode: ${e ? "stereo" : "mono"}`);
					}, (e) => {
					}][msg[0] - 32 + i] || function () {
						console.warn(`Unknown XG chorus address: ${msg[0]}.`);
					})(e);
				});
			} else if (msg[0] < 86) {
				// XG variation section 1
				dPref += "variation ";
				msg.subarray(1).forEach((e, i) => {
					([(e) => {
						upThis.setEffectTypeRaw(2, false, e);
						console.info(`${dPref}main type: ${xgEffType[e]}`);
						upThis.dispatchEvent("efxdelay", upThis.getEffectType(2));
					}, (e) => {
						upThis.setEffectTypeRaw(2, true, e);
						console.debug(`${dPref}sub type: ${e + 1}`);
						upThis.dispatchEvent("efxdelay", upThis.getEffectType(2));
					}][msg[0] - 64 + i] || function () {
						//console.warn(`Unknown XG variation address: ${msg[0]}.`);
					})(e);
				});
			} else if (msg[0] < 97) {
				// XG variation section 2
				dPref += "variation ";
				msg.subarray(1).forEach((e, i) => {
					([(e) => {
						console.debug(`${dPref}send: ${toDecibel(e)}dB`);
					}, (e) => {
						console.debug(`${dPref}pan: ${e - 64}`);
					}, (e) => {
						console.debug(`${dPref}to reverb: ${toDecibel(e)}dB`);
					}, (e) => {
						console.debug(`${dPref}to chorus: ${toDecibel(e)}dB`);
					}, (e) => {
						console.debug(`${dPref}connection: ${e ? "system" : "insertion"}`);
					}, (e) => {
						console.debug(`${dPref}channel: CH${e + 1}`);
					}, (e) => {
						console.debug(`${dPref}mod wheel: ${e - 64}`);
					}, (e) => {
						console.debug(`${dPref}bend wheel: ${e - 64}`);
					}, (e) => {
						console.debug(`${dPref}channel after touch: ${e - 64}`);
					}, (e) => {
						console.debug(`${dPref}AC1: ${e - 64}`);
					}, (e) => {
						console.debug(`${dPref}AC2: ${e - 64}`);
					}][msg[0] - 86 + i])(e);
				});
			} else if (msg[0] > 111 && msg[0] < 118) {
				// XG variation section 3
				dPref += "variation ";
			} else {
				console.warn(`Unknown XG variation address: ${msg[0]}`);
			};
		}).add([76, 2, 64], (msg) => {
			// XG 5-part EQ
			msg.subarray(1).forEach((e, i) => {
				let c = i + msg[0];
				if (c == 0) {
					console.debug(`XG EQ preset: ${["flat", "jazz", "pop", "rock", "classic"][e]}`);
				} else {
					let band = (c - 1) >> 2,
					prop = (c - 1) & 3,
					dPref = `XG EQ ${band} ${["gain", "freq", "Q", "shape"][prop]}: `;
					[() => {
						console.debug(`${dPref}${e - 64}dB`);
					}, () => {
						console.debug(`${dPref}${e} (raw)`); // HELP WANTED
					}, () => {
						console.debug(`${dPref}${e / 10}`);
					}, () => {
						console.debug(`${dPref}${["shelf", "peak"][+!!e]}`);
					}][prop]();
				};
			});
		}).add([76, 3], (msg) => {
			// XG insertion effects
			let varSlot = msg[0], offset = msg[1];
			let dPref = `XG Insertion ${msg[0] + 1} `;
			msg.subarray(2).forEach((e, i) => {
				([(e) => {
					upThis.setEffectTypeRaw(3 + varSlot, false, e);
					console.info(`${dPref}main type: ${xgEffType[e]}`);
					upThis.dispatchEvent(`efxinsert${varSlot}`, upThis.getEffectType(3 + varSlot));
				}, (e) => {
					upThis.setEffectTypeRaw(3 + varSlot, true, e);
					console.debug(`${dPref}sub type: ${e + 1}`);
					upThis.dispatchEvent(`efxinsert${varSlot}`, upThis.getEffectType(3 + varSlot));
				}][offset + i] || function () {
					//console.warn(`Unknown XG variation address: ${msg[0]}.`);
				})(e);
			});
		}).add([76, 6, 0], (msg) => {
			// XG Letter Display
			let offset = msg[0];
			if (offset < 64) {
				upThis.setLetterDisplay(msg.subarray(1), "XG letter display", offset);
			} else {
				// Expire all existing letter display
				upThis.#letterExpire = Date.now();
			};
		}).add([76, 7, 0], (msg) => {
			// XG Bitmap Display
			let offset = msg[0];
			upThis.#bitmapPage = 0;
			upThis.#bitmapExpire = Date.now() + 3200;
			upThis.#bitmap.fill(0); // Init
			let workArr = msg.subarray(1);
			for (let index = 0; index < offset; index ++) {
				workArr.unshift(0);
			};
			workArr.forEach(function (e, i) {
				let ln = Math.floor(i / 16), co = i % 16;
				let pt = (co * 3 + ln) * 7, threshold = 7, bi = 0;
				pt -= co * 5;
				if (ln == 2) {
					threshold = 2;
				};
				while (bi < threshold) {
					upThis.#bitmap[pt + bi] = (e >> (6 - bi)) & 1;
					bi ++;
				};
			});
		}).add([76, 8], (msg, track) => {
			// XG part setup
			let part = upThis.chRedir(msg[0], track, true),
			id = msg[1],
			chOff = allocated.cc * part,
			dPref = `XG CH${part + 1} `,
			errMsg = `Unknown XG part address ${id}.`;
			msg.subarray(2).forEach((e, i) => {
				// There is a bug here, but I don't have time right now
				if (id < 1) {
					console.debug(errMsg);
				} else if (id < 41) {
					// CC manipulation can be further shrunk
					([() => {
						upThis.#cc[chOff + ccToPos[0]] = e; // MSB
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						upThis.#cc[chOff + ccToPos[32]] = e; // LSB
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						upThis.#prg[part] = e; // program
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						let ch = upThis.chRedir(e, track, true);
						upThis.#chReceive[part] = ch; // Rx CH
						if (part != ch) {
							upThis.buildRchTree();
							console.info(`${dPref}receives from CH${ch + 1}`);
						};
					}, () => {
						upThis.#mono[part] = +!e; // mono/poly
					}, () => {
						// same note key on assign?
					}, () => {
						upThis.setChType(part, e, modeMap.xg);
						console.debug(`${dPref}type: ${xgPartMode[e] || e}`);
					}, () => {
						// coarse tune
						upThis.#rpn[allocated.rpn * part + 3] = e;
					}, false, false, () => {
						upThis.#cc[chOff + ccToPos[7]] = e; // volume
					}, false, false, () => {
						upThis.#cc[chOff + ccToPos[10]] = e || 128; // pan
					}, false, false, () => {
						upThis.#cc[chOff + ccToPos[128]] = e; // dry level
					}, () => {
						upThis.#cc[chOff + ccToPos[93]] = e; // chorus
					}, () => {
						upThis.#cc[chOff + ccToPos[91]] = e; // reverb
					}, () => {
						upThis.#cc[chOff + ccToPos[94]] = e; // variation
					}, () => {
						upThis.#cc[chOff + ccToPos[76]] = e; // vib rate
					}, () => {
						upThis.#cc[chOff + ccToPos[77]] = e; // vib depth
					}, () => {
						upThis.#cc[chOff + ccToPos[78]] = e; // vib delay
					}, () => {
						upThis.#cc[chOff + ccToPos[74]] = e; // brightness
					}, () => {
						upThis.#cc[chOff + ccToPos[71]] = e; // resonance
					}, () => {
						upThis.#cc[chOff + ccToPos[73]] = e; // attack
					}, () => {
						upThis.#cc[chOff + ccToPos[75]] = e; // decay
					}, () => {
						upThis.#cc[chOff + ccToPos[72]] = e; // release
					}][id + i - 1] || (() => {}))();
				} else if (id < 48) {
					console.debug(errMsg);
				} else if (id < 111) {
					if (id > 102 && id < 105) {
						upThis.#cc[chOff + ccToPos[[5, 65][id & 1]]] = e; // portamento
					};
				} else if (id < 114) {
					console.debug(errMsg);
				} else if (id < 116) {
					console.debug(`${dPref}EQ ${["bass", "treble"][id & 1]} gain: ${e - 64}dB`);
				} else if (id < 118) {
					console.debug(errMsg);
				} else if (id < 120) {
					console.debug(`${dPref}EQ ${["bass", "treble"][id & 1]} freq: ${e}`);
				} else {
					console.debug(errMsg);
				};
			});
		}).add([76, 9], (msg, track) => {
			// PLG-150VL Part Setup
			let part = upThis.chRedir(msg[0], track, true),
			id = msg[1];
			let dPref = `PLG-150VL CH${part + 1} `;
			msg.subarray(2).forEach((e, i) => {
				let ri = i + id;
				switch (ri) {
					case 1: {
						console.info(`${dPref}breath mode: ${["system", "breath", "velocity", "touch EG"][e]}`);
						break;
					};
					case 0:
					case 27:
					case 28: {
						break;
					};
					default: {
						if (ri < 27) {
							let pType = [
								"pressure",
								"embouchure",
								"tonguing",
								"scream",
								"breath noise",
								"growl",
								"throat formant",
								"harmonic enhancer",
								"damping",
								"absorption",
								"amplification",
								"brightness"
							][(ri - 3) >> 1];
							if (ri & 1) {
								if (ri < 23) {
									console.debug(`${dPref}${pType} control source: ${getVlCtrlSrc(e)}`);
									if (e && e < 96) {
										upThis.allocateAce(e);
									};
								} else {
									// These actually belong to 0x57, not 0x4c
									console.debug(`${dPref}${pType} scale break point: ${e}`);
								};
							} else {
								console.debug(`${dPref}${pType} depth: ${e - 64}`);
							};
						};
					};
				};
			});
		}).add([76, 10], (msg) => {
			// XG HPF cutoff at 76, 10, nn, 32
			// Won't implement for now
		}).add([76, 16], (msg) => {
			// XG A/D part, won't implement for now
		}).add([76, 17, 0, 0], (msg) => {
			// XG A/D mono/stereo mode, won't implement for now
		}).add([76, 112], (msg) => {
			// XG plugin board generic
			console.debug(`XG enable PLG-1${["50VL", "00SG", "50DX"][msg[0]]} for CH${msg[2] + 1}.`);
		}).add([73, 0, 0], (msg, track) => {
			// MU1000/2000 System
			let offset = msg[0];
			let dPref = `MU1000 System: `;
			msg.subarray(1).forEach((e, i) => {
				let ri = offset + i;
				if (ri == 8) {
					console.debug(`${dPref}LCD contrast set to ${e}.`);
				} else if (ri == 18) {
					upThis.#subLsb = e ? 126 : 0;
					console.debug(`${dPref}bank defaults to ${e ? "MU100 Native" : "MU Basic"}.`);
				} else if (ri >= 64 && ri < 69) {
					// Octavia custom SysEx, starts from 64 (10 before)
					[() => {
						upThis.dispatchEvent("channelactive", e);
					}, () => {
						if (e < 8) {
							upThis.dispatchEvent("channelmin", (e << 4));
							console.debug(`Octavia System: Minimum CH${(e << 4) + 1}`);
						} else {
							upThis.dispatchEvent("channelreset");
							console.info(`Octavia System: Clear channel ranges`);
						};
					}, () => {
						if (e < 8) {
							upThis.dispatchEvent("channelmax", (e << 4) + 15);
							console.debug(`Octavia System: Maximum CH${(e << 4) + 16}`);
						} else {
							upThis.dispatchEvent("channelreset");
							console.info(`Octavia System: Clear channel ranges`);
						};
					}, () => {
						upThis.dispatchEvent("channelreset");
						console.info(`Octavia System: Clear channel ranges`);
					}, () => {
						upThis.#receiveRS = !!e;
						console.info(`Octavia System: RS receiving ${["dis", "en"][e]}abled.`);
					}][ri - 64]();
				};
			});
		}).add([73, 10, 0], (msg, track) => {
			// MU1000 remote switch
			// But in practice... They are channel switching commands.
			let cmd = msg[0];
			let dPref = `MU1000 RS${upThis.#receiveRS ? "" : " (ignored)"}: `;
			if (cmd < 16) {
				switch (cmd) {
					case 2: {
						// Show all 64 channels
						let e = upThis.chRedir(0, track, true);
						if (upThis.#receiveRS) {
							upThis.dispatchEvent("channelmin", e);
							upThis.dispatchEvent("channelmax", e + 63);
						};
						console.info(`${dPref}Show CH1~64`);
						break;
					};
					case 3: {
						// Show 32 channels
						let e = upThis.chRedir(msg[1] << 5, track, true);
						upThis.#receiveRS && upThis.dispatchEvent("channelmin", e);
						upThis.#receiveRS && upThis.dispatchEvent("channelmax", e + 31);
						console.info(`${dPref}Show CH${e + 1}~CH${e + 32}`);
						break;
					};
					default: {
						console.debug(`${dPref}unknown switch ${cmd} invoked.`);
					};
				};
			} else if (cmd < 32) {
				if (upThis.#receiveRS) {
					let e = upThis.chRedir(cmd - 16 + (upThis.#selectPort << 4), track, true);
					upThis.dispatchEvent("channelactive", e);
				};
			} else if (cmd < 36) {
				let e = upThis.chRedir((cmd - 32) << 4, track, true);
				if (upThis.#receiveRS) {
					upThis.dispatchEvent("channelmin", e);
					upThis.dispatchEvent("channelmax", e + 15);
					upThis.#selectPort = cmd - 32;
				};
				console.info(`${dPref}Show CH${e + 1}~CH${e + 16}`);
			};
		}).add([93, 3], (msg, track) => {
			// PLG-100SG singing voice
			let part = upThis.chRedir(msg[0], track, true),
			dPref = `PLG-100SG CH${part + 1} `,
			timeNow = Date.now();
			if (msg[1] == 0) {
				// Vocal information
				let vocal = "",
				length = 0;
				msg.subarray(2).forEach((e, i) => {
					if (i % 2 == 0) {
						vocal += xgSgVocals[e] || e.toString().padStart("0");
					} else {
						length += e * 13; // 7.5ms
					};
				});
				if (timeNow >= upThis.#convertLastSyllable) {
					this.dispatchEvent("metacommit", {
						"type": "SGLyrics",
						"data": "",
						"amend": false
					});
				};
				this.dispatchEvent("metacommit", {
					"type": "SGLyrics",
					"data": `${getSgKana(vocal)}`,
					"amend": true
				});
				upThis.#convertLastSyllable = timeNow + Math.ceil(length / 2) + upThis.#noteLength;
				if (getDebugState()) {
					console.debug(`${dPref}vocals: ${vocal}`);
				};
			} else {
				console.warn(`Unknown PLG-100SG data: ${msg}`);
			};
		});
		this.#seXg.add([76, 48], (msg) => {
			// XG drum setup 1
		}).add([76, 49], (msg) => {
			// XG drum setup 2
		}).add([76, 50], (msg) => {
			// XG drum setup 3
		}).add([76, 51], (msg) => {
			// XG drum setup 4
		});
		// MU1000/2000 EPROM write
		this.#seXg.add([89, 0], (msg, track, id) => {
			// EPROM trail write
			if (upThis.eprom) {
				let length = msg[0];
				let addr = (msg[1] << 14) + (msg[2] << 7) + msg[3] + (upThis.eprom.offset || 0);
				getDebugState() && console.debug(`MU1000 EPROM trail to 0x${addr.toString(16).padStart(6, "0")}, ${length} bytes.`);
				let target = upThis.eprom.data;
				msg.subarray(4).forEach((e, i) => {
					// Overlay decoding
					let secId = i >> 3, secIdx = i & 7;
					if (secIdx == 7) {
						for (let bi = 0; bi < 7; bi ++) {
							target[addr + 7 * secId + bi] += ((e >> (6 - bi)) & 1) << 7;
						};
					} else {
						target[addr + 7 * secId + secIdx] = e;
					};
				});
			};
		}).add([89, 1], (msg, track, id) => {
			// EPROM base pointer jump
			let addr = (msg[0] << 21) + (msg[1] << 14) + (msg[2] << 7) + msg[3];
			getDebugState() && console.debug(`MU1000 EPROM jump to 0x${addr.toString(16).padStart(6, "0")}.`);
			if (upThis.eprom) {
				upThis.eprom.offset = addr;
			};
		}).add([89, 2], (msg, track, id) => {
			// EPROM bulk write
			// The first byte always seem to be zero
			if (upThis.eprom) {
				let addr = (msg[0] << 21) + (msg[1] << 14) + (msg[2] << 7) + msg[3] + (upThis.eprom.offset || 0);
				getDebugState() && console.debug(`MU1000 EPROM write to 0x${addr.toString(16).padStart(6, "0")}.`);
				let target = upThis.eprom.data;
				msg.subarray(4).forEach((e, i) => {
					// Overlay decoding
					let secId = i >> 3, secIdx = i & 7;
					if (secIdx == 7) {
						for (let bi = 0; bi < 7; bi ++) {
							target[addr + 7 * secId + bi] += ((e >> (6 - bi)) & 1) << 7;
						};
					} else {
						target[addr + 7 * secId + secIdx] = e;
					};
				});
			};
		}).add([89, 3], (msg, track, id) => {
			// Unknown instruction
		});
		// XG drum setup would be blank for now
		// TG300 SysEx section, the parent of XG
		this.#seXg.add([39, 48], (msg, track, id) => {
			// TG100 pool
		}).add([43, 0, 0], (msg, track, id) => {
			// TG300 master setup
			let mTune = [0, 0, 0, 0];
			let writeTune = (e, i) => {
				// GS master fine tune
				mTune[i] = e;
			};
			msg.subarray(1).forEach((e, i) => {
				let addr = i + msg[0];
				([
					writeTune,
					writeTune,
					writeTune,
					writeTune,
					() => {
						this.#masterVol = e * 129 / 16383 * 100;
						upThis.dispatchEvent("mastervolume", upThis.#masterVol);
					},
					() => {
						return e - 64;
					},
					() => {
						return e || 128;
					},
					() => {
						return e;
					},
					() => {
						return e;
					},
					() => {
						console.debug(`TG300 variation on cc${e}.`);
					}
				] || (() => {}))[addr](e, addr);
			});
			if (msg[0] < 4) {
				// Commit master tune
				let rTune = 0;
				mTune.forEach((e) => {
					rTune = rTune << 4;
					rTune += e;
				});
				rTune -= 1024;
			};
		}).add([43, 1, 0], (msg, track, id) => {
			// TG300 effect (R C V) setup
		}).add([43, 2], (msg, track, id) => {
			// TG300 part setup
			let part = upThis.chRedir(msg[0], track, true);
			let offset = msg[1];
			let chOff = allocated.cc * part;
			let dPref = `TG300 CH${part + 1} `;
			msg.subarray(2).forEach((e, i) => {
				if (i < 5) {
					([() => {
						// element reserve
					}, () => {
						upThis.#cc[chOff + ccToPos[0]] = e;
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						upThis.#cc[chOff + ccToPos[32]] = e;
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						upThis.#prg[part] = e;
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						let ch = upThis.chRedir(e, track, true);
						upThis.#chReceive[part] = ch; // Rx CH
						if (part != ch) {
							upThis.buildRchTree();
							console.info(`${dPref}receives from CH${ch + 1}`);
						};
					}][i + offset] || (() => {}))(e, i + offset);
				} else if (i < 21) {} else if (i < 47) {
					([() => {
						upThis.#mono[part] = +!e;
					}, () => {
						// same key on assign
					}, () => {
						// part mode
					}, () => {
						// coarse tune
						upThis.#rpn[allocated.rpn * part + 3] = e;
					}, () => {
						// absolute detune
					}, () => {
						upThis.#cc[chOff + ccToPos[7]] = e;
					}, false
					, false
					, () => {
						upThis.#cc[chOff + ccToPos[10]] = e || 128;
					}, false
					, false
					, () => {
						console.debug(`${dPref} AC1 at cc${e}`);
					}, () => {
						console.debug(`${dPref} AC2 at cc${e}`);
					}, () => {
						// Dry level
						upThis.#cc[chOff + ccToPos[128]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[93]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[91]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[94]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[76]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[77]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[74]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[71]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[73]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[75]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[72]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[78]] = e;
					}][i + offset - 21] || (() => {}))(e, i + offset);
				} else if (i < 95) {} else {
					([() => {
						upThis.#cc[chOff + ccToPos[65]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[5]] = e;
					}][i + offset - 95] || (() => {}))(e, i + offset);
				};
			});
		}).add([43, 7, 0], (msg, track, id) => {
			// TG300 display letter
			// Same as XG letter display
			let offset = msg[0];
			upThis.setLetterDisplay(msg.subarray(1), "TG300 letter display", offset);
		}).add([43, 7, 1], (msg, track, id) => {
			// TG300 display bitmap
			// Same as XG bitmap display
			upThis.#bitmapPage = 0;
			upThis.#bitmapExpire = Date.now() + 3200;
			upThis.#bitmap.fill(0); // Init
			msg.forEach(function (e, i) {
				let ln = Math.floor(i / 16), co = i % 16;
				let pt = (co * 3 + ln) * 7, threshold = 7, bi = 0;
				pt -= co * 5;
				if (ln == 2) {
					threshold = 2;
				};
				while (bi < threshold) {
					upThis.#bitmap[pt + bi] = (e >> (6 - bi)) & 1;
					bi ++;
				};
			});
		});
		// TG drum setup would also be blank
		// GS SysEx section
		this.#seGs.add([66, 18, 0, 0, 127], (msg, track, id) => {
			// GS mode set
			upThis.switchMode("gs", true);
			upThis.#cc[allocated.cc * 9] = 120;
			upThis.#cc[allocated.cc * 25] = 120;
			upThis.#cc[allocated.cc * 41] = 120;
			upThis.#cc[allocated.cc * 57] = 120;
			upThis.#subLsb = 3; // Use SC-88 Pro map by default
			upThis.#modeKaraoke = false;
			upThis.#trkRedir.fill(0);
			console.info(`GS system to ${["single", "dual"][msg[0]]} mode.`);
		}).add([66, 18, 64, 0], (msg, track, id) => {
			switch (msg[0]) {
				case 127: {
					// Roland GS reset
					upThis.switchMode("gs", true);
					upThis.#cc[allocated.cc * 9] = 120;
					upThis.#cc[allocated.cc * 25] = 120;
					upThis.#cc[allocated.cc * 41] = 120;
					upThis.#cc[allocated.cc * 57] = 120;
					upThis.#modeKaraoke = false;
					upThis.#trkRedir.fill(0);
					console.info("MIDI reset: GS");
					break;
				};
				default: {
					let mTune = [0, 0, 0, 0];
					let writeTune = (e, i) => {
						// GS master fine tune
						mTune[i] = e;
					};
					msg.subarray(1).forEach((e, i) => {
						let addr = i + msg[0];
						[
							writeTune, writeTune, writeTune, writeTune,
							(e) => {
								// XG master volume
								this.#masterVol = e * 129 / 16383 * 100;
								upThis.dispatchEvent("mastervolume", upThis.#masterVol);
							},
							(e) => {/* XG master coarse tune */},
							(e) => {/* XG master pan */}
						][addr](e, i);
					});
					if (msg[0] < 4) {
						// Commit master tune
						let rTune = 0;
						mTune.forEach((e) => {
							rTune = rTune << 4;
							rTune += e;
						});
						rTune -= 1024;
					};
				};
			};
		}).add([66, 18, 64, 1], (msg) => {
			// GS patch params
			let offset = msg[0];
			if (offset < 16) {
				// GS patch name (what for?)
				let string = "".padStart(offset, " ");
				msg.subarray(1).forEach((e, i) => {
					string += String.fromCharCode(Math.max(32, e));
				});
				string = string.padEnd(16, " ");
				console.debug(`GS patch name: ${string}`);
			} else if (offset < 48) {
				// GS partial reserve
			} else if (offset < 65) {
				// GS reverb and chorus
				msg.subarray(1).forEach((e, i) => {
					let dPref = `GS ${(offset + i) > 55 ? "chorus" : "reverb"} `;
					([() => {
						console.info(`${dPref}type: ${gsRevType[e]}`);
						upThis.setEffectType(0, 40, e);
						upThis.dispatchEvent(`efxreverb`, upThis.getEffectType(0));
					}, () => {// character
					}, () => {// pre-LPF
					}, () => {// level
					}, () => {// time
					}, () => {// delay feedback
					}, false, () => {
						console.debug(`${dPref}predelay: ${e}ms`);
					}, () => {
						console.info(`${dPref}type: ${gsChoType[e]}`);
						upThis.setEffectType(1, 40, 16 + e);
						upThis.dispatchEvent(`efxchorus`, upThis.getEffectType(1));
					}, () => {// pre-LPF
					}, () => {// level
					}, () => {// feedback
					}, () => {// delay
					}, () => {// rate
					}, () => {// depth
					}, () => {
						console.debug(`${dPref}to reverb: ${toDecibel(e)}`);
					}, () => {
						console.debug(`${dPref}to delay: ${toDecibel(e)}`);
					}][offset + i - 48] || (() => {}))();
				});
			} else if (offset < 80) {
				console.debug(`Unknown GS patch address: ${offset}`);
			} else if (offset < 91) {
				// GS delay
				msg.subarray(1).forEach((e, i) => {
					let dPref = `GS delay `;
					([() => {
						console.info(`${dPref}type: ${gsDelType[e]}`);
						upThis.setEffectType(2, 40, 32 + e);
						upThis.dispatchEvent(`efxdelay`, upThis.getEffectType(2));
					}, () => {// pre-LPF
					}, () => {// time C
					}, () => {// time L
					}, () => {// time R
					}, () => {// level C
					}, () => {// level L
					}, () => {// level R
					}, () => {// level
					}, () => {// feedback
					}, () => {
						console.debug(`${dPref}to reverb: ${toDecibel(e)}`);
					}][offset + i - 80] || (() => {}))();
				});
			} else {
				console.debug(`Unknown GS patch address: ${offset}`);
			};
		}).add([66, 18, 64, 2], (msg) => {
			// GS EQ
			let dPref = `GS EQ `;
			msg.subarray(1).forEach((e, i) => {
				([() => {
					console.debug(`${dPref}low freq: ${[200, 400][e]}Hz`);
				}, () => {
					console.debug(`${dPref}low gain: ${e - 64}dB`);
				}, () => {
					console.debug(`${dPref}high freq: ${[3E3, 6E3][e]}Hz`);
				}, () => {
					console.debug(`${dPref}high gain: ${e - 64}dB`);
				}][msg[0] + i] || function () {
					console.warn(`Unknown GS EQ address: ${msg[0] + i}`);
				})();
			});
		}).add([66, 18, 64, 3], (msg) => {
			// GS EFX
			let dPref = `GS EFX `;
			let prefDesc = function (e, i) {
				let desc = getGsEfxDesc(upThis.#efxBase.subarray(10, 12), i, e);
				if (desc) {
					console.debug(`${dPref}${getGsEfx(upThis.#efxBase.subarray(10, 12))} ${desc}`);
				};
			};
			msg.subarray(1).forEach((e, i) => {
				([() => {
					upThis.setEffectTypeRaw(3, false, 32 + e);
					upThis.dispatchEvent(`efxinsert0`, upThis.getEffectType(3));
				}, () => {
					upThis.setEffectTypeRaw(3, true, e);
					console.info(`${dPref}type: ${getGsEfx(upThis.#efxBase.subarray(10, 12))}`);
					upThis.dispatchEvent(`efxinsert0`, upThis.getEffectType(3));
				}, false,
				prefDesc, prefDesc, prefDesc, prefDesc, prefDesc,
				prefDesc, prefDesc, prefDesc, prefDesc, prefDesc,
				prefDesc, prefDesc, prefDesc, prefDesc, prefDesc,
				prefDesc, prefDesc, prefDesc, prefDesc, prefDesc,
				() => {
					console.debug(`${dPref}to reverb: ${toDecibel(e)}dB`);
				}, () => {
					console.debug(`${dPref}to chorus: ${toDecibel(e)}dB`);
				}, () => {
					console.debug(`${dPref}to delay: ${toDecibel(e)}dB`);
				}, false, () => {
					console.debug(`${dPref}1 source: ${e}`);
					if (e && e < 96) {
						upThis.allocateAce(e);
					};
				}, () => {
					console.debug(`${dPref}1 depth: ${e - 64}`);
				}, () => {
					console.debug(`${dPref}2 source: ${e}`);
					if (e && e < 96) {
						upThis.allocateAce(e);
					};
				}, () => {
					console.debug(`${dPref}2 depth: ${e - 64}`);
				}, () => {
					console.debug(`${dPref}to EQ: ${e ? "ON" : "OFF"}`);
				}][msg[0] + i] || function (e, i) {
					console.warn(`Unknown GS EFX address: ${i}`);
				})(e, msg[0] + i);
			});
		}).add([66, 18, 65], (msg) => {
			// GS drum setup
		}).add([69, 18, 16], (msg) => {
			// GS display section
			switch (msg[0]) {
				case 0: {
					// GS display letter
					let offset = msg[1];
					upThis.setLetterDisplay(msg.subarray(2), "GS display text", offset);
					break;
				};
				case 32: {
					upThis.#bitmapExpire = Date.now() + 3200;
					if (msg[1] == 0) {
						// GS display page
						upThis.#bitmapPage = Math.max(Math.min(msg[2] - 1, 9), 0);
					};
					break;
				};
				default: {
					if (msg[0] < 11) {
						// GS display bitmap
						if (upThis.#bitmapPage > 9) {
							upThis.#bitmapPage = 0;
						};
						upThis.#bitmapExpire = Date.now() + 3200;
						if (!upThis.#bitmapStore[msg[0] - 1]?.length) {
							upThis.#bitmapStore[msg[0] - 1] = new Uint8Array(256);
						};
						let target = upThis.#bitmapStore[msg[0] - 1];
						let offset = msg[1];
						target.fill(0); // Init
						let workArr = msg.subarray(2);
						for (let index = 0; index < offset; index ++) {
							workArr.unshift(0);
						};
						workArr.forEach(function (e, i) {
							let ln = Math.floor(i / 16), co = i % 16;
							let pt = (co * 4 + ln) * 5, threshold = 5, bi = 0;
							pt -= co * 4;
							if (ln == 3) {
								threshold = 1;
							};
							while (bi < threshold) {
								target[pt + bi] = (e >> (4 - bi)) & 1;
								bi ++;
							};
						});
					} else {
						console.warn(`Unknown GS display section: ${msg[0]}`);
					};
				};
			};
		});
		// GS Part setup
		// I wanted this to also be written in a circular structure
		// But clearly Roland hates me
		let gsPartSec = function (msg, part, track) {
			let offset = msg[0],
			chOff = allocated.cc * part,
			rpnOff = allocated.rpn * part,
			dPref = `GS CH${part + 1} `;
			if (offset < 3) {
				// Program, MSB and receive channel
				msg.subarray(1).forEach((e, i) => {
					[() => {
						upThis.#cc[chOff + ccToPos[0]] = e; // MSB
					}, () => {
						upThis.#prg[part] = e; // program
					}, () => {
						let ch = upThis.chRedir(e, track, true);
						upThis.#chReceive[part] = ch; // Rx CH
						if (part != ch) {
							upThis.buildRchTree();
							console.info(`${dPref}receives from CH${ch + 1}`);
						};
					}][offset + i]();
				});
				upThis.dispatchEvent("voice", {
					part
				});
			} else if (offset < 19) {} else if (offset < 44) {
				msg.subarray(1).forEach((e, i) => {
					([() => {
						upThis.#mono[part] = +!e; // mono/poly
					}, false // assign mode
					, () => {
						// drum map
						upThis.setChType(part, e << 1, modeMap.gs);
						console.debug(`${dPref}type: ${e ? "drum " : "melodic"}${e ? e : ""}`);
					}, () => {
						// coarse tune
						upThis.#rpn[rpnOff + 3] = e;
					}, false // pitch offset
					, () => {
						// volume
						upThis.#cc[chOff + ccToPos[7]] = e;
					}, false // velocity sense depth
					, false // velocity sense offset
					, () => {
						// pan
						upThis.#cc[chOff + ccToPos[10]] = e || 128;
					}, false // note upperbound
					, false // note lowerbound
					, () => {
						// general-purpose CC source A
						console.debug(`${dPref}CC 1: cc${e}`);
					}, () => {
						// general-purpose CC source B
						console.debug(`${dPref}CC 2: cc${e}`);
					}, () => {
						// chorus
						upThis.#cc[chOff + ccToPos[93]] = e;
					}, () => {
						// reverb
						upThis.#cc[chOff + ccToPos[91]] = e;
					}, false // Rx bank select MSB
					, false // Rx bank select LSB
					, () => {
						// fine tune MSB
						upThis.#rpn[rpnOff + 1] = e;
					}, () => {
						// fine tune LSB
						upThis.#rpn[rpnOff + 2] = e;
					}, () => {
						// delay (variation in XG)
						upThis.#cc[chOff + ccToPos[94]] = e;
					}][offset + i - 19] || (() => {}))();
				});
			} else if (offset < 76) {} else {
				console.debug(`Unknown GS part address: ${offset}`);
			};
		},
		gsMiscSec = function (msg, part) {
			let offset = msg[0],
			dPref = `GS CH${part + 1} `;
			if (offset < 2) {
				msg.subarray(1).forEach((e, i) => {
					[() => {
						// GS part LSB
						upThis.#cc[allocated.cc * part + ccToPos[32]] = e;
					}, () => {// GS part fallback LSB
					}][offset + i]();
				});
			} else if (offset < 32) {
				console.warn(`Unknown GS misc address: ${offset}`);
			} else if (offset < 35) {
				msg.subarray(1).forEach((e, i) => {
					[() => {
						// GS part EQ toggle
						console.debug(`${dPref}EQ: o${["ff", "n"][e]}`);
					}, () => {// GS part output
					}, () => {
						// GS part EFX toggle
						console.debug(`${dPref}EFX: o${["ff", "n"][e]}`);
						upThis.#efxTo[part] = e;
						upThis.dispatchEvent("partefxtoggle", {
							part,
							active: e
						});
					}][offset + i - 32]();
				});
			} else {
				console.warn(`Unknown GS misc address: ${offset}`);
			};
		};
		this.#seGs.add([66, 18, 64, 16], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(9, track, true), track);
		}).add([66, 18, 64, 17], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(0, track, true), track);
		}).add([66, 18, 64, 18], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(1, track, true), track);
		}).add([66, 18, 64, 19], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(2, track, true), track);
		}).add([66, 18, 64, 20], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(3, track, true), track);
		}).add([66, 18, 64, 21], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(4, track, true), track);
		}).add([66, 18, 64, 22], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(5, track, true), track);
		}).add([66, 18, 64, 23], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(6, track, true), track);
		}).add([66, 18, 64, 24], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(7, track, true), track);
		}).add([66, 18, 64, 25], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(8, track, true), track);
		}).add([66, 18, 64, 26], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(10, track, true), track);
		}).add([66, 18, 64, 27], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(11, track, true), track);
		}).add([66, 18, 64, 28], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(12, track, true), track);
		}).add([66, 18, 64, 29], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(13, track, true), track);
		}).add([66, 18, 64, 30], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(14, track, true), track);
		}).add([66, 18, 64, 31], (msg, track) => {
			gsPartSec(msg, upThis.chRedir(15, track, true), track);
		}).add([66, 18, 64, 64], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(9, track, true));
		}).add([66, 18, 64, 65], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(0, track, true));
		}).add([66, 18, 64, 66], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(1, track, true));
		}).add([66, 18, 64, 67], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(2, track, true));
		}).add([66, 18, 64, 68], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(3, track, true));
		}).add([66, 18, 64, 69], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(4, track, true));
		}).add([66, 18, 64, 70], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(5, track, true));
		}).add([66, 18, 64, 71], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(6, track, true));
		}).add([66, 18, 64, 72], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(7, track, true));
		}).add([66, 18, 64, 73], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(8, track, true));
		}).add([66, 18, 64, 74], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(10, track, true));
		}).add([66, 18, 64, 75], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(11, track, true));
		}).add([66, 18, 64, 76], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(12, track, true));
		}).add([66, 18, 64, 77], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(13, track, true));
		}).add([66, 18, 64, 78], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(14, track, true));
		}).add([66, 18, 64, 79], (msg, track) => {
			gsMiscSec(msg, upThis.chRedir(15, track, true));
		});
		// KORG X5DR SysEx section
		this.#seAi.add([54, 65], (msg, track) => {
			// X5D multi parameters (part setup)
			upThis.switchMode("x5d");
			let key = (msg[1] << 7) + msg[0],
			e = (msg[3] << 7) + msg[2],
			part = upThis.chRedir(key & 15, track, true),
			chOff = allocated.cc * part;
			[() => {
				// Program change
				if (e < 1) {
				} else if (e < 101) {
					upThis.setChType(part, upThis.CH_MELODIC, modeMap.x5d);
					upThis.#prg[part] = e - 1;
					upThis.#cc[chOff + ccToPos[0]] = 82;
				} else if (e < 229) {
					upThis.setChType(part, upThis.CH_MELODIC, modeMap.x5d);
					upThis.#prg[part] = e - 101;
					upThis.#cc[chOff + ccToPos[0]] = 56;
				} else {
					upThis.setChType(part, upThis.CH_DRUMS, modeMap.x5d);
					upThis.#prg[part] = korgDrums[e - 229] || 0;
					upThis.#cc[chOff + ccToPos[0]] = 62;
				};
				upThis.dispatchEvent("voice", {
					part
				});
			}, () => {
				// Volume
				upThis.#cc[chOff + ccToPos[7]] = e;
			}, () => {
				// Panpot
				if (e < 31) {
					upThis.#cc[chOff + ccToPos[10]] = Math.round((e - 15) * 4.2 + 64);
				};
			}, () => {
				// Chorus
				upThis.#cc[chOff + ccToPos[93]] = x5dSendLevel(e);
			}, () => {
				// Reverb
				upThis.#cc[chOff + ccToPos[91]] = x5dSendLevel(e);
			}, () => {
				// Coarse tune
				upThis.#rpn[part * allocated.rpn + 3] = (e > 8191 ? e - 16320 : 64 + e);
			}, () => {
				// Fine tune
				upThis.#rpn[part * allocated.rpn + 1] = (e > 8191 ? e - 16320 : 64 + e);
			}, () => {
				// PB range
				if (e > 0) {
					upThis.#rpn[part * allocated.rpn] = e;
				};
			}, () => {
				// program change filter
			}][key >> 4]();
		}).add([54, 76, 0], (msg, track) => {
			// X5D program dump
			upThis.switchMode("x5d", true);
			let name = "", msb = 82, prg = 0, lsb = 0;
			let voiceMap = "MSB\tPRG\tLSB\tNME";
			korgFilter(msg, function (e, i) {
				if (i < 16400) {
					let p = i % 164;
					switch (true) {
						case (p < 10): {
							if (e > 31) {
								name += String.fromCharCode(e);
							};
							break;
						};
						case (p == 11): {
							voiceMap += `\n${msb}\t${prg}\t${lsb}\t${name.trim().replace("Init Voice", "")}`;
							prg ++;
							name = "";
							break;
						};
					};
					if (prg > 99) {
						msb = 90;
						prg = 0;
					};
				};
			});
			upThis.userBank.clearRange({
				msb: 82,
				prg: [0, 99],
				lsb: 0
			});
			upThis.userBank.load(voiceMap);
			getDebugState() && console.debug(voiceMap);
			upThis.forceVoiceRefresh();
		}).add([54, 77, 0], (msg, track) => {
			// X5D combi dump
			upThis.switchMode("x5d", true);
			let name = "", msb = 90, prg = 0, lsb = 0;// CmbB then CmbA
			let voiceMap = "MSB\tPRG\tLSB\tNME";
			korgFilter(msg, function (e, i) {
				if (i < 13600) {
					let p = i % 136;
					switch (true) {
						case (p < 10): {
							if (e > 31) {
								name += String.fromCharCode(e);
							};
							break;
						};
						case (p == 11): {
							voiceMap += `\n${msb}\t${prg}\t${lsb}\t${name.trim().replace("Init Combi", "")}`;
							prg ++;
							name = "";
							break;
						};
					};
				};
			});
			upThis.userBank.clearRange({
				msb: 90,
				prg: [0, 99],
				lsb: 0
			});
			upThis.userBank.load(voiceMap);
			getDebugState() && console.debug(voiceMap);
			upThis.forceVoiceRefresh();
		}).add([54, 78], (msg, track) => {
			// X5D mode switch
			upThis.switchMode("x5d", true);
			console.debug(`X5D mode switch requested: ${["combi", "combi edit", "prog", "prog edit", "multi", "global"][msg[0]]} mode.`);
		}).add([54, 85], (msg, track) => {
			// X5D effect dump
			upThis.switchMode("x5d", true);
			korgFilter(msg, (e, i) => {
				if (i > 0 && i < 3) {
					upThis.setEffectType(i - 1, 44, e);
					upThis.dispatchEvent(`efx${['reverb', 'chorus'][i - 1]}`, upThis.getEffectType(i - 1));
				};
			});
		}).add([54, 104], (msg, track) => {
			// X5D extended multi setup
			upThis.switchMode("x5d", true);
			korgFilter(msg, function (e, i, a, ri) {
				if (i < 192) {
					let part = upThis.chRedir(Math.floor(i / 12), track, true),
					chOff = part * allocated.cc;
					switch (i % 12) {
						case 0: {
							// Program change
							if (e < 128) {
								upThis.setChType(part, upThis.CH_MELODIC, modeMap.x5d);
								upThis.#cc[chOff + ccToPos[0]] = 82;
								upThis.#prg[part] = e;
							} else {
								upThis.setChType(part, upThis.CH_DRUMS, modeMap.x5d);
								upThis.#cc[chOff + ccToPos[0]] = 62;
								upThis.#prg[part] = korgDrums[e - 128];
							};
							if (e > 0) {
								upThis.setChActive(part, 1);
							};
							upThis.dispatchEvent("voice", {
								part
							});
							break;
						};
						case 1: {
							// Volume
							upThis.#cc[chOff + ccToPos[7]] = e;
							break;
						};
						case 2: {
							// Coarse tune
							upThis.#rpn[part * allocated.rpn + 3] = (e > 127 ? e - 192 : 64 + e);
							break;
						};
						case 3: {
							// Fine tune
							upThis.#rpn[part * allocated.rpn + 1] = (e > 127 ? e - 192 : 64 + e);
							break;
						};
						case 4: {
							// Pan
							if (e < 31) {
								upThis.#cc[chOff + ccToPos[10]] = Math.round((e - 15) * 4.2 + 64);
							};
							break;
						};
						case 5: {
							// Reverb + Chorus
							let choSend = e >> 4,
							revSend = e & 15;
							upThis.#cc[chOff + ccToPos[91]] = x5dSendLevel(revSend);
							upThis.#cc[chOff + ccToPos[93]] = x5dSendLevel(choSend);
							break;
						};
						case 10: {
							// Control filter
							//upThis.#cc[chOff] = (e & 3) ? 82 : 56;
							break;
						};
						case 11: {
							// MIDI Rc Ch + Track Switch
							let midiCh = upThis.chRedir(e & 15, track, true),
							trkSw = e >> 4;
							upThis.#chReceive[part] = e;
							if (midiCh != part || trkSw) {
								console.info(`X5D Part CH${part + 1} receives from CH${midiCh + 1}.`);
								upThis.buildRchTree();
							};
						};
					};
				} else {
					let part = upThis.chRedir(i - 192, track, true);
					// What the heck is pitch bend range 0xF4(-12) to 0x0C(12)?
				};
			});
		});
		// Roland MT-32 or C/M SysEx section
		this.#seGs.add([22, 18, 127], (msg) => {
			// MT-32 reset all params
			upThis.switchMode("mt32", true);
			upThis.#modeKaraoke = false;
			upThis.userBank.clearRange({msb: 0, lsb: 127, prg: [0, 127]});
			console.info("MIDI reset: MT-32");
		}).add([22, 18, 0], (msg, track, id) => {
			// MT-32 Part Patch Setup (temp)
			upThis.switchMode("mt32");
			let part = upThis.chRedir(id, track, true);
			let offset = msg[1];
			msg.subarray(2).forEach((e, i) => {
				let ri = i + offset;
				upThis.#cmTPatch[ri + (part - 1) * 16] = e;
				([false
				, () => {
					let timbreGroup = upThis.#cmTPatch[(part - 1) << 4];
					if (timbreGroup < 3) {
						upThis.#bnCustom[part] = 1;
						if (timbreGroup == 2) {
							// Copy name from timbre memory
							for (let c = 0; c < name.length; c ++) {
								upThis.#cmTTimbre[(part - 1) * allocated.cmt + c] = upThis.#cmTimbre[e * allocated.cmt + c];
							};
						} else {
							// Copy name from bank
							let name = upThis.baseBank.get(0, e + (timbreGroup << 6), 127, "mt32").name;
							for (let c = 0; c < name.length; c ++) {
								upThis.#cmTTimbre[(part - 1) * allocated.cmt + c] = name.charCodeAt(c);
							};
						};
						upThis.dispatchEvent("voice", {
							part
						});
					};
				}, () => {
					upThis.#rpn[part * allocated.rpn + 3] = e + 40;
				}, () => {
					upThis.#rpn[part * allocated.rpn + 1] = e + 14;
				}, () => {
					upThis.#rpn[part * allocated.rpn] = e;
				}, false
				, () => {
					upThis.#cc[allocated.cc * part + ccToPos[91]] = e ? 127 : 0;
				}, false
				, () => {
					upThis.#cc[allocated.cc * part + ccToPos[7]] = e;
				}, () => {
					upThis.#cc[allocated.cc * part + ccToPos[10]] = Math.ceil(e * 9.05);
				}][ri] || (() => {}))();
			});
			//console.debug(`MT-32 CH${part + 1} Patch: ${msg}`);
		}).add([22, 18, 1], (msg, track, id) => {
			// MT-32 Part Drum Setup (temp)
			upThis.switchMode("mt32");
			let part = upThis.chRedir(id, track, true);
			//console.debug(`MT-32 CH${part + 1} Drum: ${msg}`);
		}).add([22, 18, 2], (msg, track, id) => {
			// MT-32 Part Timbre Setup (temp)
			upThis.switchMode("mt32");
			let part = upThis.chRedir(id, track, true);
			let offset = msg[1] + (msg[0] << 7);
			if (offset < 10) {
				upThis.#bnCustom[part] = 1;
			};
			msg.subarray(2).forEach((e, i) => {
				let ri = i + offset;
				if (ri < 14) {
					upThis.#cmTTimbre[(part - 1) * allocated.cmt + ri] = e;
				};
			});
			upThis.dispatchEvent("voice", {
				part
			});
		}).add([22, 18, 3], (msg, track, id) => {
			// MT-32 Part Patch Setup (dev)
			upThis.switchMode("mt32");
			if (msg[0]) {
				// Rhythm setup
				let offset = msg[1] - 16;
			} else {
				// Part setup
				let offset = msg[1];
				msg.subarray(2).forEach((e, i) => {
					let ri = i + offset;
					upThis.#cmTPatch[ri] = e;
					let part = upThis.chRedir(1 + ri >> 4, track, true),
					ptr = ri & 15;
					([false
					, () => {
						let timbreGroup = upThis.#cmTPatch[(part - 1) << 4];
						if (timbreGroup < 3) {
							upThis.#bnCustom[part] = 1;
							if (timbreGroup == 2) {
								// Copy name from timbre memory
								for (let c = 0; c < name.length; c ++) {
									upThis.#cmTTimbre[(part - 1) * allocated.cmt + c] = upThis.#cmTimbre[e * allocated.cmt + c];
								};
							} else {
								// Copy name from bank
								let name = upThis.baseBank.get(0, e + (timbreGroup << 6), 127, "mt32").name;
								for (let c = 0; c < name.length; c ++) {
									upThis.#cmTTimbre[(part - 1) * allocated.cmt + c] = name.charCodeAt(c);
								};
							};
						};
						upThis.dispatchEvent("voice", {
							part
						});
					}, () => {
						upThis.#rpn[part * allocated.rpn + 3] = e + 40;
					}, () => {
						upThis.#rpn[part * allocated.rpn + 1] = e + 14;
					}, () => {
						upThis.#rpn[part * allocated.rpn] = e;
					}, false
					, () => {
						upThis.#cc[allocated.cc * part + ccToPos[91]] = e ? 127 : 0;
					}, false
					, () => {
						upThis.#cc[allocated.cc * part + ccToPos[7]] = e;
					}, () => {
						upThis.#cc[allocated.cc * part + ccToPos[10]] = Math.ceil(e * 9.05);
					}][ptr] || (() => {}))();
				});
			};
			//console.debug(`MT-32 Part Patch: ${msg}`);
		}).add([22, 18, 4], (msg, track, id) => {
			// MT-32 Part Timbre Setup (dev)
			upThis.switchMode("mt32");
			let offsetTotal = msg[1] + (msg[0] << 7);
			msg.subarray(2).forEach((e, i) => {
				let ri = i + offsetTotal;
				let part = upThis.chRedir(Math.floor(ri / 246 + 1), track, true),
				offset = ri % 246;
				if (offset < 14) {
					upThis.#cmTTimbre[(part - 1) * allocated.cmt + offset] = e;
				};
				if (offset < 10) {
					upThis.#bnCustom[part] = 1;
				};
			});
			upThis.dispatchEvent("voice", {
				part
			});
		}).add([22, 18, 5], (msg, track, id) => {
			// MT-32 Patch Memory Write
			upThis.switchMode("mt32");
			let offset = (msg[0] << 7) + msg[1];
			msg.subarray(2).forEach((e, i) => {
				let realIndex = (offset + i);
				let patch = Math.floor(realIndex / 8), slot = (realIndex & 7);
				let patchOff = patch * 8;
				upThis.#cmPatch[realIndex] = e;
				([false, () => {
					let timbreGroup = upThis.#cmPatch[patchOff];
					if (timbreGroup < 3) {
						// Write for bank A, B and M
						let name = "";
						if (timbreGroup == 2) {
							let timbreOff = allocated.cmt * patch;
							name = `MT-m:${e.toString().padStart(3, "0")}`;
						} else {
							name = upThis.baseBank.get(0, e + (timbreGroup << 6), 127, "mt32").name;
						};
						upThis.userBank.clearRange({msb: 0, lsb: 127, prg: patch});
						upThis.userBank.load(`MSB\tLSB\tPRG\tNME\n000\t127\t${patch}\t${name}`, true);
					};
				}][slot] || (() => {}))();
			});
			upThis.forceVoiceRefresh();
		}).add([22, 18, 8], (msg, track, id) => {
			// MT-32 Timbre Memory Write
			upThis.switchMode("mt32");
			let offset = ((msg[0] & 1) << 7) + msg[1];
			msg.subarray(2).forEach((e, i) => {
				let ri = offset + i;
				if (ri < allocated.cmt) {
					//console.debug(`MT-32 timbre written to slot ${msg[0] >> 1}.`);
					upThis.#cmTimbre[(msg[0] >> 1) * allocated.cmt + ri] = e;
				};
			});
			upThis.forceVoiceRefresh();
		}).add([22, 18, 16], (msg, track, id) => {
			// MT-32 System Setup
			upThis.switchMode("mt32");
			let offset = msg[1];
			let updateRch = false;
			let setMidiRch = function (e, i) {
				upThis.#chReceive[i - 12] = e;
				updateRch = true;
			};
			msg.subarray(2).forEach((e, i) => {
				let ri = i + offset;
				([false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				false,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				setMidiRch,
				() => {
					upThis.#masterVol = e;
					upThis.dispatchEvent("mastervolume", upThis.#masterVol);
				}][ri] || (() => {}))(e, i);
			});
			if (updateRch) {
				upThis.buildRchTree();
			};
		}).add([22, 18, 32], (msg) => {
			// MT-32 Text Display
			upThis.switchMode("mt32");
			let offset = msg[1];
			let text = " ".repeat(offset);
			msg.subarray(2).forEach((e) => {
				if (e > 31) {
					text += String.fromCharCode(e);
				};
			});
			upThis.#letterDisp = text.padStart(20, " ");
			upThis.#letterExpire = Date.now() + 3200;
		}).add([22, 18, 82], (msg, track) => {
			// MT-32 alt reset?
			let partBase = upThis.chRedir(0, track, true);
			for (let part = 0; part < 16; part ++) {
				upThis.#ua.ano(partBase + part);
				if (part && part < 10) {
					upThis.#prg[partBase + part] = mt32DefProg[part - 1];
				};
			};
			console.info(`MT-32 alt reset complete.`);
		});
		// KORG NS5R SysEx section
		this.#seAi.add([66, 0], (msg, track) => {
			// Mode switch
			upThis.switchMode("ns5r", true);
			upThis.#modeKaraoke = false;
			console.debug(`NS5R mode switch requested: ${["global", "multi", "prog edit", "comb edit", "drum edit", "effect edit"][msg[0]]} mode.`);
		}).add([66, 1], (msg, track) => {
			// Map switch
			upThis.switchMode(["ns5r", "05rw"][msg[0]], true);
			upThis.#modeKaraoke = false;
		}).add([66, 18, 0, 0], (msg, track) => {
			// Master setup
			let offset = msg[0];
			switch (offset) {
				case 124: // all param reset
				case 126: // XG reset for NS5R
				case 127: { // GS reset for NS5R
					upThis.switchMode("ns5r", true);
					upThis.#modeKaraoke = false;
					break;
				};
				case 125: {// drum reset
					console.info(`NS5R drum setup reset: ${msg}`);
					break;
				};
				default: {
					if (offset < 10) {
						let mTune = [0, 0, 0, 0];
						let writeTune = (e, i) => {
							// NS5R master fine tune
							mTune[i] = e;
						};
						msg.subarray(1).forEach((e, i) => {
							[writeTune, writeTune, writeTune, writeTune,
							() => {
								upThis.#masterVol = e * 129 / 16383 * 100;
								upThis.dispatchEvent("mastervolume", upThis.#masterVol);
							}, () => {
								return (e - 64);
							}, () => {
								return (e - 64);
							}, () => { // EFX MSB
							}, () => { // EFX LSB
							}, () => { // EFX PRG
							}][offset + i]();
						});
						if (msg[0] < 4) {
							// Commit master tune
							let rTune = 0;
							mTune.forEach((e) => {
								rTune = rTune << 4;
								rTune += e;
							});
							rTune -= 1024;
						};
					};
				};
			};
		}).add([66, 18, 0, 1], (msg, track) => {
			// Channel out port setup, trap for now
		}).add([66, 18, 0, 2], (msg, track) => {
			// Program out port setup, trap for now
		}).add([66, 18, 1], (msg, track) => {
			// Part setup
			let part = upThis.chRedir(msg[0], track, true),
			chOff = part * allocated.cc;
			let offset = msg[1];
			let dPref = `NS5R CH${part + 1} `;
			msg.subarray(2).forEach((e, i) => {
				let c = offset + i;
				if (c < 3) {
					// MSB, LSB, PRG
					[() => {
						upThis.#cc[chOff + ccToPos[0]] = e || 121;
					}, () => {
						upThis.#cc[chOff + ccToPos[32]] = e;
					}, () => {
						upThis.#prg[part] = e;
					}][c]();
					upThis.dispatchEvent("voice", {
						part
					});
				} else if (c < 8) {
					// Trap for junk data
				} else if (c < 14) {
					[() => {
						let ch = upThis.chRedir(e, track, true);
						upThis.#chReceive[part] = ch; // Rx CH
						if (part != ch) {
							upThis.buildRchTree();
							console.info(`${dPref}receives from CH${ch + 1}`);
						};
					}, () => {
						upThis.#mono[part] = +!e;
					}, () => {
						upThis.setChType(part, e, modeMap.ns5r);
						console.debug(`${dPref}type: ${xgPartMode[e]}`);
					}, () => {
						upThis.#rpn[allocated.rpn * part + 3] = e;
					}, () => {
					}, () => {
					}][c - 8]();
				} else if (c < 16) {
					// Trap for junk data
				} else if (c < 33) {
					[() => {
						upThis.#cc[chOff + ccToPos[7]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[11]] = e;
					}, () => {
					}, () => {
					}, () => {
						upThis.#cc[chOff + ccToPos[10]] = e || 128;
					}, () => {
					}, () => {
					}, () => {
						upThis.#cc[chOff + ccToPos[93]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[91]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[76]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[77]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[78]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[74]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[71]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[73]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[75]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[72]] = e;
					}][c - 16]();
				} else if (c < 112) {
					// Trap for data not supported
				} else if (c < 114) {
					[() => {
						upThis.#cc[chOff + ccToPos[5]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[65]] = e;
					}][c - 112]();
				};
			});
		}).add([66, 18, 8, 0], (msg, track) => {
			// Display (letter and bitmap)
			let offset = msg[0];
			if (offset < 32) {
				// Letter display
				upThis.setLetterDisplay(msg.subarray(1, 33), "NS5R letter display");
			} else {
				// Bitmap display
				let bitOffset = offset - 32;
				upThis.#bitmapExpire = Date.now() + 3200;
				upThis.#bitmapPage = 10; // Use bitmap 11 that holds 512 pixels
				upThis.#bitmap.fill(0); // Init
				let workArr = msg.subarray(1);
				let lastCol = 4;
				workArr.forEach(function (e, i) {
					let ri = i + bitOffset;
					let tx = ri >> 4, ty = ri & 15;
					if (ri < 80) {
						let dummy = tx < lastCol ? e : e >> 3, shifted = 0, perspective = tx < lastCol ? 6 : 3;
						while (dummy > 0) {
							upThis.#bitmap[ty * 32 + tx * 7 + (perspective - shifted)] = dummy & 1;
							dummy = dummy >> 1;
							shifted ++;
						};
					};
				});
			};
		}).add([66, 52], (msg, track) => {
			// Currect effect dump
			upThis.switchMode("ns5r", true);
			upThis.#modeKaraoke = false;
			let efxName = "";
			korgFilter(msg, (e, i) => {
				if (i < 8) {
					if (e > 31) {
						efxName += String.fromCharCode(e);
					};
					if (i == 7) {
						upThis.aiEfxName = efxName;
					};
				} else if (i < 10) {
					// AI effect ID
					upThis.setEffectType(i - 8, 44, e);
					upThis.dispatchEvent(`efx${['reverb', 'chorus'][i - 8]}`, upThis.getEffectType(i - 8));
				};
			});
		}).add([66, 53], (msg, track) => {
			// Current multi dump
			upThis.switchMode("ns5r", true);
			upThis.#modeKaraoke = false;
			// I'm lazy I just ported the old code here don't judge meee
			korgFilter(msg, function (e, i) {
				switch (true) {
					case i < 2944: {
						// 32 part setup params, 2944 bytes
						let part = upThis.chRedir(Math.floor(i / 92), track, true),
						chOff = part * allocated.cc;
						switch (i % 92) {
							case 0: {
								// MSB Bank
								upThis.#cc[chOff + ccToPos[0]] = e || 121;
								upThis.dispatchEvent("voice", {
									part
								});
								break;
							};
							case 1: {
								// LSB Bank
								upThis.#cc[chOff + ccToPos[32]] = e;
								upThis.dispatchEvent("voice", {
									part
								});
								break;
							};
							case 2: {
								// Program
								upThis.#prg[part] = e;
								if (e > 0) {
									upThis.setChActive(part, 1);
								};
								upThis.dispatchEvent("voice", {
									part
								});
								break;
							};
							case 3: {
								// Receive MIDI channel
								let ch = upThis.chRedir(e, track, true);
								upThis.#chReceive[part] = ch;
								if (part != ch) {
									console.info(`NS5R CH${part + 1} receives from CH${ch + 1}.`);
									upThis.buildRchTree();
								};
							};
							case 7: {
								// 0 for melodic, 1 for drum, 2~5 for mod drums 1~4
								// KORG has multiple MSBs for drums, well...
								break;
							};
							case 8: {
								// Coarse Tune
								upThis.#rpn[part * allocated.rpn + 3] = (e < 40 || e > 88) ? e + (e > 63 ? -192 : 64) : e;
								break;
							};
							case 9: {
								// Fine Tune
								// This is trying to use absolute values.
							};
							case 10: {
								// Volume
								upThis.#cc[chOff + ccToPos[7]] = e;
								break;
							};
							case 11: {
								// Expression
								upThis.#cc[chOff + ccToPos[11]] = e;
								break;
							};
							case 14: {
								// Pan
								upThis.#cc[chOff + ccToPos[10]] = e || 128;
								break;
							};
							case 19: {
								// Chorus
								upThis.#cc[chOff + ccToPos[93]] = e;
								break;
							};
							case 20: {
								// Reverb
								upThis.#cc[chOff + ccToPos[91]] = e;
								break;
							};
							case 84: {
								// Portamento Switch
								upThis.#cc[chOff + ccToPos[65]] = e;
								break;
							};
							case 85: {
								// Portamento Time
								upThis.#cc[chOff + ccToPos[5]] = e;
								break;
							};
						};
						break;
					};
					case i < 3096: {
						// part common params, 152 bytes
						break;
					};
					case i < 3134: {
						// current effect params, 38 bytes
						break;
					};
					case i < 8566: {
						// 4 mod drum params, 5432 bytes
						break;
					};
				};
			});
		}).add([66, 54], (msg, track) => {
			// All program dump
			// Yup this one is also ported from old code
			upThis.switchMode("ns5r", true);
			let name = "", msb = 80, prg = 0, lsb = 0;
			let voiceMap = "MSB\tPRG\tLSB\tNME";
			korgFilter(msg, function (e, i) {
				let p = i % 158;
				switch (true) {
					case (p < 10): {
						if (e > 31) {
							name += String.fromCharCode(e);
						};
						break;
					};
					case (p == 11): {
						msb = e & 127;
						break;
					};
					case (p == 12): {
						lsb = e & 127;
						break;
					};
					case (p == 13): {
						voiceMap += `\n${msb}\t${prg}\t${lsb}\t${name.trim().replace("Init Voice", "")}`;
						prg ++;
						name = "";
						break;
					};
				};
			});
			upThis.userBank.clearRange({
				msb: 80,
				lsb: 0
			});
			//console.debug(voiceMap);
			upThis.userBank.load(voiceMap);
			getDebugState() && console.debug(voiceMap);
			upThis.forceVoiceRefresh();
		}).add([66, 55], (msg, track) => {
			// All combination dump
			// Just modified from above
			upThis.switchMode("ns5r", true);
			let name = "", msb = 88, prg = 0, lsb = 0;
			let voiceMap = "MSB\tPRG\tLSB\tNME";
			korgFilter(msg, function (e, i) {
				let p = i % 126;
				switch (true) {
					case (p < 10): {
						if (e > 31) {
							name += String.fromCharCode(e);
						};
						break;
					};
					case (p == 11): {
						//msb = e;
						break;
					};
					case (p == 12): {
						//lsb = e;
						break;
					};
					case (p == 13): {
						voiceMap += `\n${msb}\t${prg}\t${lsb}\t${name.trim().replace("Init Combi", "")}`;
						prg ++;
						name = "";
						break;
					};
				};
			});
			upThis.userBank.clearRange({
				msb: 88,
				lsb: 0
			});
			upThis.userBank.load(voiceMap);
			getDebugState() && console.debug(voiceMap);
			upThis.forceVoiceRefresh();
		}).add([66, 125], (msg) => {
			// Backlight
			upThis.dispatchEvent("backlight", ["green", "orange", "red", false, "yellow", "blue", "purple"][msg[0]] || "white");
		}).add([66, 127], (msg) => {
			// NS5R screen dump
			let screenBuffer = new Uint8Array(5760);
			korgFilter(msg, (e, i, a) => {
				if (i < 720) {
					for (let bi = 0; bi < 8; bi ++) {
						screenBuffer[i * 8 + bi] = (e >> (7 - bi)) & 1;
					};
				};
			});
			upThis.dispatchEvent("screen", {type: "ns5r", data: screenBuffer});
		}).add([76], (msg, track, id) => {
			// N1R to NS5R redirector
			upThis.#seAi.run([66, ...msg], track, id);
		});
		// Kawai GMega
		this.#seKg.add([16, 0, 8, 0], (msg, track, id) => {
			// GMega system section
			let e = (msg[2] << 4) + msg[3];
			let dPref = "K11 ";
			([() => {
				// GMega bank set
				upThis.switchMode("k11", true);
				upThis.#modeKaraoke = false;
				upThis.#subLsb = e ? 4 : 0;
				console.info("MIDI reset: GMega/K11");
			}, () => {
				upThis.setEffectType(0, 24, e);
				console.debug(`${dPref}reverb type: ${e}`);
				upThis.dispatchEvent(`efxreverb`, upThis.getEffectType(0));
			}, () => {
				console.debug(`${dPref}reverb time: ${e}`);
			}, () => {
				console.debug(`${dPref}reverb time: ${e}`);
			}, () => {
				console.debug(`${dPref}reverb predelay: ${e}`);
			}, () => {
				console.debug(`${dPref}reverb predelay: ${e}`);
			}, () => {
				console.debug(`${dPref}depth high: ${e}`);
			}, () => {
				console.debug(`${dPref}depth high: ${e}`);
			}, () => {
				console.debug(`${dPref}depth low: ${e}`);
			}, () => {
				console.debug(`${dPref}depth low: ${e}`);
			}][msg[0]] || (() => {}))();
		}).add([16, 0, 8, 1], (msg, track, id) => {
			// GMega part setup
			let part = upThis.chRedir(msg[1], track, true),
			chOff = allocated.cc * part,
			rpnOff = allocated.rpn * part,
			e = (msg[3] << 4) + msg[4];
			let dPref = `K11 CH${part + 1} `;
			([() => {
				if (e < 128) {
					// Melodic voice
					upThis.setChType(part, upThis.CH_MELODIC, modeMap.k11);
					upThis.#cc[chOff + ccToPos[0]] = 0;
					upThis.#prg[part] = e;
				} else {
					// Drum kit
					upThis.setChType(part, upThis.CH_DRUMS, modeMap.k11);
					upThis.#prg[part] = e - 128;
				};
				upThis.dispatchEvent("voice", {
					part
				});
			}, () => {
				let ch = upThis.chRedir(e, track, true);
				upThis.#chReceive[part] = ch; // Rx CH
				if (part != ch) {
					upThis.buildRchTree();
					console.info(`${dPref}receives from CH${ch + 1}`);
				};
			}, () => {
				upThis.#cc[chOff + ccToPos[7]] = e; // volume
			}, () => {
				uupThis.setChActive(part, e); // toggle channel
			}, () => {
				upThis.#cc[chOff + ccToPos[10]] = e; // pan
			}, () => {
				upThis.#rpn[rpnOff + 3] = e + 40; // coarse tune
			}, () => {
				upThis.#rpn[rpnOff + 1] = e >> 1; // fine tune
				upThis.#rpn[rpnOff + 2] = e & 1;
			}, () => {
				upThis.#cc[chOff + ccToPos[91]] = e ? 127 : 0; // reverb
			}, () => {
				// What is a negative bend depth/sensitivity?
			}, () => {
				upThis.#cc[chOff + ccToPos[74]] = e; // brightness
			}, () => {
				upThis.#cc[chOff + ccToPos[73]] = e; // attack
			}, () => {
				upThis.#cc[chOff + ccToPos[72]] = e; // release
			}][msg[0]] || (() => {}))();
		}).add([16, 0, 9, 0], (msg, track, id) => {
			// GMega LX system section
			let e = (msg[2] << 4) + msg[3];
			let dPref = "GMLX ";
			([() => {
				console.debug(`${dPref}reverb type: ${e}`);
			}, () => {
				console.debug(`${dPref}reverb time: ${e}`);
			}, () => {
				console.debug(`${dPref}reverb predelay: ${e}`);
			}, () => {
				console.debug(`${dPref}depth high: ${e}`);
			}, () => {
				console.debug(`${dPref}depth low: ${e}`);
			}][msg[0]] || (() => {}))();
		}).add([16, 0, 9, 3], (msg, track, id) => {
			// GMega LX part setup 1
			let e = (msg[2] << 4) + msg[3];
			let part = upThis.chRedir(msg[1], track, true),
			chOff = part * allocated.cc;
			[() => {
				if (e < 128) {
					// Melodic voice
					upThis.setChType(part, upThis.CH_MELODIC, modeMap.k11);
					upThis.#cc[chOff + ccToPos[0]] = 0;
					upThis.#cc[chOff + ccToPos[32]] = 0;
					upThis.#prg[part] = e;
				} else if (e < 160) {
					// Melodic voice
					upThis.setChType(part, upThis.CH_MELODIC, modeMap.k11);
					upThis.#cc[chOff + ccToPos[0]] = 0;
					upThis.#cc[chOff + ccToPos[32]] = 7;
					upThis.#prg[part] = e - 100;
				} else {
					// Drum kit
					upThis.setChType(part, upThis.CH_DRUMS, modeMap.k11);
					upThis.#cc[chOff + ccToPos[0]] = 122;
					upThis.#cc[chOff + ccToPos[32]] = 0;
					upThis.#prg[part] = e - 160;
				};
				upThis.dispatchEvent("voice", {
					part
				});
			}, () => {
				let ch = upThis.chRedir(e, track, true);
				upThis.#chReceive[part] = ch; // Rx CH
				if (part != ch) {
					upThis.buildRchTree();
					console.info(`GMLX CH${part + 1} receives from CH${ch + 1}`);
				};
			}][msg[0]]();
		}).add([16, 0, 9, 4], (msg, track, id) => {
			// GMega LX part setup 2
			let e = (msg[2] << 4) + msg[3];
			let part = upThis.chRedir(msg[1], track, true),
			chOff = part * allocated.cc,
			rpnOff = part * allocated.rpn;
			let dPref = `GMLX CH${part + 1} `;
			[() => {
				upThis.setChActive(part, e); // toggle channel
			}, () => {
				upThis.#cc[chOff + ccToPos[7]] = e; // volume
			}, () => {
				upThis.#cc[chOff + ccToPos[10]] = e; // pan
			}, () => {
				upThis.#cc[chOff + ccToPos[91]] = e ? 127 : 0; // reverb
			}, () => {
				upThis.#rpn[rpnOff + 3] = e + 40; // coarse tune
			}, () => {
				upThis.#rpn[rpnOff + 1] = e; // fine tune
			}, () => {
				upThis.#rpn[rpnOff] = e; // pitch bend sensitivity
			}, () => {
				// mod depth
			}][msg[0]]();
		});
		// AKAI SG
		this.#seSg.add([66, 93, 64], (msg, track, id) => {
			let e = msg[2];
			switch (msg[0]) {
				case 0: {
					// SG system section at 0x00
					switch (msg[1]) {
						case 4: {
							// master volume
							upThis.#masterVol = e * 129 / 16383 * 100;
							upThis.dispatchEvent("mastervolume", upThis.#masterVol);
							break;
						};
						case 5: {
							// master key shift, [-24, 24]
							(e - 64);
							break;
						};
						case 6: {
							// global reverb toggle
							console.debug(`SG global reverb: ${e ? "on" : "off"}`);
							break;
						};
						case 127: {
							// SG reset
							upThis.switchMode("sg", true);
							break;
						};
					};
					break;
				};
				case 1: {
					switch (msg[1]) {
						case 48: {
							// SG reverb macro
							console.debug(`SG reverb type: ${gsRevType[e]}`);
							break;
						};
					};
					break;
				};
				default: {
					if ((msg[0] >> 4) == 1) {
						// SG part setup
						let part = upThis.chRedir(msg[0] & 15, track, true);
						if (msg[1] == 2) {
							// SG receive channel
							let ch = upThis.chRedir(e, track, true);
							upThis.#chReceive[part] = ch; // Rx CH
							if (part != ch) {
								upThis.buildRchTree();
								console.info(`SG CH${part + 1} receives from CH${ch + 1}`);
							};
						} else if (msg[1] == 19) {
							// SG part level
							upThis.#cc[allocated.cc * part + ccToPos[7]] = e;
						};
					} else {
						console.warn(`Unknown AKAI SG SysEx: ${msg}`);
					};
				};
			};
		});
		this.#seCs.add([9], (msg, track, id) => {
			// CASIO GZ-50M cc91 effect type set
			console.debug(`GZ set effect: ${["stage reverb", "hall reverb", "room reverb", "chorus", "tremelo", "phaser", "rotary speaker", "enhancer", "flanger", "EQ"][msg[0]] || "off"}`);
		});
		// Yamaha S90 ES or Motif ES
		this.#seXg.add([127, 0], (msg, track, id) => {
			// Motif ES to S90 ES redirector
			upThis.switchMode("motif");
			let newMsg = new Uint8Array([127, 1, ...msg]);
			upThis.#seXg.run(newMsg, track, id);
		}).add([127, 1, 0, 0], (msg, track, id) => {
			// S90 ES System
			upThis.switchMode("s90es");
			let dPref = "S90/Motif ES system ",
			offset = msg[0];
			msg.subarray(1).forEach((e, i) => {
				([() => {
					upThis.#masterVol = e * 12900 / 16383;
					upThis.dispatchEvent("mastervolume", upThis.#masterVol);
				}][offset + i] || (() => {
					console.info(`Unrecognized ${dPref}ID: ${offset + i}`);
				}))();
			});
		}).add([127, 1, 0, 0, 14], (msg, track, id) => {
			// S90 ES bulk dump header
			upThis.switchMode("s90es");
			let dPref = "S90/Motif ES bulk header ";
			let addrSet = [];
			addrSet[95] = (msg, track, id) => {
				console.debug(`${dPref}multi edit buffer: ${msg[1]}`);
			};
			(addrSet[msg[0]] || (() => {
				console.info(`Unrecognized ${dPref}ID: ${msg[0]}.`);
			}))(msg.subarray(1));
		}).add([127, 1, 0, 0, 15], (msg, track, id) => {
			// S90 ES bulk dump footer
			upThis.switchMode("s90es");
			let dPref = "S90/Motif ES bulk footer ";
			let addrSet = [];
			addrSet[95] = (msg, track, id) => {
				console.debug(`${dPref}multi edit buffer: ${msg[1]}`);
			};
			(addrSet[msg[0]] || (() => {
				console.info(`Unrecognized ${dPref}ID: ${msg[0]}.`);
			}))(msg.subarray(1));
		}).add([127, 1, 0, 58, 55], (msg, track, id) => {
			// S90 ES bulk part setup (?)
			upThis.switchMode("s90es");
			let part = upThis.chRedir(msg[0], track, true),
			chOff = allocated.cc * part,
			offset = msg[1];
			let dPref = `S90/Motif ES bulk CH${part < 16 ? part + 1 : "U" + (part - 95)} `;
			console.debug(dPref, msg);
			if (msg[0] > 15) {
				return;
			};
			msg.subarray(2).forEach((e, i) => {
				([() => {
					upThis.#cc[chOff + ccToPos[0]] = e;
					upThis.dispatchEvent("voice", {
						part
					});
				}, () => {
					e && (upThis.setChActive(part, 1));
					upThis.#cc[chOff + ccToPos[32]] = e;
					upThis.setChType(part, ([32, 40].indexOf(e) > -1) ? upThis.CH_DRUMS : upThis.CH_MELODIC, upThis.#mode, true);
					upThis.dispatchEvent("voice", {
						part
					});
				}, () => {
					e && (upThis.setChActive(part, 1));
					upThis.#prg[part] = e;
					upThis.dispatchEvent("voice", {
						part
					});
				}, () => {
					let ch = upThis.chRedir(e, track, true);
					upThis.#chReceive[part] = ch; // Rx CH
					if (part != ch) {
						upThis.buildRchTree();
						console.info(`${dPref}receives from CH${ch + 1}`);
					};
				}, () => {
					upThis.#mono[part] = e ? 0 : 1;
				}, false, false, false, false, false, false, false, false, () => {
					upThis.#cc[chOff + ccToPos[7]] = e;
				}, () => {
					upThis.#cc[chOff + ccToPos[10]] = e;
				}, false, false, false, () => {
					upThis.#cc[chOff + ccToPos[91]] = e;
				}, () => {
					upThis.#cc[chOff + ccToPos[93]] = e;
				}, () => {
					upThis.#cc[chOff + ccToPos[94]] = e;
				}, () => {
					upThis.#cc[chOff + ccToPos[128]] = e;
				}, () => {
					// note shift, RPN
				}, () => {
					upThis.#cc[chOff + ccToPos[74]] = e;
				}, () => {
					upThis.#cc[chOff + ccToPos[71]] = e;
				}, false, () => {
					upThis.#cc[chOff + ccToPos[65]] = e;
				}, () => {
					upThis.#cc[chOff + ccToPos[5]] = e;
				}, () => {
					// portamento mode: fingered, fulltime
				}][offset + i] || (() => {}))();
			});
		}).add([127, 1, 54, 16], (msg, track, id) => {
			// S90 ES EQ config
			upThis.switchMode("s90es");
			let offset = msg[0];
			msg.subarray(1).forEach((e, i) => {
				let eqPart = i >> 2;
				let dPref = `S90/Motif ES EQ${eqPart + 1} `;
				([() => {
					let eqGain = e - 64;
					//console.debug(`${dPref}gain: ${eqGain}dB`);
				}, () => {
					let eqFreq = xgNormFreq[e];
					//console.debug(`${dPref}freq: ${eqFreq}Hz`);
				}, () => {
					let eqQFac = e / 10;
					//console.debug(`${dPref}Q: ${eqQFac}`);
				}, () => {
					let eqType = e; // shelf, peak
					//console.debug(`${dPref}type: ${["shelf", "peak"][eqTypes]}`);
				},][(offset + i) & 3] || (() => {}))();
			});
		});
		// SD-90 part setup (part)
		this.#seGs.add([0, 72, 18, 0, 0, 0, 0], (msg, track, id) => {
			// SD-90 Native System On
			upThis.switchMode("sd", true);
			console.info(`MIDI reset: SD`);
		})/*.add([0, 72, 18, 1, 0, 0], (msg, track, id) => {
			// Master setup
		}).add([0, 72, 18, 1, 0, 2], (msg, track, id) => {
			// Master EQ
		}).add([0, 72, 18, 2, 16, 0], (msg, track, id) => {
			// Master volume
		})*/.add([0, 72, 18, 16, 0], (msg, track, id) => {
			// Part setup (global)
			let type = msg[0] >> 5, channel = msg[0] & 31;
			switch (type) {
				case 0: {
					// Global effects
					console.debug(`Unknown SD-90 global effects message:\n%o`, msg);
					break;
				};
				case 1: {
					// Global part param setup
					let part = upThis.chRedir(channel, track, true),
					offset = msg[1], chOff = part * allocated.cc;
					//console.debug(`Unknown SD-90 CH${part + 1} setup param message:\n%o`, msg);
					msg.subarray(2).forEach((e, i) => {
						let pointer = offset + i;
						if (pointer < 37) {
							([() => {
								// Receive channel
							}, () => {
								// Receive switch
							}, 0, () => {
								// Receive port
							}, () => {
								// cc0
								upThis.#cc[chOff + ccToPos[0]] = e;
								switch (e) {
									case 104:
									case 105:
									case 106:
									case 107:
									case 120: {
										if (!upThis.#chType[part]) {
											upThis.setChType(part, upThis.CH_DRUMS);
										};
										break;
									};
									default: {
										if (upThis.#chType[part]) {
											upThis.setChType(part, upThis.CH_MELODIC);
										};
									};
								};
								upThis.dispatchEvent("voice", {
									part
								});
							}, () => {
								// cc32
								upThis.#cc[chOff + ccToPos[32]] = e;
								upThis.dispatchEvent("voice", {
									part
								});
							}, () => {
								// PC#
								upThis.#prg[part] = e;
								upThis.dispatchEvent("voice", {
									part
								});
							}, () => {
								// cc7
								upThis.#cc[chOff + ccToPos[7]] = e;
							}, () => {
								// cc10
								upThis.#cc[chOff + ccToPos[10]] = e;
							}, () => {
								// Coarse tune (±48)
							}, () => {
								// Fine tune
							}, () => {
								// Mono/poly
								if (e < 2) {
									upThis.#mono[part] = e;
								};
							}, () => {
								// cc68
								if (e < 2) {
									upThis.#cc[chOff + ccToPos[68]] = e ? 127 : 0;
								};
							}, () => {
								// Pitch bend sensitivity
							}, () => {
								// cc65
								if (e < 2) {
									upThis.#cc[chOff + ccToPos[65]] = e ? 127 : 0;
								};
							}, () => {
								// cc5 MSB
								upThis.#cc[chOff + ccToPos[5]] = (e & 15 << 4) | (upThis.#cc[chOff + ccToPos[5]] & 15);
							}, () => {
								// cc5 LSB
								upThis.#cc[chOff + ccToPos[5]] = (e & 15) | ((upThis.#cc[chOff + ccToPos[5]] & 240) >> 4);
							}, () => {
								// cc74
								upThis.#cc[chOff + ccToPos[74]] = e;
							}, () => {
								// cc71
								upThis.#cc[chOff + ccToPos[71]] = e;
							}, () => {
								// cc73
								upThis.#cc[chOff + ccToPos[73]] = e;
							}, () => {
								// cc72
								upThis.#cc[chOff + ccToPos[72]] = e;
							}, 0, 0, 0, 0, 0, 0, 0, () => {
								// Dry level
								upThis.#cc[chOff + ccToPos[128]] = e;
							}, () => {
								// cc93
								upThis.#cc[chOff + ccToPos[93]] = e;
							}, () => {
								// cc91
								upThis.#cc[chOff + ccToPos[91]] = e;
							}, 0, 0, () => {
								// cc75
								upThis.#cc[chOff + ccToPos[75]] = e;
							}, () => {
								// cc76
								upThis.#cc[chOff + ccToPos[76]] = e;
							}, () => {
								// cc77
								upThis.#cc[chOff + ccToPos[77]] = e;
							}, () => {
								// cc78
								upThis.#cc[chOff + ccToPos[78]] = e;
							}][pointer]||(() => {}))();
						} else if (pointer < 63) {
							// Keyboard setup
						} else if (pointer < 64) {
							// GM2 set
							if (upThis.#chType[part]) {
								// Drums
								upThis.#cc[chOff + ccToPos[0]] = 104 | e;
							} else {
								// Melodic
								upThis.#cc[chOff + ccToPos[0]] = 96 | e;
							};
						} else {
							console.debug(`Unknown SD-90 global CH${part + 1} param setup message:\n%o`, msg);
						};
					});
					break;
				};
				case 2: {
					// Global part MIDI setup
					let part = upThis.chRedir(channel, track, true), offset = msg[1];
					console.debug(`Unknown SD-90 global CH${part + 1} MIDI setup message:\n%o`, msg.subarray(2));
					break;
				};
				default: {
					// No one should use this...
					console.warn(`Unknown SD-90 global part setup message:\n%o`, msg);
				};
			};
		})/*.add([0, 72, 18, 17], (msg, track, id) => {
			// Part setup (part)
		})*/;
	};
};

export {
	OctaviaDevice,
	allocated,
	ccToPos,
	dnToPos
};
