// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

export default class LeafVersion {
	/** Set by runtime loaders.
	* @type {string} */
	backend;
	/** @type {string} */
	deno = "2.9.8";
	/** @type {string?} */
	ende;
	/** Set by runtime loaders.
	* @type {string} */
	engine;
	/** @type {string} */
	flyLeaf = "0.0.1";
	/** @type {boolean} */
	asyncOnly;
	/** @type {string?} */
	typescript;
	/** @type {string} */
	v8;
	/** @type {import("../../index/index/env.d.mts").DenoVersion|import("../../index/index/env.d.mts").NodeVersion} */
	versions;
	/** @param {import("../../index/index/env.d.mts").NodeVersion|undefined} nodeVersions
	* @param {import("../../index/index/env.d.mts").DenoVersion|undefined} versions  */
	constructor(nodeVersions, versions) {
		if (nodeVersions) {
			if (nodeVersions.v8) this.v8 = nodeVersions.v8;
			this.versions = nodeVersions;
		};
		if (versions) {
			if (versions.deno) this.deno = versions.deno;
			if (versions.ende) this.ende = versions.ende;
			if (versions.typescript) this.typescript = versions.typescript;
			if (versions.v8) this.v8 = versions.v8;
			if (!this.versions) {
				this.versions = versions;
			};
		};
	};
};