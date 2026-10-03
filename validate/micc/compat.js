"use strict";

import {
	test
} from "https://jsr.io/@cross/test/0.0.14/mod.ts";
import {
	assertEquals,
	assertObjectMatch,
	assertThrows
} from "https://jsr.io/@std/assert/1.0.19/mod.ts";
let ColxiMIDIParserOriginal;
try {
	ColxiMIDIParserOriginal = (await import("https://ltgcgo.github.io/midi-parser-js/dist/bundle.mjs")).MidiParser;
	//ColxiMIDIParserOriginal = (await import("../../../midi-parser-js/dist/bundle.mjs")).MidiParser;
	console.debug(`Used the patched version for Colxi.`);
	//console.debug(ColxiMIDIParserOriginal);
} catch (err) {
	console.error(`The patched distribution is no longer available.`);
	console.error(err);
};
if (!ColxiMIDIParserOriginal) {
	ColxiMIDIParserOriginal = (await import("https://unpkg.com/midi-parser-js@4.0.4/src/midi-parser.js")).MidiParser;
	console.debug(`Used the original version for Colxi via Unpkg.`);
};

import FailRecord from "../common/failRecord.mjs";
import {
	customInterpreter,
	reducePrecision
} from "../../src/state/utils.js";

if (ColxiMIDIParserOriginal) {
	// The original Colxi will ABSOLUTELY WHINE without our own customised interpreter.
	ColxiMIDIParserOriginal.customInterpreter = customInterpreter;
};

test("Validate Colxi", async () => {
	//
	/** @type {FailRecord[]} */
	const errorHistory = [];
	let testedFile = 0;
	let cumulativeDurationColxi = 0, cumulativeEventsColxi = 0;
	let cumulativeDurationMICC = 0, cumulativeEventsMICC = 0;
	for await (const dirEntry of Deno.readDir("./cache/source")) {
		if (dirEntry.isFile) {
			console.info(`[\x1b[1;33mTEST\x1b[0m] "${dirEntry.name}": ...`);
			const fileColxi = await Deno.readFile(`./cache/source/${dirEntry.name}`);
			testedFile ++;
			let passed = true;
			let processedCountColxi = 0, processedCountMICC = 0;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceColxi;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceMICC;
			const startTimeColxi = performance.now();
			try {
				sequenceColxi = ColxiMIDIParserOriginal.parse(fileColxi);
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const startTimeMICC = performance.now();
			try {
				sequenceMICC = null;
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			try {
				// Enumerate MICC
				if (sequenceColxi?.track?.length > 0) {
					// Metadata comparison
					// Enumerate Colxi
					for (const track of sequenceColxi.track) {
						processedCountColxi += track.event.length;
					};
				} else {
					console.debug(sequenceColxi);
					console.debug(`[\x1b[1;33mWARN\x1b[0m] The original Colxi parser has failed.\n`);
				};
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const runDurationColxi = reducePrecision(performance.now() - startTimeColxi, 3);
			const parseSpeedColxi = reducePrecision(processedCountColxi / runDurationColxi * 1000, 3);
			cumulativeDurationColxi += runDurationColxi;
			cumulativeEventsColxi += processedCountColxi;
			const runDurationMICC = reducePrecision(performance.now() - startTimeMICC, 3);
			const parseSpeedMICC = reducePrecision(processedCountMICC / runDurationMICC * 1000, 3);
			cumulativeDurationMICC += runDurationMICC;
			cumulativeEventsMICC += processedCountMICC;
			if (passed) {
				console.info(`\x8d\r[\x1b[1;32mPASS\x1b[0m] "${dirEntry.name}": ${runDurationColxi + runDurationMICC}ms (${runDurationColxi}ms + ${runDurationMICC}ms). ${Math.max(processedCountColxi, processedCountMICC)} event(s) at ${parseSpeedColxi}/s | ${parseSpeedMICC}/s.`);
			} else {
				console.info(`\x8d\r[\x1b[1;31mFAIL\x1b[0m] "${dirEntry.name}": ${runDurationColxi}ms (${runDurationColxi}ms). ${Math.max(processedCountColxi, processedCountMICC)} event(s) at ${parseSpeedColxi}/s | ${parseSpeedMICC}/s.`);
			};
		};
	};
	if (errorHistory.length > 0) {
		console.debug(`\n\x1b[1;31mFinal casualty report\x1b[0m:`);
		for (const failRecord of errorHistory) {
			console.debug(`File "${failRecord.fileName}" failed at 0x${failRecord.offset.toString(16).padStart(6, "0")} with\n  ${failRecord.error.name}: ${failRecord.error.message}`);
		};
		throw(`Failed ${errorHistory.length} test(s) out of ${testedFile}.`);
	};
	console.debug(`\nColxi: Parsed ${cumulativeEventsColxi} event(s) in ${cumulativeDurationColxi}ms. Average ${reducePrecision(cumulativeEventsColxi / cumulativeDurationColxi * 1000, 3)}/s`);
	console.debug(`MICC: Parsed ${cumulativeEventsMICC} event(s) in ${cumulativeDurationMICC}ms. Average ${reducePrecision(cumulativeEventsMICC / cumulativeDurationMICC * 1000, 3)}/s`);
});