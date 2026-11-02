"use strict";

import FailRecord from "../common/failRecord.mjs";
import jsonPrettifier from "../common/jsonPrettifier.mjs";

import {
	test_parseSmf
} from "./emit.mjs";

await (async function emit() {
	/** @type {FailRecord[]} */
	const errorHistory = [];
	for await (const dirEntry of Ende.readDir("./cache/source")) {
		if (!dirEntry.isFile) continue;
		console.info(`Generating the export of "${dirEntry.name}"...`);
		const fileObject = await Ende.open(`./cache/source/${dirEntry.name}`);
		try {
			await Ende.writeTextFile(
				`./cache/validate/MICC.MICC_parseSmf/ende/${dirEntry.name}.json`,
				JSON.stringify(
					await test_parseSmf(fileObject),
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