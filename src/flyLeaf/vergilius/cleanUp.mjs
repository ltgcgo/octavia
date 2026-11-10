// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { parseUaName } from "../common/util/uaParse.mjs";
import {
	getRestrictedView,
	setInternalOnlyProperty,
	stripScriptSourceUrl,
    wrapProxies
} from "./restrict.mjs";
import { getAllowOldWeb } from "./config.mjs";
import { _leaf_yield_ } from "../common/util/overlay.mjs";

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

const RealEval = globalThis.eval;
const RealFunction = globalThis.Function;

const NodeProcess = globalThis.process;
const NodeClassBuffer = globalThis.Buffer;
const NodeClearImmediate = globalThis.clearImmediate;

const CleanedNodeEnv = NodeProcess && self.Bun && {};
const OverlaidNodeProcess = NodeProcess && self.Bun && _leaf_yield_(NodeProcess, {
	"env": {
		"value": CleanedNodeEnv,
		"writable": true,
		"enumerable": true,
		"configurable": true
	}
}, true);

/*const MITMToString = function toString() {
	return "function Function() {\n    [native code]\n}";
};
MITMToString.toString = MITMToString;
const MITMEval = (function MITMEval(script) {
	if (typeof script === "string") {
		return RealEval(stripScriptSourceUrl(script));
	} else {
		return RealEval(script);
	};
}).bind(globalThis);&/
/*delete MITMEval.name;
Object.defineProperty(MITMEval, "name", {
	"value": "eval",
	"configurable": true,
	"writable": false,
	"enumerable": false,
});*/
//MITMEval.toString = MITMToString;
/*const MITMFunction = class Function extends RealFunction {
	constructor(...args) {
		if (args.length > 0) {
			const scriptBody = args[args.length - 1];
			if (typeof scriptBody === "string") {
				const tamperedArgs = args.slice(0, args.length - 1);
				tamperedArgs.push(stripScriptSourceUrl(scriptBody));
				super(...tamperedArgs);
			} else {
				super(...args);
			};
		} else {
			super();
		};
	}
};*/
//MITMFunction.toString = MITMToString;
const MITMEval = new Proxy(RealEval, {
	"apply": function mitmEval(target, thisArg, args) {
		const [script] = args;
		if (typeof script === "string") {
			const tamperedScript = stripScriptSourceUrl(script);
			//console.info(tamperedScript);
			return target.apply(thisArg, [tamperedScript]);
		} else {
			return target.apply(thisArg, args);
		};
	}
});
const MITMFunction = new Proxy(RealFunction, {
	"apply": function mitmFuncExec(target, thisArg, args) {
		if (args.length > 0) {
			const scriptBody = args[args.length - 1];
			if (typeof scriptBody === "string") {
				const tamperedArgs = args.slice(0, args.length - 1);
				tamperedArgs.push(stripScriptSourceUrl(scriptBody));
				return RealFunction.apply(thisArg, tamperedArgs);
			} else {
				return RealFunction.apply(thisArg, args);
			};
		} else {
			return RealFunction.apply(thisArg, args);
		};
	},
	"construct": function mitmFuncNew(target, args) {
		if (args.length > 0) {
			const scriptBody = args[args.length - 1];
			if (typeof scriptBody === "string") {
				const tamperedArgs = args.slice(0, args.length - 1);
				tamperedArgs.push(stripScriptSourceUrl(scriptBody));
				return Reflect.construct(RealFunction, tamperedArgs);
			} else {
				return Reflect.construct(RealFunction, args);
			};
		} else {
			return Reflect.construct(RealFunction, args);
		};
	}
})/*RealFunction*/;

/** @param {import("../index/index.d.mts")} denoCompatible */
export function executeCleanUp(thisTarget = globalThis, denoCompatible = thisTarget.Ende ?? thisTarget.Deno) {
	removeProperties(thisTarget, [
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
		/* removeProperties(thisTarget, [
			"escape",
			"eval",
			"unescape"
		]); */ // Eval may need an interceptor.
		//thisTarget.eval = wrapProxies(MITMEval, ["eval"], true);
		thisTarget.eval = MITMEval;
		//thisTarget.Function = wrapProxies(MITMFunction, ["Function"], true);
		thisTarget.Function = MITMFunction;
		removeProperties(thisTarget.Date.prototype, [
			"getYear",
			"setYear",
			"toGMTString"
		]);
		removeProperties(thisTarget.String.prototype, [
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

	if (
		denoCompatible?.version.versions?.deno?.length ||
		denoCompatible?.version.backend === "Deno" ||
		denoCompatible?.version.backend === "Ende"
	) {
		// Deno/Ende
	} else if (thisTarget.Ant) {
	} else if (thisTarget.Bun) {
		// Bun
		// env.NODE_DEBUG: Why the hell are using Fly Leaf if you want this?
		// env.NODE_USE_ENV_PROXY: Unless `fetch` is affected (which it isn't), there is no reason to pass it through. Same goes for Node.js as well.
		const gatedProcess = getRestrictedView(OverlaidNodeProcess, [
			"_exiting",
			"availableMemory",
			"binding",
			"env",
			"nextTick"
		], "process", false);
		thisTarget.process = gatedProcess;
	} else if (NodeProcess) {
		switch (parseUaName(thisTarget.navigator?.userAgent)?.toLowerCase()) {
			case "porffor": {
				break;
			};
			case "node.js":
			default: {
				// Node.js
				setInternalOnlyProperty(thisTarget, "Buffer", NodeClassBuffer);
				setInternalOnlyProperty(thisTarget, "clearImmediate", NodeClearImmediate);
				thisTarget.global = getRestrictedView(thisTarget, [
					"FinalizationRegistry"
				], "global", false);
			};
		};
	};
};