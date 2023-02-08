"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {OctaviaDevice, ccToPos} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "./transform.js";
import {customInterpreter} from "../state/utils.js";

MidiParser.customInterpreter = customInterpreter;

let RootDisplay = class extends CustomEventSource {
	#midiState = new OctaviaDevice();
	#midiPool;
	#titleName = "";
	#metaRun = [];
	#mimicStrength = new Uint8ClampedArray(64);
	// Used to provide tempo, tSig and bar information
	#noteBInt = 0.5;
	#noteTempo = 120;
	#noteNomin = 4;
	#noteDenom = 4;
	#noteBarOffset = 0;
	#noteTime = 0;
	smoothingAtk = 0;
	smoothingDcy = 0;
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
		return this.#midiState.getMode();
	};
	getVoice() {
		return this.#midiState.getVoice(...arguments);
	};
	getChVoice(ch) {
		return this.#midiState.getChVoice(ch);
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
		let beat = this.noteOverall % this.#noteNomin;
		if (beat < 0) {
			beat += this.#noteNomin;
		};
		return beat;
	};
	get device() {
		return this.#midiState;
	};
	getTimeSig() {
		return [this.#noteNomin, this.#noteDenom];
	};
	getTempo() {
		return this.#noteTempo;
	};
	sendCmd(raw) {
		this.#midiState.runJson(raw);
	};
	render(time) {
		if (time > this.#noteTime) {
			this.#noteTime = time;
		};
		let events = this.#midiPool?.step(time) || [];
		let extraPoly = 0, notes = new Set();
		let upThis = this;
		let metaReplies = [];
		// Reset strength for a new frame
		upThis.#midiState.newStrength();
		events.forEach(function (e) {
			let raw = e.data;
			if (raw.type == 9) {
				if (raw.data[1] > 0) {
					notes.add(raw.part * 128 + raw.data[0]);
					/*if (writeStrength[raw.part] == 0) {
						upThis.#mimicStrength[raw.part] = raw.data[1];
					};*/
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
		// Pass params to actual displays
		let chInUse = this.#midiState.getActive(); // Active channels
		let chKeyPr = []; // Pressed keys and their pressure
		let chPitch = upThis.#midiState.getPitch(); // All pitch bends
		let chContr = upThis.#midiState.getCcAll(); // All CC values
		let chProgr = upThis.#midiState.getProgram();
		// Mimic strength variation
		let writeStrength = this.#midiState.getStrength();
		writeStrength.forEach(function (e, i) {
			let diff = e - upThis.#mimicStrength[i];
			let chOff = ccToPos.length * i;
			if (diff >= 0) {
				// cc73 = 0, atkPower = 4
				// cc73 = 127, atkPower = 0.25
				let atkPower = 4 * (0.25 ** (chContr[chOff + ccToPos[73]] / 64));
				upThis.#mimicStrength[i] += Math.ceil(diff - (diff * (upThis.smoothingAtk ** atkPower)));
			} else {
				let rlsPower = 4 * (0.25 ** (chContr[chOff + ccToPos[72]] / 64));
				upThis.#mimicStrength[i] += Math.ceil(diff - (diff * (upThis.smoothingDcy ** rlsPower)));
			};
		});
		let curPoly = 0;
		chInUse.forEach(function (e, i) {
			if (e) {
				chKeyPr[i] = upThis.#midiState.getVel(i);
				curPoly += chKeyPr[i].size;
			};
		});
		let repObj = {
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
			texts: this.#midiState.getTexts(),
			master: this.#midiState.getMaster(),
			mode: this.#midiState.getMode(),
			strength: this.#mimicStrength.slice(),
			velo: writeStrength,
			rpn: this.#midiState.getRpn(),
			tSig: this.getTimeSig(),
			tempo: this.getTempo(),
			noteBar: this.noteBar,
			noteBeat: this.noteBeat
		};
		return repObj;
	};
	constructor(atk = 0.5, dcy = 0.5) {
		super();
		let upThis = this;
		this.smoothingAtk = atk;
		this.smoothingDcy = dcy;
		this.addEventListener("meta", function (raw) {
			raw?.data?.forEach(function (e) {
				(upThis.#metaRun[e.meta] || console.debug).call(upThis, e.meta, e.data);
			});
		});
		this.#midiState.addEventListener("mode", function (ev) {
			upThis.dispatchEvent("mode", ev.data);
		});
		this.#midiState.addEventListener("channelactive", function (ev) {
			upThis.dispatchEvent("channelactive", ev.data);
		});
		this.#midiState.addEventListener("channelmin", function (ev) {
			upThis.dispatchEvent("channelmin", ev.data);
		});
		this.#midiState.addEventListener("channelmax", function (ev) {
			upThis.dispatchEvent("channelmax", ev.data);
		});
		this.#midiState.addEventListener("channelreset", function (ev) {
			upThis.dispatchEvent("channelreset");
		});
		this.#midiState.addEventListener("screen", function (ev) {
			upThis.dispatchEvent("screen", ev.data);
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
			let oldDenom = upThis.#noteDenom;
			upThis.#noteNomin = data[0];
			upThis.#noteDenom = 1 << data[1];
			let metroClick = 24 * (32 / data[3]) / data[2];
			if (oldNomin != upThis.#noteNomin) {
				let targetBar = curBar;
				upThis.#noteBarOffset -= targetBar * (upThis.#noteNomin - oldNomin);
				if (curBeat + 1 >= oldNomin) {
					if (oldNomin < upThis.#noteNomin) {
						// For example, 4/4 > 6/4
						upThis.#noteBarOffset -= Math.ceil(upThis.#noteNomin - curBeat - 1);
					} else {
						// For example, 6/4 > 4/4
						upThis.#noteBarOffset += upThis.#noteNomin;
					};
				};
			};
		};
	};
};

export {
	RootDisplay,
	ccToPos
};
