// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

// Key order matches the real Deno.
export class LeafDirEntry {
	/** @type {string} */
	name;
	/** @type {boolean} */
	isDirectory;
	/** @type {boolean} */
	isFile;
	/** @type {boolean} */
	isSymlink;
};

// Key order matches the real Deno.
export class LeafFileInfo {
	/** @type {boolean} */
	isFile;
	/** @type {boolean} */
	isDirectory;
	/** @type {boolean} */
	isSymlink;
	/** @type {number} */
	size;
	/** @type {Date?} */
	mtime;
	/** @type {Date?} */
	atime;
	/** @type {Date?} */
	birthtime;
	/** @type {Date?} */
	ctime;
	/** @type {number} */
	dev;
	/** @type {number?} */
	mode;
	/** @type {number?} */
	ino;
	/** @type {number?} */
	nlink;
	/** @type {number?} */
	uid;
	/** @type {number?} */
	gid;
	/** @type {number?} */
	rdev;
	/** @type {number?} */
	blksize;
	/** @type {number?} */
	blocks;
	/** @type {boolean?} */
	isBlockDevice;
	/** @type {boolean?} */
	isCharDevice;
	/** @type {boolean?} */
	isFifo;
	/** @type {boolean?} */
	isSocket;
};

export class LeafFsEvent {
	/** @type {null|"rescan"} */
	flag;
	/** @type {"access"|"create"|"modify"|"remove"|"rename"|"other"|"any"} */
	kind;
	/** @type {string[]} */
	path = [];
};