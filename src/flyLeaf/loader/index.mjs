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

const printTrace = getPrintTrace();
if (printTrace > 0) {
	console.debug(`[\x1b[1;37mFly Leaf\x1b[0m] Preparing clean-up...`);
};

// Final clean-up.
const {executeCleanUp} = await import("../vergilius/cleanUp.mjs");
executeCleanUp(self);

const oldGlobal = globalThis;
if (printTrace > 0 || getPrintInternal()) {
	if (printTrace > 0) {
		console.debug(`[\x1b[1;37mFly Leaf\x1b[0m] Adjusting globals...`);
	};
	const {wrapProxies} = await import("../vergilius/restrict.mjs");
	// So Deno/Ende makes the global "Deno" property read-only huh... Not anymore!
	const oldDeno = self.Deno;
	delete self.Deno;
	self.Deno = wrapProxies(oldDeno, ["Deno"], {
		sniffOnly: true
	});
	if (printTrace > 3) {
		const accessThis = wrapProxies(oldGlobal, ["self"], {
			sniffOnly: true
		});
		oldGlobal.globalThis = accessThis;
		oldGlobal.window = accessThis;
		oldGlobal.self = accessThis;
	};
};

// Apply web polyfills when provided.
Leaf._leaf_web_clearInterval_ && (oldGlobal.clearInterval = Leaf._leaf_web_clearsetInterval_);
Leaf._leaf_web_clearTimeout_ && (oldGlobal.clearTimeout = Leaf._leaf_web_clearTimeout_);
Leaf._leaf_web_setInterval_ && (oldGlobal.setInterval = Leaf._leaf_web_setInterval_);
Leaf._leaf_web_setTimeout_ && (oldGlobal.setTimeout = Leaf._leaf_web_setTimeout_);

// Apply web polyfills requiring the Deno global.
_leaf_copyTo_(oldGlobal, LeafPolyfills);

if (printTrace > 0) {
	const leafVersion = Leaf.version;
	console.debug(`[\x1b[1;37mFly Leaf\x1b[0m] Activated v${leafVersion.flyLeaf}, backend ${leafVersion.backend} v${leafVersion.release ?? "<unknown>"}, Deno v${leafVersion.deno}.`);
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