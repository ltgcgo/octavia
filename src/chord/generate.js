"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

let finalObj = [];

for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/chord/chords.tsv")).readable))) {
	let tmpObj = {};
	if (line.id && line.sp) {
		tmpObj.id = parseInt(line.id, 16);
		tmpObj.sp = line.sp.split(",");
		if (line.xf) {
			tmpObj.xf = parseInt(line.xf, 16);
		};
	};
	finalObj.push(tmpObj);
};

//console.debug(finalObj);

await Deno.writeTextFile("./src/chord/generated/chords.json", JSON.stringify(finalObj));
