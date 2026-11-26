// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

const isig = new Map([
	[0x03, "SIGINT"],
	[0x1A, "SIGTSTP"],
	[0x1C, "SIGQUIT"]
]);
const stdioModes = new Set([
	"inherit",
	"null",
	"piped"
]);

/** @param {Uint8Array} buffer */
export function isolateSignals(buffer) {
	const signals = [];
	const carveOut = [];
	for (let i = 0; i < buffer.length; i ++) {
		const signal = isig.get(buffer[i]);
		if (typeof signal === "string") {
			signals.push(signal);
			carveOut.push(i);
		};
	};
	return signals;
};
export function assertValidStdIoMode(mode) {
	if (mode == null || stdioModes.has(mode)) return;
	throw(new TypeError(`unknown variant \`${mode}\`, expected one of \`inherit\`, \`piped\`, \`null\``));
};
export function assertEnvVarType(records) {
	if (typeof records !== "object") return;
	for (const key in records) {
		const value = records[key];
		if (typeof value === "string") continue;
		// There is no "serde" in plain JS, but appearances must be kept.
		throw(new TypeError(`serde_v8 error: invalid type; expected: string, got: ${value?.constructor?.name ?? typeof value}`));
	};
};
