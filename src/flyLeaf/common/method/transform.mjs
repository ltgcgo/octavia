// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** @returns {Uint8Array} */
export function toUint8Array(buffer) {
	console.debug(buffer);
	if (
		buffer?.buffer instanceof ArrayBuffer &&
		Number.isSafeInteger(buffer?.byteLength) &&
		Number.isSafeInteger(buffer?.byteOffset)
	) {
		return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	} else {
		throw(new TypeError("Argument is not a valid buffer view."));
	};
};