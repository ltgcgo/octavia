"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/chord/chords.tsv")).readable))) {
	console.debug(line);
};
