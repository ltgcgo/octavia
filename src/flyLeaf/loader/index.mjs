// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import Leaf from "../index/index.mjs";
import { _leaf_copyTo_ } from "../common/util/overlay.mjs";
import * as LeafPolyfills from "../vergilius/ponyfill/leaf.mjs";
import { getPrintInternal, getPrintTrace } from "../vergilius/config.mjs";

if (!globalThis.self) globalThis.self = globalThis;
if (!self.window) self.window = self;

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
	if (typeof denoGlobals.run !== "function") {
		denoGlobals.run = Leaf.run;
	};
} else {
	self.Deno = Leaf;
};

// Final clean-up.
const {
	executeCleanUp
} = await import("../vergilius/cleanUp.mjs");

const printTrace = getPrintTrace();
const oldGlobal = globalThis;
if (printTrace > 0 || getPrintInternal()) {
	if (printTrace > 0) {
		console.debug(`[Fly Leaf] Adjusting globals...`);
	};
	const {wrapProxies} = await import("../vergilius/restrict.mjs");
	// So Deno/Ende makes the global "Deno" property read-only huh... Not anymore!
	const oldDeno = self.Deno;
	delete self.Deno;
	self.Deno = wrapProxies(oldDeno, ["Deno"], true);
	if (printTrace > 3) {
		const accessThis = wrapProxies(oldGlobal, ["self"], true);
		oldGlobal.globalThis = accessThis;
		oldGlobal.window = accessThis;
		oldGlobal.self = accessThis;
	};
};

// Apply web polyfills requiring the Deno global.
_leaf_copyTo_(oldGlobal, LeafPolyfills);

if (printTrace > 0) {
	const leafVersion = Leaf.version;
	console.debug(`[Fly Leaf] Activated v${leafVersion.flyLeaf}, backend ${leafVersion.backend} v${leafVersion.release ?? "<unknown>"}, Deno v${leafVersion.deno}.`);
};

setTimeout(async () => {
	switch (Leaf.version.backend) {
		case "Node": {
			if (oldGlobal.process) {
				executeCleanUp(oldGlobal, Leaf);
			};
			break;
		};
	};
}, 0);