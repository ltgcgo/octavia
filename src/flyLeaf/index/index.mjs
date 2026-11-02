// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

if (!globalThis.self) globalThis.self = globalThis;

const debugMsg = false;

/** @type {typeof import("./index.d.mts")} */
let flyLeafGlobals;
if (self.Ende) {
	debugMsg && console.debug(`Selected: Ende.`);
	flyLeafGlobals = await import("../ende/index.mjs");
} else if (self.Deno) {
	debugMsg && console.debug(`Selected: Deno.`);
	flyLeafGlobals = await import("../deno/index.mjs");
} else if (self.Bun) {
	debugMsg && console.debug(`Selected: Bun.`);
	flyLeafGlobals = await import("../bun/index.mjs");
} else if (self.process || self.require) {
	debugMsg && console.debug(`Selected: Node.`);
	flyLeafGlobals = await import("../node/index.mjs");
};

const {
	version
} = flyLeafGlobals;

export {
	version
};
export default flyLeafGlobals;