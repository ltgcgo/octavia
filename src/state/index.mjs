"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";
import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {
	xgEffType,
	xgPartMode,
	xgDelOffset,
	xgNormFreq,
	xgLfoFreq,
	getXgRevTime,
	getXgDelayOffset
} from "./xgValues.js";
import {
	gsRevType,
	gsChoType
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
	[0, 0, 1, 0, 0,   127, 0, 0,  0,  0,  0,  0, 0]
];
const drumMsb = [120, 127, 120, 127, 120, 127, 61, 62, 62, 62, 120, 122, 127];
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

let toZero = function (e, i, a) {
	a[i] = 0;
};
let sysExSplitter = function (seq) {
	let seqArr = [[]];
	seq?.forEach(function (e) {
		if (e == 247) {
			// End of SysEx
		} else if (e == 240) {
			seqArr.push([]);
		} else {
			seqArr[seqArr.length - 1].push(e);
		};
	});
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
	rpn: 6
};

let OctaviaDevice = class extends CustomEventSource {
	// Values
	#mode = 0;
	#bitmapPage = 0;
	#bitmapExpire = 0;
	#bitmapStore = new Array(10); // 10 pages of bitmaps
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
	#customName = new Array(allocated.ch); // Allow custom naming
	#rawStrength = new Uint8Array(allocated.ch);
	#dataCommit = 0; // 0 for RPN, 1 for NRPN
	#rpn = new Uint8Array(allocated.ch * allocated.rpn); // RPN registers (0 pitch MSB, 1 fine tune MSB, 2 fine tune LSB, 3 coarse tune MSB, 4 mod sensitivity MSB, 5 mod sensitivity LSB)
	#nrpn = new Int8Array(allocated.ch * useNormNrpn.length); // Normal section of NRPN registers
	#subMsb = 0; // Allowing global bank switching
	#subLsb = 0;
	#masterVol = 100;
	#metaChannel = 0;
	#letterDisp = "";
	#letterExpire = 0;
	#modeKaraoke = false;
	#receiveTree;
	// Metadata text events
	#metaTexts = [];
	// GS Track Occupation
	#trkRedir = new Uint8Array(allocated.ch);
	#trkAsReq = new Uint8Array(allocated.tr); // Track Assignment request
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
						//console.debug(`${modeIdx[this.#mode]}, CH${part + 1}: ${det.data[1]}`);
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
									console.debug(`Redirected NRPN 1 ${lsb} to cc${71 + toCc}.`);
								} else {
									let nrpnIdx = useNormNrpn.indexOf(lsb);
									if (nrpnIdx > -1) {
										this.#nrpn[part * 10 + nrpnIdx] = det.data[1] - 64;
									};
									console.debug(`CH${part + 1} voice NRPN ${lsb} commit`);
								};
							} else {
								//console.debug(`CH${part + 1} drum NRPN ${msb} commit`);
							};
						} else {
							// Commit supported RPN values
							let rpnIndex = useRpnMap[this.#cc[chOffset + ccToPos[100]]];
							if (this.#cc[chOffset + ccToPos[101]] == 0 && rpnIndex != undefined) {
								console.debug(`CH${part + 1} RPN 0 ${this.#cc[chOffset + ccToPos[100]]} commit: ${det.data[1]}`);
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
			this.#customName[part] = 0;
			//console.debug(`T:${det.track} C:${part} P:${det.data}`);
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
				})(deviceId, seq.slice(2), det.track);
				//upThis.#seMain.run(seq, det.track);
			});
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
			// C/M: [22, CmdId]
			// GS: [66, CmdId, HH, MM, LL, ...DD, Checksum]
			if (msg[0] < 64) {
				this.#seGs.run(msg, track, id);
			} else {
				let sentCs = msg.pop();
				let calcCs = gsChecksum(msg.slice(2));
				if (sentCs == calcCs) {
					this.#seGs.run(msg, track, id);
				} else {
					console.warn(`Bad GS checksum ${sentCs}. Should be ${calcCs}.`);
				};
			};
		},
		66: (id, msg, track) => {
			// Korg
			this.#seXd.run(msg, track, id);
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
			this.#seUnr.run(msg, track, id);
		}
	};
	#seUnr; // Universal non-realtime
	#seUr; // Universal realtime
	#seXg; // YAMAHA
	#seGs; // Roland
	#seXd; // KORG
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
		for (let c = 0; c < 64; c ++) {
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
	getCustomNames() {
		return this.#customName.slice();
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
	init(type = 0) {
		// Type 0 is full reset
		// Full reset
		this.dispatchEvent("mode", "?");
		this.#mode = 0;
		this.#subMsb = 0;
		this.#subLsb = 0;
		this.#metaChannel = 0;
		this.#chActive.forEach(toZero);
		this.#cc.forEach(toZero);
		this.#prg.forEach(toZero);
		this.#velo.forEach(toZero);
		this.#poly.forEach(toZero);
		this.#rawStrength.forEach(toZero);
		this.#pitch.forEach(toZero);
		this.#nrpn.forEach(toZero);
		this.#masterVol = 100;
		this.#metaTexts = [];
		this.#letterExpire = 0;
		this.#letterDisp = "";
		this.#bitmapExpire = 0;
		this.#bitmapPage = 0;
		this.#bitmap.forEach(toZero);
		this.#customName.forEach(toZero);
		this.#modeKaraoke = false;
		// Reset MIDI receive channel
		this.#chReceive.forEach(function (e, i, a) {
			a[i] = i;
		});
		this.buildRchTree();
		// Reset channel redirection
		this.#trkRedir.forEach(toZero);
		this.#trkAsReq.forEach(toZero);
		// Channel 10 to drum set
		this.#cc[allocated.cc * 9] = drumMsb[0];
		this.#cc[allocated.cc * 25] = drumMsb[0];
		this.#cc[allocated.cc * 41] = drumMsb[0];
		this.#cc[allocated.cc * 57] = drumMsb[0];
		for (let ch = 0; ch < 64; ch ++) {
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
				for (let ch = 0; ch < 64; ch ++) {
					if (drumMsb.indexOf(this.#cc[ch * allocated.cc]) > -1) {
						this.#cc[ch * allocated.cc] = drumMsb[idx];
					};
				};
				this.dispatchEvent("mode", mode);
			};
		} else {
			throw(new Error(`Unknown mode ${mode}`));
		};
	};
	newStrength() {
		this.#rawStrength.forEach(toZero);
	};
	runJson(json) {
		// Execute transformed JSON event
		if (json.type > 14) {
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
	};
	runRaw(midiArr) {
		// Translate raw byte stream into JSON MIDI event
	};
	constructor() {
		super();
		let upThis = this;
		this.#bitmap = new Uint8Array(256);
		this.#metaSeq = new BinaryMatch();
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
			if (track < 1 && this.#metaChannel < 1) {
				this.#metaTexts.unshift(`${showTrue(this.#metaChannel, "", " ")}Instrmnt: ${data}`);
			};
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
		this.#seXd = new BinaryMatch();
		this.#seKg = new BinaryMatch();
		this.#seSg = new BinaryMatch();
		this.#seCs = new BinaryMatch();
		// The new SysEx engine only defines actions when absolutely needed.
		// Mode reset section
		this.#seUnr.add([9], (msg) => {
			// General MIDI reset.
			upThis.switchMode(["gm", "?", "g2"][msg[0] - 1], true);
			upThis.#modeKaraoke = upThis.#modeKaraoke || false;
			console.info(`MIDI reset: ${["GM", "Init", "GM2"][msg[0]]}`);
			if (msg[0] == 2) {
				upThis.init();
			};
		});
		this.#seXg.add([76, 0, 0, 126], (msg) => {
			// Yamaha XG reset
			upThis.switchMode("xg", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: XG");
		});
		this.#seGs.add([22, 18, 127, 0, 0, 1], () => {
			// MT-32 reset, refactor needed
			upThis.switchMode("mt32", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: MT-32");
		}).add([66, 18, 64, 0, 127, 0, 65], () => {
			// Roland GS reset, refactor needed
			upThis.switchMode("gs", true);
			upThis.#cc[allocated.cc * 9] = 120;
			upThis.#cc[allocated.cc * 25] = 120;
			upThis.#cc[allocated.cc * 41] = 120;
			upThis.#cc[allocated.cc * 57] = 120;
			upThis.#modeKaraoke = false;
			upThis.#trkRedir.forEach(toZero);
			console.info("MIDI reset: GS");
		});
		this.#seKg.add([16, 0, 8, 0, 0, 0, 0], () => {
			// Kawai GMega, refactor needed
			upThis.switchMode("k11", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: KAWAI GMega/K11");
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
		this.#seXg.add([76, 6, 0], (msg) => {
			// XG Letter Display
			let offset = msg[0];
			upThis.#letterDisp = " ".repeat(offset);
			upThis.#letterExpire = Date.now() + 3200;
			msg.slice(1).forEach(function (e) {
				upThis.#letterDisp += String.fromCharCode(e);
			});
			upThis.#letterDisp = upThis.#letterDisp.padEnd(32, " ");
		}).add([76, 7, 0], (msg) => {
			// XG Bitmap Display
			let offset = msg[0];
			upThis.#bitmapExpire = Date.now() + 3200;
			upThis.#bitmap.fill(0); // Init
			let workArr = msg.slice(1);
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
		// GS SysEx section
		this.#seGs.add([69, 18, 16], (msg) => {
			// GS display section
			switch (msg[0]) {
				case 0: {
					// GS display letter
					upThis.#letterExpire = Date.now() + 3200;
					let offset = msg[1];
					upThis.#letterDisp = " ".repeat(offset);
					msg.slice(2).forEach(function (e) {
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
						let workArr = msg.slice(2);
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
	};
};

export {
	OctaviaDevice,
	allocated,
	ccToPos
};
