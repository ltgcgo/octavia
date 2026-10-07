"use strict";

import {
	test
} from "https://jsr.io/@cross/test/0.0.14/mod.ts";
import {
	assert,
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

import optLogFile from "../common/optLogFile.json" with {"type": "json"};
import FailRecord from "../common/failRecord.mjs";
import OldColxiCustomInterpreter from "../common/colxiOldCI.mjs";
import {
	arrayCompare,
	reducePrecision,
	reducePrecisionText
} from "../../src/state/utils.js";
import {
	ColxiMIDIParser,
	ColxiMIDIParserStreamed
} from "../../src/miccCompat/index.mjs";

if (ColxiMIDIParserOriginal) {
	// The original Colxi will ABSOLUTELY WHINE without our own customised interpreter.
	ColxiMIDIParserOriginal.customInterpreter = OldColxiCustomInterpreter;
};

/** @param {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} seqA
* @param {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} seqB */
const assertSeqColxiMeta = function (seqA, seqB) {
	assertEquals(seqA.formatType, seqB.formatType, "Mismatched format type.");
	assertEquals(seqA.timeDivision, seqB.timeDivision, "Mismatched format type.");
	assertEquals(seqA.tracks, seqB.tracks, "Mismatched format type.");
	assertEquals(seqA.track.length, seqB.track.length, "Mismatched format type.");
};
/** @param {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} seqA
* @param {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} seqB */
const assertSeqColxiTrackEvent = function (seqA, seqB) {
	for (let iTrack = 0; iTrack < seqA.track.length; iTrack ++) {
		const trackA = seqA.track[iTrack].event;
		const trackB = seqB.track[iTrack].event;
		assertEquals(trackA.length, trackB.length, `Mismatched event count for track #${iTrack}.`);
		for (let iEvent = 0; iEvent < trackA.length; iEvent ++) {
			const dSuffix = `for event #${iEvent} on track #${iTrack}`;
			const eventA = trackA[iEvent];
			const eventB = trackB[iEvent];
			assertEquals(eventA.deltaTime, eventB.deltaTime, `Mismatched delta time ${dSuffix}.`);
			assertEquals(eventA.type, eventB.type, `Mismatched event type ${dSuffix}.`);
			switch (eventA.type) {
				case 12:
				case 13: {
					assertEquals(
						eventA.channel,
						eventB.channel,
						`Mismatched event channel ${dSuffix}.`
					);
					assertEquals(
						eventA.data,
						eventB.data,
						`Mismatched numeric event data ${dSuffix}.`
					);
					break;
				};
				case 8:
				case 9:
				case 10:
				case 11:
				case 14: {
					assertEquals(
						eventA.channel,
						eventB.channel,
						`Mismatched event channel ${dSuffix}.`
					);
					// Fallthrough.
				};
				case 15: {
					assertEquals(
						eventA.data.length,
						eventB.data.length,
						`Mismatched event data length ${dSuffix}.`
					);
					const arrCmpResult = arrayCompare(eventA.data, eventB.data);
					assert(
						arrCmpResult[0] === 0 && arrCmpResult[1] === 0,
						`Mismatched event data content at index #${arrCmpResult[0]} ${dSuffix}.`
					);
					break;
				};
				case 255: {
					assertEquals(
						eventA.metaType,
						eventB.metaType,
						`Mismatched meta event type ${dSuffix}.`
					);
					const dPrefix = `Mismatched meta event ${eventA.metaType}`;
					// No strict string comparison here due to decoder differences.
					switch (eventA.metaType) {
						case 0x2F: {
							assert(
								eventA.data == null && eventB.data == null,
								`Non-null end of track data ${dSuffix}.`
							);
							break;
						};
						case 0x21:
						case 0x51:
						case 0x59: {
							assertEquals(
								eventA.data,
								eventB.data,
								`${dPrefix} numeric data ${dSuffix}.`
							);
							break;
						};
						case 0x54:
						case 0x58: {
							assertEquals(
								eventA.data.length,
								eventB.data.length,
								`${dPrefix} buffer length ${dSuffix}.`
							);
							const arrCmpResult = arrayCompare(eventA.data, eventB.data);
							assert(
								arrCmpResult[0] === 0 && arrCmpResult[1] === 0,
								`${dPrefix} buffer data at index #${arrCmpResult[0]} ${dSuffix}.`
							);
							break;
						};
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x04:
						case 0x05:
						case 0x06:
						case 0x07: {
							assert(
								eventA.data.length > 0 && eventB.data.length > 0,
								`${dPrefix} string null status ${dSuffix}.`
							);
							break;
						};
					};
					break;
				};
				default: {
					throw(new RangeError(`Invalid event type "${eventA.type}" ${dSuffix}.`));
				};
			};
		};
	};
};
test("Validate Colxi against streamed and buffered", async () => {
	//
	/** @type {FailRecord[]} */
	const errorHistory = [];
	let testedFile = 0;
	let cumulativeDurationColxi = 0, cumulativeEventsColxi = 0;
	let cumulativeDurationMICCNativeStreamed = 0, cumulativeEventsMICCNativeStreamed = 0;
	let cumulativeDurationMICCMatchedStreamed = 0, cumulativeEventsMICCMatchedStreamed = 0;
	let cumulativeDurationMICCNativeBuffered = 0, cumulativeEventsMICCNativeBuffered = 0;
	let cumulativeDurationMICCMatchedBuffered = 0, cumulativeEventsMICCMatchedBuffered = 0;
	for await (const dirEntry of Deno.readDir("./cache/source")) {
		if (dirEntry.isFile) {
			console.info(`[\x1b[1;33mTEST\x1b[0m] "${dirEntry.name}": ...`);
			const filePath = `./cache/source/${dirEntry.name}`;
			const fileColxi = await Deno.readFile(filePath);
			const fileMICCNativeStreamed = (await Deno.open(filePath)).readable;
			const fileMICCMatchedStreamed = (await Deno.open(filePath)).readable;
			const fileMICCNativeBuffered = (await Deno.open(filePath)).readable;
			const fileMICCMatchedBuffered = (await Deno.open(filePath)).readable;
			testedFile ++;
			let passed = true;
			let processedCountColxi = 0,
			processedCountMICCNativeStreamed = 0,
			processedCountMICCMatchedStreamed = 0,
			processedCountMICCNativeBuffered = 0,
			processedCountMICCMatchedBuffered = 0;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceColxi;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceMICCNativeStreamed;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceMICCMatchedStreamed;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceMICCNativeBuffered;
			/** @type {import("../../src/miccCompat/index.mjs").ColxiMIDIFile} */
			let sequenceMICCMatchedBuffered;
			// Original section
			const startTimeColxi = performance.now();
			try {
				sequenceColxi = ColxiMIDIParserOriginal.parse(fileColxi);
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const runDurationColxi = performance.now() - startTimeColxi;
			// Native run section
			ColxiMIDIParserStreamed.extended = true;
			ColxiMIDIParserStreamed.customInterpreter = true;
			const startTimeMICCNativeStreamed = performance.now();
			try {
				sequenceMICCNativeStreamed = await ColxiMIDIParserStreamed.parse(fileMICCNativeStreamed);
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const runDurationMICCNativeStreamed = performance.now() - startTimeMICCNativeStreamed;
			ColxiMIDIParser.extended = true;
			ColxiMIDIParser.customInterpreter = true;
			const startTimeMICCNativeBuffered = performance.now();
			try {
				sequenceMICCNativeBuffered = await ColxiMIDIParser.parse(fileMICCNativeBuffered);
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const runDurationMICCNativeBuffered = performance.now() - startTimeMICCNativeBuffered;
			// Behaviour match section
			ColxiMIDIParserStreamed.extended = false;
			ColxiMIDIParserStreamed.customInterpreter = true;
			const startTimeMICCMatchedStreamed = performance.now();
			try {
				sequenceMICCMatchedStreamed = await ColxiMIDIParserStreamed.parse(fileMICCMatchedStreamed);
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const runDurationMICCMatchedStreamed = performance.now() - startTimeMICCMatchedStreamed;
			ColxiMIDIParser.extended = false;
			ColxiMIDIParser.customInterpreter = true;
			const startTimeMICCMatchedBuffered = performance.now();
			try {
				sequenceMICCMatchedBuffered = await ColxiMIDIParser.parse(fileMICCMatchedBuffered);
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const runDurationMICCMatchedBuffered = performance.now() - startTimeMICCMatchedBuffered;
			try {
				// Enumerate streamed native MICC
				for (const track of sequenceMICCNativeStreamed.track) {
					processedCountMICCNativeStreamed += track.event.length;
				};
				// Enumerate streamed matched MICC
				for (const track of sequenceMICCMatchedStreamed.track) {
					processedCountMICCMatchedStreamed += track.event.length;
				};
				// Enumerate buffered native MICC
				for (const track of sequenceMICCNativeBuffered.track) {
					processedCountMICCNativeBuffered += track.event.length;
				};
				// Enumerate buffered matched MICC
				for (const track of sequenceMICCMatchedBuffered.track) {
					processedCountMICCMatchedBuffered += track.event.length;
				};
				const colxiPassed = sequenceColxi?.track?.length > 0;
				if (colxiPassed) {
					// Enumerate Colxi
					for (const track of sequenceColxi.track) {
						processedCountColxi += track.event.length;
					};
				} else {
					console.debug(sequenceColxi);
					console.debug(`[\x1b[1;33mWARN\x1b[0m] The original Colxi parser has failed!\n`);
				};
				if (colxiPassed) {
					// Event data comparison
					// File meta
					assertSeqColxiMeta(sequenceColxi, sequenceMICCMatchedStreamed);
					assertSeqColxiMeta(sequenceColxi, sequenceMICCMatchedBuffered);
					assertSeqColxiTrackEvent(sequenceColxi, sequenceMICCMatchedStreamed);
					assertSeqColxiTrackEvent(sequenceColxi, sequenceMICCMatchedBuffered);
				};
			} catch (err) {
				passed = false;
				errorHistory.push(new FailRecord(dirEntry.name, 0, err));
				console.error(err);
			};
			const parseSpeedColxi = reducePrecisionText(processedCountColxi / runDurationColxi * 1000, 3);
			cumulativeDurationColxi += runDurationColxi;
			cumulativeEventsColxi += processedCountColxi;
			const parseSpeedMICCNativeStreamed = reducePrecisionText(processedCountMICCNativeStreamed / runDurationMICCNativeStreamed * 1000, 3);
			cumulativeDurationMICCNativeStreamed += runDurationMICCNativeStreamed;
			cumulativeEventsMICCNativeStreamed += processedCountMICCNativeStreamed;
			const parseSpeedMICCMatchedStreamed = reducePrecisionText(processedCountMICCMatchedStreamed / runDurationMICCMatchedStreamed * 1000, 3);
			cumulativeDurationMICCMatchedStreamed += runDurationMICCMatchedStreamed;
			cumulativeEventsMICCMatchedStreamed += processedCountMICCMatchedStreamed;
			const parseSpeedMICCNativeBuffered = reducePrecisionText(processedCountMICCNativeBuffered / runDurationMICCNativeBuffered * 1000, 3);
			cumulativeDurationMICCNativeBuffered += runDurationMICCNativeBuffered;
			cumulativeEventsMICCNativeBuffered += processedCountMICCNativeBuffered;
			const parseSpeedMICCMatchedBuffered = reducePrecisionText(processedCountMICCMatchedBuffered / runDurationMICCMatchedBuffered * 1000, 3);
			cumulativeDurationMICCMatchedBuffered += runDurationMICCMatchedBuffered;
			cumulativeEventsMICCMatchedBuffered += processedCountMICCMatchedBuffered;
			let reportText = `${processedCountColxi} / ${processedCountMICCMatchedStreamed} / ${processedCountMICCMatchedBuffered} / ${processedCountMICCNativeStreamed} / ${processedCountMICCNativeBuffered} event(s).\nDuration: ${reducePrecisionText(runDurationColxi + runDurationMICCMatchedStreamed + runDurationMICCMatchedBuffered + runDurationMICCNativeStreamed + runDurationMICCNativeBuffered, 3)}ms (${reducePrecisionText(runDurationColxi, 3)}ms + ${reducePrecisionText(runDurationMICCMatchedStreamed, 3)}ms + ${reducePrecisionText(runDurationMICCMatchedBuffered, 3)}ms + ${reducePrecisionText(runDurationMICCNativeStreamed, 3)}ms + ${reducePrecisionText(runDurationMICCNativeBuffered, 3)}ms).\nThroughput: ${parseSpeedColxi}/s | ${parseSpeedMICCMatchedStreamed}/s | ${parseSpeedMICCMatchedBuffered}/s | ${parseSpeedMICCNativeStreamed}/s | ${parseSpeedMICCNativeBuffered}/s.`;
			if (passed) {
				console.info(`\x8d\r[\x1b[1;32mPASS\x1b[0m] "${dirEntry.name}": Validation success with ${reportText}`);
				await Deno.writeTextFile(`./cache/speed.compat.colxiSplit.tsv`, `${dirEntry.name}\t${((parseSpeedMICCMatchedStreamed / parseSpeedColxi) || 0).toFixed(6)}\t${((parseSpeedMICCNativeStreamed / parseSpeedColxi) || 0).toFixed(6)}\t${((parseSpeedMICCMatchedBuffered / parseSpeedColxi) || 0).toFixed(6)}\t${((parseSpeedMICCNativeBuffered / parseSpeedColxi) || 0).toFixed(6)}\n`, optLogFile);
			} else {
				console.info(`\x8d\r[\x1b[1;31mFAIL\x1b[0m] "${dirEntry.name}": Validation failure with ${reportText}`);
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
	const speedAvgColxi = reducePrecisionText(cumulativeEventsColxi / cumulativeDurationColxi * 1000, 3);
	const speedAvgMatchedStreamed = reducePrecisionText(cumulativeEventsMICCMatchedStreamed / cumulativeDurationMICCMatchedStreamed * 1000, 3);
	const speedAvgNativeStreamed = reducePrecisionText(cumulativeEventsMICCNativeStreamed / cumulativeDurationMICCNativeStreamed * 1000, 3);
	const speedAvgMatchedBuffered = reducePrecisionText(cumulativeEventsMICCMatchedBuffered / cumulativeDurationMICCMatchedBuffered * 1000, 3);
	const speedAvgNativeBuffered = reducePrecisionText(cumulativeEventsMICCNativeBuffered / cumulativeDurationMICCNativeBuffered * 1000, 3);
	console.debug(`\nColxi: Parsed ${cumulativeEventsColxi} event(s) in ${reducePrecisionText(cumulativeDurationColxi, 3)}ms. Average ${speedAvgColxi}/s`);
	console.debug(`MICC streamed (matched): Parsed ${cumulativeEventsMICCMatchedStreamed} event(s) in ${reducePrecisionText(cumulativeDurationMICCMatchedStreamed, 3)}ms. Average ${speedAvgMatchedStreamed}/s`);
	console.debug(`MICC streamed (native): Parsed ${cumulativeEventsMICCNativeStreamed} event(s) in ${reducePrecisionText(cumulativeDurationMICCNativeStreamed, 3)}ms. Average ${speedAvgNativeStreamed}/s`);
	console.debug(`MICC buffered (matched): Parsed ${cumulativeEventsMICCMatchedBuffered} event(s) in ${reducePrecisionText(cumulativeDurationMICCMatchedBuffered, 3)}ms. Average ${speedAvgMatchedBuffered}/s`);
	console.debug(`MICC buffered (native): Parsed ${cumulativeEventsMICCNativeBuffered} event(s) in ${reducePrecisionText(cumulativeDurationMICCNativeBuffered, 3)}ms. Average ${speedAvgNativeBuffered}/s`);
	await Deno.writeTextFile(`./cache/speed.compat.colxi.tsv`, `${speedAvgColxi}\t${speedAvgMatchedStreamed}\t${speedAvgNativeStreamed}\t${speedAvgMatchedBuffered}\t${speedAvgNativeBuffered}\n`, optLogFile);
});