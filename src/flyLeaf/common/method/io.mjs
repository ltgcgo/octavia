// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

const isig = new Map([
	[0x03, "SIGINT"],
	[0x1A, "SIGTSTP"],
	[0x1C, "SIGQUIT"]
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