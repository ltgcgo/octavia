// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	bufferFrom
} from "../../state/utils/bufferIo.mjs";

/** @typedef {string|ArrayBuffer|ArrayBufferView|Blob|File|Response|HTMLInputElement|FileList|ReadableStream<Uint8Array>|AsyncIterable<Uint8Array>} UnifiedBinaryIntake */

//const testHex = /^[0-9a-fA-F]+$/;
const testBase64Normal = /^[0-9A-Za-z+/=]+$/;
const testBase64Url = /^[0-9A-Za-z\-_=]+$/;

/** @param {FileList} fileList */
const handleFileList = (fileList) => {
	if (!fileList) throw(new Error(`No files have been selected.`));
	for (const file of fileList) {
		if (file.size > 0) return file;
	};
	throw(new Error(`No files have been selected.`));
};
/** @param {string} string */
const stringQuickGuess = (string) => {
	//if (testHex.test(string)) return "hex";
	if (testBase64Normal.test(string)) return "base64";
	if (testBase64Url.test(string)) return "base64url";
	return "unknown";
};

/** @param {UnifiedBinaryIntake} intake
* @returns {ReadableStream<Uint8Array>|AsyncIterable<Uint8Array>} */
const toByteStream = function (intake) {
	if (intake == null) {
		throw(new TypeError("Invalid blank input type."));
	} else if (typeof intake[Symbol.asyncIterator] === "function") {
		return intake;
	} else if (intake.body && typeof intake.body[Symbol.asyncIterator] === "function") {
		return intake.body;
	};
	switch (typeof intake) {
		case "bigint":
		case "number":
		case "boolean":
		case "function":
		case "symbol":
		case "undefined": {
			throw(new TypeError(`Invalid input type.`));
		};
		case "string": {
			return (new Blob([bufferFrom(stringQuickGuess(intake), intake)])).stream();
		};
	};
	switch (intake?.constructor) {
		case ArrayBuffer:
		case DataView:
		case Int8Array:
		case Uint8Array:
		case Uint8ClampedArray:
		case Int16Array:
		case Uint16Array:
		case Int32Array:
		case Uint32Array:
		case BigInt64Array:
		case BigUint64Array:
		case Float32Array:
		case Float64Array: {
			return (new Blob([intake])).stream();
		};
		case Blob:
		case globalThis?.File ?? 0: {
			return intake.stream();
		};
		case globalThis?.HTMLInputElement ?? 1: {
			return handleFileList(intake.files).stream();
		};
		case globalThis?.FileList ?? 2: {
			return handleFileList(intake).stream();
		};
		case globalThis?.ReadableStream ?? 3: {
			return intake;
		};
		case globalThis?.Response ?? 4: {
			return intake.body;
		};
		default: {
			if (
				ArrayBuffer.isView(intake) ||
				(
					typeof intake.byteLength === "number" &&
					typeof intake.slice === "function" &&
					typeof intake.transfer === "function"
				)
			) {
				return (new Blob([intake])).stream();
			} else if (
				typeof intake.slice === "function" &&
				typeof intake.size === "number" &&
				typeof intake.stream === "function"
			) {
				return intake.stream();
			} else if (
				typeof intake.getReader === "function" &&
				typeof intake.pipeTo === "function" &&
				typeof intake.tee === "function"
			) {
				return intake;
			} else if (
				typeof intake.item === "function" &&
				typeof intake.length === "number"
			) {
				return handleFileList(intake).stream();
			} else if (
				typeof intake.files?.item === "function" &&
				typeof intake.files?.length === "number"
			) {
				return handleFileList(intake.files).stream();
			};
		};
	};
	throw(new TypeError("Unknown input type."));
};

/** @param {UnifiedBinaryIntake} intake
* @returns {Promise<Uint8Array|Uint8ClampedArray>} */
const toBytes = async function (intake) {
	if (intake == null) {
		throw(new TypeError("Invalid blank input type."));
	} else if (typeof intake[Symbol.asyncIterator] === "function") {
		return await (new Response(intake)).bytes();
	} else if (intake.body && typeof intake.body[Symbol.asyncIterator] === "function") {
		return await intake.bytes();
	};
	switch (typeof intake) {
		case "bigint":
		case "number":
		case "boolean":
		case "function":
		case "symbol":
		case "undefined": {
			throw(new TypeError(`Invalid input type.`));
		};
		case "string": {
			return bufferFrom(stringQuickGuess(intake), intake).buffer;
		};
	};
	switch (intake?.constructor) {
		case Uint8Array:
		case Uint8ClampedArray: {
			return intake;
		};
		case ArrayBuffer: {
			return new Uint8Array(intake);
		};
		case DataView:
		case Int8Array:
		case Int16Array:
		case Uint16Array:
		case Int32Array:
		case Uint32Array:
		case BigInt64Array:
		case BigUint64Array:
		case Float32Array:
		case Float64Array: {
			return new Uint8Array(intake.buffer, intake.byteOffset, intake.byteLength);
		};
		case Blob:
		case globalThis?.File ?? 0: {
			return await intake.bytes();
		};
		case globalThis?.HTMLInputElement ?? 1: {
			return await handleFileList(intake.files).bytes();
		};
		case globalThis?.FileList ?? 2: {
			return await handleFileList(intake).bytes();
		};
		case globalThis?.ReadableStream ?? 3: {
			return await (new Response(intake)).bytes();
		};
		case globalThis?.Response ?? 4: {
			return await intake.bytes();
		};
	};
	throw(new TypeError("Unknown input type."));
};

/** @param {UnifiedBinaryIntake} intake
* @returns {Promise<ArrayBuffer>} */
const toBuffer = async function (intake) {
	if (intake == null) {
		throw(new TypeError("Invalid blank input type."));
	} else if (intake.body && typeof intake[Symbol.asyncIterator] === "function") {
		return await (new Response(intake)).arrayBuffer();
	};
	switch (typeof intake) {
		case "bigint":
		case "number":
		case "boolean":
		case "function":
		case "symbol":
		case "undefined": {
			throw(new TypeError(`Invalid input type.`));
		};
		case "string": {
			return bufferFrom(stringQuickGuess(intake), intake).buffer;
		};
	};
	switch (intake?.constructor) {
		case ArrayBuffer: {
			return intake;
		};
		case DataView:
		case Int8Array:
		case Uint8Array:
		case Uint8ClampedArray:
		case Int16Array:
		case Uint16Array:
		case Int32Array:
		case Uint32Array:
		case BigInt64Array:
		case BigUint64Array:
		case Float32Array:
		case Float64Array: {
			if (
				intake.byteOffset === 0 &&
				intake.byteLength === intake.buffer.byteLength
			) {
				return intake.buffer;
			} else {
				return intake.buffer.slice(intake.byteOffset, intake.byteOffset + intake.byteLength);
			};
		};
		case Blob:
		case globalThis?.File ?? 0: {
			return await intake.arrayBuffer();
		};
		case globalThis?.HTMLInputElement ?? 1: {
			return await handleFileList(intake.files).arrayBuffer();
		};
		case globalThis?.FileList ?? 2: {
			return await handleFileList(intake).arrayBuffer();
		};
		case globalThis?.ReadableStream ?? 3: {
			return await (new Response(intake)).arrayBuffer();
		};
	};
	throw(new TypeError("Unknown input type."));
};

export {
	toBuffer,
	toBytes,
	toByteStream
};