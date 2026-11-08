// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** @param {string|URL} path  */
export function fileUrlToPath(path) {
	if (typeof path === "string") return path;
	if (path.constructor !== URL) {
		throw(new TypeError(`Argument must be either a string or a URL object.`));
	};
	if (path.protocol === "file:") {
		return path.pathname;
	};
	throw(new TypeError(`URL protocol "${path.protocol}" not supported.`));
};