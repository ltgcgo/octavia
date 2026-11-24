// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { allSystemSignals } from "../../common/constant/system.mjs";

import NodeProcess from "node:process";

/** @param {number} pid
* @param {import("../../index/index.d.mts").LeafSystemSignal} signal */
export function kill(pid, signal = "SIGTERM") {
	if (allSystemSignals.has(signal) || typeof signal === "number") {
		switch (NodeProcess.platform) {
			case "cygwin":
			case "win32": {
				if (pid < 0) throw(new TypeError("Invalid pid"));
				// Fallthrough
			};
			default: {
				NodeProcess.kill(pid, signal);
			};
		};
	} else {
		throw(new TypeError(`Invalid signal: ${signal}`));
	};
};