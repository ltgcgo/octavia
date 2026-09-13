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

test("Reset and meta event parsing with delta", () => {
	const metaEvent1NoDelta = bufferFrom("hex", "FF01023032");
	const metaEvent1HasDelta = bufferFrom("hex", "FF7FFF01023032");
	{
		const e = MICCInternalsSMF.parseSingleEvent(metaEvent1NoDelta, {
			"isSmfWrapped": false,
			"hasDelta": false
		});
		assertEquals(e.type, MICCConstants.MIDI_RESET);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 0);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(metaEvent1NoDelta, {
			"isSmfWrapped": true,
			"hasDelta": false
		});
		assertEquals(e.type, MICCConstants.MIDI_META);
		assertEquals(e.isStale, false);
		assertEquals(e.data.length, 2);
	};
	{
		const e = MICCInternalsSMF.parseSingleEvent(metaEvent1HasDelta, {
			"isSmfWrapped": false,
			"hasDelta": true
		});
		assertEquals(e.delta, 16383);
	};
	{
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(metaEvent1HasDelta, {
			"isSmfWrapped": true,
			"hasDelta": false
		})}, undefined, undefined, "Allowed an incomplete message.");
		assertThrows(() => {MICCInternalsSMF.parseSingleEvent(metaEvent1NoDelta, {
			"isSmfWrapped": true,
			"hasDelta": true
		})}, undefined, undefined, "Allowed an incomplete message.");
	};
});
test("Single fixed-length event errors", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "80"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "813C"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "823CE6"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "83A97F"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "94"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "953C"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "963CF6"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "978E7F"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "A8"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "A93C"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "AA3CC5"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "AB9A7F"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BC"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BD3C"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BE3CA6"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "BFCE7F"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "C0"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "C1A5"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "D2"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "D3ED"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E4"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E53C"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E63C92"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "E7C87F"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F1"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F1ED"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F2"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F28E"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F27F86"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F3"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F3DF"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F4"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F5"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F6"))}, undefined, undefined, "Allowed an incomplete message.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F7"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F9"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "FD"))}, undefined, undefined, "Allowed an invalid live MIDI status.");
});
test("Single SysEx event errors", () => {
	assertThrows(() => {MICCInternalsSMF.parseSingleEvent(bufferFrom("hex", "F0"))});
});
test("Single event roundtrip", () => {
	
});