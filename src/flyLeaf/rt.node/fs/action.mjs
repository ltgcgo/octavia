// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;

/** @param {import("../../index/index.d.mts").LeafRemoveOptions} options */
export async function remove(path, options) {
	await NodeAsyncFs.rm(path, {
		"recursive": options?.recursive
	});
};
/** @param {import("../../index/index.d.mts").LeafRemoveOptions} options */
export function removeSync(path, options) {
	NodeFs.rmSync(path, {
		"recursive": options?.recursive
	});
};