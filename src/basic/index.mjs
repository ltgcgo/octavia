"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {OctaviaDevice} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "./transform.js";
import {VoiceBank} from	"./bankReader.js";

let toZero = function (e, i, a) {
	a[i] = 0;
};

MidiParser.customInterpreter = function (type, file, rawMtLen) {
	let u8Data = [];
	let metaLength = rawMtLen == false ? file.readIntVLV() : rawMtLen;
	if (type == 127) {
		metaLength = 1;
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
			file.backOne();
			file.backOne();
			return u8Data;
		};
	};
	return u8Data;
};

let RootDisplay = class extends CustomEventSource {
	#midiState = new OctaviaDevice();
	#midiPool;
	#titleName = "";
	voices = new VoiceBank("xg", "gs", "ns5r");
	#metaRun = [];
	#mimicStrength = new Uint8ClampedArray(64);
	// Used to provide tempo, tSig and bar information
	#noteBInt = 0.5;
	#noteTempo = 120;
	#noteNomin = 4;
	#noteDenom = 4;
	#noteBarOffset = 0;
	#noteTime = 0;
	reset() {
		// Dispatching the event
		this.dispatchEvent("reset");
		// Clearing all MIDI instructions up
		this.#midiPool?.resetIndex();
		// And set all controllers to blank
		this.#midiState.init();
		// Clear titleName
		this.#titleName = "";
		// Timing info reset;
		this.#noteBInt = 0.5;
		this.#noteTempo = 120;
		this.#noteNomin = 4;
		this.#noteDenom = 4;
		this.#noteBarOffset = 0;
		this.#noteTime = 0;
	};
	async loadFile(blob) {
		this.#midiPool = rawToPool(MidiParser.parse(new Uint8Array(await blob.arrayBuffer())));
	};
	switchMode(modeName, forced = false) {
		this.#midiState.switchMode(modeName, forced);
	};
	getMode() {
		return this.#midiState.mode;
	};
	get noteProgress() {
		return this.#noteTime / this.#noteBInt;
	};
	get noteOverall() {
		return this.noteProgress - this.#noteBarOffset;
	};
	get noteBar() {
		return Math.floor(this.noteOverall / this.#noteNomin);
	};
	get noteBeat() {
		return this.noteOverall % this.#noteNomin;
	};
	getTimeSig() {
		return [this.#noteNomin, this.#noteDenom];
	};
	getTempo() {
		return this.#noteTempo;
	};
	render(time) {
		if (time > this.#noteTime) {
			this.#noteTime = time;
		};
		let events = this.#midiPool.step(time);
		let extraPoly = 0, notes = new Set();
		let upThis = this;
		let metaReplies = [];
		events.forEach(function (e) {
			let raw = e.data;
			if (raw.type == 9) {
				if (raw.data[1] > 0) {
					notes.add(raw.part * 128 + raw.data[0]);
				} else {
					if (notes.has(raw.part * 128 + raw.data[0])) {
						extraPoly ++;
					};
				};
			};
			if (e.data.type == 8) {
				if (notes.has(raw.part * 128 + raw.data[0])) {
					extraPoly ++;
				};
			};
			let reply = upThis.#midiState.runJson(raw);
			switch (reply?.reply) {
				case "meta": {
					metaReplies.push(reply);
					break;
				};
			};
			if (reply?.reply) {
				delete reply.reply;
			};
		});
		if (metaReplies?.length > 0) {
			this.dispatchEvent("meta", metaReplies);
		};
		// Mimic strength variation
		this.#midiState.getStrength().forEach(function (e, i) {
			let diff = e - upThis.#mimicStrength[i];
			upThis.#mimicStrength[i] += Math.ceil(diff - (diff / 2));
		});
		// Pass params to actual displays
		let chInUse = this.#midiState.getActive(); // Active channels
		let chKeyPr = []; // Pressed keys and their pressure
		let chPitch = upThis.#midiState.getPitch(); // All pitch bends
		let chContr = []; // All CC values
		let chProgr = upThis.#midiState.getProgram();
		let curPoly = 0;
		chInUse.forEach(function (e, i) {
			if (e) {
				chKeyPr[i] = upThis.#midiState.getVel(i);
				chContr[i] = upThis.#midiState.getCc(i);
				curPoly += chKeyPr[i].size;
			};
		});
		return {
			extraPoly,
			curPoly,
			chInUse,
			chKeyPr,
			chPitch,
			chProgr,
			chContr,
			eventCount: events.length,
			title: this.#titleName,
			bitmap: this.#midiState.getBitmap(),
			letter: this.#midiState.getLetter(),
			names: this.#midiState.getCustomNames(),
			texts: this.#midiState.getTexts(),
			master: this.#midiState.getMaster(),
			mode: this.#midiState.getMode(),
			strength: this.#mimicStrength.slice(),
			tSig: this.getTimeSig(),
			tempo: this.getTempo(),
			noteBar: this.noteBar,
			noteBeat: Math.floor(this.noteBeat)
		};
	};
	constructor() {
		super();
		let upThis = this;
		this.addEventListener("meta", function (raw) {
			raw?.data?.forEach(function (e) {
				(upThis.#metaRun[e.meta] || console.debug).call(upThis, e.meta, e.data);
			});
		});
		this.#midiState.addEventListener("mode", function (ev) {
			upThis.dispatchEvent("mode", ev.data);
		});
		this.#metaRun[3] = function (type, data) {
			if (upThis.#titleName?.length < 1) {
				upThis.#titleName = data;
			};
		};
		this.#metaRun[81] = function (type, data) {
			let noteProgress = upThis.noteProgress;
			// Change tempo
			let lastBInt = upThis.#noteBInt || 0.5;
			upThis.#noteTempo = 60000000 / data;
			upThis.#noteBInt = data / 1000000;
			upThis.#noteBarOffset += noteProgress * (lastBInt / upThis.#noteBInt) - noteProgress;
		};
		this.#metaRun[88] = function (type, data) {
			let noteProgress = upThis.noteProgress;
			let noteOverall = upThis.noteOverall;
			let curBar = upThis.noteBar;
			let curBeat = upThis.noteBeat;
			// Change time signature
			let oldNomin = upThis.#noteNomin;
			let oldDemon = upThis.#noteDenom;
			upThis.#noteNomin = data[0];
			upThis.#noteDenom = 1 << data[1];
			let metroClick = 24 * (32 / data[3]) / data[2];
			if (oldNomin != upThis.#noteNomin) {
				if (curBeat < 1) {
					if (oldNomin < upThis.#noteNomin) {
						upThis.#noteBarOffset += noteProgress - curBeat - curBar * upThis.#noteNomin;
					} else {
						upThis.#noteBarOffset += noteOverall * upThis.#noteNomin / oldNomin;
						console.warn(`Fuck me! Any trick to make tSig shrinking WORK in any condition!`);
					};
				} else {
					upThis.#noteBarOffset += noteProgress - upThis.#noteNomin * (curBar + 1);
				};
				console.info(`${upThis.#noteNomin}/${upThis.#noteDenom}`);
			};
		};
	};
};

export {
	RootDisplay
};
