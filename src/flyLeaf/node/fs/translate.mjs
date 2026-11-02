// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import * as NodeFs from "node:fs";
const NodeFsConstant = NodeFs.constants;

import {
	LeafDirEntry as CommonDirEntry
} from "../../common/class/fsInfo.mjs";

/** @param {import("../../index/index.d.mts").LeafOpenOptions} flags */
export function linuxOpenFlags(flags) {
	let result = 0;
	let rwIntermediate = 0;
	if (flags.read == null || flags.read) {
		rwIntermediate |= 1;
	};
	if (flags.write || flags.append) {
		rwIntermediate |= 2;
	};
	switch (rwIntermediate) {
		case 1: {
			result |= NodeFsConstant.O_RDONLY;
			break;
		};
		case 2: {
			result |= NodeFsConstant.O_WRONLY;
			break;
		};
		case 3: {
			result |= NodeFsConstant.O_RDWR;
			break;
		};
		default: {
			throw(new Error(`Must either read or write.`));
		};
	};
	if (flags.append) result |= NodeFsConstant.O_APPEND;
	if (!flags.createNew && flags.truncate) {
		if (!flags.write) {throw new Error(`Truncate requires permission to write.`)};
		result |= NodeFsConstant.O_TRUNC;
	};
	if (!flags.createNew && flags.create) {
		if (!flags.write && !flags.append) {throw new Error(`Create requires permission to write or append.`)};
		result |= NodeFsConstant.O_CREAT;
	};
	if (flags.createNew) {
		if (!flags.write && !flags.append) {throw new Error(`Enforced create requires permission to write or append.`)};
		result |= NodeFsConstant.O_CREAT | NodeFsConstant.O_EXCL
	};
	return result;
};

export class LeafDirEntry extends CommonDirEntry {
	/** @type {import("node:fs").Dirent} */
	#dirent;
	get isDirectory() {
		return this.#dirent.isDirectory();
	};
	get isFile() {
		return this.#dirent.isFile();
	};
	get isSymlink() {
		return this.#dirent.isSymlink();
	};
	/** @param {import("node:fs").Dirent} dirent */
	constructor(dirent) {
		super();
		this.name = dirent.name;
		this.#dirent = dirent;
		delete this.isDirectory;
		delete this.isFile;
		delete this.isSymlink;
	};
};