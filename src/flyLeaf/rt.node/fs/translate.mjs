// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	LeafDirEntry as CommonDirEntry,
	LeafFileInfo as CommonFileInfo
} from "../../common/class/fsInfo.mjs";

import * as NodeFs from "node:fs";
const NodeFsConstant = NodeFs.constants;

/** @param {import("../../index/index.d.mts").LeafOpenOptions} flags */
export function linuxOpenFlags(flags) {
	let result = 0;
	let rwIntermediate = 0;
	if (flags.read !== false) {
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

/** @param {import("../../index/index.d.mts").LeafWriteFileOptions} flags */
export function linuxWriteFlags(flags) {
	let result = NodeFsConstant.O_WRONLY;
	if (flags.append) result |= NodeFsConstant.O_APPEND;
	if (!flags.createNew && flags.create !== false) {
		result |= NodeFsConstant.O_CREAT;
	};
	if (flags.createNew) {
		if (!flags.write && !flags.append) {throw new Error(`Enforced create requires permission to write or append.`)};
		result |= NodeFsConstant.O_CREAT | NodeFsConstant.O_EXCL
	};
	return result;
};

export class LeafDirEntry extends CommonDirEntry {
	/** @type {NodeFs.Dirent} */
	#dirent;
	get isDirectory() {
		return this.#dirent.isDirectory();
	};
	get isFile() {
		return this.#dirent.isFile();
	};
	get isSymlink() {
		return this.#dirent.isSymbolicLink();
	};
	/** @param {NodeFs.Dirent} dirent */
	constructor(dirent) {
		super();
		this.name = dirent.name;
		this.#dirent = dirent;
		delete this.isDirectory;
		delete this.isFile;
		delete this.isSymlink;
	};
};

export class LeafFileInfo extends CommonFileInfo {
	/** @param {NodeFs.Stats} fileStat */
	constructor(fileStat) {
		super();
		this.atime = fileStat.atime;
		this.birthtime = fileStat.birthtime;
		this.blksize = fileStat.blksize;
		this.blocks = fileStat.blocks;
		this.ctime = fileStat.ctime;
		this.dev = fileStat.dev;
		this.gid = fileStat.gid;
		this.ino = fileStat.ino;
		this.isBlockDevice = fileStat.isBlockDevice.bind(fileStat);
		this.isCharDevice = fileStat.isCharacterDevice.bind(fileStat);
		this.isDirectory = fileStat.isDirectory.bind(fileStat);
		this.isFifo = fileStat.isFIFO.bind(fileStat);
		this.isFile = fileStat.isFile.bind(fileStat);
		this.isSocket = fileStat.isSocket.bind(fileStat);
		this.isSymlink = fileStat.isSymbolicLink.bind(fileStat);
		this.mode = fileStat.mode;
		this.mtime = fileStat.mtime;
		this.nlink = fileStat.nlink;
		this.rdev = fileStat.rdev;
		this.size = fileStat.size;
		this.uid = fileStat.uid;
	};
};