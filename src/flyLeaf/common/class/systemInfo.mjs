// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

/** @extends {Record<string, string>} */
export class LeafEnvSnapshot {
	/** @param {Iterable<[string, string]>|Record<string, string>} source */
	constructor(source) {
		if (source) {
			if (typeof source[Symbol.iterator] === "function") {
				for (const [key, value] of source) {
					this[key] = value;
				};
			} else {
				for (const key in source) {
					this[key] = source[key];
				};
			};
		};
	};
};
export class LeafMemoryUsage {
	/** @type {number} */
	external;
	/** @type {number} */
	heapTotal;
	/** @type {number} */
	heapUsed;
	/** @type {number} */
	rss;
	constructor(source) {
		if (source) {
			this.external = source.external;
			this.heapTotal = source.heapTotal;
			this.heapUsed = source.heapUsed;
			this.rss = source.rss;
		};
	};
};