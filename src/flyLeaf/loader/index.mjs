// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import Leaf from "../index/index.mjs";
import { _leaf_copyTo_ } from "../common/util/overlay.mjs";
import * as LeafPolyfills from "../vergilius/ponyfill/leaf.mjs";

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

// Apply web polyfills requiring the Deno global.
_leaf_copyTo_(self, LeafPolyfills);

// Final clean-up.
await import("../vergilius/cleanUp.mjs");