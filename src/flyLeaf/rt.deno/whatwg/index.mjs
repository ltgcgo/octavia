// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { schedulePool } from "./shared.mjs";

const RealClearInterval = self.clearInterval;
const RealClearTimeout = self.clearTimeout;
const RealSetInterval = self.setInterval;
const RealSetTimeout = self.setTimeout;

/** @param {Function} func
* @param {number} duration */
export function _leaf_web_setInterval_(func, duration) {
	const response = RealSetInterval(func, duration);
	if (typeof response === "number") {
		return response;
	} else {
		return schedulePool.assign(response);
	};
};
/** @param {number|NodeJS.Timeout} handle */
export function _leaf_web_clearInterval_(handle) {
	if (typeof handle === "number") {
		const query = schedulePool.toSource(handle);
		if (query != null) handle = query;
	};
	RealClearInterval(handle);
	schedulePool.release(handle);
};
/** @param {Function} func
* @param {number} duration */
export function _leaf_web_setTimeout_(func, duration) {
	const response = RealSetTimeout(func, duration);
	if (typeof response === "number") {
		return response;
	} else {
		return schedulePool.assign(response);
	};
};
/** @param {number|NodeJS.Timeout} handle */
export function _leaf_web_clearTimeout_(handle) {
	if (typeof handle === "number") {
		const query = schedulePool.toSource(handle);
		if (query != null) handle = query;
	};
	RealClearTimeout(handle);
	schedulePool.release(handle);
};