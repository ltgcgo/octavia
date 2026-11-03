// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

if (!globalThis.self) globalThis.self = globalThis;

const debugMsg = false;

/** @type {typeof import("./index.d.mts")} */
let flyLeafGlobals;
if (self.Ende) {
	debugMsg && console.debug(`Selected backend: Ende.`);
	flyLeafGlobals = await import("../rt.ende/index.mjs");
} else if (self.Deno) {
	debugMsg && console.debug(`Selected backend: Deno.`);
	flyLeafGlobals = await import("../rt.deno/index.mjs");
} else if (self.Ant) {
	debugMsg && console.debug(`Selected backend: Ant.`);
	flyLeafGlobals = await import("../rt.ant/index.mjs");
} else if (self.Bun) {
	debugMsg && console.debug(`Selected backend: Bun.`);
	flyLeafGlobals = await import("../rt.bun/index.mjs");
} else if (self.process || self.require) {
	debugMsg && console.debug(`Selected backend: Node.`);
	flyLeafGlobals = await import("../rt.node/index.mjs");
};

flyLeafGlobals.version.asyncOnly = false;

const {
	LeafFsFile,

	version,

	open,
	openSync,
	readDir,
	readDirSync,
	writeFile,
	writeFileSync,
	writeTextFile,
	writeTextFileSync
} = flyLeafGlobals;

export {
	LeafFsFile as FsFile,
	LeafFsFile,

	version,

	open,
	openSync,
	readDir,
	readDirSync,
	writeFile,
	writeFileSync,
	writeTextFile,
	writeTextFileSync
};
export default flyLeafGlobals;