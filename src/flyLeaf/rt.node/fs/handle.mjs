// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import * as NodeFs from "node:fs";
import * as NodeStream from "node:stream";

import {
	linuxOpenFlags
} from "./translate.mjs";

export class LeafFsFile {
	/** @type {boolean} */
	#closed = false;
	/** @type {boolean} */
	#closedFd = true;
	/** @type {number} */
	#fileDescriptor;
	/** @type {import("../../index/index.d.mts").LeafOpenOptions} */
	#flags;
	/** @type {string} */
	#path;
	#getFd() {
		if (this.#closed) return false;
		if (!this.#closedFd) {
			if (Number.isInteger(this.#fileDescriptor)) return true;
		};
		this.#fileDescriptor = NodeFs.openSync(this.#path, linuxOpenFlags(this.#flags), this.#flags?.mode);
		this.#closedFd = false;
		return true;
	};
	#closeFd() {
		if (this.#closedFd) return;
		this.#closedFd = true;
		if (Number.isInteger(this.#fileDescriptor)) {
			try {
				NodeFs.closeSync(this.#fileDescriptor);
			} catch (err) {};
			this.#fileDescriptor = undefined;
		};
	};
	close() {
		this.#closeFd();
		this.#closed = true;
	};
	/** @param {string|URL} path
	* @param {import("../../index/index.d.mts").LeafOpenOptions} flags  */
	constructor(path, flags = {}) {
		this.#path = path;
		this.#flags = flags;
		this.#getFd();
	};
	get readable() {
		if (!this.#getFd()) {
			throw(new Error(`File has not been active.`));
		};
		const stream = NodeFs.createReadStream(this.#path, {
			"fd": this.#fileDescriptor
		});
		stream.once("close", () => {
			this.close();
		});
		return NodeStream.Readable.toWeb(stream);
	};
};

export const FsFile = LeafFsFile;