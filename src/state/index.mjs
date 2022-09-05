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
import {toDecibel} from "./utils.js";

const modeIdx = [
	"?",
	"gm", "gs", "xg", "g2",
	"mt32", "ns5r",
	"ag10", "x5d", "05rw"
];
let modeMap = {};
modeIdx.forEach(function (e, i) {
	modeMap[e] = i;
});
const substList = [
	[0, 0, 0, 0, 0, 0, 0, 56, 82, 81],
	[0, 0, 1, 0, 0, 127, 0, 0, 0, 0]
];
const drumMsb = [120, 127, 120, 127, 120, 127, 61, 62, 62, 62];
const passedMeta = [0, 3, 81, 84, 88]; // What is meta event 32?

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

let OctaviaDevice = class extends CustomEventSource {
	// Values
	#mode = 0;
	#bitmap = new Array(256);
	#bitmapExpire = 0;
	#chActive = new Array(64); // Whether the channel is in use
	#cc = new Uint8ClampedArray(8192); // 64 channels, 128 controllers
	#prg = new Uint8ClampedArray(64);
	#velo = new Uint8ClampedArray(8192); // 64 channels. 128 velocity registers
	#poly = new Uint16Array(256); // 256 polyphony allowed
	#pitch = new Int16Array(64); // Pitch for channels, from -8192 to 8191
	#customName = new Array(64); // Allow custom naming
	#rawStrength = new Uint8Array(64);
	#subMsb = 0; // Allowing global bank switching
	#subLsb = 0;
	#masterVol = 100;
	#metaChannel = 0;
	#letterDisp = "";
	#letterExpire = 0;
	#modeKaraoke = false;
	// Metadata text events
	#metaTexts = [];
	// GS Track Occupation
	#trkRedir = new Uint8Array(32);
	#trkAsReq = new Uint8Array(128); // Track Assignment request
	chRedir(part, track) {
		/*if (this.#trkAsReq[track]) {
			// Allow part assigning via meta
			return (this.#trkAsReq[track] - 1) * 16 + part;
		} else */if (this.#mode == modeMap.gs) {
			// Trying to support 32 channel...
			let shift = 0;
			//console.debug(`T${track} TC${part} AT${this.#trkRedir[part]}`);
			if (this.#trkRedir[part] == 0) {
				this.#trkRedir[part] = track;
				//console.debug(`Assign track ${track} to channel ${part + 1}.`);
			} else if (this.#trkRedir[part] != track) {
				shift = 16;
				if (this.#trkRedir[part + shift] == 0) {
					this.#trkRedir[part + shift] = track;
					//console.debug(`Assign track ${track} to channel ${part + shift + 1}.`);
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
	// Channel event pool
	#runChEvent = {
		8: function (det) {
			let part = this.chRedir(det.part, det.track);
			// Note off, velocity should be ignored.
			let rawNote = part * 128 + det.data[0];
			let polyIdx = this.#poly.indexOf(rawNote);
			if (polyIdx > -1) {
				this.#poly[polyIdx] = 0;
				this.#velo[rawNote] = 0;
			};
		},
		9: function (det) {
			let part = this.chRedir(det.part, det.track);
			// Note on, but should be off if velocity is 0.
			// Set channel active
			this.#chActive[part] = 1;
			let rawNote = part * 128 + det.data[0];
			if (det.data[1] > 0) {
				let place = 0;
				while (this.#poly[place] > 0) {
					place ++;
				};
				if (place < 256) {
					this.#poly[place] = rawNote;
					this.#velo[rawNote] = det.data[1];
					if (this.#rawStrength[part] < det.data[1]) {
						this.#rawStrength[part] = det.data[1];
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
			let part = this.chRedir(det.part, det.track);
			// Note aftertouch.
			// Currently it directly changes velocity to set value.
			let rawNote = part * 128 + det.data[0];
			let polyIdx = this.#poly.indexOf(rawNote);
			if (polyIdx > -1) {
				this.#velo[rawNote] = data[1];
			};
		},
		11: function (det) {
			let part = this.chRedir(det.part, det.track);
			// CC event, directly assign values to the register.
			this.#chActive[part] = 1;
			// Pre interpret
			if (det.data[0] == 0) {
				//console.debug(`Channel ${det.part + 1} MSB set from ${this.#cc[128 * det.part]} to ${det.data[1]}`);
				if (this.#mode == modeMap.gs) {
					if (this.#cc[128 * part] == 120 && det.data[1] == 0) {
						// Do not change drum channel to a melodic
						det.data[1] = 120;
						//console.debug(`Forced channel ${det.part + 1} to stay drums.`);
					} else {
						//console.debug(`Channel ${det.part + 1} switched MSB to ${det.data[1]}.`);
					};
				};
			};
			this.#cc[part * 128 + det.data[0]] = det.data[1];
		},
		12: function (det) {
			let part = this.chRedir(det.part, det.track);
			// Program change
			this.#chActive[part] = 1;
			this.#prg[part] = det.data;
			this.#customName[part] = 0;
			//console.debug(`T:${det.track} C:${part} P:${det.data}`);
		},
		13: function (det) {
			// Channel aftertouch
			let upThis = this;
			this.#poly.forEach(function (e) {
				let realCh = e >> 7;
				if (part == realCh) {
					upThis.#velo[e] = det.data;
				};
			});
		},
		14: function (det) {
			let part = this.chRedir(det.part, det.track);
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
	getActive() {
		let result = this.#chActive.slice();
		if (this.#mode == modeMap.mt32) {
			result[0] = 0;
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
		return this.#pitch.slice();
	};
	getProgram() {
		return this.#prg.slice();
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
			bitmap: this.#bitmap.slice(),
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
		return this.#rawStrength.slice();
	};
	getStrength() {
		// 0 to 255
		let str = [], upThis = this;
		this.getRawStrength().forEach(function (e, i) {
			str[i] = Math.floor(e * upThis.#cc[i * 128 + 7] * upThis.#cc[i * 128 + 11] * upThis.#masterVol / 803288);
		});
		return str;
	};
	init() {
		this.dispatchEvent("mode", "?");
		// Full reset
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
		this.#masterVol = 100;
		this.#metaTexts = [];
		this.#letterExpire = 0;
		this.#letterDisp = "";
		this.#bitmapExpire = 0;
		this.#bitmap.forEach(toZero);
		this.#customName.forEach(toZero);
		this.#modeKaraoke = false;
		// Reset channel redirection
		this.#trkRedir.forEach(toZero);
		this.#trkAsReq.forEach(toZero);
		// Channel 10 to drum set
		this.#cc[1152] = 127;
		this.#cc[3200] = 127;
		for (let ch = 0; ch < 64; ch ++) {
			// Volume and expression to full
			this.#cc[ch * 128 + 7] = 127;
			this.#cc[ch * 128 + 11] = 127;
			// Full brightness
			this.#cc[ch * 128 + 74] = 127;
			// Center panning
			this.#cc[ch * 128 + 10] = 64;
		};
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
	runJson(json) {
		// Execute transformed JSON event
		this.#rawStrength.forEach(toZero);
		return this.#runChEvent[json.type].call(this, json);
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
			console.debug("Unparsed meta 127 sequence on track ${track}: ", seq);
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
					this.#metaTexts.unshift(`Ka.Title: ${data.slice(3)}`);
					break;
				};
				default: {
					if (this.#modeKaraoke) {
						if (data[0] == "\\") {
							// New section
							this.#metaTexts.unshift(`@@ ${data.slice(1)}`);
						} else if (data[0] == "/") {
							// New line
							this.#metaTexts.unshift(data.slice(1));
						} else {
							// Normal append
							this.#metaTexts[0] += data;
						};
					} else {
						this.#metaTexts.unshift(data);
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
			this.#metaTexts.unshift(`C.Lyrics: ${data}`);
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
			//console.debug(`Track ${track} requests to get assigned to output ${data}.`);
			upThis.#trkAsReq[track] = data + 1;
		};
		this.#metaRun[127] = function (data, track) {
			//console.debug(`Sequencer specific on track ${track}: `, data);
			upThis.#metaSeq.run(data, track);
		};
		// Standard resets
		this.#seMain.add([126, 127, 9, 1], function () {
			// General MIDI reset
			upThis.switchMode("gm", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: GM");
		}).add([126, 127, 9, 3], function () {
			// General MIDI rev. 2 reset
			upThis.switchMode("g2", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: GM2");
		}).add([65, 16, 22, 18, 127, 1], function () {
			// MT-32 reset
			upThis.switchMode("mt32", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: MT-32");
		}).add([65, 16, 66, 18, 64, 0, 127, 0, 65], function () {
			// Roland GS reset
			upThis.switchMode("gs", true);
			upThis.#cc[1152] = 120;
			upThis.#cc[3200] = 120;
			upThis.#modeKaraoke = false;
			upThis.#trkRedir.forEach(toZero);
			console.info("MIDI reset: GS");
		}).add([66, 48, 66, 52, 0], function (msg) {
			// KORG NS5R/NX5R System Exclusive
			// No available data for parsing yet...
			upThis.switchMode("ns5r", true);
			upThis.#modeKaraoke = false;
			console.info("KORG reset:", msg);
		}).add([67, 16, 76, 0, 0, 126, 0], function (msg) {
			// Yamaha XG reset
			upThis.switchMode("xg", true);
			upThis.#modeKaraoke = false;
			console.info("MIDI reset: XG");
		});
		// Sequencer specific meta event
		this.#metaSeq.add([67, 0, 1], function (msg, track) {
			//console.debug(`XGworks requests assigning track ${track} to output ${msg[0]}.`);
			upThis.#trkAsReq[track] = msg[0] + 1;
		});
		// General MIDI SysEx
		this.#seMain.add([127, 127, 4, 1], function (msg) {
			// Master volume
			upThis.switchMode("gm");
			upThis.#masterVol = (msg[1] << 7 + msg[0]) / 163.83;
		});
		// Yamaha XG SysEx
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
			console.info(`XG reverb type: ${xgEffType[msg[0]]}${msg[1] > 0 ? " " + (msg[1] + 1) : ""}`);
		}).add([67, 16, 76, 2, 1, 2], function (msg) {
			console.info(`XG reverb time: ${getXgRevTime(msg)}s`);
		}).add([67, 16, 76, 2, 1, 3], function (msg) {
			console.info(`XG reverb diffusion: ${msg}`);
		}).add([67, 16, 76, 2, 1, 4], function (msg) {
			console.info(`XG reverb initial delay: ${msg}`);
		}).add([67, 16, 76, 2, 1, 5], function (msg) {
			console.info(`XG reverb high pass cutoff: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 6], function (msg) {
			console.info(`XG reverb low pass cutoff: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 7], function (msg) {
			console.info(`XG reverb width: ${msg}`);
		}).add([67, 16, 76, 2, 1, 8], function (msg) {
			console.info(`XG reverb height: ${msg}`);
		}).add([67, 16, 76, 2, 1, 9], function (msg) {
			console.info(`XG reverb depth: ${msg}`);
		}).add([67, 16, 76, 2, 1, 10], function (msg) {
			console.info(`XG reverb wall type: ${msg}`);
		}).add([67, 16, 76, 2, 1, 11], function (msg) {
			console.info(`XG reverb dry/wet: ${msg[0]}`);
		}).add([67, 16, 76, 2, 1, 12], function (msg) {
			console.info(`XG reverb return: ${msg}`);
		}).add([67, 16, 76, 2, 1, 13], function (msg) {
			console.info(`XG reverb pan: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 16], function (msg) {
			console.info(`XG reverb delay: ${msg}`);
		}).add([67, 16, 76, 2, 1, 17], function (msg) {
			console.info(`XG density: ${msg}`);
		}).add([67, 16, 76, 2, 1, 18], function (msg) {
			console.info(`XG reverb balance: ${msg}`);
		}).add([67, 16, 76, 2, 1, 20], function (msg) {
			console.info(`XG reverb feedback: ${msg}`);
		}).add([67, 16, 76, 2, 1, 32], function (msg) {
			console.info(`XG chorus type: ${xgEffType[msg[0]]}${msg[1] > 0 ? " " + (msg[1] + 1) : ""}`);
		}).add([67, 16, 76, 2, 1, 34], function (msg) {
			console.info(`XG chorus LFO: ${xgLfoFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 35], function (msg) {
			//console.info(`XG chorus LFO phase: ${msg}`);
		}).add([67, 16, 76, 2, 1, 36], function (msg) {
			console.info(`XG chorus feedback: ${msg}`);
		}).add([67, 16, 76, 2, 1, 37], function (msg) {
			console.info(`XG chorus delay offset: ${getXgDelayOffset(msg[0])}ms`);
		}).add([67, 16, 76, 2, 1, 39], function (msg) {
			console.info(`XG chorus low: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 40], function (msg) {
			console.info(`XG chorus low: ${msg[0] - 64}dB`);
		}).add([67, 16, 76, 2, 1, 41], function (msg) {
			console.info(`XG chorus high: ${xgNormFreq[msg[0]]}Hz`);
		}).add([67, 16, 76, 2, 1, 42], function (msg) {
			console.info(`XG chorus high: ${msg[0] - 64}dB`);
		}).add([67, 16, 76, 2, 1, 43], function (msg) {
			console.info(`XG chorus dry/wet: ${msg}`);
		}).add([67, 16, 76, 2, 1, 44], function (msg) {
			console.info(`XG chorus return: ${msg}`);
		}).add([67, 16, 76, 2, 1, 45], function (msg) {
			console.info(`XG chorus pan: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 46], function (msg) {
			console.info(`XG chorus to reverb: ${msg}`);
		}).add([67, 16, 76, 2, 1, 64], function (msg) {
			console.info(`XG variation type: ${xgEffType[msg[0]]}${msg[1] > 0 ? " " + (msg[1] + 1) : ""}`);
		}).add([67, 16, 76, 2, 1, 66], function (msg) {
			console.info(`XG variation 1: ${msg}`);
		}).add([67, 16, 76, 2, 1, 68], function (msg) {
			console.info(`XG variation 2: ${msg}`);
		}).add([67, 16, 76, 2, 1, 70], function (msg) {
			console.info(`XG variation 3: ${msg}`);
		}).add([67, 16, 76, 2, 1, 72], function (msg) {
			console.info(`XG variation 4: ${msg}`);
		}).add([67, 16, 76, 2, 1, 74], function (msg) {
			console.info(`XG variation 5: ${msg}`);
		}).add([67, 16, 76, 2, 1, 76], function (msg) {
			console.info(`XG variation 6: ${msg}`);
		}).add([67, 16, 76, 2, 1, 78], function (msg) {
			console.info(`XG variation 7: ${msg}`);
		}).add([67, 16, 76, 2, 1, 80], function (msg) {
			console.info(`XG variation 8: ${msg}`);
		}).add([67, 16, 76, 2, 1, 82], function (msg) {
			console.info(`XG variation 9: ${msg}`);
		}).add([67, 16, 76, 2, 1, 84], function (msg) {
			console.info(`XG variation 10: ${msg}`);
		}).add([67, 16, 76, 2, 1, 86], function (msg) {
			console.info(`XG variation return: ${toDecibel(msg[0])}dB`);
		}).add([67, 16, 76, 2, 1, 87], function (msg) {
			console.info(`XG variation pan: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 88], function (msg) {
			console.info(`XG variation to reverb: ${toDecibel(msg[0])}dB`);
		}).add([67, 16, 76, 2, 1, 89], function (msg) {
			console.info(`XG variation to chorus: ${toDecibel(msg[0])}dB`);
		}).add([67, 16, 76, 2, 1, 90], function (msg) {
			console.info(`XG variation connection: ${msg[0] ? "system" : "insertion"}`);
		}).add([67, 16, 76, 2, 1, 91], function (msg) {
			console.info(`XG variation part: ${msg}`);
		}).add([67, 16, 76, 2, 1, 92], function (msg) {
			console.info(`XG variation mod wheel: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 93], function (msg) {
			console.info(`XG variation bend wheel: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 94], function (msg) {
			console.info(`XG variation channel after touch: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 95], function (msg) {
			console.info(`XG variation AC1: ${msg[0] - 64}`);
		}).add([67, 16, 76, 2, 1, 96], function (msg) {
			console.info(`XG variation AC2: ${msg[0] - 64}`);
		}).add([67, 16, 76, 8], function (msg, track) {
			// XG part setup
			//console.info(`XG Part Setup trk ${track} ch ${msg[0]} real ${upThis.chRedir(msg[0], track)}.`);
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
		});
		this.#seMtSysEx.add([22, 18, 2, 0, 0], function (msg, channel) {
			// MT-32 tone properties
			let setName = "";
			msg.slice(0, 10).forEach(function (e) {
				if (e > 31) {
					setName += String.fromCharCode(e);
				};
			});
			upThis.#customName[channel] = setName;
			console.debug(`MT-32 tone properties on channel ${channel + 1} (${setName}): ${msg.slice(10)}`);
		});
		// Roland GS SysEx
		this.#seMain.add([65, 16, 66, 18, 0, 0, 127], function (msg) {
			// GS module mode (single port 16 channel, or double port 32 channel)
			upThis.switchMode("gs", true);
			upThis.#cc[1152] = 120;
			upThis.#cc[3200] = 120;
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
			console.info(`GS master key shift: ${msg[0] - 64} semitones.`);
		}).add([65, 16, 66, 18, 64, 0, 6], function (msg) {
			// GS Master Pan
			console.info(`GS master pan:${msg[0] - 64}.`);
		}).add([65, 16, 66, 18, 64, 1, 48], function (msg) {
			// GS reverb macro
			console.info(`GS reverb type: ${gsRevType[msg[0]]}`);
		}).add([65, 16, 66, 18, 64, 1, 49], function (msg) {
			// GS reverb Character
		}).add([65, 16, 66, 18, 64, 1, 50], function (msg) {
			// GS reverb pre-LPF
			console.info(`GS reverb pre-LPF: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 51], function (msg) {
			// GS reverb level
			console.info(`GS reverb level: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 52], function (msg) {
			// GS reverb time (NEED A LOOKUP TABLE FOR REAL VALUES)
			console.info(`GS reverb time: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 53], function (msg) {
			// GS reverb delay feedback
			console.info(`GS reverb delay feedback: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 55], function (msg) {
			// GS reverb pre-delay time
			console.info(`GS reverb pre-delay time: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 1, 56], function (msg) {
			// GS reverb chorus macro
			console.info(`GS chorus type: ${gsChoType[msg[0]]}`);
		}).add([65, 16, 66, 18, 64, 1, 57], function (msg) {
			// GS reverb chorus pre-LPF (SC-88 Pro manual page 195)
			console.info(`GS chorus pre-LPF: ${msg[0]}`);
		}).add([65, 16, 66, 18, 64, 2, 0], function (msg) {
			// GS EQ low freq
			console.info(`GS EQ low: ${msg[0] ? 400 : 200}Hz`);
		}).add([65, 16, 66, 18, 64, 2, 1], function (msg) {
			// GS EQ low gain
			console.info(`GS EQ low: ${msg[0] - 64}dB`);
		}).add([65, 16, 66, 18, 64, 2, 2], function (msg) {
			// GS EQ high freq
			console.info(`GS EQ high: ${msg[0] ? 6000 : 3000}Hz`);
		}).add([65, 16, 66, 18, 64, 2, 3], function (msg) {
			// GS EQ high gain
			console.info(`GS EQ high: ${msg[0] - 64}dB`);
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
		}).add([65, 16, 66, 18, 64, 16], function (msg) {
			// GS Part channel 10
			upThis.#seGsPart.run(msg, 9);
		}).add([65, 16, 66, 18, 64, 17], function (msg) {
			// GS Part channel 01
			upThis.#seGsPart.run(msg, 0);
		}).add([65, 16, 66, 18, 64, 18], function (msg) {
			// GS Part channel 02
			upThis.#seGsPart.run(msg, 1);
		}).add([65, 16, 66, 18, 64, 19], function (msg) {
			// GS Part channel 03
			upThis.#seGsPart.run(msg, 2);
		}).add([65, 16, 66, 18, 64, 20], function (msg) {
			// GS Part channel 04
			upThis.#seGsPart.run(msg, 3);
		}).add([65, 16, 66, 18, 64, 21], function (msg) {
			// GS Part channel 05
			upThis.#seGsPart.run(msg, 4);
		}).add([65, 16, 66, 18, 64, 22], function (msg) {
			// GS Part channel 06
			upThis.#seGsPart.run(msg, 5);
		}).add([65, 16, 66, 18, 64, 23], function (msg) {
			// GS Part channel 07
			upThis.#seGsPart.run(msg, 6);
		}).add([65, 16, 66, 18, 64, 24], function (msg) {
			// GS Part channel 08
			upThis.#seGsPart.run(msg, 7);
		}).add([65, 16, 66, 18, 64, 25], function (msg) {
			// GS Part channel 09
			upThis.#seGsPart.run(msg, 8);
		}).add([65, 16, 66, 18, 64, 26], function (msg) {
			// GS Part channel 11
			upThis.#seGsPart.run(msg, 10);
		}).add([65, 16, 66, 18, 64, 27], function (msg) {
			// GS Part channel 12
			upThis.#seGsPart.run(msg, 11);
		}).add([65, 16, 66, 18, 64, 28], function (msg) {
			// GS Part channel 13
			upThis.#seGsPart.run(msg, 12);
		}).add([65, 16, 66, 18, 64, 29], function (msg) {
			// GS Part channel 14
			upThis.#seGsPart.run(msg, 13);
		}).add([65, 16, 66, 18, 64, 30], function (msg) {
			// GS Part channel 15
			upThis.#seGsPart.run(msg, 14);
		}).add([65, 16, 66, 18, 64, 31], function (msg) {
			// GS Part channel 16
			upThis.#seGsPart.run(msg, 15);
		}).add([65, 16, 66, 18, 64, 64], function (msg) {
			// GS Part channel 10
			upThis.#seGsPartProp.run(msg, 9);
		}).add([65, 16, 66, 18, 64, 65], function (msg) {
			// GS Part channel 01
			upThis.#seGsPartProp.run(msg, 0);
		}).add([65, 16, 66, 18, 64, 66], function (msg) {
			// GS Part channel 02
			upThis.#seGsPartProp.run(msg, 1);
		}).add([65, 16, 66, 18, 64, 67], function (msg) {
			// GS Part channel 03
			upThis.#seGsPartProp.run(msg, 2);
		}).add([65, 16, 66, 18, 64, 68], function (msg) {
			// GS Part channel 04
			upThis.#seGsPartProp.run(msg, 3);
		}).add([65, 16, 66, 18, 64, 69], function (msg) {
			// GS Part channel 05
			upThis.#seGsPartProp.run(msg, 4);
		}).add([65, 16, 66, 18, 64, 70], function (msg) {
			// GS Part channel 06
			upThis.#seGsPartProp.run(msg, 5);
		}).add([65, 16, 66, 18, 64, 71], function (msg) {
			// GS Part channel 07
			upThis.#seGsPartProp.run(msg, 6);
		}).add([65, 16, 66, 18, 64, 72], function (msg) {
			// GS Part channel 08
			upThis.#seGsPartProp.run(msg, 7);
		}).add([65, 16, 66, 18, 64, 73], function (msg) {
			// GS Part channel 09
			upThis.#seGsPartProp.run(msg, 8);
		}).add([65, 16, 66, 18, 64, 74], function (msg) {
			// GS Part channel 11
			upThis.#seGsPartProp.run(msg, 10);
		}).add([65, 16, 66, 18, 64, 75], function (msg) {
			// GS Part channel 12
			upThis.#seGsPartProp.run(msg, 11);
		}).add([65, 16, 66, 18, 64, 76], function (msg) {
			// GS Part channel 13
			upThis.#seGsPartProp.run(msg, 12);
		}).add([65, 16, 66, 18, 64, 77], function (msg) {
			// GS Part channel 14
			upThis.#seGsPartProp.run(msg, 13);
		}).add([65, 16, 66, 18, 64, 78], function (msg) {
			// GS Part channel 15
			upThis.#seGsPartProp.run(msg, 14);
		}).add([65, 16, 66, 18, 64, 79], function (msg) {
			// GS Part channel 16
			upThis.#seGsPartProp.run(msg, 15);
		});
		// Yamaha XG Drum Setup SysEx
		upThis.#seXgDrumInst.add([0], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} coarse pitch bend ${msg[0] - 64}.`);
		}).add([1], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} fine pitch bend ${msg[0] - 64}.`);
		}).add([2], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} level ${msg[0]}.`);
		}).add([3], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} alt group ${msg[0]}.`);
		}).add([4], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} pan ${msg[0] - 64}.`);
		}).add([5], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} reverb send ${toDecibel(msg[0])}dB.`);
		}).add([6], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} chorus send ${toDecibel(msg[0])}dB.`);
		}).add([7], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} variation send ${toDecibel(msg[0])}dB.`);
		}).add([8], function (msg, setupNum, noteNum) {
			console.info(`XG Drum ${setupNum} note ${noteNum} key assign as ${msg[0] > 0 ? "multi" : "single"}.`);
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
		upThis.#seXgPart.add([0], function (msg, channel) {
			console.info(`XG Part reserve ${msg[0]} elements for channel ${channel}.`);
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
			console.info(`XG Part send CH${channel} to CH${msg[0]}. Channel redirect feature required!`);
		}).add([5], function (msg, channel) {
			// Mono/poly switching
			console.info(`XG Part mono/poly set to ${msg[0] ? "mono" : "poly"} for channel ${channel}.`);
		}).add([6], function (msg, channel) {
			// Same note number key on assign (what does this mean???)
			console.info(`XG Part repeat pressing set to ${["single", "multi", "inst"][msg[0]]} mode for channel ${channel}.`);
		}).add([7], function (msg, channel) {
			let data = msg[0];
			upThis.#cc[128 * channel] = data > 1 ? 127 : 0;
			console.info(`XG Part use mode "${xgPartMode[data]}" for channel ${channel}.`);
		}).add([14], function (msg, channel) {
			//console.info(`XG Part panning for channel ${channel}: ${msg[0]}.`);
			upThis.#cc[128 * channel + 10] = msg[0];
		}).add([17], function (msg, channel) {
			console.info(`XG Part dry level ${msg[0]} for channel ${channel}.`);
		}).add([18], function (msg, channel) {
			console.info(`XG Part chorus send ${toDecibel(msg[0])}dB for channel ${channel}.`);
		}).add([19], function (msg, channel) {
			console.info(`XG Part reverb send ${toDecibel(msg[0])}dB for channel ${channel}.`);
		}).add([20], function (msg, channel) {
			console.info(`XG Part variation send ${toDecibel(msg[0])}dB for channel ${channel}.`);
		}).add([21], function (msg, channel) {
			console.info(`XG Part LFO speed ${msg[0]} for channel ${channel}.`);
		}).add([29], function (msg, channel) {
			console.info(`XG Part MW bend ${msg[0] - 64} semitones for channel ${channel}.`);
		}).add([32], function (msg, channel) {
			console.info(`XG Part MW LFO pitch depth ${msg[0]} for channel ${channel}.`);
		}).add([33], function (msg, channel) {
			console.info(`XG Part MW LFO filter depth ${msg[0]} for channel ${channel}.`);
		}).add([35], function (msg, channel) {
			console.info(`XG Part bend pitch ${msg[0] - 64} semitones for channel ${channel}.`);
		}).add([83], function (msg, channel) {
			// Polyphonic aftertouch (PAT) pitch control
			//console.info(`XG Part PAT pitch ${msg[0] - 64} semitones for channel ${channel}.`);
		}).add([103], function (msg, channel) {
			// Same as cc65
			upThis.#cc[channel * 128 + 65] = msg[0];
		}).add([104], function (msg, channel) {
			// Same as cc5
			upThis.#cc[channel * 128 + 5] = msg[0];
		}).add([105], function (msg, channel) {
			console.info(`XG Part EG initial ${msg[0] - 64} for channel ${channel}.`);
		}).add([106], function (msg, channel) {
			console.info(`XG Part EG attack time ${msg[0] - 64} for channel ${channel}.`);
		});
		// Roland GS Part Setup SysEx
		upThis.#seGsPart.add([0], function (msg, channel) {
			// Same as cc00 and program change
			if (upThis.#cc[channel * 128] == 120) {
				msg[0] = 120;
			};
			upThis.#cc[channel * 128] = msg[0] || 0;
			upThis.#prg[channel] = msg[1] || 0;
		}).add([2], function (msg, channel) {
			// Channel redirect might be required
			// 3 to 18 controls whether to receive messages. Not implemented for now.
		}).add([19], function (msg, channel) {
			// Switch to mono (0) or poly (1)
		}).add([20], function (msg, channel) {
			// Switch assign mode
		}).add([21], function (msg, channel) {
			// Channel use rhythm or not
			// Only two drum kits can even be used at the same time
			console.info(`GS Part ${channel + 1} type: ${["melodic", "drum 1", "drum 2"][msg[0]]}.`);
			if (msg[0] > 0) {
				upThis.#cc[channel * 128] = 120;
			};
		}).add([25], function (msg, channel) {
			// Set volume
			upThis.#cc[channel * 128 + 7] = msg[0];
		}).add([28], function (msg, channel) {
			// Set pan
			upThis.#cc[channel * 128 + 10] = msg[0];
		}).add([33], function (msg, channel) {
			// Set chorus
			upThis.#cc[channel * 128 + 93] = msg[0];
		}).add([34], function (msg, channel) {
			// Set reverb
			upThis.#cc[channel * 128 + 91] = msg[0];
		});
		// Roland GS Part Properties
		upThis.#seGsPartProp.add([0], function(msg, channel) {
			upThis.#cc[channel * 128 + 32] = msg[0];
		}).add([1], function(msg, channel) {
			// This should be per-channel subLsb, but currently not implemented, sooooo...
			upThis.#cc[channel * 128 + 32] = msg[0];
		}).add([32], function(msg, channel) {
			console.info(`GS Part ${channel + 1} turned EQ ${msg[0] ? "on" : "off"}.`);
		}).add([33], function(msg, channel) {
			// GS output assign
		}).add([34], function(msg, channel) {
			console.info(`GS Part ${channel + 1} turned EFX ${msg[0] ? "on" : "off"}.`);
		});
	};
};

export {
	OctaviaDevice
};
