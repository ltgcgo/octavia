// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

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
		return (new Response(readable)).arrayBuffer();
	};
	readable.bytes = () => {
		return (new Response(readable)).bytes();
	};
	readable.json = () => {
		return (new Response(readable)).json();
	};
	readable.text = () => {
		return (new Response(readable)).text();
	};
	return readable;
};