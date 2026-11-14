// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	LeafDirEntry,
	LeafFileInfo
} from "./translate.mjs";
import { LeafFsFile } from "./handle.mjs";

import {Readable as NodeReadable} from "node:stream";
import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;

export async function lstat(path) {
	return new LeafFileInfo(await NodeAsyncFs.lstat(path, {
		"bigint": false,
		"throwIfNoEntry": true
	}));
};
export function lstatSync(path) {
	return new LeafFileInfo(NodeFs.lstatSync(path, {
		"bigint": false,
		"throwIfNoEntry": true
	}));
};

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
	return new LeafFsFile(path, options);
};
/** @param {import("../../index/index.d.mts").LeafOpenOptions} options */
export function openSync(path, options) {
	return new LeafFsFile(path, options);
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

export async function readLink(path) {
	return await NodeAsyncFs.readlink(path);
};
export function readLinkSync(path) {
	return NodeFs.readlinkSync(path);
};

export async function realPath(path) {
	return await NodeAsyncFs.realpath(path, {
		"encoding": "utf-8"
	});
};
export function realPathSync(path) {
	return NodeFs.realpathSync(path, {
		"encoding": "utf-8"
	});
};

export async function stat(path) {
	return new LeafFileInfo(await NodeAsyncFs.stat(path, {
		"bigint": false,
		"throwIfNoEntry": true
	}));
};
export function statSync(path) {
	return new LeafFileInfo(NodeFs.statSync(path, {
		"bigint": false,
		"throwIfNoEntry": true
	}));
};