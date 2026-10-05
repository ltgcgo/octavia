// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	IntegerHandler
} from "../../../libs/seamstress@ltgcgo/index.mjs";
import MICCInternalsFinalisers from "../../micc/classes/finalisers.mjs";
import {
	MICCConstants,
	MICCInternalsSMF,
	MIDINakedEvent
} from "../../micc/index.mjs";

import {
	ColxiMIDIView,
	ColxiMIDIEvent
} from "./classes.mjs";

export default class ColxiMethods {
	/** @param {typeof import("../index.d.mts").ColxiMIDIParserBase} upThis
	* @param {MIDINakedEvent} miccEvent */
	static handleExtended(upThis, miccEvent) {
		switch (miccEvent.type) {
			case MICCConstants.MIDI_SYSEX_NEW:
			case MICCConstants.MIDI_SYSEX_RESUME: {
				if (upThis.extended) return miccEvent.data;
				break;
			};
			case MICCConstants.MIDI_META: {
				if (
					upThis.extended &&
					typeof miccEvent.parsed?.text === "string"
				) return miccEvent.parsed.text;
				break;
			};
			default: {
				throw(new TypeError(`Unknown MICC event type ${miccEvent.type}.`));
			};
		};
		const result = typeof upThis.customInterpreter === "function" ? upThis.customInterpreter.call(upThis) : upThis.customInterpreter;
		switch (result) {
			// Passthrough. (MICC)
			case true: {
				return miccEvent.data;
				break;
			};
			// Read as number.
			case false:
			case null:
			case undefined: {
				let safeView = miccEvent.data;
				if (safeView.length > 4) {
					safeView = safeView.subarray(
						safeView.length - 4,
						safeView.length
					);
				};
				let value = safeView[0];
				for (let i = 1; i < safeView.length; i ++) {
					value = (value << 8) | safeView[i];
				};
				return value;
			};
			default: {
				return result;
			};
		};
	};
	/** @param {MIDINakedEvent} miccEvent
	* @param {typeof import("../index.d.mts").ColxiMIDIParserBase} upThis
	* @returns {ColxiMIDIEvent} */
	static fromNakedEvent(upThis, miccEvent) {
		const colxiEvent = new ColxiMIDIEvent(miccEvent.delta);
		switch (miccEvent.type) {
			case MICCConstants.MIDI_PROGRAM:
			case MICCConstants.MIDI_CH_AT: {
				colxiEvent.type = miccEvent.type;
				colxiEvent.channel = miccEvent.ch;
				colxiEvent.data = miccEvent.data[0];
				break;
			};
			case MICCConstants.MIDI_NOTE_OFF:
			case MICCConstants.MIDI_NOTE_ON:
			case MICCConstants.MIDI_NOTE_AT:
			case MICCConstants.MIDI_CONTROL:
			case MICCConstants.MIDI_CH_PITCH: {
				colxiEvent.type = miccEvent.type;
				colxiEvent.channel = miccEvent.ch;
				colxiEvent.data = miccEvent.data;
				break;
			};
			case MICCConstants.MIDI_SYSEX_RESUME: // Don't blame me!
			case MICCConstants.MIDI_SYSEX_NEW: {
				colxiEvent.type = 15;
				colxiEvent.data = this.handleExtended(upThis, miccEvent);
				break;
			};
			case MICCConstants.MIDI_META: {
				colxiEvent.type = 255;
				colxiEvent.metaType = miccEvent.meta;
				MICCInternalsFinalisers.smfMetaFilter(upThis, miccEvent, true);
				switch (miccEvent.meta) {
					// Strings.
					case MICCConstants.META_VOICE_NAME:
					case MICCConstants.META_DEVICE_NAME: {
						if (!upThis.extended) {
							upThis.debug ?? console.debug(`Fallback handling for meta event ${miccEvent.meta}: not supported in the original implementation.`);
							break;
						};
						// Fallthrough!
					};
					case MICCConstants.META_TEXT:
					case MICCConstants.META_COPYRIGHT:
					case MICCConstants.META_TITLE:
					case MICCConstants.META_INSTRUMENT:
					case MICCConstants.META_LYRICS:
					case MICCConstants.META_MARKER:
					case MICCConstants.META_CUE_POINT: {
						colxiEvent.data = miccEvent.parsed?.text ?? "MICC failure: no text data present.";
						break;
					};
					// `uint8`.
					case MICCConstants.META_TRACK_CH: {
						// Even if this doesn't exist in the original implementation, it's still being handled as a `uint8` value anyway.
						/*if (!upThis.extended) {
							upThis.debug ?? console.debug(`Fallback handling for meta event ${miccEvent.meta}: not supported in the original implementation.`);
							break;
						};*/
						// Fallthrough!
					};
					case MICCConstants.META_TRACK_PORT: {
						colxiEvent.data = miccEvent.data[0];
						break;
					};
					// `uint16`.
					case MICCConstants.META_SET_KEY_SIG: {
						colxiEvent.data = IntegerHandler.readUint16(miccEvent.data);
						break;
					};
					// `uint24`.
					case MICCConstants.META_SET_TEMPO: {
						colxiEvent.data = IntegerHandler.readUint24(miccEvent.data);
						break;
					};
					// Nothing.
					case MICCConstants.META_TRACK_END: {
						colxiEvent.data = null;
						break;
					};
					// Passthrough.
					case MICCConstants.META_SET_SMPTE_OFFSET:
					case MICCConstants.META_SET_TIME_SIG: {
						colxiEvent.data = miccEvent.data;
						break;
					};
				};
				if (colxiEvent.data !== undefined) break;
				colxiEvent.data = this.handleExtended(upThis, miccEvent);
				break;
			};
			default: {
				upThis.debug ?? console.debug(`Skipped unknown event ${miccEvent.type}.`);
			};
		};
		return colxiEvent;
	};
	/** @param {Uint8Array} buffer
	* @returns {Generator<MIDINakedEvent, void, any>} */
	static *parseEventBulk(buffer) {
		/** @type {import("../../micc/index.mjs").MICCSMFMIAHandleOptions} */
		const parserConfig = {
			"hasDelta": true,
			"isSmfWrapped": true,
			"parserContext": {}
		};
		let ptr = 0;
		while (ptr < buffer.length) {
			const parsedEvent = MICCInternalsSMF.parseSingleEvent(buffer.subarray(ptr), parserConfig);
			yield parsedEvent;
			if (parsedEvent.byteSize > 0) {
				ptr += parsedEvent.byteSize;
			} else {
				throw(new RangeError(`Encountered a MIDI event with invalid size: ${parsedEvent.byteSize}.`));
			};
		};
	};
};