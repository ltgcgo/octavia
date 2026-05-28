"use strict";

import {
	arrayCompare,
	bufferFrom
} from "../../src/state/utils.js";

const fileBuffer = await Deno.readFile(Deno.args[0]);
const fileBufferLast = fileBuffer.length - 1;
const findTarget = bufferFrom("hex", Deno.args[1]);
const reportInterval = (1 << (32 - Math.clz32(fileBuffer.length >>> 4))) - 1;
const getHexString = (value) => {
	return `0x${(value).toString(16).padStart(8, "0")}`;
};

for (let i = 0; i < fileBuffer.length; i ++) {
	let e = fileBuffer[i];
	if ((i & reportInterval) === 0 || i === fileBufferLast) {
		console.debug(`Current position: ${getHexString(i)}.`);
	};
	if (e === findTarget[0]) {
		let compareResult = arrayCompare(fileBuffer.subarray(i, i + findTarget.length), findTarget);
		if (compareResult[0] === 0 && compareResult[1] === 0) {
			console.debug(`Found a match: ${getHexString(i)}.`);
		};
	};
};
