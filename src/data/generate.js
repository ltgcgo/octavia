"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";
import {
	bitFieldPack
} from "../state/utils/bufferIo.mjs";

{
	// Master chord map
	const finalObj = [];
	const spToId = new Map();
	for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/chords.tsv")).readable))) {
		let tmpObj = {};
		if (line.id && line.sp) {
			tmpObj.id = parseInt(line.id, 16);
			tmpObj.sp = line.sp.split(",");
			for (let sp of tmpObj.sp) {
				spToId.set(sp, tmpObj.id);
			};
			if (line.xf) {
				tmpObj.xf = parseInt(line.xf, 16);
			};
		};
		finalObj.push(tmpObj);
	};
	//console.debug(finalObj);
	await Deno.writeTextFile("./src/data/generated/chords.json", JSON.stringify(finalObj));

	// QY chord plan
	//let planSet1 = new Set(), planSet2 = new Set();
	const qyPlan = [];
	for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/qyChordPlan.tsv")).readable))) {
		let plan = [spToId.get(line.chord), `m${line.main ?? ""}`];
		if (line.main) {
			//planSet1.add(line.main);
		};
		if (line.sub) {
			//planSet2.add(line.sub);
			plan.push(`s${line.sub}`);
		};
		qyPlan.push(plan);
	};
	//console.debug(planSet1, planSet2);
	await Deno.writeTextFile("./src/data/generated/qyChordPlan.json", JSON.stringify(qyPlan));

	// PSR-170 chord plan
	const psr170Plan = [];
	for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/psr170ChordPlan.tsv")).readable))) {
		let plan = [spToId.get(line.chord), parseInt(line.bitfield, 16)];
		psr170Plan.push(plan);
	};
	//console.debug(psr170Plan);
	await Deno.writeTextFile("./src/data/generated/psr170ChordPlan.json", JSON.stringify(psr170Plan));
};

// Blocklisted code points
{
	const bcps = new Uint8Array(256);
	bcps[0x0000] = 85; // Null
	bcps[0x0004] = 85; // End of transmission
	bcps[0x0005] = 85; // Enquiry
	bcps[0x0006] = 85; // Acknowledge
	bcps[0x0008] = 85; // Backspace
	bcps[0x000E] = 85; // Shift out (used by some legacy encodings)
	bcps[0x000F] = 85; // Shift in (used by some legacy encodings)
	bcps[0x0011] = 85; // Device control 1
	bcps[0x0012] = 85; // Device control 2
	bcps[0x0013] = 85; // Device control 3
	bcps[0x0014] = 85; // Device control 4
	bcps[0x0015] = 85; // Negative acknowledge
	bcps[0x0016] = 85; // Synchronous idle
	bcps[0x0017] = 85; // End of transmission block
	bcps[0x0018] = 85; // Cancel
	bcps[0x0019] = 85; // End of medium
	bcps[0x001A] = 85; // Substitute (superceded by 0xFFFD)
	bcps[0x001B] = 85; // Escape (used by some legacy encodings)
	bcps[0x0080] = 85; // Unassigned control
	bcps[0x0081] = 85; // Unassigned control
	bcps[0x0084] = 85; // Unassigned control, formerly "index"
	bcps[0x0093] = 85; // Set transmission rate
	bcps[0x0094] = 85; // Cancel character
	bcps[0x0095] = 85; // Message waiting
	bcps[0x0099] = 85; // Unassigned control
	bcps[0x009D] = 85; // Operating system command
	/*bcps[0x0378] = 85; // Unassigned
	bcps[0x0379] = 85; // Unassigned
	bcps.fill(85, 0x0380, 0x0384); // Unassigned
	bcps[0x038B] = 85; // Unassigned
	bcps[0x038D] = 85; // Unassigned
	bcps[0x03A2] = 85; // Unassigned
	bcps[0x0530] = 85; // Unassigned
	bcps[0x0557] = 85; // Unassigned
	bcps[0x0590] = 85; // Unassigned
	bcps.fill(85, 0x05CA, 0x05D0); // Unassigned
	bcps.fill(85, 0x05EB, 0x05EF); // Unassigned
	bcps.fill(85, 0x05F5, 0x0600); // Unassigned
	bcps[0x070E] = 85; // Unassigned
	bcps[0x074B] = 85; // Unassigned
	bcps[0x074C] = 85; // Unassigned
	bcps.fill(85, 0x07B2, 0x07C0); // Unassigned
	bcps[0x07FB] = 85; // Unassigned
	bcps[0x07FC] = 85; // Unassigned
	bcps[0x082E] = 85; // Unassigned
	bcps[0x082F] = 85; // Unassigned
	bcps[0x083F] = 85; // Unassigned
	bcps[0x085C] = 85; // Unassigned
	bcps[0x085D] = 85; // Unassigned
	bcps[0x085F] = 85; // Unassigned
	bcps.fill(85, 0x086B, 0x0870); // Unassigned
	bcps.fill(85, 0x0892, 0x0897); // Unassigned
	bcps[0x0B80] = 85; // Unassigned
	bcps[0x0B81] = 85; // Unassigned
	bcps[0x0B84] = 85; // Unassigned
	bcps[0x0B8B] = 85; // Unassigned
	bcps[0x0B8C] = 85; // Unassigned
	bcps[0x0B8D] = 85; // Unassigned
	bcps[0x0B91] = 85; // Unassigned
	bcps[0x0B96] = 85; // Unassigned
	bcps[0x0B97] = 85; // Unassigned
	bcps[0x0B98] = 85; // Unassigned
	bcps[0x0B9B] = 85; // Unassigned
	bcps[0x0B9D] = 85; // Unassigned
	bcps[0x0BA0] = 85; // Unassigned
	bcps[0x0BA1] = 85; // Unassigned
	bcps[0x0BA2] = 85; // Unassigned
	bcps[0x0BA5] = 85; // Unassigned
	bcps[0x0BA6] = 85; // Unassigned
	bcps[0x0BA7] = 85; // Unassigned
	bcps[0x0BAB] = 85; // Unassigned
	bcps[0x0BAC] = 85; // Unassigned
	bcps[0x0BAD] = 85; // Unassigned
	bcps.fill(85, 0x0BBA, 0x0BBE); // Unassigned
	bcps[0x0BC3] = 85; // Unassigned
	bcps[0x0BC4] = 85; // Unassigned
	bcps[0x0BC5] = 85; // Unassigned
	bcps[0x0BC9] = 85; // Unassigned
	bcps[0x0BCE] = 85; // Unassigned
	bcps[0x0BCF] = 85; // Unassigned
	bcps.fill(85, 0x0BD1, 0x0BD7); // Unassigned
	bcps.fill(85, 0x0BD8, 0x0BE6); // Unassigned
	bcps.fill(85, 0x0BFB, 0x0C00); // Unassigned
	bcps[0x0F48] = 85; // Unassigned
	bcps[0x0F6D] = 85; // Unassigned
	bcps[0x0F6E] = 85; // Unassigned
	bcps[0x0F6F] = 85; // Unassigned
	bcps[0x0F98] = 85; // Unassigned
	bcps[0x0FDB] = 85; // Unassigned
	bcps[0x0FDC] = 85; // Unassigned
	bcps.fill(85, 0x0FE0, 0x1000); // Unassigned*/
	await Deno.writeTextFile("./src/data/generated/bcps.txt", bitFieldPack(bcps).toBase64());
};