// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

// Basic web conformance.

await import("./init.mjs");
await import("./polyfill.mjs");
const {
	init,
	isCallSiteInternal
} = await import("../vergilius/restrict.mjs");
const {executeCleanUp} = await import("./cleanUp.mjs");

executeCleanUp(self);

export {
	init,
	isCallSiteInternal,
	executeCleanUp
};