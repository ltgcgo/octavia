// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { getRandom16 } from "../../common/method/random.mjs";

import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;
import NodeOs from "node:os";
import NodePath from "node:path";
import NodeProcess from "node:process";

const failureRetries = 3;

/** @param {import("../../index/index.d.mts").LeafMakeTempOptions} options */
const getTempPath = function (options) {
	return NodePath.join(options?.dir ?? NodeProcess.env["TMPDIR"] ?? NodeOs.tmpdir(), `${options?.prefix ?? ""}${getRandom16()}${options?.suffix ?? ""}`);
};

/** @param {import("../../index/index.d.mts").LeafMakeTempOptions} options */
export async function makeTempDir(options) {
	for (let i = 0; i < failureRetries; i ++) {
		try {
			const path = getTempPath(options);
			await NodeAsyncFs.mkdir(path, {
				"mode": 0o700,
				"recursive": false
			});
			return path;
		} catch (err) {
			if (err?.code === "EEXIST") continue;
			throw(err);
			break;
		};
	};
	throw(new Error(`Temporary creation failed, ${failureRetries} retries exhausted.`));
};
/** @param {import("../../index/index.d.mts").LeafMakeTempOptions} options */
export function makeTempDirSync(options) {
	for (let i = 0; i < failureRetries; i ++) {
		try {
			const path = getTempPath(options);
			NodeFs.mkdirSync(path, {
				"mode": 0o700,
				"recursive": false
			});
			return path;
		} catch (err) {
			if (err?.code === "EEXIST") continue;
			throw(err);
			break;
		};
	};
	throw(new Error(`Temporary creation failed, ${failureRetries} retries exhausted.`));
};

/** @param {import("../../index/index.d.mts").LeafMakeTempOptions} options */
export async function makeTempFile(options) {
	for (let i = 0; i < failureRetries; i ++) {
		try {
			const path = getTempPath(options);
			const handle = await NodeAsyncFs.open(path, "wx", 0o600);
			try {
				await handle.close();
			} catch (err) {
				await NodeAsyncFs.unlink(path);
				continue;
			};
			return path;
		} catch (err) {
			if (err?.code === "EEXIST") continue;
			throw(err);
			break;
		};
	};
	throw(new Error(`Temporary creation failed, ${failureRetries} retries exhausted.`));
};
/** @param {import("../../index/index.d.mts").LeafMakeTempOptions} options */
export function makeTempFileSync(options) {
	for (let i = 0; i < failureRetries; i ++) {
		try {
			const path = getTempPath(options);
			const handle = NodeFs.openSync(path, "wx", 0o600);
			try {
				NodeFs.closeSync(handle);
			} catch (err) {
				NodeFs.unlinkSync(path);
				continue;
			};
			return path;
		} catch (err) {
			if (err?.code === "EEXIST") continue;
			throw(err);
			break;
		};
	};
	throw(new Error(`Temporary creation failed, ${failureRetries} retries exhausted.`));
};

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