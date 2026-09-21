"use strict";

import {
	Seamstress
} from "../../libs/seamstress@ltgcgo/seamstress/index.mjs";
import {
	MICCInternalsSMF
} from "../../src/micc/index.mjs";
import {
	test
} from "https://jsr.io/@cross/test/0.0.14/mod.ts";

const reducePrecision = function (value, base10Precision = 0) {
	const base10Factor = Math.pow(10, base10Precision);
	return Math.round(value * base10Factor) / base10Factor;
};

const FailRecord = class FailRecord {
	/** @type {Error} */
	error;
	/** @type {string} */
	fileName;
	/** @type {number} */
	offset;
	/** @param {string} fileName 
	* @param {number} offset 
	* @param {Error} error  */
	constructor(fileName, offset, error) {
		this.fileName = fileName;
		this.offset = offset;
		this.error = error;
	};
};

// Screw it, Deno APIs can be easily shimmed anyway.
test("Validate stream parsing of single events", async () => {
	const skeletalSmfParser = new Seamstress(Seamstress.TYPE_4CC | Seamstress.ENDIAN_B | Seamstress.LENGTH_U32);
	skeletalSmfParser.headerSize = 0;
	skeletalSmfParser.regulateStream = MICCInternalsSMF.streamRegulator;
	/** @type {FailRecord[]} */
	const errorHistory = [];
	let testedFile = 0, cumulativeDuration = 0, cumulativeEvents = 0;
	for await (const dirEntry of Deno.readDir("./cache/source")) {
		if (dirEntry.isFile) {
			console.info(`Validating skeletal event parsing of "${dirEntry.name}"...\x7f`);
			const fileObject = await Deno.open(`./cache/source/${dirEntry.name}`);
			const fileState = {
				"isSmfWrapped": true,
				"hasDelta": true
			};
			testedFile ++;
			const startTime = performance.now();
			let passed = true, processedCount = 0;
			for await (let chunk of skeletalSmfParser.readRegulated(fileObject.readable)) {
				switch (chunk.type) {
					case "MTrk":
					case "XFIH":
					case "XFKM": {
						try {
							MICCInternalsSMF.parseSingleEvent(chunk, fileState);
							processedCount ++;
						} catch (err) {
							passed = false;
							errorHistory.push(new FailRecord(dirEntry.name, chunk.offsetData, err));
							console.error(err);
						};
						break;
					};
				};
			};
			const runDuration = reducePrecision(performance.now() - startTime, 6);
			const parseSpeed = reducePrecision(processedCount / runDuration * 1000, 3);
			cumulativeDuration += runDuration;
			cumulativeEvents += processedCount;
			if (passed) {
				console.info(`\x8d\rValidated skeletal parsing of "${dirEntry.name}" in ${runDuration}ms. ${processedCount} event(s) at ${parseSpeed}/s.`);
			} else {
				console.info(`\x8d\rFailed skeletal parsing of "${dirEntry.name}" in ${runDuration}ms. ${processedCount} event(s) at ${parseSpeed}/s.`);
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
	console.debug(`\nParsed ${cumulativeEvents} event(s) in ${cumulativeDuration}ms. Average ${reducePrecision(cumulativeEvents / cumulativeDuration * 1000, 3)}/s`);
});