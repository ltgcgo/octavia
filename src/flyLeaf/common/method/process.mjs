// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** `1` contains `"output"` defaults, and `0` `"spawn"` defaults.
* @template {string} T
* @param {Map<import("../../leaf.full/index.d.mts").LeafStdIoMode, T>} map
* @returns {Record<"stdin"|"stdout"|"stderr", T>[]} */
export function getTranslatedDefault(map) {
	const inherit = map.get("inherit") ?? "inherit";
	const piped = map.get("piped") ?? "piped";
	return [{
		"stdin": inherit,
		"stdout": inherit,
		"stderr": inherit
	}, {
		"stdin": inherit,
		"stdout": piped,
		"stderr": piped
	}];
};