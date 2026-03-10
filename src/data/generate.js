"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

// Master chord map
let finalObj = [];
let spToId = new Map();
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
let qyPlan = [];
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
let psr170Plan = [];
for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/psr170ChordPlan.tsv")).readable))) {
	let plan = [spToId.get(line.chord), parseInt(line.bitfield, 16)];
	psr170Plan.push(plan);
};
//console.debug(psr170Plan);
await Deno.writeTextFile("./src/data/generated/psr170ChordPlan.json", JSON.stringify(psr170Plan));
