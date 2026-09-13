// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const testCase = globalThis?.Deno?.test ?? (await import("node:test"))?.test;

const mustEqual = (a, b) => {
	if (a !== b) {
		if (Number.isNaN(a) && Number.isNaN(b)) {
			return;
		};
		throw(new Error("The two values are not equal."));
	};
};
const mustThrow = async (a, b) => {
	if (typeof a === "function") {
		try {
			await a();
		} catch (err) {
			if (typeof b === "string" && b !== err?.name) {
				throw(new Error("Error name mismatch."));
			};
			return;
		};
		throw(new Error("The function did not fail."));
	};
	throw(new Error("Not a valid function."));
};

export {
	testCase,
	mustEqual,
	mustThrow
};