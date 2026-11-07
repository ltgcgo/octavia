// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import { parseUaName } from "../common/util/uaParse.mjs";
import {
	getRestrictedView,
	setInternalOnlyProperty
} from "./restrict.mjs";
import { getAllowOldWeb } from "./config.mjs";

// The very last step to clean runtimes up. Do not run during API initialisation!
/** @param {Iterable<string>} keys */
const removeProperties = (target, keys = []) => {
	for (const key of keys) {
		try {
			if (Object.hasOwn(target, key)) {
				delete target[key];
				continue;
			};
			if (target[key] != null) delete target[key];
		} catch (err) {
			console.warn(`Removal of "${key}" has failed. ${err.name}: ${err.message}`);
		};
	};
};

const NodeProcess = globalThis.process;
const NodeClassBuffer = globalThis.Buffer;
const NodeClearImmediate = globalThis.clearImmediate;

removeProperties(globalThis, [
	"__dirname",
	"__filename",
	"Buffer",
	"HTMLRewriter", // Bun-specific.
	"async_hooks",
	"buffer",
	"child_process",
	"clearImmediate",
	"cluster",
	"constants",
	"dgram",
	"diagnostics_channel",
	"dns",
	"domain",
	"events",
	"exports",
	"fs",
	"global",
	"http",
	"http2",
	"https",
	"inspector",
	"jsc", // Bun-specific.
	"module",
	"net",
	"os",
	"path",
	"perf_hooks",
	"process",
	"punycode",
	"querystring",
	"readline",
	"repl",
	"require",
	"setImmediate",
	"stream",
	"string_decoder",
	"sys",
	"timers",
	"tls",
	"trace_events",
	"tty",
	"url",
	"util",
	"v8",
	"vm",
	"wasi",
	"worker_threads",
	"zlib"
]);
if (!getAllowOldWeb()) {
	// Remove certain deprecated web features
	removeProperties(globalThis, [
		"escape",
		"eval",
		"unescape"
	]);
	removeProperties(Date.prototype, [
		"getYear",
		"setYear",
		"toGMTString"
	]);
	removeProperties(String.prototype, [
		"anchor",
		"big",
		"blink",
		"bold",
		"fixed",
		"fontcolor",
		"fontsize",
		"italics",
		"link",
		"small",
		"strike",
		"sub",
		"sup",
		"trimLeft",
		"trimRight"
	]);
};

/** @type {import("../index/index.d.mts")} */
const denoCompatible = globalThis.Ende ?? globalThis.Deno;
if (
	denoCompatible?.version.versions?.deno?.length ||
	denoCompatible?.version.backend === "Deno" ||
	denoCompatible?.version.backend === "Ende"
) {
	// Deno/Ende
} else if (globalThis.Ant) {
} else if (globalThis.Bun) {
	// Bun
	globalThis.process = getRestrictedView(NodeProcess, [
		"_exiting",
		"availableMemory",
		"nextTick"
	], "process", false);
} else if (NodeProcess) {
	switch (parseUaName(globalThis.navigator?.userAgent)?.toLowerCase()) {
		case "porffor": {
			break;
		};
		case "node.js":
		default: {
			// Node.js
			setInternalOnlyProperty(globalThis, "Buffer", NodeClassBuffer);
			setInternalOnlyProperty(globalThis, "clearImmediate", NodeClearImmediate);
			globalThis.global = getRestrictedView(globalThis, [
				"FinalizationRegistry"
			], "global", false);
		};
	};
};