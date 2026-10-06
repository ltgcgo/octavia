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

{
	const trackVendors = {};
	for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/trackVendors.tsv")).readable))) {
		trackVendors[line.type] = line.vendor;
	};
	await Deno.writeTextFile("./src/data/generated/trackVendors.json", JSON.stringify(trackVendors));
};

{
	// Blocklisted code points
	const bcps = new Uint8Array(256);
	// 0xFF: immediate denial
	// 0xA0: immediate denial when fatal
	// 0x80: Stricter coverage cap
	// 0x40: looser coverage cap
	bcps[0x0000] = 0xA0; // Null
	bcps[0x0001] = 0xFF; // Start of heading
	bcps[0x0002] = 0xFF; // Start of text
	bcps[0x0003] = 0xFF; // End of text
	bcps[0x0004] = 0xFF; // End of transmission
	bcps[0x0005] = 0xFF; // Enquiry
	bcps[0x0006] = 0xFF; // Acknowledge
	//bcps[0x0008] = 0xFF; // Backspace
	bcps[0x000E] = 0xFF; // Shift out (used by some legacy encodings)
	bcps[0x000F] = 0xFF; // Shift in (used by some legacy encodings)
	bcps[0x0010] = 0xFF; // Data link escape
	bcps[0x0011] = 0xFF; // Device control 1
	bcps[0x0012] = 0xFF; // Device control 2
	bcps[0x0013] = 0xFF; // Device control 3
	bcps[0x0014] = 0xFF; // Device control 4
	bcps[0x0015] = 0xFF; // Negative acknowledge
	bcps[0x0016] = 0xFF; // Synchronous idle
	bcps[0x0017] = 0xFF; // End of transmission block
	bcps[0x0018] = 0xFF; // Cancel
	bcps[0x0019] = 0xFF; // End of medium
	bcps[0x001A] = 0xFF; // Substitute (superceded by 0xFFFD)
	bcps[0x001B] = 0xFF; // Escape (used by some legacy encodings)
	bcps[0x001C] = 0xFF; // File separator
	bcps[0x001D] = 0xFF; // Group separator
	bcps[0x001E] = 0xFF; // Record separator
	bcps[0x001F] = 0xFF; // Unit separator
	bcps[0x0080] = 0xFF; // Unassigned control
	bcps[0x0081] = 0xFF; // Unassigned control
	bcps[0x0082] = 0xA0; // Break allowed (superceded by ZWS 0x200B)
	bcps[0x0083] = 0xA0; // Break denied (superceded by WJ 0x2060)
	bcps[0x0084] = 0xFF; // Unassigned control, formerly "index"
	bcps[0x0085] = 0xA0; // Next line (superceded by CR/LF, only needed for EBCDIC)
	bcps[0x0086] = 0xA0; // Selection start
	bcps[0x0087] = 0xA0; // Selection end
	bcps[0x0088] = 0xA0; // Character tabulation
	bcps[0x0089] = 0xA0; // Character tabulation with justification
	bcps[0x008A] = 0xA0; // Line tabulation
	bcps[0x008E] = 0xFF; // Single shift two (used by some legacy encodings)
	bcps[0x008F] = 0xFF; // Single shift three (used by some legacy encodings)
	bcps[0x0090] = 0xA0; // Device control string
	bcps[0x0091] = 0xA0; // Private use one
	bcps[0x0092] = 0xA0; // Private use two
	bcps[0x0093] = 0xFF; // Set transmission rate
	bcps[0x0094] = 0xFF; // Cancel character
	bcps[0x0095] = 0xA0; // Message waiting
	bcps[0x0096] = 0xFF; // Guarded area start
	bcps[0x0097] = 0xFF; // Guarded area end
	bcps[0x0098] = 0xA0; // Start of string
	bcps[0x0099] = 0xFF; // Unassigned control
	bcps[0x009A] = 0xFF; // Introduce single character
	bcps[0x009B] = 0xFF; // Introduce control sequence
	bcps[0x009C] = 0xA0; // End of string
	bcps[0x009D] = 0xFF; // Operating system command
	bcps[0x009E] = 0xA0; // Privacy message
	bcps[0x009F] = 0xFF; // Application program command
	bcps.fill(0x80, 0x00A0, 0x00C0); // Normal strings don't have a bunch of symbols.
	bcps.fill(0x40, 0x00C0, 0x0100); // Normal strings don't have way too many diacritics.
	/*bcps[0x0378] = 0xFF; // Unassigned
	bcps[0x0379] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x0380, 0x0384); // Unassigned
	bcps[0x038B] = 0xFF; // Unassigned
	bcps[0x038D] = 0xFF; // Unassigned
	bcps[0x03A2] = 0xFF; // Unassigned
	bcps[0x0530] = 0xFF; // Unassigned
	bcps[0x0557] = 0xFF; // Unassigned
	bcps[0x0590] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x05CA, 0x05D0); // Unassigned
	bcps.fill(0xFF, 0x05EB, 0x05EF); // Unassigned
	bcps.fill(0xFF, 0x05F5, 0x0600); // Unassigned
	bcps[0x070E] = 0xFF; // Unassigned
	bcps[0x074B] = 0xFF; // Unassigned
	bcps[0x074C] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x07B2, 0x07C0); // Unassigned
	bcps[0x07FB] = 0xFF; // Unassigned
	bcps[0x07FC] = 0xFF; // Unassigned
	bcps[0x082E] = 0xFF; // Unassigned
	bcps[0x082F] = 0xFF; // Unassigned
	bcps[0x083F] = 0xFF; // Unassigned
	bcps[0x085C] = 0xFF; // Unassigned
	bcps[0x085D] = 0xFF; // Unassigned
	bcps[0x085F] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x086B, 0x0870); // Unassigned
	bcps.fill(0xFF, 0x0892, 0x0897); // Unassigned
	bcps[0x0B80] = 0xFF; // Unassigned
	bcps[0x0B81] = 0xFF; // Unassigned
	bcps[0x0B84] = 0xFF; // Unassigned
	bcps[0x0B8B] = 0xFF; // Unassigned
	bcps[0x0B8C] = 0xFF; // Unassigned
	bcps[0x0B8D] = 0xFF; // Unassigned
	bcps[0x0B91] = 0xFF; // Unassigned
	bcps[0x0B96] = 0xFF; // Unassigned
	bcps[0x0B97] = 0xFF; // Unassigned
	bcps[0x0B98] = 0xFF; // Unassigned
	bcps[0x0B9B] = 0xFF; // Unassigned
	bcps[0x0B9D] = 0xFF; // Unassigned
	bcps[0x0BA0] = 0xFF; // Unassigned
	bcps[0x0BA1] = 0xFF; // Unassigned
	bcps[0x0BA2] = 0xFF; // Unassigned
	bcps[0x0BA5] = 0xFF; // Unassigned
	bcps[0x0BA6] = 0xFF; // Unassigned
	bcps[0x0BA7] = 0xFF; // Unassigned
	bcps[0x0BAB] = 0xFF; // Unassigned
	bcps[0x0BAC] = 0xFF; // Unassigned
	bcps[0x0BAD] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x0BBA, 0x0BBE); // Unassigned
	bcps[0x0BC3] = 0xFF; // Unassigned
	bcps[0x0BC4] = 0xFF; // Unassigned
	bcps[0x0BC5] = 0xFF; // Unassigned
	bcps[0x0BC9] = 0xFF; // Unassigned
	bcps[0x0BCE] = 0xFF; // Unassigned
	bcps[0x0BCF] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x0BD1, 0x0BD7); // Unassigned
	bcps.fill(0xFF, 0x0BD8, 0x0BE6); // Unassigned
	bcps.fill(0xFF, 0x0BFB, 0x0C00); // Unassigned
	bcps[0x0F48] = 0xFF; // Unassigned
	bcps[0x0F6D] = 0xFF; // Unassigned
	bcps[0x0F6E] = 0xFF; // Unassigned
	bcps[0x0F6F] = 0xFF; // Unassigned
	bcps[0x0F98] = 0xFF; // Unassigned
	bcps[0x0FDB] = 0xFF; // Unassigned
	bcps[0x0FDC] = 0xFF; // Unassigned
	bcps.fill(0xFF, 0x0FE0, 0x1000); // Unassigned*/
	await Deno.writeFile("./src/data/generated/bcps.bin", bcps);
};