// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	LeafDirEntry as CommonDirEntry
} from "../../common/class/fsInfo.mjs";

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