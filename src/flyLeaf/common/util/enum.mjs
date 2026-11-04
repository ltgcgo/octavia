// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

/** @extends {Record<string, string|number>} */
const LeafEnum = class LeafEnum {}

/** Simple TS-compatible enum, with value starting from 0 and increased with the specified step. */
export function linear(keys = [], step = 1) {
	if (!Number.isSafeInteger(step) || step === 0) {
		throw(new RangeError(`Step must be a non-zero integer.`));
	};
	let value = 0;
	const result = new LeafEnum();
	for (const key of keys) {
		result[key] = value;
		value += step;
	};
	return result;
};
/** @param {LeafEnum} source */
export function finalise(source) {
	if (!source) {
		throw(new Error(`Argument must be an object.`));
	};
	const result = new LeafEnum();
	for (const key in source) {
		result[key] = source[key];
		result[source[key]] = key;
	};
	return result;
};