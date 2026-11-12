// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { PoolIDMaps } from "../../common/class/pool.mjs";
import {
	LeafMemoryUsage
} from "../../common/class/systemInfo.mjs";

import { isCallSiteInternal } from "../../vergilius/restrict.mjs";

import NodeOs from "node:os";
import NodePath from "node:path";
import NodeProcess from "node:process";
import NodeTimers from "node:timers";
import NodeUrl from "node:url";

export * from "./env.mjs";
export * from "./sysMem.mjs";

export const args = NodeProcess.argv.slice(2);
export const mainModule = NodeUrl.pathToFileURL(NodeProcess.argv[1] ?? `${NodeProcess.cwd()}${NodePath.sep}$deno$repl.mts`).href;
export const noColor = NodeProcess.env["NO_COLOR"]?.length > 0;

export const pid = NodeProcess.pid;
export const ppid = NodeProcess.ppid;

const allSystemSignals = new Set(["SIGABRT", "SIGALRM", "SIGBREAK", "SIGBUS", "SIGCHLD", "SIGCONT", "SIGEMT", "SIGFPE", "SIGHUP", "SIGILL", "SIGINFO", "SIGINT", "SIGIO", "SIGKILL", "SIGPIPE", "SIGPOLL", "SIGPROF", "SIGPWR", "SIGQUIT", "SIGSEGV", "SIGSTKFLT", "SIGSTOP", "SIGSYS", "SIGTERM", "SIGTRAP", "SIGTSTP", "SIGTTIN", "SIGTTOU", "SIGUNUSED", "SIGURG", "SIGUSR1", "SIGUSR2", "SIGVTALRM", "SIGWINCH", "SIGXCPU", "SIGXFSZ"]);
/** @type {PoolIDMaps<NodeJS.Timeout>} */
const schedulePool = new PoolIDMaps();
const signalListeners = new WeakMap();

/** @param {import("../../index/index.d.mts").LeafSystemSignal} signal
* @param {() => void} handler */
export function addSignalListener(signal, handler) {
	// Some signal types are actually not possible on certain platforms. Out of scope for now.
	if (allSystemSignals.has(signal)) {
		const wrappedListener = () => {
			handler(); // Deno doesn't pass the signal type string along, unlike Node.js.
		};
		signalListeners.set(handler, wrappedListener);
		NodeProcess.on(signal, wrappedListener);
	} else {
		throw(new TypeError(`Invalid signal: ${signal}`)); // The exact same error message.
	};
};
/** @param {string|URL} folder*/
export function chdir(folder) {
	switch (folder.constructor) {
		case URL: {
			folder = folder.href;
			break;
		};
	};
	NodeProcess.chdir(folder);
};
export function cwd() {
	return NodeProcess.cwd();
};
export function execPath() {
	return NodeProcess.execPath;
};
export function exit(exitCode) {
	NodeProcess.exit(exitCode);
};
export function gid() {
	return NodeProcess.getgid();
};
export function hostname() {
	return NodeOs.hostname();
};
export function loadavg() {
	return NodeOs.loadavg();
};
export function memoryUsage() {
	return new LeafMemoryUsage(NodeProcess.memoryUsage());
};
export function osRelease() {
	return NodeOs.release();
};
export function osUptime() {
	return NodeOs.uptime();
};
/** @param {number|NodeJS.Timeout} scheduleId */
export function refTimer(scheduleId) {
	if (typeof scheduleId === "number") {
		// Use the internal timer object referral system
		schedulePool.toSource(scheduleId)?.ref();
	} else if (typeof scheduleId.ref === "function") {
		scheduleId.ref();
	};
};
/** @param {import("../../index/index.d.mts").LeafSystemSignal} signal
* @param {() => void} handler */
export function removeSignalListener(signal, handler) {
	// Some signal types are actually not possible on certain platforms. Out of scope for now.
	if (allSystemSignals.has(signal)) {
		const wrappedListener = signalListeners.get(handler);
		if (wrappedListener) {
			NodeProcess.off(signal, wrappedListener);
		};
	} else {
		throw(new TypeError(`Invalid signal: ${signal}`)); // The exact same error message.
	};
};
export function uid() {
	return NodeProcess.getuid();
};
/** @param {number|NodeJS.Timeout} scheduleId */
export function unrefTimer(scheduleId) {
	if (typeof scheduleId === "number") {
		// Use the internal timer object referral system
		schedulePool.toSource(scheduleId)?.unref();
	} else if (typeof scheduleId.unref === "function") {
		scheduleId.unref();
	};
};

/** @param {Function} func
* @param {number} duration */
export function _leaf_web_setInterval_(func, duration) {
	const response = NodeTimers.setInterval(func, duration);
	if (isCallSiteInternal()) return response;
	return schedulePool.assign(response);
};
/** @param {number|NodeJS.Timeout} handle */
export function _leaf_web_clearInterval_(handle) {
	if (typeof handle === "number") {
		const query = schedulePool.toSource(handle);
		if (query != null) handle = query;
	};
	NodeTimers.clearInterval(handle);
	handle != null && schedulePool.release(handle);
};
/** @param {Function} func
* @param {number} duration */
export function _leaf_web_setTimeout_(func, duration) {
	const response = NodeTimers.setTimeout(func, duration);
	if (isCallSiteInternal()) return response;
	return schedulePool.assign(response);
};
/** @param {number|NodeJS.Timeout} handle */
export function _leaf_web_clearTimeout_(handle) {
	if (typeof handle === "number") {
		const query = schedulePool.toSource(handle);
		if (query != null) handle = query;
	};
	NodeTimers.clearTimeout(handle);
	handle != null && schedulePool.release(handle);
};