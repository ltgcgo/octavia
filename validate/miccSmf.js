"use strict";

import {
	MICCConstants,
	MICCInternalsSMF
} from "../src/micc/index.mjs";
import {
	bufferFrom
} from "../src/state/utils/bufferIo.mjs";
import {
	test
} from "https://jsr.io/@cross/test/0.0.14/mod.ts";
import {
	assertEquals,
	assertThrows
} from "https://jsr.io/@std/assert/1.0.19/mod.ts";

/** @type {import("../src/micc/index.mjs").MICCSMFMIAHandleOptions} */
const parseTypeDelta = {
	"hasDelta": true
};
const parseTypeWrapped = {
	"isSmfWrapped": true
};
const parseTypeInSMF = {
	"isSmfWrapped": true,
	"hasDelta": true
};

// Parser
test("Delta time validation", () => {
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F8")).delta, 0);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "00F8"), parseTypeDelta).delta, 0);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FF8"), parseTypeDelta).delta, 127);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "8100F8"), parseTypeDelta).delta, 128);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF7FF8"), parseTypeDelta).delta, 16383);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "818000F8"), parseTypeDelta).delta, 16384);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FFFF7FF8"), parseTypeDelta).delta, 2097151);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "81808000F8"), parseTypeDelta).delta, 2097152);
	assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FFFFFF7FF8"), parseTypeDelta).delta, 268435455);
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "8000F8"), parseTypeDelta)}, undefined, undefined, "Allowed non-canonical VLV.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "808000F8"), parseTypeDelta)}, undefined, undefined, "Allowed non-canonical VLV.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "80808000F8"), parseTypeDelta)}, undefined, undefined, "Allowed non-canonical VLV.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FFFFFFFF7FF8"), parseTypeDelta)}, undefined, undefined, "Allowed out-of-range VLV.");
});
test("Reset and meta event parsing with delta", () => {
	const metaEvent1NoDelta = bufferFrom("hex", "FF01023032");
	const metaEvent1HasDelta = bufferFrom("hex", "FF7FFF01023032");
	{
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(metaEvent1HasDelta, parseTypeWrapped)}, undefined, undefined, "Allowed an incomplete event.");
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(metaEvent1NoDelta, parseTypeInSMF)}, undefined, undefined, "Allowed an incomplete event.");
	};
});
test("Single fixed-length event errors", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "80"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "813C"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "823CE6"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "83A97F"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "94"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "953C"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "963CF6"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "978E7F"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "A8"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "A93C"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "AA3CC5"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "AB9A7F"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BC"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BD3C"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BE3CA6"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BFCE7F"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "C0"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "C1A5"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "D2"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "D3ED"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E4"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E53C"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E63C92"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E7C87F"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F1"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F1ED"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F100"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F2"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F237"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F2D475"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F27F86"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F20000"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F3"))}, undefined, undefined, "Allowed an incomplete event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F3DF"))}, undefined, undefined, "Allowed invalid data.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F300"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F4"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F5"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F6"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7"))}, undefined, undefined, "Allowed double SysEx termination.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F8"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F9"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FA"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FB"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FC"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FD"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FE"), parseTypeWrapped)}, undefined, undefined, "Allowed live-only system events in SMF.");
});
test("Single SysEx event errors", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0"))}, undefined, undefined, "Allowed an incomplete SysEx event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F080F7"))}, undefined, undefined, "Allowed an invalid SysEx event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0"), parseTypeWrapped)}, undefined, undefined, "Allowed an incomplete SysEx event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F001"), parseTypeWrapped)}, undefined, undefined, "Allowed an incomplete SysEx event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F001EEF7"), parseTypeWrapped)}, undefined, undefined, "Allowed an invalid SysEx event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7"), parseTypeWrapped)}, undefined, undefined, "Allowed SysEx continuation without hanging SysEx transmission.");
});
test("Single meta event errors", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF"), parseTypeWrapped)}, undefined, undefined, "Allowed an incomplete meta event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF01"), parseTypeWrapped)}, undefined, undefined, "Allowed an incomplete meta event.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF0101"), parseTypeWrapped)}, undefined, undefined, "Allowed an incomplete meta event.");
});
test("Continuous event errors", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"))}, undefined, undefined, "Allowed invalid running status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
		"parserContext": {
			"lastStatus": 0xf0
		}
	})}, undefined, undefined, "Allowed invalid running status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7"), parseTypeWrapped)}, undefined, undefined, "Allowed double SysEx termination.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "904A7F"), {
		"parserContext": {
			"lastSysExHung": true
		}
	})}, undefined, undefined, "Allowed unterminated SysEx.");
});
test("Single event validation", () => {
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "834A7F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_NOTE_OFF);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0x83);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "934A7F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_NOTE_ON);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0x93);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "A34A7F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_NOTE_AT);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0xA3);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "B34A7F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_CONTROL);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0xB3);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "C37F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_PROGRAM);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 1);
		assertEquals(dummyState.parserContext.lastStatus, 0xC3);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "D37F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_CH_AT);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 1);
		assertEquals(dummyState.parserContext.lastStatus, 0xD3);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E34A7F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_CH_PITCH);
		assertEquals(e.isStale, false);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0xE3);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F07E7F0901F7"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_NEW);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 5);
		assertEquals(dummyState.parserContext.lastStatus, 0xf0);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0057E7F0901F7"), parseTypeWrapped);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_NEW);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 5);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F17F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_TIME_CODE);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 1);
		assertEquals(dummyState.parserContext.lastStatus, 0xf1);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F27F7F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_SONG_POSITION);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0xf2);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F37F"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_SONG_SELECT);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 1);
		assertEquals(dummyState.parserContext.lastStatus, 0xf3);
	};
	{
		const dummyState = {
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F6"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_TUNE_REQUEST);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0xf6);
	};
	{
		const dummyState = {
			"isSmfWrapped": true,
			"parserContext": {
				"lastSysExHung": true
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7057E7F0901F7"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_RESUME);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 5);
		assertEquals(dummyState.parserContext.lastStatus, 0xf7);
	};
	{
		const dummyState = {
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F8"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_CLOCK);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
	{
		const dummyState = {
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FA"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_START);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
	{
		const dummyState = {
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FB"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_RESUME);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
	{
		const dummyState = {
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FC"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_STOP);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
	{
		const dummyState = {
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FE"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_ACTIVE_SENSE);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
	{
		const dummyState = {
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_RESET);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
	{
		const dummyState = {
			"isSmfWrapped": true,
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF01023032"), dummyState);
		assertEquals(e.type, MICCConstants.MIDI_META);
		assertEquals(e.isStale, false);
		assertEquals(e.meta, 1);
		assertEquals(e.data.length, 2);
		assertEquals(dummyState.parserContext.lastStatus, 0x9f);
	};
});
test("Continuous event validation", () => {
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0x83
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_NOTE_OFF);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0x93
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_NOTE_ON);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0xa3
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_NOTE_AT);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0xb3
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_CONTROL);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0xc3
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_PROGRAM);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 1);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0xd3
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_CH_AT);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 1);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "4A7F"), {
			"parserContext": {
				"lastStatus": 0xe3
			}
		});
		assertEquals(e.type, MICCConstants.MIDI_CH_PITCH);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
	};
});

// Serialiser

// Round-trip
test("Single event roundtrip validation", () => {
	
});