// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {Readable as NodeReadable} from "node:stream";
import {promises as NodeAsyncFs} from "node:fs";
import * as NodeSyncFs from "node:fs";

import {
	fileUrlToPath
} from "../../common/method/normaliser.mjs";
import {
	LeafDirEntry
} from "./translate.mjs";

export async function *readDir(path) {
	for (const entry of await NodeAsyncFs.readdir(
		fileUrlToPath(path), {
			"withFileTypes": true
		}
	)) {
		yield new LeafDirEntry(entry);
	};
};
export function *readDirSync(path) {
	for (const entry of NodeSyncFs.readdirSync(
		fileUrlToPath(path), {
			"withFileTypes": true
		}
	)) {
		yield new LeafDirEntry(entry);
	};
};