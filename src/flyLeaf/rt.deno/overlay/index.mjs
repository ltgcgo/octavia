// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** @type {PropertyDescriptor} */
export const exitCode = {
	"enumerable": true,
	"configurable": false,
	"get": () => {
		return Deno.exitCode;
	},
	/** @param {number} exitCode */
	"set": (exitCode) => {
		Deno.exitCode = exitCode;
	}
};