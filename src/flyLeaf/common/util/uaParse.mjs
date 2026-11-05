// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	NavigatorExtract
} from "../class/matchers.mjs";

/** @param {string} userAgent */
const parseUa = function (userAgent) {
	return NavigatorExtract.exec(userAgent)?.groups;
};
/** @param {string} userAgent */
export function parseUaName(userAgent) {
	return parseUa(userAgent)?.name;
};
/** @param {string} userAgent */
export function parseUaVersion(userAgent) {
	return parseUa(userAgent)?.version;
};