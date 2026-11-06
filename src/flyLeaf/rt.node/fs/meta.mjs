// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {Readable as NodeReadable} from "node:stream";
import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;

import {
	LeafDirEntry
} from "./translate.mjs";
import { FsFile } from "./handle.mjs";

/** @param {import("../../index/index.d.mts").LeafOpenOptions} options */
export async function mkdir(path, options) {
	await NodeAsyncFs.mkdir(path, options);
};
/** @param {import("../../index/index.d.mts").LeafOpenOptions} options */
export function mkdirSync(path, options) {
	NodeFs.mkdirSync(path, options);
};

/** @param {import("../../index/index.d.mts").LeafOpenOptions} options */
export async function open(path, options) {
	return new FsFile(path, options);
};
/** @param {import("../../index/index.d.mts").LeafOpenOptions} options */
export function openSync(path, options) {
	return new FsFile(path, options);
};

export async function *readDir(path) {
	for (const entry of await NodeAsyncFs.readdir(
		path, {
			"withFileTypes": true
		}
	)) {
		yield new LeafDirEntry(entry);
	};
};
export function *readDirSync(path) {
	for (const entry of NodeFs.readdirSync(
		path, {
			"withFileTypes": true
		}
	)) {
		yield new LeafDirEntry(entry);
	};
};