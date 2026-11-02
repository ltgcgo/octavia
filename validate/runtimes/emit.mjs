"use strict";

import FailRecord from "../common/failRecord.mjs";
import jsonPrettifier from "../common/jsonPrettifier.mjs";

import {
	test_parseSmf
} from "./method.mjs";

const runtimeSmall = Deno.version.backend.toLowerCase();

await (async function emit() {
	/** @type {import("../../src/flyLeaf/index/index.d.mts")} */
	const Deno = self.Deno;
	/** @type {FailRecord[]} */
	const errorHistory = [];
	for await (const dirEntry of Deno.readDir("./cache/source")) {
		if (!dirEntry.isFile) continue;
		console.info(`Generating the export of "${dirEntry.name}"...`);
		const fileObject = await Deno.open(`./cache/source/${dirEntry.name}`);
		try {
			await Deno.writeTextFile(
				`./cache/validate/MICC.MICC_parseSmf/${runtimeSmall}/${dirEntry.name}.json`,
				JSON.stringify(
					await test_parseSmf(fileObject.readable),
					jsonPrettifier,
					"\t"
				)
			);
		} catch (err) {
			errorHistory.push(new FailRecord(dirEntry.name, 0, err));
			//console.error(err);
		};
	};
	if (errorHistory.length > 0) {
		for (const record of errorHistory) {
			console.debug(record);
		};
	};
})();