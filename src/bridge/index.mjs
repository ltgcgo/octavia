// Middleware!
"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "../basic/transform.js";

MidiParser.customInterpreter = function (type, file, rawMtLen) {
	let u8Data = [];
	let metaLength = rawMtLen == false ? file.readIntVLV() : rawMtLen;
	if (type == 0 || type == 127) {
		//metaLength = 1;
	};
	for (let c = 0; c < metaLength; c ++) {
		let byte = file.readInt(1);
		u8Data.push(byte);
		if (byte == 247) {
			// End of SysEx
		} else if (byte == 240) {
			// Start of a new SysEx
		} else if (byte > 127) {
			// Start of a new event
			console.debug(`Early termination: ${u8Data}`);
			u8Data.pop();
			file.backOne();
			file.backOne();
			return u8Data;
		};
	};
	//console.debug(`Constructed data: `, u8Data);
	return u8Data;
};

// Use track 240 to 255 for middleware.
let toJson = function (data, track = 0) {
	let type = data[0] >> 4, part = data[0] & 15;
	let replyObj = {
		track: (track & 15) + 240,
		type,
		data: data.slice(1)
	};
	if (type < 15) {
		replyObj.part = part;
		return replyObj;
	} if (type == 12) {
		replyObj.data = data[1];
	} else {
		if (part == 0) {
			// SysEx
			return replyObj;
		} else {
			console.warn(`Unknown special event channel ${part}.`)
		};
	};
};
let fromJson = function (json) {
	let type = json.type, part = json.part;
	if (type == 255) {
		// Directly reject sending meta events
		return;
	};
	let binLength = 3;
	if (type == 12) {
		binLength = 2;
	} else if (type == 15) {
		binLength = json.data.length + 1;
	};
	let newInstr = new Uint8Array(binLength);
	if (type != 15) {
		newInstr[0] = json.type * 16 + json.part;
	} else {
		newInstr[0] = 240;
	};
	if (type == 12) {
		newInstr[1] = json.data;
	} else {
		if (json.data.forEach) {
			json.data.forEach((e, i) => {
				newInstr[i + 1] = e;
			});
		} else {
			console.debug(`Type ${type} value ${json.data.constructor.name} cannot be iterated.`);
		};
	};
	return newInstr;
};

let getBridge = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainInput");
};
let getBridgeOut = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainOutput");
};

let SimpleMidiEventEmitter = class extends CustomEventSource {
	#pool;
	#paused = true;
	#currentTime = 0;
	#lastEventTs = 0;
	#threadId = -1;
	get currentTime() {
		return this.#currentTime / 1000;
	};
	get duration() {
		if (!this.#pool) {
			return 0;
		} else {
			return this.#pool[this.#pool.length - 1].end + 4;
		};
	};
	async load(blob) {
		if (blob) {
			this.#pool = rawToPool(MidiParser.parse(new Uint8Array(await blob.arrayBuffer())));
		} else {
			this.pause();
			this.#currentTime = 0;
		};
	};
	pause() {
		if (this.#threadId > -1) {
			clearInterval(this.#threadId);
			// All notes off
			for (let part = 0; part < 16; part ++) {
				this.dispatchEvent("midi", {
					delay: 0,
					data: {part, "type": 11, "data": [123, 0]}
				});
			};
			this.dispatchEvent("pause");
			this.#threadId = -1;
		};
	};
	async play() {
		if (this.#threadId < 0) {
			this.#lastEventTs = Date.now();
			this.#threadId = setInterval(() => {
				let timeNow = Date.now(),
				timeLast = this.#currentTime,
				timeDiff = timeNow - this.#lastEventTs;
				this.#currentTime += timeDiff;
				let events = this.#pool.step(this.currentTime);
				events?.forEach((e) => {
					this.dispatchEvent("midi", {
						delay: Math.round(e.start * 1000 - timeLast),
						data: e.data
					});
				});
				this.#lastEventTs = timeNow;
			}, 12.5);
			this.dispatchEvent("play");
		};
	};
	constructor(pool) {
		super();
		if (pool) {
			this.load(pool);
		};
	};
};

export {
	toJson,
	fromJson,
	getBridge,
	getBridgeOut,
	SimpleMidiEventEmitter
};
