// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import CommonStreamConverters from "../util/consumer.mjs";

/** @returns {Uint8Array} */
export function toUint8Array(buffer) {
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

/** @param {ReadableStream<Uint8Array>} readable
* @returns {import("../../index/index/conventions.d.mts").ExtendedReadableByteStream} */
export function toExtendedReadable(readable) {
	readable.arrayBuffer = () => {
		return CommonStreamConverters.arrayBuffer(readable);
	};
	readable.bytes = () => {
		return CommonStreamConverters.bytes(readable);
	};
	readable.json = () => {
		return CommonStreamConverters.json(readable);
	};
	readable.text = () => {
		return CommonStreamConverters.text(readable);
	};
	return readable;
};