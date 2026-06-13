"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";
import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {VoiceBank} from	"../state/bankReader.js";

const modeIdx = [
	"?",
	"gm", "gs", "xg", "g2",
	"mt32", "ns5r",
	"ag10", "x5d", "05rw", "krs",
	"k11", "sg"
];
const substList = [
	[0, 0, 0, 0, 121, 0,   0, 56, 82, 81, 63, 0, 0],
	[0, 0, 4, 0, 0,   127, 0, 0,  0,  0,  0,  0, 0]
];
const drumMsb = [120, 127, 120, 127, 120, 127, 61, 62, 62, 62, 120, 122, 122];
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
	12, 13, // General-purpose effect controllers
	16, 17, 18, 19 // General-purpose sound controllers
], // 96, 97, 120 to 127 all have special functions
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
		//console.info(seqArr);
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
};

let OctaviaDevice = class extends CustomEventSource {
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
	#cc = new Uint8ClampedArray(allocated.ch * allocated.cc); // 64 channels, 128 controllers
	#prg = new Uint8ClampedArray(allocated.ch);
	#velo = new Uint8ClampedArray(allocated.ch * allocated.nn); // 64 channels. 128 velocity registers
	#mono = new Uint8Array(allocated.ch); // Mono/poly mode
	#poly = new Uint16Array(allocated.pl); // 512 polyphony allowed
	#polyState = new Uint8Array(allocated.pl); // State of each active voice.
	#pitch = new Int16Array(allocated.ch); // Pitch for channels, from -8192 to 8191
	#rawStrength = new Uint8Array(allocated.ch);
	#dataCommit = 0; // 0 for RPN, 1 for NRPN
	#rpn = new Uint8Array(allocated.ch * allocated.rpn); // RPN registers (0 pitch MSB, 1 fine tune MSB, 2 fine tune LSB, 3 coarse tune MSB, 4 mod sensitivity MSB, 5 mod sensitivity LSB)
	#nrpn = new Int8Array(allocated.ch * useNormNrpn.length); // Normal section of NRPN registers
	#bnCustom = new Uint8Array(allocated.ch); // Custom name activation
	#cmTPatch = new Uint8Array(128); // C/M part patch storage
	#cmTTimbre = new Uint8Array(allocated.cmt * 8); // C/M part timbre storage
	#cmPatch = new Uint8Array(1024); // C/M device patch storage
	#cmTimbre = new Uint8Array(allocated.cmt * 64); // C/M device timbre storage (64)
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
	baseBank = new VoiceBank("gm", "gm2", "xg", "gs", "ns5r", "gmega", "plg-150vl", "plg-150pf", "plg-150dx", "plg-150an", "plg-150dr", "plg-100sg", "kross"); // Load all possible voice banks
	userBank = new VoiceBank("gm"); // User-defined bank for MT-32, X5DR and NS5R
	initOnReset = false; // If this is true, Octavia will re-init upon mode switches
	chRedir(part, track, noConquer) {
		if (this.#trkAsReq[track]) {
			// Allow part assigning via meta
			let metaChosen = (this.#trkAsReq[track] - 1) * 16 + part;
			return metaChosen;
		} else if ([modeMap.gs, modeMap.ns5r].indexOf(this.#mode) > -1) {
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
				if (this.#cc[allocated.cc * part + ccToPos[64]] > 63 && !this.config?.disableCc64) {
					// Held by cc64
					this.#polyState[polyIdx] = 4;
				} else {
					this.#poly[polyIdx] = 0;
					this.#velo[rawNote] = 0;
					this.#polyState[polyIdx] = 0;
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
				// 5: sostenuto sustain
				// 6: sostenuto hold
				// 7: release
				place ++;
			};
			if (place < allocated.pl) {
				this.#poly[place] = rawNote;
				this.#velo[rawNote] = velo;
				this.#polyState[place] = 3;
				if (this.#rawStrength[part] < velo) {
					this.#rawStrength[part] = velo;
				};
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
				if (e == 4) {
					// Held by cc64
					let rawNote = this.#poly[i];
					let channel = rawNote >> 7;
					if (part == channel) {
						this.#polyState[i] = 0;
						this.#poly[i] = 0;
						this.#velo[rawNote] = 0;
					};
				};
			});
		},
		soOf: (part) => {
			// Scan and turn off all notes held by cc66
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
			this.#chActive[part] = 1;
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
			};
		},
		11: function (det) {
			let part = det.channel;
			// CC event, directly assign values to the register.
			this.#chActive[part] = 1;
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
								if (this.#cc[chOffset] > 119) {
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
								if (this.#cc[chOffset] > 119) {
									det.data[1] = this.#cc[chOffset];
									det.data[1] = 120;
									console.debug(`Forced channel ${part + 1} to stay drums.`);
								};
							};
						} else if (this.#mode == modeMap.gm) {
							if (det.data[1] < 48) {
								// Do not change drum channel to a melodic
								if (this.#cc[chOffset] > 119) {
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
							} else if (det.data[1] == 56) {
								let agCount = 0;
								for (let c = 0; c < 16; c ++) {
									let d = this.#cc[allocated.cc * c];
									if (d == 56 || d == 62) {
										agCount ++;
									};
								};
								if (agCount > 14) {
									this.switchMode("ag10", true);
								};
							};
						};
						break;
					};
					case 6: {
						// Show RPN and NRPN
						if (this.#dataCommit) {
							let msb = this.#cc[chOffset + ccToPos[99]],
							lsb = this.#cc[chOffset + ccToPos[98]];
							if (msb == 1) {
								let toCc = nrpnCcMap.indexOf(lsb);
								if (toCc > -1) {
									this.#cc[chOffset + ccToPos[71 + toCc]] = det.data[1];
									getDebugState() && console.debug(`Redirected NRPN 1 ${lsb} to cc${71 + toCc}.`);
								} else {
									let nrpnIdx = useNormNrpn.indexOf(lsb);
									if (nrpnIdx > -1) {
										this.#nrpn[part * 10 + nrpnIdx] = det.data[1] - 64;
									};
									getDebugState() && console.debug(`CH${part + 1} voice NRPN ${lsb} commit`);
								};
							} else {
								//console.debug(`CH${part + 1} drum NRPN ${msb} commit`);
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
						console.debug(`Sostenuto pedal: ${det.data[1]}`);
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
			};
		},
		12: function (det) {
			let part = det.channel;
			// Program change
			this.#chActive[part] = 1;
			this.#prg[part] = det.data;
			this.#bnCustom[part] = 0;
			if (getDebugState()) {
				console.debug(`T:${det.track} C:${part} P:${det.data}`);
			};
		},
		13: function (det) {
			// Channel aftertouch
			let upThis = this;
			let part = det.channel;
			this.#poly.forEach(function (e) {
				let realCh = e >> 7;
				if (part == realCh) {
					upThis.#velo[e] = det.data;
				};
			});
		},
		14: function (det) {
			let part = det.channel;
			// Pitch bending
			this.#pitch[part] = det.data[1] * 128 + det.data[0] - 8192;
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
			if (useReply) {
				det.reply = "meta";
				return det;
			} else if (getDebugState()) {
				console.debug(det);
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
				this.#seGs.run(msg, track, id);
				console.warn(`Unknown device SysEx!`);
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
		let result = this.#chActive.slice();
		if (this.#mode == modeMap.mt32) {
			//result[0] = 0;
		};
		return result;
	};
	getCc(channel) {
		// Return channel CC registers
		let start = channel * allocated.cc;
		let arr = this.#cc.slice(start, start + allocated.cc);
		arr[ccToPos[0]] = arr[ccToPos[0]] || this.#subMsb;
		arr[ccToPos[32]] = arr[ccToPos[32]] || this.#subLsb;
		return arr;
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
	init(type = 0) {
		// Type 0 is full reset
		// Type 1 is almost-full reset
		// Full reset, except the loaded banks
		this.dispatchEvent("mode", "?");
		this.#mode = 0;
		this.#subMsb = 0;
		this.#subLsb = 0;
		this.#metaChannel = 0;
		this.#chActive.fill(0);
		this.#cc.fill(0);
		this.#prg.fill(0);
		this.#velo.fill(0);
		this.#poly.fill(0);
		this.#rawStrength.fill(0);
		this.#pitch.fill(0);
		this.#nrpn.fill(0);
		this.#masterVol = 100;
		this.#metaTexts = [];
		this.#noteLength = 500;
		this.#convertLastSyllable = 0;
		this.#letterExpire = 0;
		this.#letterDisp = "";
		this.#bitmapExpire = 0;
		this.#bitmapPage = 0;
		this.#bitmap.fill(0);
		this.#modeKaraoke = false;
		this.#selectPort = 0;
		this.#receiveRS = true;
		// Reset MIDI receive channel
		this.#chReceive.forEach(function (e, i, a) {
			a[i] = i;
		});
		this.buildRchTree();
		// Reset channel redirection
		if (type == 0) {
			this.#trkRedir.fill(0);
			this.#trkAsReq.fill(0);
		};
		// Channel 10 to drum set
		this.#cc[allocated.cc * 9] = drumMsb[0];
		this.#cc[allocated.cc * 25] = drumMsb[0];
		this.#cc[allocated.cc * 41] = drumMsb[0];
		this.#cc[allocated.cc * 57] = drumMsb[0];
		// Reset effect storage
		this.#gsEfxSto.fill(0);
		// Reset MT-32 user patch and timbre storage
		this.#cmPatch.fill(0);
		this.#cmTimbre.fill(0);
		this.#cmTPatch.fill(0);
		this.#cmTTimbre.fill(0);
		this.#bnCustom.fill(0);
		// Reset MT-32 user bank
		this.userBank.clearRange({msb: 0, lsb: 127, prg: [0, 127]});
		for (let ch = 0; ch < allocated.ch; ch ++) {
			let chOff = ch * allocated.cc;
			// Reset to full
			this.#cc[chOff + ccToPos[7]] = 100; // Volume
			this.#cc[chOff + ccToPos[11]] = 127; // Expression
			// Reset to centre
			this.#cc[chOff + ccToPos[10]] = 64; // Pan
			this.#cc[chOff + ccToPos[71]] = 64; // Resonance
			this.#cc[chOff + ccToPos[72]] = 64; // Release Time
			this.#cc[chOff + ccToPos[73]] = 64; // Attack Time
			this.#cc[chOff + ccToPos[74]] = 64; // Brightness
			this.#cc[chOff + ccToPos[75]] = 64; // Decay Time
			this.#cc[chOff + ccToPos[76]] = 64; // Vibrato Rate
			this.#cc[chOff + ccToPos[77]] = 64; // Vibrato Depth
			this.#cc[chOff + ccToPos[78]] = 64; // Vibrato Delay
			// Extra default values
			this.#cc[chOff + ccToPos[91]] = 40; // Reverb
			// RPN/NRPN to null
			this.#cc[chOff + ccToPos[101]] = 127;
			this.#cc[chOff + ccToPos[100]] = 127;
			this.#cc[chOff + ccToPos[99]] = 127;
			this.#cc[chOff + ccToPos[98]] = 127;
			// RPN reset
			let rpnOff = ch * allocated.rpn;
			this.#rpn[rpnOff] = 2; // Pitch bend sensitivity
			this.#rpn[rpnOff + 1] = 64; // Fine tune MSB
			this.#rpn[rpnOff + 2] = 0; // Fine tune LSB
			this.#rpn[rpnOff + 3] = 64; // Coarse tune MSB
			this.#rpn[rpnOff + 4] = 0; // Mod sensitivity MSB
			this.#rpn[rpnOff + 5] = 0; // Mod sensitivity LSB
			// NRPN drum section reset
		};
		return;
	};
	switchMode(mode, forced = false) {
		let idx = modeIdx.indexOf(mode);
		if (idx > -1) {
			if (this.#mode == 0 || forced) {
				this.#mode = idx;
				this.#bitmapPage = 0; // Restore page
				this.#subMsb = substList[0][idx];
				this.#subLsb = substList[1][idx];
				for (let ch = 0; ch < allocated.ch; ch ++) {
					if (drumMsb.indexOf(this.#cc[ch * allocated.cc]) > -1) {
						this.#cc[ch * allocated.cc] = drumMsb[idx];
					};
					//this.initOnReset && forced && this.#ua.ano(ch);
				};
				if (this.initOnReset && forced) {
					//this.init(1);
				};
				switch (idx) {
					case modeMap.mt32: {
						mt32DefProg.forEach((e, i) => {
							let ch = i + 1;
							if (!this.#chActive[ch]) {
								this.#prg[ch] = e;
								this.#cc[ch * allocated.cc + ccToPos[91]] = 127;
							};
						});
						break;
					};
				};
				this.dispatchEvent("mode", mode);
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
	constructor() {
		super();
		let upThis = this;
		this.#bitmap = new Uint8Array(256);
		this.#bitmapStore[10] = new Uint8Array(512);
		this.#metaSeq = new BinaryMatch();
		this.userBank.strictMode = true;
		// Prevent bank readers from getting stalled
		this.userBank.load(`MSB\tPRG\tLSB\tNME\n062\t000\t000\t\n122\t000\t000\t\n122\t001\t000\t\n122\t002\t000\t\n122\t003\t000\t\n122\t004\t000\t\n122\t005\t000\t\n122\t006\t000\t`);
		// Metadata events
		// Should be moved to somewhere else
		this.#metaRun[1] = function (data) {
			// Normal text
			switch (data.slice(0, 2)) {
				case "@I": {
					this.#modeKaraoke = true;
					this.#metaTexts.unshift(`Kar.Info: ${data.slice(2)}`);
					break;
				};
				case "@K": {
					this.#modeKaraoke = true;
					this.#metaTexts.unshift(`Karaoke mode active.`);
					console.debug(`Karaoke mode active: ${data.slice(2)}`);
					break;
				};
				case "@L": {
					this.#modeKaraoke = true;
					this.#metaTexts.unshift(`Language: ${data.slice(2)}`);
					break;
				};
				case "@T": {
					this.#modeKaraoke = true;
					this.#metaTexts.unshift(`Ka.Title: ${data.slice(2)}`);
					break;
				};
				case "@V": {
					this.#modeKaraoke = true;
					this.#metaTexts.unshift(`Kara.Ver: ${data.slice(2)}`);
					break;
				};
				case "XF": {
					// XG File Data section
					let dataArr = data.slice(2).split(":");
					switch (dataArr[0]) {
						case "hd": {
							dataArr.slice(1).forEach((e, i) => {
								e.length && this.#metaTexts.unshift(`${[
									"SongDate", "SnRegion", "SongCat.", "SongBeat",
									"SongInst", "Sn.Vocal", "SongCmp.", "SongLrc.",
									"SongArr.", "SongPerf", "SongPrg.", "SongTags"
								][i]}: ${e}`);
							});
							break;
						};
						case "ln": {
							dataArr.slice(1).forEach((e, i) => {
								e.length && this.#metaTexts.unshift(`${[
									"Kar.Lang", "Kar.Name", "Kar.Cmp.", "Kar.Lrc.",
									"kar.Arr.", "Kar.Perf", "Kar.Prg."
								][i]}: ${e}`);
							});
							break;
						};
						default: {
							this.#metaTexts.unshift(`XGF_Data: ${data}`);
						};
					};
					break;
				};
				default: {
					if (this.#modeKaraoke) {
						if (data[0] == "\\") {
							// New section
							this.#metaTexts.unshift(`@ ${data.slice(1)}`);
						} else if (data[0] == "/") {
							// New line
							this.#metaTexts.unshift(data.slice(1));
						} else {
							// Normal append
							this.#metaTexts[0] += data;
						};
					} else {
						this.#metaTexts[0] = data;
						this.#metaTexts.unshift("");
					};
				};
			};
		};
		this.#metaRun[2] = function (data) {
			this.#metaTexts.unshift(`Copyrite: ${data}`);
		};
		this.#metaRun[3] = function (data, track) {
			// Filter overly annoying meta events
			if (track < 1 && this.#metaChannel < 1) {
				this.#metaTexts.unshift(`TrkTitle: ${data}`);
			};
		};
		this.#metaRun[4] = function (data, track) {
			//if (track < 1 && this.#metaChannel < 1) {
				this.#metaTexts.unshift(`${showTrue(this.#metaChannel, "", " ")}Instrmnt: ${data}`);
			//};
		};
		this.#metaRun[5] = function (data) {
			if (data.trim() == "") {
				this.#metaTexts.unshift("");
			} else {
				this.#metaTexts[0] += `${data}`;
			};
		};
		this.#metaRun[6] = function (data) {
			this.#metaTexts.unshift(`${showTrue(this.#metaChannel, "", " ")}C.Marker: ${data}`);
		};
		this.#metaRun[7] = function (data) {
			this.#metaTexts.unshift(`CuePoint: ${data}`);
		};
		this.#metaRun[32] = function (data) {
			this.#metaChannel = data[0] + 1;
		};
		this.#metaRun[33] = function (data, track) {
			console.debug(`Track ${track} requests to get assigned to output ${data}.`);
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
		this.#seUnr = new BinaryMatch();
		this.#seUr = new BinaryMatch();
		this.#seXg = new BinaryMatch();
		this.#seGs = new BinaryMatch();
		this.#seAi = new BinaryMatch();
		this.#seKg = new BinaryMatch();
		this.#seSg = new BinaryMatch();
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
				case 126: {
					// Yamaha XG reset
					upThis.switchMode("xg", true);
					upThis.#modeKaraoke = false;
					console.info("MIDI reset: XG");
					break;
				};
			};
		}).add([76, 6, 0], (msg) => {
			// XG Letter Display
			let offset = msg[0];
			if (offset < 64) {
				upThis.#letterDisp = " ".repeat(offset);
				upThis.#letterExpire = Date.now() + 3200;
				msg.subarray(1).forEach(function (e) {
					upThis.#letterDisp += String.fromCharCode(e);
				});
				upThis.#letterDisp = upThis.#letterDisp.padEnd(32, " ");
			} else {
				// Expire all existing letter display
				upThis.#letterExpire = Date.now();
			};
		}).add([76, 7, 0], (msg) => {
			// XG Bitmap Display
			let offset = msg[0];
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
		});
		// XG drum setup would be blank for now
		// TG300 SysEx section, the parent of XG
		this.#seXg.add([43, 7, 0], (msg, track, id) => {
			// TG300 display letter
			// Same as XG letter display
			upThis.#letterDisp = " ".repeat(offset);
			upThis.#letterExpire = Date.now() + 3200;
			msg.subarray(1).forEach(function (e) {
				upThis.#letterDisp += String.fromCharCode(e);
			});
			upThis.#letterDisp = upThis.#letterDisp.padEnd(32, " ");
		}).add([43, 7, 1], (msg, track, id) => {
			// TG300 display bitmap
			// Same as XG bitmap display
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
			};
		}).add([69, 18, 16], (msg) => {
			// GS display section
			switch (msg[0]) {
				case 0: {
					// GS display letter
					upThis.#letterExpire = Date.now() + 3200;
					let offset = msg[1];
					upThis.#letterDisp = " ".repeat(offset);
					msg.subarray(2).forEach(function (e) {
						if (e < 128) {
							upThis.#letterDisp += String.fromCharCode(e);
						};
					});
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
		// Roland MT-32 or C/M SysEx section
		this.#seGs.add([22, 18, 127], (msg) => {
			// MT-32 reset all params
			upThis.switchMode("mt32", true);
			upThis.#modeKaraoke = false;
			upThis.userBank.clearRange({msb: 0, lsb: 127, prg: [0, 127]});
			console.info("MIDI reset: MT-32");
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
			};
		}).add([66, 18, 8, 0], (msg, track) => {
			// Display (letter and bitmap)
			// Mehh I'll fill this up when I have time
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
			}][msg[0]] || (() => {}))();
		});
		// AKAI SG
		this.#seSg.add([66, 93, 64], (msg, track, id) => {
			let e = msg[2];
			switch (msg[0]) {
				case 0: {
					// SG system section at 0x00
					switch (msg[1]) {
						case 127: {
							// SG reset
							upThis.switchMode("sg", true);
							break;
						};
					};
					break;
				};
			};
		});
	};
};

export {
	OctaviaDevice,
	allocated,
	ccToPos
};
