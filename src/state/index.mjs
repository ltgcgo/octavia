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
	korgFilter,
	x5dSendLevel
} from "./utils.js";

const modeIdx = [
	"?",
	"gm", "gs", "xg", "g2",
	"mt32", "ns5r",
	"ag10", "x5d", "05rw"
];
const substList = [
	[0, 0, 0, 0, 121, 0, 0, 56, 82, 81],
	[0, 0, 1, 0, 0, 127, 0, 0, 0, 0]
];
const drumMsb = [120, 127, 120, 127, 120, 127, 61, 62, 62, 62];
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
useNormNrpn = [8, 9, 10, 32, 33, 36, 37, 99, 100, 101],
useDrumNrpn = [20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 36, 37, 64, 65],
ccAccepted = [
	0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 32,
	38, 64, 65, 66, 67, 68, 69, 70, 71,
	72, 73, 74, 75, 76, 77, 78, 84, 91,
	92, 93, 94, 95, 98, 99, 100, 101
]; // 96, 97, 120 to 127 all have special functions


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
	ch: 64, // channels
	cc: ccAccepted.length, // control changes
	nn: 128, // notes per channel
	pl: 512, // polyphony
	tr: 256, // tracks
	rpn: 6
};

let OctaviaDevice = class extends CustomEventSource {
	// Values
	#mode = 0;
	#bitmap = new Uint8Array(256);
	#bitmapExpire = 0;
	#chActive = new Uint8Array(allocated.ch); // Whether the channel is in use
	#chReceive = new Uint8Array(allocated.ch); // Determine the receiving channel
	#cc = new Uint8ClampedArray(8192); // 64 channels, 128 controllers
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
		if ([modeMap.gs, modeMap.ns5r].indexOf(this.#mode) > -1) {
			if (this.#trkAsReq[track]) {
				// Allow part assigning via meta
				let metaChosen = (this.#trkAsReq[track] - 1) * 16 + part;
				return metaChosen;
			};
			// Do not conquer channels if requested.
			if (noConquer == 1) {
				return part;
			};
			// Trying to support 32 channel...
			let shift = 0;
			//console.debug(`T${track} TC${part} AT${this.#trkRedir[part]}`);
			if (this.#trkRedir[part] == 0) {
				this.#trkRedir[part] = track;
				console.debug(`Assign track ${track} to channel ${part + 1}.`);
			} else if (this.#trkRedir[part] != track) {
				shift = 16;
				if (this.#trkRedir[part + shift] == 0) {
					this.#trkRedir[part + shift] = track;
					console.debug(`Assign track ${track} to channel ${part + shift + 1}.`);
				} else if (this.#trkRedir[part + shift] != track) {
					shift = 0;
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
			let chOffset = part * 128;
			// Check if control change is accepted
			if (ccToPos[det.data[0]] == undefined) {
				console.warn(`cc${det.data[0]} is not accepted.`);
			};
			// Pre interpret
			switch (det.data[0]) {
				case 0: {
					// Detect mode via bank MSB
					//console.debug(`${modeIdx[this.#mode]}, CH${part + 1}: ${det.data[1]}`);
					if (this.#mode == modeMap.gs || this.#mode == 0) {
						if (det.data[1] < 48) {
							// Do not change drum channel to a melodic
							if (this.#cc[chOffset] > 119) {
								det.data[1] = this.#cc[chOffset];
								if (!this.#mode) {
									det.data[1] = 120;
									console.debug(`Forced channel ${part + 1} to stay drums.`);
								};
							};
							if (det.data[1] > 0 && !this.#mode) {
								console.debug(`Roland GS detected with MSB: ${det.data[1]}`);
								this.switchMode("gs");
							};
						} else if (det.data[1] == 62) {
							this.switchMode("x5d");
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
								let d = this.#cc[128 * c];
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
						if (this.#cc[chOffset + 99] == 1) {
							let nrpnIdx = useNormNrpn.indexOf(this.#cc[chOffset + 98]);
							if (nrpnIdx > -1) {
								this.#nrpn[part * 10 + nrpnIdx] = det.data[1] - 64;
							};
						} else {
							//console.debug(`${part + 1} MSB ${det.data[1]} NRPN ${this.#dataCommit ? this.#cc[chOffset + 99] : this.#cc[chOffset + 101]} ${this.#dataCommit ? this.#cc[chOffset + 98] : this.#cc[chOffset + 100]}`);
						};
					} else {
						// Commit supported RPN values
						if (this.#cc[chOffset + 101] == 0 && useRpnMap[this.#cc[chOffset + 100]] != undefined) {
							this.#rpn[part * allocated.rpn + useRpnMap[this.#cc[chOffset + 100]]] = det.data[1];
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
				case 120: {
					// All sound off, but keys stay on
					break;
				};
				case 121: {
					// Reset controllers
					this.#ua.ano(part);
					this.#pitch[part] = 0;
					let chOff = part * 128;
					// Reset to zero
					this.#cc[chOff + 1] = 0; // Modulation
					this.#cc[chOff + 5] = 0; // Portamento Time
					this.#cc[chOff + 64] = 0; // Sustain
					this.#cc[chOff + 65] = 0; // Portamento
					this.#cc[chOff + 66] = 0; // Sostenuto
					this.#cc[chOff + 67] = 0; // Soft Pedal
					// Reset to full
					this.#cc[chOff + 11] = 127; // Expression
					// RPN/NRPN to null
					this.#cc[chOff + 101] = 127;
					this.#cc[chOff + 100] = 127;
					this.#cc[chOff + 99] = 127;
					this.#cc[chOff + 98] = 127;
					break;
				};
				case 123: {
					// All notes off
					this.#ua.ano(part);
					break;
				};
				case 124: {
					// Omni off
					this.#ua.ano(part);
					break;
				};
				case 125: {
					// Omni on
					this.#ua.ano(part);
					break;
				};
				case 126: {
					// Mono mode
					this.#mono[part] = 1;
					this.#ua.ano(part);
					break;
				};
				case 127: {
					// Poly mode
					this.#mono[part] = 0;
					this.#ua.ano(part);
					break;
				};
			};
			this.#cc[chOffset + det.data[0]] = det.data[1];
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
			let upThis = this;
			sysExSplitter(det.data).forEach(function (seq) {
				upThis.#seMain.run(seq, det.track);
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
	// Main SysEx pool
	#seMain;
	// GS Part SysEx pool
	#seGsPart;
	#seGsPartProp;
	// XG Part SysEx pool
	#seXgPart;
	#seXgDrumInst;
	// MT-32 SysEx pool
	#seMtSysEx;
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
		let start = channel * 128;
		let arr = this.#cc.slice(start, start + 128);
		arr[0] = arr[0] || this.#subMsb;
		arr[32] = arr[32] || this.#subLsb;
		return arr;
	};
	getCcAll() {
		// Return all CC registers
		let arr = this.#cc.slice();
		for (let c = 0; c < 64; c ++) {
			let chOff = c * 128;
			arr[chOff] = arr[chOff] || this.#subMsb;
			arr[chOff + 32] = arr[chOff + 32] || this.#subLsb;
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
			str[i] = Math.floor(e * upThis.#cc[i * 128 + 7] * upThis.#cc[i * 128 + 11] * upThis.#masterVol / 803288);
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
		this.#cc[1152] = drumMsb[0];
		this.#cc[3200] = drumMsb[0];
		this.#cc[5248] = drumMsb[0];
		this.#cc[7296] = drumMsb[0];
		for (let ch = 0; ch < 64; ch ++) {
			let chOff = ch * 128;
			// Reset to full
			this.#cc[chOff + 7] = 127; // Volume
			this.#cc[chOff + 11] = 127; // Expression
			// Reset to centre
			this.#cc[chOff + 10] = 64; // Pan
			this.#cc[chOff + 71] = 64; // Harmonic Content
			this.#cc[chOff + 72] = 64; // Release Time
			this.#cc[chOff + 73] = 64; // Attack Time
			this.#cc[chOff + 74] = 64; // Brightness
			this.#cc[chOff + 75] = 64; // Decay Time
			this.#cc[chOff + 76] = 64; // Vibrato Rate
			this.#cc[chOff + 77] = 64; // Vibrato Depth
			this.#cc[chOff + 78] = 64; // Vibrato Delay
			// RPN/NRPN to null
			this.#cc[chOff + 101] = 127;
			this.#cc[chOff + 100] = 127;
			this.#cc[chOff + 99] = 127;
			this.#cc[chOff + 98] = 127;
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
				this.#subMsb = substList[0][idx];
				this.#subLsb = substList[1][idx];
				for (let ch = 0; ch < 64; ch ++) {
					if (drumMsb.indexOf(this.#cc[ch * 128]) > -1) {
						this.#cc[ch * 128] = drumMsb[idx];
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
		this.#metaSeq = new BinaryMatch();
		this.#seMain = new BinaryMatch();
		this.#seGsPart = new BinaryMatch();
		this.#seGsPartProp = new BinaryMatch();
		this.#seXgPart = new BinaryMatch();
		this.#seXgDrumInst = new BinaryMatch();
		this.#seMtSysEx = new BinaryMatch();
		this.#metaSeq.default = function (seq, track) {
			console.debug(`Unparsed meta 127 sequence on track ${track}: `, seq);
		};
		this.#seMain.default = function (sysEx) {
			console.debug("Unparsed SysEx: ", sysEx);
		};
		this.#seGsPart.default = function (sysEx, channel) {
			console.debug(`Unparsed GS Part on channel ${channel}: `, sysEx);
		};
		this.#seXgPart.default = function (sysEx, channel) {
			console.debug(`Unparsed XG Part on channel ${channel}: `, sysEx);
		};
		this.#seXgDrumInst.default = function (sysEx, channel) {
			console.debug(`Unparsed XG Drum Part on channel ${channel}: `, sysEx);
		};
		// Metadata events
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
		// Standard resets
		// Refactor this!
		this.#seMain.add([126, 127, 9, 1], function () {
			// General MIDI reset
			upThis.switchMode("gm", true);
			upThis.#modeKaraoke = upThis.#modeKaraoke || false;
			console.info("MIDI reset: GM");
		}).add([126, 127, 9, 3], function () {
			// General MIDI rev. 2 reset
			upThis.switchMode("g2", true);
			upThis.#modeKaraoke = upThis.#modeKaraoke || false;
			console.info("MIDI reset: GM2");
		}).add([65, 16, 22, 18, 127, 1], function () {
			// MT-32 reset
			upThis.switchMode("mt32", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: MT-32");
			console.debug("Reset with the shorter one.");
		}).add([65, 16, 22, 18, 127, 0, 0, 1], function () {
			// MT-32 reset
			upThis.switchMode("mt32", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: MT-32");
			console.debug("Reset with the longer one.");
		}).add([65, 16, 66, 18, 64, 0, 127, 0, 65], function () {
			// Roland GS reset
			upThis.switchMode("gs", true);
			upThis.#cc[1152] = 120;
			upThis.#cc[3200] = 120;
			upThis.#cc[5248] = 120;
			upThis.#cc[7296] = 120;
			upThis.#modeKaraoke = false;
			upThis.#trkRedir.forEach(toZero);
			console.info("MIDI reset: GS");
		}).add([67, 16, 76, 0, 0, 126, 0], function (msg) {
			// Yamaha XG reset
			upThis.switchMode("xg", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: XG");
		});
		// Sequencer specific meta event
		// No refactoring needed.
		this.#metaSeq.add([67, 0, 1], function (msg, track) {
			//console.debug(`XGworks requests assigning track ${track} to output ${msg[0]}.`);
			upThis.#trkAsReq[track] = msg[0] + 1;
		});
		// General MIDI SysEx
		// No refactoring needed.
		this.#seMain.add([127, 127, 4, 1], function (msg) {
			// Master volume
			upThis.switchMode("gm");
			upThis.#masterVol = (msg[1] << 7 + msg[0]) / 163.83;
		});
		// Yamaha XG SysEx
		// Refactor this!
		this.#seMain.add([67, 16, 76, 6, 0], function (msg) {
			// XG Letter Display
			let offset = msg[0];
			upThis.#letterDisp = " ".repeat(offset);
			upThis.#letterExpire = Date.now() + 3200;
			msg.slice(1).forEach(function (e) {
				upThis.#letterDisp += String.fromCharCode(e);
			});
		}).add([67, 16, 76, 7, 0, 0], function (msg) {
			// XG Bitmap Display
			upThis.#bitmapExpire = Date.now() + 3200;
			while (msg.length < 48) {
				msg.unshift(0);
			};
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
		}).add([67, 16, 76, 2, 1, 0], function (msg) {
			console.debug(`XG reverb type: ${xgEffType[msg[0]]}${msg[1] > 0 ? " " + (msg[1] + 1) : ""}`);
		}).add([67, 16, 76, 2, 1, 2], function (msg) {
			console.debug(`XG reverb time: ${getXgRevTime(msg)}s`);
		}).add([67, 16, 76, 2, 1, 3], function (msg) {
			console.debug(`XG reverb diffusion: ${msg}`);
		}).add([67, 16, 76, 2, 1, 4], function (msg) {
			console.debug(`XG reverb initial delay: ${msg}`);
		}).add([67, 16, 76, 2, 1, 5], function (msg) {
			console.debug(`XG reverb high pass cutoff: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 6], function (msg) {
			console.debug(`XG reverb low pass cutoff: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 7], function (msg) {
			console.debug(`XG reverb width: ${msg}`);
		}).add([67, 16, 76, 2, 1, 8], function (msg) {
			console.debug(`XG reverb height: ${msg}`);
		}).add([67, 16, 76, 2, 1, 9], function (msg) {
			console.debug(`XG reverb depth: ${msg}`);
		}).add([67, 16, 76, 2, 1, 10], function (msg) {
			console.debug(`XG reverb wall type: ${msg}`);
		}).add([67, 16, 76, 2, 1, 11], function (msg) {
			console.debug(`XG reverb dry/wet: ${msg[0]}`);
		}).add([67, 16, 76, 2, 1, 12], function (msg) {
			console.debug(`XG reverb return: ${msg}`);
		}).add([67, 16, 76, 2, 1, 13], function (msg) {
			console.debug(`XG reverb pan: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 16], function (msg) {
			console.debug(`XG reverb delay: ${msg}`);
		}).add([67, 16, 76, 2, 1, 17], function (msg) {
			console.debug(`XG density: ${msg}`);
		}).add([67, 16, 76, 2, 1, 18], function (msg) {
			console.debug(`XG reverb balance: ${msg}`);
		}).add([67, 16, 76, 2, 1, 20], function (msg) {
			console.debug(`XG reverb feedback: ${msg}`);
		}).add([67, 16, 76, 2, 1, 32], function (msg) {
			console.debug(`XG chorus type: ${xgEffType[msg[0]]}${msg[1] > 0 ? " " + (msg[1] + 1) : ""}`);
		}).add([67, 16, 76, 2, 1, 34], function (msg) {
			console.debug(`XG chorus LFO: ${xgLfoFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 35], function (msg) {
			//console.debug(`XG chorus LFO phase: ${msg}`);
		}).add([67, 16, 76, 2, 1, 36], function (msg) {
			console.debug(`XG chorus feedback: ${msg}`);
		}).add([67, 16, 76, 2, 1, 37], function (msg) {
			console.debug(`XG chorus delay offset: ${getXgDelayOffset(msg[0])}ms`);
		}).add([67, 16, 76, 2, 1, 39], function (msg) {
			console.debug(`XG chorus low: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 40], function (msg) {
			console.debug(`XG chorus low: ${msg[0] - 64}dB`);
		}).add([67, 16, 76, 2, 1, 41], function (msg) {
			console.debug(`XG chorus high: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 42], function (msg) {
			console.debug(`XG chorus high: ${msg[0] - 64}dB`);
		}).add([67, 16, 76, 2, 1, 43], function (msg) {
			console.debug(`XG chorus dry/wet: ${msg}`);
		}).add([67, 16, 76, 2, 1, 44], function (msg) {
			console.debug(`XG chorus return: ${msg}`);
		}).add([67, 16, 76, 2, 1, 45], function (msg) {
			console.debug(`XG chorus pan: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 46], function (msg) {
			console.debug(`XG chorus to reverb: ${msg}`);
		}).add([67, 16, 76, 2, 1, 64], function (msg) {
			console.debug(`XG variation type: ${xgEffType[msg[0]]}${msg[1] > 0 ? " " + (msg[1] + 1) : ""}`);
		}).add([67, 16, 76, 2, 1, 66], function (msg) {
			console.debug(`XG variation 1: ${msg}`);
		}).add([67, 16, 76, 2, 1, 68], function (msg) {
			console.debug(`XG variation 2: ${msg}`);
		}).add([67, 16, 76, 2, 1, 70], function (msg) {
			console.debug(`XG variation 3: ${msg}`);
		}).add([67, 16, 76, 2, 1, 72], function (msg) {
			console.debug(`XG variation 4: ${msg}`);
		}).add([67, 16, 76, 2, 1, 74], function (msg) {
			console.debug(`XG variation 5: ${msg}`);
		}).add([67, 16, 76, 2, 1, 76], function (msg) {
			console.debug(`XG variation 6: ${msg}`);
		}).add([67, 16, 76, 2, 1, 78], function (msg) {
			console.debug(`XG variation 7: ${msg}`);
		}).add([67, 16, 76, 2, 1, 80], function (msg) {
			console.debug(`XG variation 8: ${msg}`);
		}).add([67, 16, 76, 2, 1, 82], function (msg) {
			console.debug(`XG variation 9: ${msg}`);
		}).add([67, 16, 76, 2, 1, 84], function (msg) {
			console.debug(`XG variation 10: ${msg}`);
		}).add([67, 16, 76, 2, 1, 86], function (msg) {
			console.debug(`XG variation return: ${toDecibel(msg[0])}dB`);
		}).add([67, 16, 76, 2, 1, 87], function (msg) {
			console.debug(`XG variation pan: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 88], function (msg) {
			console.debug(`XG variation to reverb: ${toDecibel(msg[0])}dB`);
		}).add([67, 16, 76, 2, 1, 89], function (msg) {
			console.debug(`XG variation to chorus: ${toDecibel(msg[0])}dB`);
		}).add([67, 16, 76, 2, 1, 90], function (msg) {
			console.debug(`XG variation connection: ${msg[0] ? "system" : "insertion"}`);
		}).add([67, 16, 76, 2, 1, 91], function (msg) {
			console.debug(`XG variation part: ${msg}`);
		}).add([67, 16, 76, 2, 1, 92], function (msg) {
			console.debug(`XG variation mod wheel: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 93], function (msg) {
			console.debug(`XG variation bend wheel: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 94], function (msg) {
			console.debug(`XG variation channel after touch: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 95], function (msg) {
			console.debug(`XG variation AC1: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 96], function (msg) {
			console.debug(`XG variation AC2: ${msg[0] - 64}`);
		}).add([67, 16, 76, 8], function (msg, track) {
			// XG part setup
			//console.info(`XG Part Setup trk ${track} ch ${msg[0]} real ${upThis.chRedir(msg[0], track)}.`);
			// THIS CAN CONTAIN BUGS
			upThis.#seXgPart.run(msg.slice(1), upThis.chRedir(msg[0], track));
		}).add([67, 16, 76, 48], function (msg) {
			// XG drum 1 setup
			upThis.#seXgDrumInst.run(msg.slice(1), 0, msg[0]);
		}).add([67, 16, 76, 49], function (msg) {
			// XG drum 2 setup
			upThis.#seXgDrumInst.run(msg.slice(1), 1, msg[0]);
		}).add([67, 16, 76, 50], function (msg) {
			// XG drum 3 setup
			upThis.#seXgDrumInst.run(msg.slice(1), 2, msg[0]);
		}).add([67, 16, 76, 51], function (msg) {
			// XG drum 4 setup
			upThis.#seXgDrumInst.run(msg.slice(1), 3, msg[0]);
		});
		// Roland MT-32 SysEx
		// Refactor this!
		this.#seMain.add([65, 1], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 1);
		}).add([65, 2], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 2);
		}).add([65, 3], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 3);
		}).add([65, 4], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 4);
		}).add([65, 5], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 5);
		}).add([65, 6], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 6);
		}).add([65, 7], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 7);
		}).add([65, 8], function (msg) {
			upThis.switchMode("mt32");
			upThis.#seMtSysEx.run(msg, 8);
		}).add([65, 9], function (msg) {
			upThis.switchMode("mt32");
			upThis.#chActive[9] = 1;
			upThis.#seMtSysEx.run(msg, 9);
		}).add([65, 16, 22, 18, 8], function (msg, track) {
			upThis.switchMode("mt32");
			let section = msg[0]/*upThis.chRedir(msg[0], track, true)*/,
			funcId = msg[1],
			theText = "";
			if (funcId == 0) {
				msg.slice(2, 12).forEach((e) => {
					if (e > 31) {
						theText += String.fromCharCode(e);
					};
				});
				console.debug(`MT-32 voice setup on section ${section}: ${theText}.`);
			} else {
				//console.debug(`Mysterious sequence on channel ${part + 1}: ${msg}`);
			};
		}).add([65, 16, 22, 18, 16, 0, 13], function (msg, track) {
			upThis.switchMode("mt32");
			console.info(`MT-32 receive channel: ${msg}`);
		}).add([65, 16, 22, 18, 16, 0, 22], function (msg, track) {
			upThis.switchMode("mt32");
			console.info(`MT-32 all notes off? ${msg}`);
		}).add([65, 16, 22, 18, 32, 0], function (msg) {
			upThis.switchMode("mt32");
			let offset = msg[0];
			upThis.#letterDisp = " ".repeat(offset);
			msg.unshift();
			msg.pop();
			upThis.#letterDisp = " ".repeat(offset);
			upThis.#letterExpire = Date.now() + 3200;
			msg.forEach(function (e) {
				if (e > 31) {
					upThis.#letterDisp += String.fromCharCode(e);
				};
			});
			upThis.#letterDisp += " ".repeat(32 - upThis.#letterDisp.length);
		});
		this.#seMtSysEx.add([22, 18, 2, 0, 0], function (msg, channel) {
			// MT-32 tone properties
			// Refactor this!
			let setName = "";
			msg.slice(0, 10).forEach(function (e) {
				if (e > 31) {
					setName += String.fromCharCode(e);
				};
			});
			upThis.#customName[channel] = setName;
			console.debug(`MT-32 tone properties on channel ${channel + 1} (${setName}).`);
			let matchedPart = [];
			msg.slice(10).forEach((e, i) => {
				if (e < 10) {
					matchedPart[e] = matchedPart[e] || [];
					matchedPart[e].push(i);
				};
			});
			console.info(matchedPart[channel]);
		});
		// Roland GS SysEx
		// Refactor this!
		this.#seMain.add([65, 16, 66, 18, 0, 0, 127], function (msg) {
			// GS module mode (single port 16 channel, or double port 32 channel)
			upThis.switchMode("gs", true);
			upThis.#cc[1152] = 120;
			upThis.#cc[3200] = 120;
			upThis.#cc[5248] = 120;
			upThis.#cc[7296] = 120;
			upThis.#trkRedir.forEach(toZero);
			upThis.#modeKaraoke = false;
			upThis.#subLsb = 3;
			console.info(`GS system set to ${msg[0] ? "dual" : "single"} mode.`);
		}).add([65, 16, 66, 18, 64, 0, 0], function (msg) {
			// GS Master Tune, 4 bytes but I don't know how to process
		}).add([65, 16, 66, 18, 64, 0, 4], function (msg) {
			// GS Master Volume, same as universal master volume but with MSB only.
			upThis.#masterVol = msg[0] * 129 / 163.83;
		}).add([65, 16, 66, 18, 64, 0, 5], function (msg) {
			// GS Master Key Shift
			console.debug(`GS master key shift: ${msg[0] - 64} semitones.`);
		}).add([65, 16, 66, 18, 64, 0, 6], function (msg) {
			// GS Master Pan
			console.debug(`GS master pan:${msg[0] - 64}.`);
		}).add([65, 16, 66, 18, 64, 1, 48], function (msg) {
			// GS reverb macro
			console.debug(`GS reverb type: ${gsRevType[msg[0]]}`);
		}).add([65, 16, 66, 18, 64, 1, 49], function (msg) {
			// GS reverb Character
		}).add([65, 16, 66, 18, 64, 1, 50], function (msg) {
			// GS reverb pre-LPF
			console.debug(`GS reverb pre-LPF: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 51], function (msg) {
			// GS reverb level
			console.debug(`GS reverb level: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 52], function (msg) {
			// GS reverb time (NEED A LOOKUP TABLE FOR REAL VALUES)
			console.debug(`GS reverb time: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 53], function (msg) {
			// GS reverb delay feedback
			console.debug(`GS reverb delay feedback: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 55], function (msg) {
			// GS reverb pre-delay time
			console.debug(`GS reverb pre-delay time: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 56], function (msg) {
			// GS reverb chorus macro
			console.debug(`GS chorus type: ${gsChoType[msg[0]]}`);
		}).add([65, 16, 66, 18, 64, 1, 57], function (msg) {
			// GS reverb chorus pre-LPF (SC-88 Pro manual page 195)
			console.debug(`GS chorus pre-LPF: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 2, 0], function (msg) {
			// GS EQ low freq
			console.debug(`GS EQ low: ${msg[0] ? 400 : 200}Hz`);
		}).add([65, 16, 66, 18, 64, 2, 1], function (msg) {
			// GS EQ low gain
			console.debug(`GS EQ low: ${msg[0] - 64}dB`);
		}).add([65, 16, 66, 18, 64, 2, 2], function (msg) {
			// GS EQ high freq
			console.debug(`GS EQ high: ${msg[0] ? 6000 : 3000}Hz`);
		}).add([65, 16, 66, 18, 64, 2, 3], function (msg) {
			// GS EQ high gain
			console.debug(`GS EQ high: ${msg[0] - 64}dB`);
		}).add([65, 16, 66, 18, 64, 3], function (msg) {
			// GS EFX params, have to ignore for now (SC-88 Pro manual page 196)
		}).add([65, 16, 69, 18, 16, 0], function (msg) {
			// GS Text Insert (same as XG Letter Display)
			let offset = msg[0];
			upThis.#letterDisp = " ".repeat(offset);
			upThis.#letterExpire = Date.now() + 3200;
			msg.pop();
			msg.slice(1).forEach(function (e) {
				upThis.#letterDisp += String.fromCharCode(e);
			});
		}).add([65, 16, 69, 18, 16, 1, 0], function (msg) {
			// GS Frame Draw (same as XG Bitmap Display)
			upThis.#bitmapExpire = Date.now() + 3200;
			msg.forEach(function (e, i) {
				if (i < 64) {
					let ln = Math.floor(i / 16), co = i % 16;
					let pt = (co * 4 + ln) * 5, threshold = 5, bi = 0;
					pt -= co * 4;
					if (ln == 3) {
						threshold = 1;
					};
					while (bi < threshold) {
						upThis.#bitmap[pt + bi] = (e >> (4 - bi)) & 1;
						bi ++;
					};
				};
			});
		}).add([65, 16, 66, 18, 64, 16], function (msg, track) {
			// GS Part channel 10
			upThis.#seGsPart.run(msg, upThis.chRedir(9, track, true), track);
		}).add([65, 16, 66, 18, 64, 17], function (msg, track) {
			// GS Part channel 01
			upThis.#seGsPart.run(msg, upThis.chRedir(0, track, true), track);
		}).add([65, 16, 66, 18, 64, 18], function (msg, track) {
			// GS Part channel 02
			upThis.#seGsPart.run(msg, upThis.chRedir(1, track, true), track);
		}).add([65, 16, 66, 18, 64, 19], function (msg, track) {
			// GS Part channel 03
			upThis.#seGsPart.run(msg, upThis.chRedir(2, track, true), track);
		}).add([65, 16, 66, 18, 64, 20], function (msg, track) {
			// GS Part channel 04
			upThis.#seGsPart.run(msg, upThis.chRedir(3, track, true), track);
		}).add([65, 16, 66, 18, 64, 21], function (msg, track) {
			// GS Part channel 05
			upThis.#seGsPart.run(msg, upThis.chRedir(4, track, true), track);
		}).add([65, 16, 66, 18, 64, 22], function (msg, track) {
			// GS Part channel 06
			upThis.#seGsPart.run(msg, upThis.chRedir(5, track, true), track);
		}).add([65, 16, 66, 18, 64, 23], function (msg, track) {
			// GS Part channel 07
			upThis.#seGsPart.run(msg, upThis.chRedir(6, track, true), track);
		}).add([65, 16, 66, 18, 64, 24], function (msg, track) {
			// GS Part channel 08
			upThis.#seGsPart.run(msg, upThis.chRedir(7, track, true), track);
		}).add([65, 16, 66, 18, 64, 25], function (msg, track) {
			// GS Part channel 09
			upThis.#seGsPart.run(msg, upThis.chRedir(8, track, true), track);
		}).add([65, 16, 66, 18, 64, 26], function (msg, track) {
			// GS Part channel 11
			upThis.#seGsPart.run(msg, upThis.chRedir(10, track, true), track);
		}).add([65, 16, 66, 18, 64, 27], function (msg, track) {
			// GS Part channel 12
			upThis.#seGsPart.run(msg, upThis.chRedir(11, track, true), track);
		}).add([65, 16, 66, 18, 64, 28], function (msg, track) {
			// GS Part channel 13
			upThis.#seGsPart.run(msg, upThis.chRedir(12, track, true), track);
		}).add([65, 16, 66, 18, 64, 29], function (msg, track) {
			// GS Part channel 14
			upThis.#seGsPart.run(msg, upThis.chRedir(13, track, true), track);
		}).add([65, 16, 66, 18, 64, 30], function (msg, track) {
			// GS Part channel 15
			upThis.#seGsPart.run(msg, upThis.chRedir(14, track, true), track);
		}).add([65, 16, 66, 18, 64, 31], function (msg, track) {
			// GS Part channel 16
			upThis.#seGsPart.run(msg, upThis.chRedir(15, track, true), track);
		}).add([65, 16, 66, 18, 64, 64], function (msg, track) {
			// GS Part channel 10
			upThis.#seGsPartProp.run(msg, upThis.chRedir(9, track, true));
		}).add([65, 16, 66, 18, 64, 65], function (msg, track) {
			// GS Part channel 01
			upThis.#seGsPartProp.run(msg, upThis.chRedir(0, track, true));
		}).add([65, 16, 66, 18, 64, 66], function (msg, track) {
			// GS Part channel 02
			upThis.#seGsPartProp.run(msg, upThis.chRedir(1, track, true));
		}).add([65, 16, 66, 18, 64, 67], function (msg, track) {
			// GS Part channel 03
			upThis.#seGsPartProp.run(msg, upThis.chRedir(2, track, true));
		}).add([65, 16, 66, 18, 64, 68], function (msg, track) {
			// GS Part channel 04
			upThis.#seGsPartProp.run(msg, upThis.chRedir(3, track, true));
		}).add([65, 16, 66, 18, 64, 69], function (msg, track) {
			// GS Part channel 05
			upThis.#seGsPartProp.run(msg, upThis.chRedir(4, track, true));
		}).add([65, 16, 66, 18, 64, 70], function (msg, track) {
			// GS Part channel 06
			upThis.#seGsPartProp.run(msg, upThis.chRedir(5, track, true));
		}).add([65, 16, 66, 18, 64, 71], function (msg, track) {
			// GS Part channel 07
			upThis.#seGsPartProp.run(msg, upThis.chRedir(6, track, true));
		}).add([65, 16, 66, 18, 64, 72], function (msg, track) {
			// GS Part channel 08
			upThis.#seGsPartProp.run(msg, upThis.chRedir(7, track, true));
		}).add([65, 16, 66, 18, 64, 73], function (msg, track) {
			// GS Part channel 09
			upThis.#seGsPartProp.run(msg, upThis.chRedir(8, track, true));
		}).add([65, 16, 66, 18, 64, 74], function (msg, track) {
			// GS Part channel 11
			upThis.#seGsPartProp.run(msg, upThis.chRedir(10, track, true));
		}).add([65, 16, 66, 18, 64, 75], function (msg, track) {
			// GS Part channel 12
			upThis.#seGsPartProp.run(msg, upThis.chRedir(11, track, true));
		}).add([65, 16, 66, 18, 64, 76], function (msg, track) {
			// GS Part channel 13
			upThis.#seGsPartProp.run(msg, upThis.chRedir(12, track, true));
		}).add([65, 16, 66, 18, 64, 77], function (msg, track) {
			// GS Part channel 14
			upThis.#seGsPartProp.run(msg, upThis.chRedir(13, track, true));
		}).add([65, 16, 66, 18, 64, 78], function (msg, track) {
			// GS Part channel 15
			upThis.#seGsPartProp.run(msg, upThis.chRedir(14, track, true));
		}).add([65, 16, 66, 18, 64, 79], function (msg, track) {
			// GS Part channel 16
			upThis.#seGsPartProp.run(msg, upThis.chRedir(15, track, true));
		});
		// KORG X5D SysEx
		upThis.#seMain.add([66, 48, 54, 104], function (msg, track) {
			// X5D extended multi setup
			upThis.switchMode("x5d", true);
			korgFilter(msg, function (e, i) {
				if (i < 192) {
					let part = upThis.chRedir(Math.floor(i / 12), track, true),
					chOff = part * 128;
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
							upThis.#cc[chOff + 7] = e;
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
								upThis.#cc[chOff + 10] = Math.round((e - 15) * 4.2 + 64);
							};
							break;
						};
						case 5: {
							// Reverb + Chorus
							let choSend = e >> 4,
							revSend = e & 15;
							upThis.#cc[chOff + 91] = x5dSendLevel(revSend);
							upThis.#cc[chOff + 93] = x5dSendLevel(choSend);
							break;
						};
						case 10: {
							// Control filter
							upThis.#cc[chOff] = (e & 3) ? 82 : 56;
							break;
						};
						case 11: {
							// MIDI Rc Ch + Track Switch
							let midiCh = e & 15,
							trkSw = e >> 4;
							upThis.#chReceive[part] = e;
							if (midiCh != part || trkSw) {
								console.info(`X5D Part CH${part + 1} receives from CH${midiCh + 1}. Track is ${trkSw ? "inactive" : "active"}.`);
								upThis.buildRchTree();
							};
						};
					};
				} else {
					let part = upThis.chRedir(i - 192, track, true);
					// What the heck is pitch bend range 0xF4(-12) to 0x0C(12)?
				};
			});
		}).add([66, 48, 54, 76, 0], function (msg, track) {
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
			upThis.dispatchEvent("mapupdate", {
				clearRange: {
					msb: 82,
					prg: [0, 99],
					lsb: 0
				},
				voiceMap
			});
		}).add([66, 48, 54, 77, 0], function (msg, track) {
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
			upThis.dispatchEvent("mapupdate", {
				clearRange: {
					msb: 90,
					prg: [0, 99],
					lsb: 0
				},
				voiceMap
			});
		}).add([66, 48, 66, 54], function (msg, track) {
			// NS5R program dump
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
						voiceMap += `\n${msb}\t${prg}\t${lsb}\t${name.trim()}`;
						prg ++;
						name = "";
						break;
					};
				};
			});
			upThis.dispatchEvent("mapupdate", {
				clearRange: {
					msb: 80,
					lsb: 0
				},
				voiceMap
			});
		}).add([66, 48, 66, 52], function (msg) {
			// KORG NS5R/NX5R System Exclusive
			// Current effect dump, but cannot find parsing docs.
			upThis.switchMode("ns5r", true);
			upThis.#modeKaraoke = false;
			//console.debug(`NS5R effect dump: `, msg);
		}).add([66, 48, 66, 53], function (msg) {
			// NS5R Current multi dump
			upThis.switchMode("ns5r", true);
			//console.debug(`NS5R part dump: `, msg);
			korgFilter(msg, function (e, i) {
				switch (true) {
					case i < 2944: {
						// 32 part setup params, 2944 bytes
						let part = Math.floor(i / 92),
						chOff = part * 128;
						switch (i % 92) {
							case 0: {
								// MSB Bank
								upThis.#cc[chOff] = e;
								break;
							};
							case 1: {
								// LSB Bank
								upThis.#cc[chOff + 32] = e;
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
								upThis.#chReceive[part] = e;
								if (part != e) {
									console.info(`NS5R CH${part + 1} receives from CH${e + 1}.`);
									upThis.buildRchTree();
								};
							};
							case 7: {
								// 0 for melodic, 1 for drum, 2~5 for mod drums 1~4
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
								upThis.#cc[chOff + 7] = e;
								break;
							};
							case 11: {
								// Expression
								upThis.#cc[chOff + 11] = e;
								break;
							};
							case 14: {
								// Pan
								upThis.#cc[chOff + 10] = e || 128;
								break;
							};
							case 19: {
								// Chorus
								upThis.#cc[chOff + 93] = e;
								break;
							};
							case 20: {
								// Reverb
								upThis.#cc[chOff + 91] = e;
								break;
							};
							case 84: {
								// Portamento Switch
								upThis.#cc[chOff + 65] = e;
								break;
							};
							case 85: {
								// Portamento Time
								upThis.#cc[chOff + 5] = e;
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
						// currnet effect params, 38 bytes
						break;
					};
					case i < 8566: {
						// 4 mod drum params, 5432 bytes
						break;
					};
				};
			});
		});
		// Yamaha XG Drum Setup SysEx
		// Refactor this!
		upThis.#seXgDrumInst.add([0], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} coarse pitch bend ${msg[0] - 64}.`);
		}).add([1], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} fine pitch bend ${msg[0] - 64}.`);
		}).add([2], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} level ${msg[0]}.`);
		}).add([3], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} alt group ${msg[0]}.`);
		}).add([4], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} pan ${msg[0] - 64}.`);
		}).add([5], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} reverb send ${toDecibel(msg[0])}dB.`);
		}).add([6], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} chorus send ${toDecibel(msg[0])}dB.`);
		}).add([7], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} variation send ${toDecibel(msg[0])}dB.`);
		}).add([8], function (msg, setupNum, noteNum) {
			console.debug(`XG Drum ${setupNum} note ${noteNum} key assign as ${msg[0] > 0 ? "multi" : "single"}.`);
		}).add([9], function (msg, setupNum, noteNum) {
			// Note off send
		}).add([10], function (msg, setupNum, noteNum) {
			// Note on send
		}).add([11], function (msg, setupNum, noteNum) {
			// Filter cutoff (brightness)
		}).add([12], function (msg, setupNum, noteNum) {
			// Filter resonance
		}).add([13], function (msg, setupNum, noteNum) {
			// EG attack rate
		}).add([14], function (msg, setupNum, noteNum) {
			// EG decay 1 rate
		}).add([15], function (msg, setupNum, noteNum) {
			// EG decay 2 rate
		});
		// Yamaha XG Part Setup SysEx
		// Refactor this!
		upThis.#seXgPart.add([0], function (msg, channel) {
			console.debug(`XG Part reserve ${msg[0]} elements for channel ${channel}.`);
		}).add([1], function (msg, channel) {
			// Same as cc0
			upThis.#cc[channel * 128] = msg[0];
		}).add([2], function (msg, channel) {
			// Same as cc32
			upThis.#cc[channel * 128 + 32] = msg[0];
		}).add([3], function (msg, channel) {
			// Same as program change
			upThis.#prg[channel] = msg[0];
		}).add([4], function (msg, channel) {
			// Change receive channel. May require channel redirect feature to be implemented!
			upThis.#chReceive[channel] = msg[0];
			if (channel != msg[0]) {
				console.info(`XG Part CH${channel + 1} receives from CH${msg[0] + 1}.`);
				upThis.buildRchTree();
			};
		}).add([5], function (msg, channel) {
			// Mono/poly switching
			console.debug(`XG Part mono/poly set to ${msg[0] ? "mono" : "poly"} for channel ${channel}.`);
		}).add([6], function (msg, channel) {
			// Same note number key on assign (what does this mean???)
			console.debug(`XG Part repeat pressing set to ${["single", "multi", "inst"][msg[0]]} mode for channel ${channel}.`);
		}).add([7], function (msg, channel) {
			let data = msg[0];
			upThis.#cc[128 * channel] = data > 1 ? 127 : 0;
			console.debug(`XG Part use mode "${xgPartMode[data]}" for channel ${channel}.`);
		}).add([14], function (msg, channel) {
			//console.debug(`XG Part panning for channel ${channel}: ${msg[0]}.`);
			upThis.#cc[128 * channel + 10] = msg[0] || 128;
		}).add([17], function (msg, channel) {
			console.debug(`XG Part dry level ${msg[0]} for channel ${channel}.`);
		}).add([18], function (msg, channel) {
			console.debug(`XG Part chorus send ${toDecibel(msg[0])}dB for channel ${channel}.`);
		}).add([19], function (msg, channel) {
			console.debug(`XG Part reverb send ${toDecibel(msg[0])}dB for channel ${channel}.`);
		}).add([20], function (msg, channel) {
			console.debug(`XG Part variation send ${toDecibel(msg[0])}dB for channel ${channel}.`);
		}).add([21], function (msg, channel) {
			console.debug(`XG Part LFO speed ${msg[0]} for channel ${channel}.`);
		}).add([29], function (msg, channel) {
			console.debug(`XG Part MW bend ${msg[0] - 64} semitones for channel ${channel}.`);
		}).add([32], function (msg, channel) {
			console.debug(`XG Part MW LFO pitch depth ${msg[0]} for channel ${channel}.`);
		}).add([33], function (msg, channel) {
			console.debug(`XG Part MW LFO filter depth ${msg[0]} for channel ${channel}.`);
		}).add([35], function (msg, channel) {
			console.debug(`XG Part bend pitch ${msg[0] - 64} semitones for channel ${channel}.`);
		}).add([83], function (msg, channel) {
			// Polyphonic aftertouch (PAT) pitch control
			//console.debug(`XG Part PAT pitch ${msg[0] - 64} semitones for channel ${channel}.`);
		}).add([103], function (msg, channel) {
			// Same as cc65
			upThis.#cc[channel * 128 + 65] = msg[0];
		}).add([104], function (msg, channel) {
			// Same as cc5
			upThis.#cc[channel * 128 + 5] = msg[0];
		}).add([105], function (msg, channel) {
			console.debug(`XG Part EG initial ${msg[0] - 64} for channel ${channel}.`);
		}).add([106], function (msg, channel) {
			console.debug(`XG Part EG attack time ${msg[0] - 64} for channel ${channel}.`);
		});
		// Roland GS Part Setup SysEx
		// Refactor this!
		upThis.#seGsPart.add([0], function (msg, channel) {
			// Same as cc00 and program change
			if (upThis.#cc[channel * 128] == 120) {
				msg[0] = 120;
			};
			upThis.#cc[channel * 128] = msg[0] || 0;
			upThis.#prg[channel] = msg[1] || 0;
		}).add([2], function (msg, channel, track) {
			// Channel redirect might be required
			// 3 to 18 controls whether to receive messages. Not implemented for now.
			let targetCh = upThis.chRedir(msg[0], track, true);
			upThis.#chReceive[channel] = targetCh;
			if (channel != targetCh) {
				console.info(`GS Part CH${channel + 1} receives from CH${targetCh + 1.}.`);
				upThis.buildRchTree();
			};
		}).add([19], function (msg, channel) {
			// Switch to mono (0) or poly (1)
		}).add([20], function (msg, channel) {
			// Switch assign mode
		}).add([21], function (msg, channel) {
			// Channel use rhythm or not
			// Only two drum kits can even be used at the same time
			console.debug(`GS Part ${channel + 1} type: ${["melodic", "drum 1", "drum 2"][msg[0]]}.`);
			if (msg[0] > 0) {
				upThis.#cc[channel * 128] = 120;
			};
		}).add([25], function (msg, channel) {
			// Set volume
			upThis.#cc[channel * 128 + 7] = msg[0];
		}).add([28], function (msg, channel) {
			// Set pan
			upThis.#cc[channel * 128 + 10] = msg[0] || 128;
		}).add([33], function (msg, channel) {
			// Set chorus
			upThis.#cc[channel * 128 + 93] = msg[0];
		}).add([34], function (msg, channel) {
			// Set reverb
			upThis.#cc[channel * 128 + 91] = msg[0];
		});
		// Roland GS Part Properties
		// Refactor this!
		upThis.#seGsPartProp.add([0], function(msg, channel) {
			upThis.#cc[channel * 128 + 32] = msg[0];
		}).add([1], function(msg, channel) {
			// This should be per-channel subLsb, but currently not implemented, sooooo...
			upThis.#cc[channel * 128 + 32] = msg[0];
		}).add([32], function(msg, channel) {
			console.debug(`GS Part ${channel + 1} turned EQ ${msg[0] ? "on" : "off"}.`);
		}).add([33], function(msg, channel) {
			// GS output assign
		}).add([34], function(msg, channel) {
			console.debug(`GS Part ${channel + 1} turned EFX ${msg[0] ? "on" : "off"}.`);
		});
	};
};

export {
	OctaviaDevice,
	ccToPos
};
