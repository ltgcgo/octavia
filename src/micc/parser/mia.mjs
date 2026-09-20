"use strict";

import {
	IntegerHandler,
	SeamstressChunk
} from "../../../libs/seamstress@ltgcgo/seamstress/index.mjs";
import {
	MIDINakedEvent
} from "../classes/event.mjs";
import MICCConstants from "../classes/constants.mjs";

const mapMiaCommandTypes = new Map();
const mapMiaCommandNames = new Map();
const mapMiaDisassembleTypes = new Uint8Array(128);
{
	mapMiaCommandTypes.set(MICCConstants.MIDI_NOTE_OFF, ["of", "off"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_NOTE_ON, ["on", "on"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_NOTE_AT, ["na", "nat"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_CONTROL, ["cc", "cc"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_PROGRAM, ["pc", "pc"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_CH_AT, ["ca", "cat"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_CH_PITCH, ["pb", "pb"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_SYSEX_NEW, ["se", "syx"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_SYSEX_RESUME, ["sc", "sc"]);
	mapMiaCommandTypes.set(MICCConstants.MIDI_META, ["mt", "meta"]);
	for (const [type, names] of mapMiaCommandTypes) {
		for (const name of names) {
			mapMiaCommandNames.set(name, type);
		};
	};
	mapMiaDisassembleTypes[1] = 15;
	mapMiaDisassembleTypes[2] = 15;
	mapMiaDisassembleTypes[3] = 15;
	mapMiaDisassembleTypes[4] = 15;
	mapMiaDisassembleTypes[5] = 15;
	mapMiaDisassembleTypes[6] = 15;
	mapMiaDisassembleTypes[7] = 15;
	mapMiaDisassembleTypes[8] = 15;
	mapMiaDisassembleTypes[9] = 15;
};

/** MIDI Instruction Assembly */
export default class MICCInternalsMIA {
	/** @param {MIDINakedEvent} event
	* @param {import("../index.mjs").MICCSMFMIAHandleOptions} options
	* @returns {string} */
	static emitSingleEvent(event, options = {}) {
		if (event.constructor !== MIDINakedEvent && event.group !== "mma.midiEvent") {
			throw(new TypeError(`Provided event is not of type MIDINakedEvent.`));
		};
		options.parserContext = options.parserContext ?? {};
		let miaText = "";
		if (options.hasDelta) {
			miaText += `${event.delta.toString().padStart(6, " ")} `;
		};
		if (!mapMiaCommandTypes.has(event.type)) {
			throw(new TypeError(`Event type ${event.type} is not supported.`));
		};
		miaText += `${mapMiaCommandTypes.get(event.type)[options.preferReadable ? 1 : 0]}`;
		switch (event.type) {
			case MICCConstants.MIDI_NOTE_OFF:
			case MICCConstants.MIDI_NOTE_ON:
			case MICCConstants.MIDI_NOTE_AT:
			case MICCConstants.MIDI_CONTROL:
			case MICCConstants.MIDI_PROGRAM:
			case MICCConstants.MIDI_CH_AT:
			case MICCConstants.MIDI_CH_PITCH: {
				if (event.ch >= 16) {
					throw(new RangeError(`Invalid MIDI channel: ${event.ch} > 15.`));
				};
				miaText += ` ${options.preferReadable ? `${event.ch}`.padStart(2, "0") : event.ch.toString(16).toLowerCase()}`;
				if (event.isStale) {
					miaText += "*";
				};
				break;
			};
			case MICCConstants.MIDI_SYSEX_NEW:
			case MICCConstants.MIDI_SYSEX_RESUME: {
				// No-op
				break;
			};
			case MICCConstants.MIDI_META: {
				miaText += ` ${event.meta.toString(16).toUpperCase().padStart(2, "0")}`;
				break;
			};
		};
		switch (event.type) {
			case MICCConstants.MIDI_NOTE_OFF:
			case MICCConstants.MIDI_NOTE_ON:
			case MICCConstants.MIDI_NOTE_AT:
			case MICCConstants.MIDI_CONTROL:
			case MICCConstants.MIDI_PROGRAM:
			case MICCConstants.MIDI_CH_AT: {
				for (const byte of event.data) {
					miaText += " " + `${byte}`.padStart(3, "0");
				};
				break;
			};
			case MICCConstants.MIDI_CH_PITCH: {
				const pitchRaw = (event.data[0] & 127) | ((event.data[1] & 127) << 7);
				miaText += " " + `${pitchRaw - 8192}`;
				break;
			};
			case MICCConstants.MIDI_SYSEX_NEW:
			case MICCConstants.MIDI_SYSEX_RESUME: {
				for (const byte of event.data) {
					miaText += ` ${byte.toString(16).toUpperCase().padStart(2, "0")}`;
				};
				break;
			};
			case MICCConstants.MIDI_META: {
				let useTextDecode = false;
				if (mapMiaDisassembleTypes[event.meta] === 15) {
					useTextDecode = options.preferReadable ? true : false;
				};
				for (const byte of event.data) {
					miaText += ` ${byte.toString(16).toUpperCase().padStart(2, "0")}`;
				};
				break;
			};
			default: {
				throw(new Error(`Unknown handling of data section.`));
			};
		};
		return miaText;
	};
};
