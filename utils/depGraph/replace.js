"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

const replaceMap = new Map();
for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./conf/depGraph.tsv")).readable))) {
	if (line.from && line.to) {
		replaceMap.set(line.from, line.to);
	};
};

let textBuffer = await Deno.readTextFile(Deno.args[0]);
for (const [k, v] of replaceMap) {
	textBuffer = textBuffer.replaceAll(`from "${k}"`, `from "${v}"`);
};
await Deno.writeTextFile(`${Deno.args[0]}.tmp`, textBuffer);
