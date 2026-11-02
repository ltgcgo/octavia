// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;

import { linuxOpenFlags } from "./translate.mjs";

/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export async function writeFile(path, data, options = {}) {
	if (data?.constructor !== Uint8Array) {
		throw(new TypeError(`Data must be Uint8Array.`));
	};
	await NodeAsyncFs.writeFile(path, data, {
		"flush": true,
		"mode": options.mode,
		"flag": linuxOpenFlags(options)
	});
};
/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export function writeFileSync(path, data, options = {}) {
	if (data?.constructor !== Uint8Array) {
		throw(new TypeError(`Data must be Uint8Array.`));
	};
	NodeFs.writeFileSync(path, data, {
		"flush": true,
		"mode": options.mode,
		"flag": linuxOpenFlags(options)
	});
};
/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export async function writeTextFile(path, data, options = {}) {
	if (typeof data !== "string") {
		throw(new TypeError(`Data must be string.`));
	};
	await NodeAsyncFs.writeFile(path, data, {
		"flush": true,
		"mode": options.mode,
		"flag": linuxOpenFlags(options)
	});
};
/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export function writeTextFileSync(path, data, options = {}) {
	if (typeof data !== "string") {
		throw(new TypeError(`Data must be string.`));
	};
	NodeFs.writeFileSync(path, data, {
		"flush": true,
		"mode": options.mode,
		"flag": linuxOpenFlags(options)
	});
};