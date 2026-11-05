"use strict";

import * as LeafGlob from "../index/index.mjs";
import LeafDeno from "../index/index.mjs";

const allSymbols = new Set();
for (const symbol in LeafGlob) {
	switch (symbol) {
		case "_leaf_apply_":
		case "_leaf_overlay_":
		case "_leaf_yield_":
		case "default": {
			break;
		};
		default: {
			allSymbols.add(symbol);
		};
	};
};
for (const symbol in LeafDeno) {
	allSymbols.add(symbol);
};

console.debug(`Symbol                  Glob  Default Expected`);
console.debug(`----------------------------------------------`);
for (const symbol of (Array.from(allSymbols.keys())).sort()) {
	console.debug(
		`${
			(symbol ?? "").padEnd(23, " ")
		} ${
			Object.hasOwn(LeafGlob, symbol) ? "true " : "false"
		} ${
			Object.hasOwn(LeafDeno, symbol) ? "true " : "false"
		}   ${
			(
				Object.hasOwn(LeafGlob, symbol) !==
				symbol in LeafGlob._leaf_overlay_
			) ? "true " : "false"
		}`
	);
};