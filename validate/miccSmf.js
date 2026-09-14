"use strict";

import {
	SeamstressChunk
} from "../libs/seamstress@ltgcgo/seamstress/index.mjs";
import {
	MICCConstants,
	MICCInternalsSMF
} from "../src/micc/index.mjs";
import {
	bufferToDHex
} from "../src/state/utils.js";
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
test("Input types validation", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(true)});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(1)});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(1n)});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent("1")});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent([])});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent({})});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(() => {})});
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(Symbol("Horni"))});
	MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F8"));
	MICCInternalsSMF.parseSingleEvent(Uint8ClampedArray.from([0xf8]));
	const dummyChunk = new SeamstressChunk(0, 0, 0, 0, 1);
	dummyChunk.data = bufferFrom("hex", "F8");
	dummyChunk.offset = 4;
	dummyChunk.offsetData = 8;
	assertEquals(MICCInternalsSMF.parseSingleEvent(dummyChunk).offset, 8);
});
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
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("base64", "8H1BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQYD3"))}, undefined, undefined, "Allowed an invalid SysEx event.");
	const dummyState = {
		"loosenForSpeed": true,
		"parserContext": {}
	};
	MICCInternalsSMF.parseSingleEvent(bufferFrom("base64", "8H1BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQYD3"), dummyState); // Should pass normally.
	assertEquals(dummyState.parserContext.lastSysExHung, false);
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
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0057E7F0901F7"), {
		"isSmfWrapped": true,
		"parserContext": {
			"lastSysExHung": true
		}
	})}, undefined, undefined, "Allowed nested SysEx.");
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52834A7F"), dummyState);
		assertEquals(e.delta, 114514);
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52934A7F"), dummyState);
		assertEquals(e.delta, 114514);
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52A34A7F"), dummyState);
		assertEquals(e.delta, 114514);
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52B34A7F"), dummyState);
		assertEquals(e.delta, 114514);
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52C37F"), dummyState);
		assertEquals(e.delta, 114514);
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52D37F"), dummyState);
		assertEquals(e.delta, 114514);
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
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52E34A7F"), dummyState);
		assertEquals(e.delta, 114514);
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
		assertEquals(dummyState.parserContext.lastSysExHung, false);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0057E7F0901F7"), parseTypeWrapped);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_NEW);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 5);
	};
	{
		const dummyState = {
			"hasDelta": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52F07E7F0901F7"), dummyState);
		assertEquals(e.delta, 114514);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_NEW);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 5);
		assertEquals(dummyState.parserContext.lastStatus, 0xf0);
		assertEquals(dummyState.parserContext.lastSysExHung, false);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("base64", "8IEBfUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUH3"), parseTypeWrapped);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_NEW);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 129);
	};
	{
		const dummyState = {
			"hasDelta": true,
			"isSmfWrapped": true,
			"parserContext": {}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("base64", "hv5S8IEBfUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUH3"), dummyState);
		assertEquals(e.delta, 114514);
		assertEquals(e.type, MICCConstants.MIDI_SYSEX_NEW);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 129);
		assertEquals(dummyState.parserContext.lastSysExHung, false);
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
		assertEquals(dummyState.parserContext.lastSysExHung, false);
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
		assertEquals(MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF0100"), dummyState).data.length, 0)
	};
	{
		const dummyState = {
			"hasDelta": true,
			"isSmfWrapped": true,
			"parserContext": {
				"lastStatus": 0x9f
			}
		};
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "86FE52FF01023032"), dummyState);
		assertEquals(e.delta, 114514);
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
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0x83
			}
		});
		assertEquals(e.delta, 255);
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
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0x93
			}
		});
		assertEquals(e.delta, 255);
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
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0xa3
			}
		});
		assertEquals(e.delta, 255);
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
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0xb3
			}
		});
		assertEquals(e.delta, 255);
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
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0xc3
			}
		});
		assertEquals(e.delta, 255);
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
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0xd3
			}
		});
		assertEquals(e.delta, 255);
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
	{
		const e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "817F4A7F"), {
			"hasDelta": true,
			"parserContext": {
				"lastStatus": 0xe3
			}
		});
		assertEquals(e.delta, 255);
		assertEquals(e.type, MICCConstants.MIDI_CH_PITCH);
		assertEquals(e.isStale, true);
		assertEquals(e.ch, 3);
		assertEquals(e.data.length, 2);
	};
});
test("Complex continuous event validation", () => {
	// Real-time bytes fed from Web MIDI API are hoisted out by `parseRawEvents`. They are not the concern of this test file.
	// Read the long-finished existing documentation first for any confusion.
	{
		const parserState = {};
		const dummyState = {
			"isSmfWrapped": true,
			"parserContext": parserState
		};
		const dummyStateLive = {
			"parserContext": parserState
		};
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7030901F7"), dummyState)}, undefined, undefined, "Allowed SysEx continuation without hanging SysEx transmission.");
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0027E7F"), dummyState);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0057E7F0901F7"), dummyState)}, undefined, undefined, "Allowed nested SysEx.");
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F8"), dummyStateLive);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FA"), dummyStateLive);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FB"), dummyStateLive);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FC"), dummyStateLive);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FE"), dummyStateLive);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FF"), dummyStateLive);
		assertEquals(dummyState.parserContext.lastSysExHung, true);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7030901F7"), dummyState);
		assertEquals(dummyState.parserContext.lastSysExHung, false);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0117E7F0902F7F07E7F0901F7F07E7F0903F7"), dummyState);
		assertEquals(dummyState.parserContext.lastSysExHung, false);
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7030901F7"), dummyState)}, undefined, undefined, "Allowed SysEx continuation without hanging SysEx transmission.");
	};
	{
		const dummyState = {
			"hasDelta": true,
			"parserContext": {}
		};
		let e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FF07E7F0901F7"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0xf0);
		assertEquals(e.isStale, false);
		assertEquals(dummyState.parserContext.lastSysExHung, false);
		e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7F904C7F"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		assertEquals(e.isStale, false);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FF8"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FFA"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FFB"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FFC"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FFE"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FFF"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FF2"), dummyState)});
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FB9"), dummyState)});
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FFF01023032"), {
			"isSmfWrapped": true,
			"hasDelta": true,
			"parserContext": dummyState.parserContext
		});
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7FF07D"), dummyState)});
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		assertEquals(dummyState.parserContext.lastSysExHung, false);
		e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7F4C00"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x90);
		assertEquals(e.isStale, true);
		e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7F914C7F"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x91);
		assertEquals(e.isStale, false);
		e = MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "7F4C7F"), dummyState);
		assertEquals(dummyState.parserContext.lastStatus, 0x91);
		assertEquals(e.isStale, true);
	};
});

