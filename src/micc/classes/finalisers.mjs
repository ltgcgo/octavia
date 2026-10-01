// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	IntegerHandler
} from "../../../libs/seamstress@ltgcgo/seamstress/index.mjs";
import {
	MICCInternalsTempo
} from "./conversions.mjs";
import MICCConstants from "./constants.mjs";
import {
	MIDINakedEvent,
	MIDIUMPEvent
} from "./event.mjs";

export default class MICCInternalsFinalisers {
	/** @param {MIDINakedEvent|MIDIUMPEvent} event
	* @returns {void} */
	static smfMetaFilter(event, parseExtended = false) {
		if (event.type !== MICCConstants.MIDI_META) return;
		const noParseExtended = !parseExtended;
		switch (event.meta) {
			case MICCConstants.META_SEQ_NUMBER: {
				console.debug(`Unknown data schema for meta type ${event.meta}.`);
				break;
			};
			case MICCConstants.META_TEXT:
			case MICCConstants.META_COPYRIGHT:
			case MICCConstants.META_TITLE:
			case MICCConstants.META_INSTRUMENT:
			case MICCConstants.META_LYRICS:
			case MICCConstants.META_MARKER:
			case MICCConstants.META_CUE_POINT:
			case MICCConstants.META_VOICE_NAME:
			case MICCConstants.META_DEVICE_NAME: {
				// Strings!
				/** @type {BinaryString} */
				const parsed = new BinaryString();
				parsed.decoders = upThis.decoders;
				parsed.decode(event.data);
				event.parsed = parsed;
				break;
			};
			case MICCConstants.META_TRACK_CH:
			case MICCConstants.META_TRACK_PORT: {
				event.parsed = event.data[0];
				break;
			};
			case MICCConstants.META_SET_TEMPO: {
				event.parsed = MICCInternalsTempo.fromMPQN(IntegerHandler.readUint24(event.data));
				break;
			};
			case MICCConstants.META_SET_SMPTE_OFFSET: {
				if (noParseExtended) return;
				// WIP
				break;
			};
			case MICCConstants.META_SET_TIME_SIG: {
				if (noParseExtended) return;
				// WIP
				break;
			};
			case MICCConstants.META_SET_KEY_SIG: {
				if (noParseExtended) return;
				// WIP
				break;
			};
			case MICCConstants.META_SEQEX: {
				if (noParseExtended) return;
				// WIP
				break;
			};
		};
	};
};