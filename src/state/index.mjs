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
	[0, 0, 0, 0, 0, 127, 0, 0, 0, 0]
];
const passedMeta = [0, 3, 32, 81, 84, 88, 89];

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
	// Metadata text events
	#metaTexts = [];
	// Exec Pools
	// Meta event pool
	#metaRun = [];
	// Channel event pool
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
			this.#chActive[det.part] = 1;
			let rawNote = det.part * 128 + det.data[0];
			if (det.data[1] > 0) {
				let place = 0;
				while (this.#poly[place] > 0) {
					place ++;
				};
				if (place < 256) {
					this.#poly[place] = rawNote;
					this.#velo[rawNote] = det.data[1];
					if (this.#rawStrength[det.part] < det.data[1]) {
						this.#rawStrength[det.part] = det.data[1];
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
			this.#chActive[det.part] = 1;
			// Pre interpret
			if (det.data[0] == 0) {
				if (det.part % 16 == 9) {
					// Drum channels
					if (this.#mode == modeMap.gs) {
						det.data[1] = 120;
					};
				};
			};
			this.#cc[det.part * 128 + det.data[0]] = det.data[1];
		},
		12: function (det) {
			// Program change
			this.#chActive[det.part] = 1;
			this.#prg[det.part] = det.data;
			this.#customName[det.part] = 0;
		},
		13: function (det) {
			// Channel aftertouch
			let upThis = this;
			this.#poly.forEach(function (e) {
				let realCh = e >> 7;
				if (det.part == realCh) {
					upThis.#velo[e] = det.data;
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
			(this.#metaRun[det.meta] || console.debug).call(this, det.data);
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
	// XG Part SysEx pool
	#seXgPart;
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
		this.#seMain = new BinaryMatch();
		this.#seXgPart = new BinaryMatch();
		this.#seMtSysEx = new BinaryMatch();
		this.#seMain.default = console.debug;
		// Metadata events
		this.#metaRun[1] = function (data) {
			this.#metaTexts.unshift(data);
		};
		this.#metaRun[2] = function (data) {
			this.#metaTexts.unshift(`Copyrite: ${data}`);
		};
		this.#metaRun[3] = function (data) {
			this.#metaTexts.unshift(`Trk.Info: ${data}`);
		};
		this.#metaRun[4] = function (data) {
			this.#metaTexts.unshift(`${showTrue(this.#metaChannel, "", " ")}Instrmnt: ${data}`);
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
		this.#seMain.add([65, 16, 69, 18, 16, 1, 0], function (msg) {
			// GS Frame Draw
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
		});
	};
};

export {
	OctaviaDevice
};
