// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import Leaf from "../index/index.mjs";

if (!globalThis.self) globalThis.self = globalThis;

if (self.Ende) {
	if (!self.Deno) {
		self.Deno = self.Ende;
	};
};
if (self.Deno) {
	/** @type {typeof Leaf} */
	const denoGlobals = self.Deno;
	denoGlobals.version = Leaf.version;
	denoGlobals.build = Leaf.build;
} else {
	self.Deno = Leaf;
};

// Final clean-up.
await import("../vergilius/cleanUp.mjs");