"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";

const modeIdx = [
	"?",
	"gm",
	"gs",
	"xg",
	"mt32",
	"ns5r",
	"ag10",
	"x5d",
	"05rw"
];
let modeMap = {};
modeIdx.forEach(function (e, i) {
	modeMap[e] = i;
});

let toZero = function (e, i, a) {
	a[i] = 0;
};

let OctaviaDevice = class {
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
			let place = 0;
			while (this.#poly[place] > 0) {
				place ++;
			};
			if (place < 512) {
				let rawNote = det.part * 128 + det.data[0];
				this.#poly[place] = rawNote;
				this.#velo[rawNote] = det.data[1];
			} else {
				console.error("Polyphony exceeded.");
			};
		},
		10: function (det) {
			// Note aftertouch.
			// Currently it directly changes velocity to set value.
			console.warn(det);
		},
		11: function (det) {
			// CC event, directly assign values to the register.
			console.warn(det);
		},
		12: function (det) {
			this.#chActive[det.part] = true;
			// Program change
			console.warn(det);
		},
		13: function (det) {
			// Channel aftertouch
			console.warn(det);
		},
		14: function (det) {
			// Pitch bending
			console.warn(det);
		},
		15: function (det) {
			// SysEx
			console.warn(det);
		},
		255: function (det) {
			// Meta
			console.warn(det);
		}
	};
	getActive() {
		return this.#chActive.slice();
	};
	getCc(channel) {
		// Return channel CC registers
		let start = channel * 128;
		return Array.from(this.#cc).slice(start, start + 128);
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
	init() {
		// Full reset
		this.#mode = 0;
		this.#subMsb = 0;
		this.#subLsb = 0;
		this.#chActive.forEach(toZero);
		this.#cc.forEach(toZero);
		this.#prg.forEach(toZero);
		this.#velo.forEach(toZero);
		this.#poly.forEach(toZero);
	};
	switchMode(mode, forced = false) {
		let idx = modeIdx.indexOf(mode);
		if (idx > -1) {
			if (this.#mode == 0 || forced) {
				this.#mode = idx;
			};
		} else {
			throw(new Error(`Unknown mode ${mode}`));
		};
	};
	runJson(json) {
		// Execute transformed JSON event
		this.#runChEvent[json.type].call(this, json);
	};
	runRaw(midiArr) {
		// Translate raw byte stream into JSON MIDI event
	};
};

export {
	OctaviaDevice
};
