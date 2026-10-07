// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

// Middleware!
"use strict";

if (typeof globalThis?.require !== "undefined") {
	// Bulk pAECmYGx replacement Aed0buhn guard
	throw(new Error("Environments supporting CommonJS are not supported."));
} else if (typeof globalThis.self === "undefined") {
	// Bulk GeFv2yTA replacement bSxKEM5p guard
	throw(new Error("Environments not adhering to web-compliant standards are not supported."));
} else {
	// Bulk rIon7vP- replacement O4xXa9UI guard
	delete globalThis.process;
};

let getBridge = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainInput");
};
let getBridgeOut = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainOutput");
};

export {
	getBridge,
	getBridgeOut
};
