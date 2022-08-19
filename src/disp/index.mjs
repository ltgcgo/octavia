"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {OctaviaDevice} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "./transform.js";

const noteNames = [
	"C~", "C#", "D~", "Eb",
	"E~", "F~", "F#", "G~",
	"Ab", "A~", "Bb", "B~"
], noteRegion = "!0123456789";

//
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
			return u8Data;
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
	reset() {
		// Dispatching the event
		this.dispatchEvent("reset");
		// Clearing all MIDI instructions up
		this.#midiPool?.resetIndex();
		// And set all controllers to blank
		this.#midiState.init();
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
	render(time) {
		let events = this.#midiPool.step(time);
		let extraPoly = 0, notes = new Set();
		let upThis = this;
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
			upThis.#midiState.runJson(raw);
		});
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
			mode: this.getMode()
		};
	};
};

let TuiDisplay = class extends RootDisplay {
	constructor() {
		super();
	};
	render(time) {
		let fields = new Array(30);
		let sum = super.render(time);
		fields[0] = `Poly: ${(sum.curPoly+sum.extraPoly).toString().padStart(3, "0")}/512`;
		fields[2] = "Ch:Prg Note";
		let line = 3;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				fields[line] = `${(i + 1).toString().padStart(2, "0")}:${sum.chProgr[i].toString().padStart(3, "0")}`;
				sum.chKeyPr[i].forEach(function (e, i) {
					if (e > 0) {
						fields[line] += ` ${noteNames[i % 12]}${noteRegion[Math.floor(i / 12)]}`;
					};
				});
				line ++;
			};
		});
		// Limit to 100*30
		fields.forEach(function (e, i, a) {
			if (e.length > 100) {
				a[i] = e.slice(0, 100);
			};
		});
		return fields.join("\n");
	};
};

export {
	TuiDisplay
};
