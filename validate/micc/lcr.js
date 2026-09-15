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

// Screw it, Deno APIs can be easily shimmed anyway.
test("Validate stream parsing of single events", async () => {
	const skeletalSmfParser = new Seamstress(Seamstress.TYPE_4CC | Seamstress.ENDIAN_B | Seamstress.LENGTH_U32);
	skeletalSmfParser.headerSize = 0;
	skeletalSmfParser.regulateStream = MICCInternalsSMF.streamRegulator;
	for await (const dirEntry of Deno.readDir("./cache/source")) {
		if (dirEntry.isFile) {
			console.info(`Validating skeletal event parsing of "${dirEntry.name}"...`);
			const fileObject = await Deno.open(`./cache/source/${dirEntry.name}`);
			const fileState = {
				"isSmfWrapped": true,
				"hasDelta": true
			};
			for await (let chunk of skeletalSmfParser.readRegulated(fileObject.readable)) {
				switch (chunk.type) {
					case "MTrk":
					case "XFIH":
					case "XFKM": {
						MICCInternalsSMF.parseSingleEvent(chunk, fileState);
						break;
					};
				};
			};
		};
	};
});