// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import NodeProcess from "node:process";

let cachedExitCode = 0;
/** @type {PropertyDescriptor} */
export const exitCode = {
	"enumerable": true,
	"configurable": false,
	"get": () => {
		return NodeProcess.exitCode ?? cachedExitCode;
	},
	/** @param {number} exitCode */
	"set": (exitCode) => {
		NodeProcess.exitCode = exitCode;
		cachedExitCode = exitCode;
	}
};