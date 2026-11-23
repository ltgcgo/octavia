// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

// Exact order of Deno 2.9.8.
export class LeafTeletypeDimensions {
	columns = 0;
	rows = 0;
	constructor(rows, columns) {
		this.columns = columns;
		this.rows = rows;
	};
};