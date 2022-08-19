"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {OctaviaDevice} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "./transform.js";
import {VoiceBank} from	"./bankReader.js";
import {textedPanning, textedPitchBend} from "./texted.js";

const noteNames = [
	"C~", "C#", "D~", "Eb",
	"E~", "F~", "F#", "G~",
	"Ab", "A~", "Bb", "B~"
], noteRegion = "!0123456789",
hexMap = "0123456789ABCDEF",
map = "0123456789_aAbBcCdDeEfFgGhHiIjJ-kKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ";

const modeNames = {
	"?": "UnkwnStd",
	"gm": "GnrlMIDI",
	"g2": "GrlMIDI2",
	"xg": "YamahaXG",
	"gs": "RolandGS",
	"mt32": "RlndMT32",
	"ag10": "KorgAG10",
	"x5d": "Korg X5D",
	"05rw": "Korg05RW",
	"ns5r": "KorgNS5R"
};

// Velocity to brightness
let velToLuma = function (velo) {
	let newVel = velo * 2 + 1;
	return `${hexMap[newVel >> 4]}${hexMap[newVel & 15]}`;
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
	voices = new VoiceBank("xg", "gs", "ns5r");
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
		let metaReplies = [],
		sysExReplies = [];
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
			mode: this.#midiState.getMode()
		};
	};
	constructor() {
		super();
		this.addEventListener("meta", function (raw) {
			console.debug(raw.data);
		});
	};
};

let TuiDisplay = class extends RootDisplay {
	constructor() {
		super();
	};
	render(time) {
		let fields = new Array(24);
		let sum = super.render(time);
		let upThis = this;
		fields[0] = `${sum.eventCount.toString().padStart(3, "0")} Poly:${(sum.curPoly+sum.extraPoly).toString().padStart(3, "0")}/512`;
		fields[1] = `Mode:${modeNames[sum.mode]}`;
		fields[2] = "Ch:VoiceNme#St VE RCDB PP Pi Pan: Note";
		let line = 3;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				let voiceName = upThis.voices.get(sum.chContr[i][0], sum.chProgr[i], sum.chContr[i][32]);
				fields[line] = `${(i + 1).toString().padStart(2, "0")}:${voiceName.name.padEnd(8, " ")}${voiceName.ending}${voiceName.standard} ${map[sum.chContr[i][7] >> 1]}${map[sum.chContr[i][11] >> 1]} ${map[sum.chContr[i][91] >> 1]}${map[sum.chContr[i][93] >> 1]}${map[sum.chContr[i][94] >> 1]}${map[sum.chContr[i][74] >> 1]} ${sum.chContr[i][65] > 63 ? "O" : "X"}${map[sum.chContr[i][5] >> 1]} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(sum.chContr[i][10])}:`;
				sum.chKeyPr[i].forEach(function (e, i) {
					if (e > 0) {
						fields[line] += ` <span style="opacity:${Math.round(e / 1.27) / 100}">${noteNames[i % 12]}${noteRegion[Math.floor(i / 12)]}</span>`;
					};
				});
				line ++;
			};
		});
		return fields.join("<br/>");
	};
};

export {
	TuiDisplay
};
