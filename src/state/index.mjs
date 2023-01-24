"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";
import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {VoiceBank} from	"./bankReader.js";
import {
	xgEffType,
	xgPartMode,
	xgSgVocals,
	xgDelOffset,
	xgNormFreq,
	xgLfoFreq,
	getSgKana,
	getXgRevTime,
	getXgDelayOffset
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
	if (self.debugMode) {
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
	#modeKaraoke = false;
	#receiveTree;
	// Temporary EFX storage
	#gsEfxSto = new Uint8Array(2);
	// Metadata text events
	#metaTexts = [];
	// GS Track Occupation
	#trkRedir = new Uint8Array(allocated.ch);
	#trkAsReq = new Uint8Array(allocated.tr); // Track Assignment request
	baseBank = new VoiceBank("gm", "gm2", "xg", "gs", "ns5r", "gmega", "plg-150vl", "plg-150pf", "plg-100sg", "kross"); // Load all possible voice banks
	userBank = new VoiceBank("gm"); // User-defined bank for MT-32, X5DR and NS5R
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
		ano: (part) => {
			// All notes off
			// Current implementation uses the static velocity register
			this.#poly.forEach((e, i, a) => {
				let ch = e >> 7;
				if (e == 0 && this.#velo[0] == 0) {
				} else if (ch == part) {
					this.#velo[e] = 0;
					a[i] = 0;
				};
			});
		}
	};
	// Channel event pool
	#runChEvent = {
		8: function (det) {
			let part = det.channel;
			// Note off, velocity should be ignored.
			let rawNote = part * 128 + det.data[0];
			let polyIdx = this.#poly.indexOf(rawNote);
			if (polyIdx > -1) {
				this.#poly[polyIdx] = 0;
				this.#velo[rawNote] = 0;
			};
		},
		9: function (det) {
			let part = det.channel;
			// Note on, but should be off if velocity is 0.
			// Set channel active
			this.#chActive[part] = 1;
			let rawNote = part * 128 + det.data[0];
			if (det.data[1] > 0) {
				let place = 0;
				while (this.#poly[place] > 0) {
					place ++;
				};
				if (place < this.#poly.length) {
					this.#poly[place] = rawNote;
					this.#velo[rawNote] = det.data[1];
					if (this.#rawStrength[part] < det.data[1]) {
						this.#rawStrength[part] = det.data[1];
						//console.info(`${part}: ${det.data[1]}`);
					};
				} else {
					console.error("Polyphony exceeded.");
				};
			} else {
				let polyIdx = this.#poly.indexOf(rawNote);
				if (polyIdx > -1) {
					this.#poly[polyIdx] = 0;
					this.#velo[rawNote] = 0;
				};
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
						if (self.debugMode) {
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
									self.debugMode && console.debug(`Redirected NRPN 1 ${lsb} to cc${71 + toCc}.`);
								} else {
									let nrpnIdx = useNormNrpn.indexOf(lsb);
									if (nrpnIdx > -1) {
										this.#nrpn[part * 10 + nrpnIdx] = det.data[1] - 64;
									};
									self.debugMode && console.debug(`CH${part + 1} voice NRPN ${lsb} commit`);
								};
							} else {
								//console.debug(`CH${part + 1} drum NRPN ${msb} commit`);
							};
						} else {
							// Commit supported RPN values
							let rpnIndex = useRpnMap[this.#cc[chOffset + ccToPos[100]]];
							if (this.#cc[chOffset + ccToPos[101]] == 0 && rpnIndex != undefined) {
								self.debugMode && console.debug(`CH${part + 1} RPN 0 ${this.#cc[chOffset + ccToPos[100]]} commit: ${det.data[1]}`);
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
			if (self.debugMode) {
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
			} else if (self.debugMode) {
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
		this.#poly.forEach(function (e) {
			let realCh = Math.floor(e / 128),
			realNote = e % 128;
			if (channel == realCh && upThis.#velo[e] > 0) {
				notes.set(realNote, upThis.#velo[e]);
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
		// Reset MIDI receive channel
		this.#chReceive.forEach(function (e, i, a) {
			a[i] = i;
		});
		this.buildRchTree();
		// Reset channel redirection
		this.#trkRedir.fill(0);
		this.#trkAsReq.fill(0);
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
		this.#seCs = new BinaryMatch();
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
				default: {
					let mTune = [0, 0, 0, 0];
					let writeTune = (e, i) => {
						// XG master fine tune
						mTune[i] = e;
					};
					msg.subarray(1).forEach((e, i) => {
						let addr = i + msg[0];
						[
							writeTune, writeTune, writeTune, writeTune,
							(e) => {
								// XG master volume
								this.#masterVol = e * 129 / 16383 * 100;
							},
							(e) => {/* XG master attenuator */},
							(e) => {/* XG master coarse tune */}
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
		}).add([76, 2, 1], (msg) => {
			// XG reverb, chorus and variation
			let dPref = "XG ";
			if (msg[0] < 32) {
				// XG reverb
				dPref += "reverb ";
				msg.subarray(1).forEach((e, i) => {
					([(e) => {
						console.info(`${dPref}main type: ${xgEffType[e]}`);
					}, (e) => {
						console.debug(`${dPref}sub type: ${e + 1}`);
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
						console.info(`${dPref}main type: ${xgEffType[e]}`);
					}, (e) => {
						console.debug(`${dPref}sub type: ${e + 1}`);
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
				if (msg[0] == 64) {
					console.info(`${dPref}type: ${xgEffType[msg[1]]}${msg[2] > 0 ? " " + (msg[2] + 1) : ""}`);
				};
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
			// Won't implement for now
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
		}).add([76, 8], (msg, track) => {
			// XG part setup
			let part = upThis.chRedir(msg[0], track, true),
			id = msg[1],
			chOff = allocated.cc * part,
			dPref = `XG CH${part + 1} `,
			errMsg = `Unknown XG part address ${id}.`;
			msg.subarray(2).forEach((e, i) => {
				if (id < 1) {
					console.debug(errMsg);
				} else if (id < 41) {
					// CC manipulation can be further shrunk
					([() => {
						upThis.#cc[chOff + ccToPos[0]] = e; // MSB
					}, () => {
						upThis.#cc[chOff + ccToPos[32]] = e; // LSB
					}, () => {
						upThis.#prg[part] = e; // program
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
						upThis.#cc[chOff + ccToPos[0]] = e > 1 ? 127 : 0;
						console.debug(`${dPref}type: ${xgPartMode[e]}`);
					}, () => {
						// coarse tune
						upThis.#rpn[allocated.rpn * part + 3] = e;
					}, false, false, () => {
						upThis.#cc[chOff + ccToPos[7]] = e; // volume
					}, false, false, () => {
						upThis.#cc[chOff + ccToPos[10]] = e || 128; // pan
					}, false, false, () => {
						upThis.#cc[chOff + ccToPos[11]] = e; // dry level or expression
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
		}).add([76, 10], (msg) => {
			// XG HPF cutoff at 76, 10, nn, 32
			// Won't implement for now
		}).add([76, 16], (msg) => {
			// XG A/D part, won't implement for now
		}).add([76, 17, 0, 0], (msg) => {
			// XG A/D mono/stereo mode, won't implement for now
		}).add([73, 0, 0], (msg, track) => {
			// MU1000/2000 System
			let offset = msg[0];
			msg.subarray(1).forEach((e, i) => {
				let ri = offset + i;
				if (ri == 8) {
					console.debug(`MU1000 set LCD contrast to ${e}.`);
				} else if (ri > 9 && ri < 15) {
					// Octavia custom SysEx
					[() => {
						upThis.dispatchEvent("channelactive", e);
					}, () => {
						if (e < 8) {
							upThis.dispatchEvent("channelmin", (e << 4));
						} else {
							upThis.dispatchEvent("channelreset");
						};
					}, () => {
						if (e < 8) {
							upThis.dispatchEvent("channelmax", (e << 4) + 15);
						} else {
							upThis.dispatchEvent("channelreset");
						};
					}, () => {
						upThis.dispatchEvent("channelreset");
					}][ri - 10]();
				};
			});
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
					upThis.#metaTexts.unshift("SG Lyric: ");
				};
				upThis.#metaTexts[0] += `${getSgKana(vocal)}`;
				upThis.#convertLastSyllable = timeNow + Math.ceil(length / 2) + upThis.#noteLength;
				if (self.debugMode) {
					console.debug(`${dPref}vocals: ${vocal}`);
				};
			} else {
				console.warn(`Unknown PLG-100SG data: ${msg}`);
			};
		}).add([112], (msg) => {
			// XG plugin board generic
			console.debug(`XG plugin PLG1-${["00VL", "00SG", "00DX"][msg[0]]} enabled for channel ${msg[2] + 1}.`);
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
				self.debugMode && console.debug(`MU1000 EPROM trail to 0x${addr.toString(16).padStart(6, "0")}, ${length} bytes.`);
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
			self.debugMode && console.debug(`MU1000 EPROM jump to 0x${addr.toString(16).padStart(6, "0")}.`);
			if (upThis.eprom) {
				upThis.eprom.offset = addr;
			};
		}).add([89, 2], (msg, track, id) => {
			// EPROM bulk write
			// The first byte always seem to be zero
			if (upThis.eprom) {
				let addr = (msg[0] << 21) + (msg[1] << 14) + (msg[2] << 7) + msg[3] + (upThis.eprom.offset || 0);
				self.debugMode && console.debug(`MU1000 EPROM write to 0x${addr.toString(16).padStart(6, "0")}.`);
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
		// GS SysEx section
		this.#seGs.add([66, 18, 0, 0, 127], (msg) => {
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
		}).add([66, 18, 64, 0], (msg) => {
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
					}, () => {// character
					}, () => {// pre-LPF
					}, () => {// level
					}, () => {// time
					}, () => {// delay feedback
					}, false, () => {
						console.debug(`${dPref}predelay: ${e}ms`);
					}, () => {
						console.info(`${dPref}type: ${gsChoType[e]}`);
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
				let desc = getGsEfxDesc(upThis.#gsEfxSto, i, e);
				if (desc) {
					console.debug(`${dPref}${getGsEfx(upThis.#gsEfxSto)} ${desc}`);
				};
			};
			msg.subarray(1).forEach((e, i) => {
				([() => {
					upThis.#gsEfxSto[0] = e;
				}, () => {
					upThis.#gsEfxSto[1] = e;
					console.info(`${dPref}type: ${getGsEfx(upThis.#gsEfxSto)}`);
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
				}, () => {
					console.debug(`${dPref}1 depth: ${e - 64}`);
				}, () => {
					console.debug(`${dPref}2 source: ${e}`);
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
			} else if (offset < 19) {} else if (offset < 44) {
				msg.subarray(1).forEach((e, i) => {
					([() => {
						upThis.#mono[part] = +!e; // mono/poly
					}, false // assign mode
					, () => {
						// drum map
						upThis.#cc[chOff + ccToPos[0]] = e ? 120 : 0;
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
		this.#seAi.add([54, 76, 0], (msg, track) => {
			// program dump
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
		}).add([54, 77, 0], (msg, track) => {
			// combi dump
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
		}).add([54, 104], (msg, track) => {
			// extended multi setup
			upThis.switchMode("x5d", true);
			korgFilter(msg, function (e, i) {
				if (i < 192) {
					let part = upThis.chRedir(Math.floor(i / 12), track, true),
					chOff = part * allocated.cc;
					switch (i % 12) {
						case 0: {
							// Program change
							upThis.#prg[part] = e;
							if (e > 0) {
								upThis.#chActive[part] = 1;
							};
							break;
						};
						case 1: {
							// Volume
							upThis.#cc[chOff + ccToPos[7]] = e;
							break;
						};
						case 2: {
							// Coarse tune
							upThis.#rpn[part * allocated.rpn + 3] = (e > 127 ? 256 - e : 64 + e);
							break;
						};
						case 3: {
							// Fine tune
							upThis.#rpn[part * allocated.rpn + 1] = (e > 127 ? 256 - e : 64 + e);
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
							upThis.#cc[chOff] = (e & 3) ? 82 : 56;
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
			let dPref = `NS5R CH${part + 1}`;
			msg.subarray(2).forEach((e, i) => {
				let c = offset + i;
				if (c < 3) {
					// MSB, LSB, PRG
					[() => {
						upThis.#cc[chOff + ccToPos[0]] = e;
					}, () => {
						upThis.#cc[chOff + ccToPos[32]] = e;
					}, () => {
						upThis.#prg[part] = e;
					}][c]();
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
			// Mehh I'll fill this up when I have time
		}).add([66, 52], (msg, track) => {
			// Currect effect dump
			// Still no docs, sigh...
			upThis.switchMode("ns5r", true);
			upThis.#modeKaraoke = false;
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
								upThis.#cc[chOff + ccToPos[0]] = e;
								break;
							};
							case 1: {
								// LSB Bank
								upThis.#cc[chOff + ccToPos[32]] = e;
								break;
							};
							case 2: {
								// Program
								upThis.#prg[part] = e;
								if (e > 0) {
									upThis.#chActive[part] = 1;
								};
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
						msb = e;
						break;
					};
					case (p == 12): {
						lsb = e;
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
			upThis.userBank.load(voiceMap);
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
		}).add([66, 125], (msg) => {
			// Backlight
			upThis.dispatchEvent("backlight", ["green", "orange", "red", false, "yellow", "blue", "purple"][msg[0]] || "white");
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
				console.debug(`${dPref}reverb type: ${e}`);
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
					upThis.#cc[chOff + ccToPos[0]] = 0;
					upThis.#prg[part] = e;
				} else {
					// Drum kit
					upThis.#cc[chOff + ccToPos[0]] = 122;
					upThis.#prg[part] = e - 128;
				};
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
				upThis.#chActive[part] = e; // toggle channel
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
					upThis.#cc[chOff + ccToPos[0]] = 0;
					upThis.#cc[chOff + ccToPos[32]] = 0;
					upThis.#prg[part] = e;
				} else if (e < 160) {
					// Melodic voice
					upThis.#cc[chOff + ccToPos[0]] = 0;
					upThis.#cc[chOff + ccToPos[32]] = 7;
					upThis.#prg[part] = e - 100;
				} else {
					// Drum kit
					upThis.#cc[chOff + ccToPos[0]] = 122;
					upThis.#cc[chOff + ccToPos[32]] = 0;
					upThis.#prg[part] = e - 160;
				};
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
				upThis.#chActive[part] = e; // toggle channel
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
	};
};

export {
	OctaviaDevice,
	allocated,
	ccToPos
};
