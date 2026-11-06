// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	toDenoArch,
	toLtgcArch,
	toDenoOs
} from "../util/ambient.mjs";

export default class LeafBuildInfo {
	/** @type {string} */
	target;
	/** @type {string} */
	arch;
	/** @type {string} */
	os;
	/** @type {string} */
	vendor; // The most pointless property.
	/** @type {string?} */
	env;
	standalone = false;
	/** @type {string} */
	archNormal;
	/** @param {string} os
	* @param {string} arch
	* @param {string?} vendor
	* @param {string?} target */
	constructor(os, arch, vendor, target) {
		this.os = toDenoOs(os) ?? os;
		this.arch = toDenoArch(arch) ?? arch;
		this.archNormal = toLtgcArch(arch) ?? arch;
		switch (this.os) {
			case "android": {
				this.vendor = "linux";
				break;
			};
			case "darwin": {
				this.vendor = "apple";
				break;
			};
			case "windows": {
				this.vendor = "pc";
				break;
			};
			default: {
				this.vendor = vendor ?? "unknown";
			};
		};
		this.target = target ?? `${this.arch}-${this.vendor}-${this.os}`;
	};
};