"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

{
	// Architecture table.
	const toArch = {
		ltgc: {},
		llvm: {},
		gcc: {},
		go: {},
		node: {}
	};
	for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/archTables.tsv")).readable))) {
		const cauldron = new Set([
			line.ltgc, line.go,
			line.llvm, line.gcc,
			line.node
		]);
		if (line.alias?.length) {
			for (const name of line.alias.split(",")) {
				cauldron.add(name);
			};
		};
		for (const arch of cauldron) {
			if (typeof arch !== "string") continue;
			for (const type in toArch) {
				if (line[type]) {
					toArch[type][arch] = line[type];
				};
			};
		};
	};
	await Deno.writeTextFile("./src/data/generated/archTables.json", JSON.stringify(toArch));
};
{
	// OS table.
	const toOs = {};
	for await (let line of DSVParser.parseObjects(0, TextReader.line((await Deno.open("./src/data/osTables.tsv")).readable))) {
		if (line.to?.length) {
			for (const os of line.from.split(",")) {
				toOs[os] = line.to;
			};
		};
	};
	await Deno.writeTextFile("./src/data/generated/osTables.json", JSON.stringify(toOs));
};