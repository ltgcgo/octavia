"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";
import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";

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
	[0, 0, 3, 0, 0, 127, 0, 0, 0, 0]
];
const passedMeta = [0, 1, 2, 3, 4, 5, 6, 7, 81, 84, 88, 89];

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

let OctaviaDevice = class extends CustomEventSource {
	// Values
	#mode = 0;
	#chActive = new Array(64); // Whether the channel is in use
	#cc = new Uint8ClampedArray(8192); // 64 channels, 128 controllers
	#prg = new Uint8ClampedArray(64);
	#velo = new Uint8ClampedArray(8192); // 64 channels. 128 velocity registers
	#poly = new Uint16Array(512); // 512 polyphony allowed
	#pitch = new Int16Array(64); // Pitch for channels, from -8192 to 8191
	#subMsb = 0; // Allowing global bank switching
	#subLsb = 0;
	#masterVol = 100;
	// Exec Pools
	#runChEvent = {
		8: function (det) {
			// Note off, velocity should be ignored.
			let rawNote = det.part * 128 + det.data[0];
			let polyIdx = this.#poly.indexOf(rawNote);
			if (polyIdx > -1) {
				this.#poly[polyIdx] = 0;
				this.#velo[rawNote] = 0;
			};
		},
		9: function (det) {
			// Note on, but should be off if velocity is 0.
			// Set channel active
			this.#chActive[det.part] = true;
			let rawNote = det.part * 128 + det.data[0];
			if (det.data[1] > 0) {
				let place = 0;
				while (this.#poly[place] > 0) {
					place ++;
				};
				if (place < 512) {
					this.#poly[place] = rawNote;
					this.#velo[rawNote] = det.data[1];
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
			// Note aftertouch.
			// Currently it directly changes velocity to set value.
			let rawNote = det.part * 128 + det.data[0];
			let polyIdx = this.#poly.indexOf(rawNote);
			if (polyIdx > -1) {
				this.#velo[rawNote] = data[1];
			};
		},
		11: function (det) {
			// CC event, directly assign values to the register.
			this.#chActive[det.part] = true;
			this.#cc[det.part * 128 + det.data[0]] = det.data[1];
		},
		12: function (det) {
			// Program change
			this.#chActive[det.part] = true;
			this.#prg[det.part] = det.data;
		},
		13: function (det) {
			// Channel aftertouch
			let upThis = this;
			this.#poly.forEach(function (e) {
				let realCh = e >> 7;
				if (det.part == realCh) {
					this.#velo[e] = det.data;
				};
			});
			console.info(det);
		},
		14: function (det) {
			// Pitch bending
			this.#pitch[det.part] = det.data[1] * 128 + det.data[0] - 8192;
		},
		15: function (det) {
			// SysEx
			let upThis = this;
			sysExSplitter(det.data).forEach(function (seq) {
				upThis.#seMain.run(seq);
			});
		},
		255: function (det) {
			// Meta
			let useReply = passedMeta.indexOf(det.meta) > -1;
			if (useReply) {
				det.reply = "meta";
				return det;
			} else if (self.debugMode) {
				console.debug(det);
			};
		}
	};
	#seMain;
	#seXgPart;
	getActive() {
		return this.#chActive.slice();
	};
	getCc(channel) {
		// Return channel CC registers
		let start = channel * 128;
		let arr = Array.from(this.#cc).slice(start, start + 128);
		arr[0] = arr[0] || this.#subMsb;
		arr[32] = arr[32] || this.#subLsb;
		return arr;
	};
	getPitch() {
		return Array.from(this.#pitch);
	};
	getProgram() {
		return Array.from(this.#prg);
	};
	getVel(channel) {
		// Return all pressed keys with velocity in a channel
		let notes = new Map();
		let upThis = this;
		this.#poly.forEach(function (e) {
			let realCh = e >> 7,
			realNote = e & 127;
			if (channel == realCh && upThis.#velo[e] > 0) {
				notes.set(realNote, upThis.#velo[e]);
			};
		});
		return notes;
	};
	getMode() {
		return modeIdx[this.#mode];
	};
	getMaster() {
		return {
			volume: this.#masterVol
		};
	};
	init() {
		this.dispatchEvent("mode", "?");
		// Full reset
		this.#mode = 0;
		this.#subMsb = 0;
		this.#subLsb = 0;
		this.#chActive.forEach(toZero);
		this.#cc.forEach(toZero);
		this.#prg.forEach(toZero);
		this.#velo.forEach(toZero);
		this.#poly.forEach(toZero);
		this.#masterVol = 100;
		// Channel 10 to drum set
		this.#cc[1152] = 127;
		for (let ch = 0; ch < 64; ch ++) {
			// Volume and expression to full
			this.#cc[ch * 128 + 7] = 127;
			this.#cc[ch * 128 + 11] = 127;
			// Full brightness
			this.#cc[ch * 128 + 74] = 127;
			// Center panning
			this.#cc[ch * 128 + 10] = 127;
		};
	};
	switchMode(mode, forced = false) {
		let idx = modeIdx.indexOf(mode);
		if (idx > -1) {
			if (this.#mode == 0 || forced) {
				this.#mode = idx;
				this.#subMsb = substList[0][idx];
				this.#subLsb = substList[1][idx];
			};
		} else {
			throw(new Error(`Unknown mode ${mode}`));
		};
		this.dispatchEvent("mode", mode);
	};
	runJson(json) {
		// Execute transformed JSON event
		return this.#runChEvent[json.type].call(this, json);
	};
	runRaw(midiArr) {
		// Translate raw byte stream into JSON MIDI event
	};
	constructor() {
		super();
		let upThis = this;
		this.#seMain = new BinaryMatch();
		this.#seMain.default = console.debug;
		// Standard resets
		this.#seMain.add([126, 127, 9, 1], function () {
			// General MIDI reset
			upThis.switchMode("gm", true);
			console.info("MIDI reset: GM");
		}).add([126, 127, 9, 3], function () {
			// General MIDI rev. 2 reset
			upThis.switchMode("g2", true);
			console.info("MIDI reset: GM2");
		}).add([65, 16, 22, 18, 127, 1], function () {
			// MT-32 reset
			upThis.switchMode("mt32", true);
			console.info("MIDI reset: MT-32");
		}).add([65, 16, 66, 18, 64, 0, 127, 0, 65], function () {
			// Roland GS reset
			upThis.switchMode("gs", true);
			console.info("MIDI reset: GS");
		}).add([66, 48, 66, 52, 0], function (msg) {
			// KORG NS5R/NX5R System Exclusive
			// No available data for parsing yet...
			upThis.switchMode("ns5r", true);
			console.info("KORG reset:", msg);
		}).add([67, 16, 76, 0, 0, 126, 0], function (msg) {
			// Yamaha XG reset
			upThis.switchMode("xg", true);
			console.info("MIDI reset: XG");
		});
		// General MIDI SysEx
		this.#seMain.add([127, 127, 4, 1], function (msg) {
			// Master volume
			upThis.switchMode("gm");
			upThis.#masterVol = (msg[1] << 7 + msg[0]) / 163.83;
		});
	};
};

export {
	OctaviaDevice
};
