// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

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

export class LeafFileInfo {
	/** @type {Date?} */
	atime;
	/** @type {Date?} */
	birthtime;
	/** @type {number?} */
	blksize;
	/** @type {number?} */
	blocks;
	/** @type {Date?} */
	ctime;
	/** @type {number} */
	dev;
	/** @type {number?} */
	gid;
	/** @type {number?} */
	ino;
	/** @type {boolean?} */
	isBlockDevice;
	/** @type {boolean?} */
	isCharDevice;
	/** @type {boolean} */
	isDirectory;
	/** @type {boolean?} */
	isFifo;
	/** @type {boolean} */
	isFile;
	/** @type {boolean?} */
	isSocket;
	/** @type {boolean} */
	isSymlink;
	/** @type {number?} */
	mode;
	/** @type {Date?} */
	mtime;
	/** @type {number?} */
	nlink;
	/** @type {number?} */
	rdev;
	/** @type {number} */
	size;
	/** @type {number?} */
	uid;
};

export class LeafFsEvent {
	/** @type {null|"rescan"} */
	flag;
	/** @type {"access"|"create"|"modify"|"remove"|"rename"|"other"|"any"} */
	kind;
	/** @type {string[]} */
	path = [];
};