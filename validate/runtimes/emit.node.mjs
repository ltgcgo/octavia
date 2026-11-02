"use strict";

import FailRecord from "../common/failRecord.mjs";
import jsonPrettifier from "../common/jsonPrettifier.mjs";

import {
	test_parseSmf
} from "./emit.method.mjs";

// Eugh!
import {Readable as NodeReadable} from "node:stream";
import {promises as NodeAsyncFs} from "node:fs";

await (async function emit() {
	/** @type {FailRecord[]} */
	const errorHistory = [];
	for (const dirEntry of await NodeAsyncFs.readdir("./cache/source", {
		"withFileTypes": true
	})) {
		if (!dirEntry.isFile()) continue;
		console.info(`Generating the export of "${dirEntry.name}"...`);
		const fileObject = await NodeAsyncFs.open(`./cache/source/${dirEntry.name}`);
		const fileStream = NodeReadable.toWeb(fileObject.createReadStream());
		try {
			await NodeAsyncFs.writeFile(
				`./cache/validate/MICC.MICC_parseSmf/node/${dirEntry.name}.json`,
				JSON.stringify(
					await test_parseSmf(fileStream),
					jsonPrettifier,
					"\t"
				)
			);
		} catch (err) {
			errorHistory.push(new FailRecord(dirEntry.name, 0, err));
			//console.error(err);
		};
	}
	if (errorHistory.length > 0) {
		for (const record of errorHistory) {
			console.debug(record);
		};
	};
})();