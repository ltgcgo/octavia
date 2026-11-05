// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

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