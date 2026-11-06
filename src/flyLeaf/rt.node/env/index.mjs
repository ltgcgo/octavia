// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	LeafMemoryUsage
} from "../../common/class/systemInfo.mjs";

import NodeOs from "node:os";
import NodePath from "node:path";
import NodeProcess from "node:process";
import NodeUrl from "node:url";

export * from "./env.mjs";

export const args = NodeProcess.argv.slice(2);
export const mainModule = NodeUrl.pathToFileURL(NodeProcess.argv[1] ?? `${NodeProcess.cwd()}${NodePath.sep}$deno$repl.mts`).href;
export const noColor = NodeProcess.env["NO_COLOR"]?.length > 0;

export const pid = NodeProcess.pid;
export const ppid = NodeProcess.ppid;

/** @param {import("../../index/index.d.mts").LeafSystemSignal} signal
* @param {() => void} handler  */
export function addSignalListener(signal, handler) {
	// Some signal types are actually not possible on certain platforms. Out of scope for now.
	switch (signal) {
		case "SIGABRT":
		case "SIGALRM":
		case "SIGBREAK":
		case "SIGBUS":
		case "SIGCHLD":
		case "SIGCONT":
		case "SIGEMT":
		case "SIGFPE":
		case "SIGHUP":
		case "SIGILL":
		case "SIGINFO":
		case "SIGINT":
		case "SIGIO":
		case "SIGKILL":
		case "SIGPIPE":
		case "SIGPOLL":
		case "SIGPROF":
		case "SIGPWR":
		case "SIGQUIT":
		case "SIGSEGV":
		case "SIGSTKFLT":
		case "SIGSTOP":
		case "SIGSYS":
		case "SIGTERM":
		case "SIGTRAP":
		case "SIGTSTP":
		case "SIGTTIN":
		case "SIGTTOU":
		case "SIGUNUSED":
		case "SIGURG":
		case "SIGUSR1":
		case "SIGUSR2":
		case "SIGVTALRM":
		case "SIGWINCH":
		case "SIGXCPU":
		case "SIGXFSZ": {
			NodeProcess.on(signal, () => {
				handler(); // Deno doesn't pass the signal type string along, unlike Node.js.
			});
			break;
		};
		default: {
			throw(new TypeError(`Invalid signal: ${signal}`)); // The exact same error message.
		};
	};
};
/** @param {string|URL} folder  */
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