// Serialiser

// Round-trip
test("Event roundtrip validation", () => {
	const eventBundles = [{
		"setup": {
			"isSmfWrapped": false,
			"hasDelta": false
		},
		"data": [
			[
				bufferFrom("hex", "8F3C78"),
				bufferFrom("hex", "3E00")
			], [
				bufferFrom("hex", "9E3C7F"),
				bufferFrom("hex", "3C00"),
				bufferFrom("hex", "3E70"),
				bufferFrom("hex", "3E00")
			], [
				bufferFrom("hex", "AD3C7E"),
				bufferFrom("hex", "3C01"),
				bufferFrom("hex", "3C71"),
				bufferFrom("hex", "3C03")
			], [
				bufferFrom("hex", "BC4A7D"),
				bufferFrom("hex", "4740"),
				bufferFrom("hex", "6500"),
				bufferFrom("hex", "6402"),
				bufferFrom("hex", "060C")
			], [
				bufferFrom("hex", "CB10"),
				bufferFrom("hex", "12"),
				bufferFrom("hex", "18"),
				bufferFrom("hex", "19")
			], [
				bufferFrom("hex", "DA7C"),
				bufferFrom("hex", "10"),
				bufferFrom("hex", "7B"),
				bufferFrom("hex", "20")
			], [
				bufferFrom("hex", "E97F7F"),
				bufferFrom("hex", "0040"),
				bufferFrom("hex", "0000"),
				bufferFrom("hex", "0040")
			], [
				bufferFrom("hex", "F17F"),
				bufferFrom("hex", "F27F7F"),
				bufferFrom("hex", "F37F"),
				bufferFrom("hex", "F6"),
				bufferFrom("hex", "F8"),
				bufferFrom("hex", "FA"),
				bufferFrom("hex", "FB"),
				bufferFrom("hex", "FC"),
				bufferFrom("hex", "FE"),
				bufferFrom("hex", "FF")
			]
		]
	}, {
		"setup": {
			"isSmfWrapped": false,
			"hasDelta": true
		},
		"data": [
			[
				bufferFrom("hex", "0A8F3C78"),
				bufferFrom("hex", "83563E00")
			], [
				bufferFrom("hex", "0A9E3C7F"),
				bufferFrom("hex", "83563C00"),
				bufferFrom("hex", "0A3E70"),
				bufferFrom("hex", "83563E00")
			], [
				bufferFrom("hex", "0AAD3C7E"),
				bufferFrom("hex", "83563C01"),
				bufferFrom("hex", "0A3C71"),
				bufferFrom("hex", "83563C03")
			], [
				bufferFrom("hex", "0ABC4A7D"),
				bufferFrom("hex", "0A4740"),
				bufferFrom("hex", "0A6500"),
				bufferFrom("hex", "0A6402"),
				bufferFrom("hex", "0A060C")
			], [
				bufferFrom("hex", "00CB10"),
				bufferFrom("hex", "8F0012"),
				bufferFrom("hex", "8F0018"),
				bufferFrom("hex", "8F0019")
			], [
				bufferFrom("hex", "8360DA7C"),
				bufferFrom("hex", "836010"),
				bufferFrom("hex", "83607B"),
				bufferFrom("hex", "836020")
			], [
				bufferFrom("hex", "00E97F7F"),
				bufferFrom("hex", "83600040"),
				bufferFrom("hex", "83600000"),
				bufferFrom("hex", "83600040")
			]
		]
	}, {
		"setup": {
			"isSmfWrapped": true,
			"hasDelta": true
		},
		"data": [
			[
				bufferFrom("hex", "00FF030953776565746E657373"),
				bufferFrom("hex", "00FF020D3139393720A92059616D616861"),
				bufferFrom("hex", "00FF012350726F64756365642062792059616D616861204D75736963536F6674204575726F7065"),
				bufferFrom("hex", "00FF580404021808"),
				bufferFrom("hex", "00FF510307A120"),
				bufferFrom("hex", "8F00FF510306A25E")
			], [
				bufferFrom("hex", "00F0027E7F"),
				bufferFrom("hex", "02F7030902F7"),
				bufferFrom("hex", "3AF0057E7F0901F7"),
				bufferFrom("hex", "3CF0057E7F0903F7"),
				bufferFrom("hex", "3CF00843104C00007E00F7"),
				bufferFrom("hex", "14F00943104C0201000100F7"),
				bufferFrom("hex", "14F00943104C0201204300F7"),
				bufferFrom("hex", "14F00943104C0201400500F7"),
				bufferFrom("hex", "14F00843104C02015A01F7"),
				bufferFrom("hex", "14F00843104C08090702F7"),
				bufferFrom("hex", "14F00843104C08080703F7"),
				bufferFrom("hex", "14F00843104C080A0701F7")
			]
		]
	}];
	for (const {setup, data} of eventBundles) {
		const {isSmfWrapped, hasDelta} = setup;
		for (const bundle of data) {
			console.info(bufferToDHex(bundle[0]));
			const dummyStateIn = {
				isSmfWrapped,
				hasDelta
			}, dummyStateOut = {
				isSmfWrapped,
				hasDelta
			};
			for (const message of bundle) {
				//console.debug(bufferToDHex(message, 30));
				assertEquals(message, MICCInternalsSMF.emitSingleEvent(MICCInternalsSMF.parseSingleEvent(message, dummyStateIn), dummyStateOut));
			};
		};
	};
});