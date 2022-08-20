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
map = "0123456789_aAbBcCdDeEfFgGhHiIjJ-kKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
waveMap = ["-", "~", "+", "|"];

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
	reset() {
		// Dispatching the event
		this.dispatchEvent("reset");
		// Clearing all MIDI instructions up
		this.#midiPool?.resetIndex();
		// And set all controllers to blank
		this.#midiState.init();
		// Clear titleName
		this.#titleName = "";
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
			mode: this.#midiState.getMode()
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
	};
};

let TuiDisplay = class extends RootDisplay {
	#chMaxPress = new Array(64);
	constructor() {
		super();
		for (let a = 0; a < this.#chMaxPress.length; a ++) {
			this.#chMaxPress[a] = 0;
			console.info("a");
		};
	};
	render(time, ctx) {
		let fields = new Array(24);
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		fields[0] = `${sum.eventCount.toString().padStart(3, "0")} Poly:${(sum.curPoly+sum.extraPoly).toString().padStart(3, "0")}/512 Vol:${Math.floor(sum.master.volume)}.${Math.round(sum.master.volume % 1 * 100).toString().padStart(2, "0")}%`;
		fields[1] = `Mode:${modeNames[sum.mode]} Title:${sum.title || "N/A"}`;
		fields[2] = "Ch:VoiceNme#St VEM RCDB PP PiBd Pan : Note";
		let line = 3;
		// Decrease strength of max press
		this.#chMaxPress.forEach(function (e, i, a) {
			a[i] = e >> 1;
		});
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				let voiceName = upThis.voices.get(sum.chContr[i][0], sum.chProgr[i], sum.chContr[i][32]);
				if (sum.names[i]) {
					voiceName.name = sum.names[i];
					voiceName.ending = "~";
				};
				fields[line] = `${(i + 1).toString().padStart(2, "0")}:${voiceName.name.slice(0, 8).padEnd(8, " ")}${voiceName.ending}${voiceName.standard} ${map[sum.chContr[i][7] >> 1]}${map[sum.chContr[i][11] >> 1]}${waveMap[sum.chContr[i][1] >> 5]} ${map[sum.chContr[i][91] >> 1]}${map[sum.chContr[i][93] >> 1]}${map[sum.chContr[i][94] >> 1]}${map[sum.chContr[i][74] >> 1]} ${sum.chContr[i][65] > 63 ? "O" : "X"}${map[sum.chContr[i][5] >> 1]} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(sum.chContr[i][10])}:`;
				sum.chKeyPr[i].forEach(function (e1, i1) {
					if (e1 > 0) {
						let targetPressure = Math.max(upThis.#chMaxPress[i], e1);
						upThis.#chMaxPress[i] = (targetPressure - upThis.#chMaxPress[i]) > 32 ? upThis.#chMaxPress[i] + 48 : targetPressure;
						fields[line] += ` <span style="opacity:${Math.round(e1 / 1.27) / 100}">${noteNames[i1 % 12]}${noteRegion[Math.floor(i1 / 12)]}</span>`;
					};
				});
				line ++;
			};
		});
		if (sum.texts.length > 0) {
			let metaLine = 0;
			for (let st = fields.length - 1; st >= line; st --) {
				fields[st] = (sum.texts[metaLine] || "").padEnd(100, " ");
				metaLine ++;
			};
		};
		if (timeNow <= sum.letter.expire) {
			let letterDisp = sum.letter.text.padEnd(32, " ");
			let startLn = fields.length - 2;
			for (let st = 0; st < 2; st ++) {
				fields[st + startLn] = `${(fields[st + startLn] || "").slice(0, 82).padEnd(81)} <span class="letter"> ${letterDisp.slice(st * 16, st * 16 + 16).padEnd(" ", 16)} </span>`;
			};
		};
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		if (ctx) {
			ctx.fillStyle = "#202020";
			let renderer;
			if (timeNow <= sum.bitmap.expire) {
				renderer = sum.bitmap.bitmap;
			} else {
				renderer = new Array(256);
				upThis.#chMaxPress.forEach(function (e, i) {
					if (i < 16 && sum.chContr[i]?.length > 0) {
						let strength = Math.floor(e * sum.chContr[i][7] * sum.chContr[i][11] / 129032);
						for (let dot = 0; dot <= strength; dot ++) {
							renderer[i + (15 - dot) * 16] = 1;
						};
					};
				});
			};
			renderer.forEach(function (e, i) {
				if (e) {
					ctx.fillRect((i % 16) * 12, Math.floor(i / 16) * 6, 11, 5);
				};
			});
		};
		return fields.join("<br/>");
	};
};

export {
	TuiDisplay
};
