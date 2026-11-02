"use strict";

import {
	MICC_parseSmf
} from "../../src/micc/index.mjs";

const test_parseSmf = async (fileObject) => {
	const sequence = MICC_parseSmf(fileObject.readable);
	await sequence.finalised;
	return sequence;
};

export {
	test_parseSmf
};