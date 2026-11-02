// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

// The final step to clean Node.js up. Do not run during API initialisation!

if (!globalThis.self) globalThis.self = globalThis;

await import("../common/init.mjs");

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

removeProperties(
	self,
	[
		"Buffer",
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
		"fs",
		"global",
		"http",
		"http2",
		"https",
		"inspector",
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
	]
);