// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { getRandom16 } from "../../common/method/random.mjs";
import { LeafFsFile } from "./handle.mjs";

import * as NodeFs from "node:fs";
const NodeAsyncFs = NodeFs.promises;
import NodeOs from "node:os";
import NodePath from "node:path";
import NodeProcess from "node:process";

const failureRetries = 3;
let umaskCache = NodeProcess.umask(0o000);
NodeProcess.umask(umaskCache);

/** @param {import("../../index/index.d.mts").LeafMakeTempOptions} options */
const getTempPath = function (options) {
	return NodePath.join(options?.dir ?? NodeProcess.env["TMPDIR"] ?? NodeOs.tmpdir(), `${options?.prefix ?? ""}${getRandom16()}${options?.suffix ?? ""}`);
};

export async function chmod(path, mode) {
	await NodeAsyncFs.chmod(path, mode);
};
export function chmodSync(path, mode) {
	NodeFs.chmodSync(path, mode);
};

export async function chown(path, uid, gid) {
	await NodeAsyncFs.chown(path, uid, gid);
};
export function chownSync(path, uid, gid) {
	NodeFs.chownSync(path, uid, gid);
};

export async function copyFile(sourcePath, targetPath) {
	const stat = await NodeAsyncFs.stat(sourcePath);
	await NodeAsyncFs.copyFile(sourcePath, targetPath, NodeFs.constants.COPYFILE_FICLONE);
	await NodeAsyncFs.chmod(targetPath, stat.mode);
};
export function copyFileSync(sourcePath, targetPath) {
	const stat = NodeFs.statSync(sourcePath);
	NodeFs.copyFileSync(sourcePath, targetPath, NodeFs.constants.COPYFILE_FICLONE);
	NodeFs.chmodSync(targetPath, stat.mode);
};

export async function create(path) {
	return new LeafFsFile(path, {
		"write": true,
		"create": true,
		"truncate": true
	});
};
export function createSync(path) {
	return new LeafFsFile(path, {
		"write": true,
		"create": true,
		"truncate": true
	});
};

export async function link(sourcePath, targetPath) {
	await NodeAsyncFs.link(targetPath, sourcePath);
};
export function linkSync(sourcePath, targetPath) {
	NodeFs.linkSync(targetPath, sourcePath);
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

export async function rename(sourcePath, targetPath) {
	await NodeAsyncFs.rename(sourcePath, targetPath);
};
export function renameSync(sourcePath, targetPath) {
	NodeFs.renameSync(sourcePath, targetPath);
};

/** @param {import("../../index/index.d.mts").LeafSymlinkOptions} options */
export async function symlink(sourcePath, targetPath, options) {
	await NodeAsyncFs.symlink(targetPath, sourcePath, options?.type);
};
/** @param {import("../../index/index.d.mts").LeafSymlinkOptions} options */
export function symlinkSync(sourcePath, targetPath, options) {
	NodeFs.symlinkSync(targetPath, sourcePath, options?.type);
};

export async function truncate(name, size) {
	await NodeAsyncFs.truncate(name, size);
};
export function truncateSync(name, size) {
	NodeFs.truncateSync(name, size);
};

export function umask(mask) {
	if (typeof mask === "number") {
		const result = NodeProcess.umask(mask);
		umaskCache = mask;
		return result;
	} else if (mask == null) {
		return umaskCache;
	} else {
		throw(new TypeError(`Invalid umask type.`));
	};
};

export async function utime(path, atime, mtime) {
	await NodeAsyncFs.utimes(path, atime, mtime);
};
export function utimeSync(path, atime, mtime) {
	NodeFs.utimesSync(path, atime, mtime);
};