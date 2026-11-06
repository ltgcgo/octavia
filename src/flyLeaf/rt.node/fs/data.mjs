// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;

import {
	linuxWriteFlags
} from "./translate.mjs";

/** @param {Uint8Array|ReadableStream<Uint8Array>} data
* @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export async function writeFile(path, data, options = {}) {
	if (data?.constructor === Uint8Array) {
		await NodeAsyncFs.writeFile(path, data, {
			"flush": true,
			"mode": options.mode,
			"flag": linuxWriteFlags(options),
			"signal": options?.signal
		});
		return;
	} else if (data?.constructor === ReadableStream) {
		await NodeAsyncFs.writeFile(path, (async function *() {
			for await (const chunk of data) {
				if (chunk?.constructor === Uint8Array) {
					yield chunk;
				} else {
					throw(new TypeError(`Data in the stream must be Uint8Array.`));
				};
			};
		})(), {
			"flush": true,
			"mode": options.mode,
			"flag": linuxWriteFlags(options),
			"signal": options?.signal
		});
		return;
	};
	throw(new TypeError(`Data must be Uint8Array.`));
};
/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export function writeFileSync(path, data, options = {}) {
	if (data?.constructor !== Uint8Array) {
		throw(new TypeError(`Data must be Uint8Array.`));
	};
	NodeFs.writeFileSync(path, data, {
		"flush": true,
		"mode": options.mode,
		"flag": linuxWriteFlags(options)
	});
};
/** @param {string|ReadableStream<string>} data
* @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export async function writeTextFile(path, data, options = {}) {
	if (typeof data === "string") {
		await NodeAsyncFs.writeFile(path, data, {
			"flush": true,
			"mode": options.mode,
			"flag": linuxWriteFlags(options)
		});
		return;
	} else if (data?.constructor === ReadableStream) {
		await NodeAsyncFs.writeFile(path, (async function *() {
			for await (const chunk of data) {
				if (typeof chunk === "string") {
					yield chunk;
				} else {
					throw(new TypeError(`Data in the stream must be string.`));
				};
			};
		})(), {
			"flush": true,
			"mode": options.mode,
			"flag": linuxWriteFlags(options)
		});
		return;
	};
	throw(new TypeError(`Data must be string.`));
};
/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} options */
export function writeTextFileSync(path, data, options = {}) {
	if (typeof data !== "string") {
		throw(new TypeError(`Data must be string.`));
	};
	NodeFs.writeFileSync(path, data, {
		"flush": true,
		"mode": options.mode,
		"flag": linuxWriteFlags(options)
	});
};