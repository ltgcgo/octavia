// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import archTables from "../../data/generated/archTables.json" with {type: "json"};
import osTables from "../../data/generated/osTables.json" with {type: "json"};

/** @param {string} sourceArch */
export function toDenoArch(sourceArch, loose = false) {
	let result = archTables.llvm[sourceArch];
	if (!result && loose) {
		result = archTables.ltgc[sourceArch];
	};
	return result;
};
/** @param {string} sourceArch */
export function toLtgcArch(sourceArch) {
	let result = archTables.ltgc[sourceArch];
	return result;
};

/** @param {string} sourceOs */
export function toDenoOs(sourceOs) {
	return osTables[sourceOs];
};