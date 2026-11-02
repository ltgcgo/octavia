"use strict";

import {
	MICC_parseSmf
} from "../../src/micc/index.mjs";

const test_parseSmf = async (readableStream) => {
	const sequence = MICC_parseSmf(readableStream);
	await sequence.finalised;
	return sequence;
};

export {
	test_parseSmf
};