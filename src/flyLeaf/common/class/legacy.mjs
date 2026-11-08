// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

export class LeafLegacyResourceIDBearingObject {
	get rid() {
		throw(new TypeError(`Resource IDs are fully deprecated. Use instance methods and properties instead.`));
	};
};