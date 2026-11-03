// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

// The very last step to clean runtimes up. Do not run during API initialisation!

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
	globalThis,
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
		"exports",
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