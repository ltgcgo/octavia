"use strict";

import {
	BinaryStreamCodecs
} from "./utils/codec.mjs";

let arrayCompare = (arr1, arr2) => {
	let minLength = Math.min(arr1.length, arr2.length);
	let result = 0;
	for (let i = 0; i < minLength; i ++) {
		result = arr1[i] - arr2[i];
		if (result !== 0) {
			return [i, result];
			break;
		};
	};
	if (arr1.length !== arr2.length) {
		return [minLength, arr1.length - arr2.length];
	};
	return [0, 0];
};

let toDecibel = function (data = 64) {
	return Math.round(2000 * Math.log10(data / 64)) / 100;
};

let customInterpreter = function (type, file, rawMtLen) {
	let u8Data = [];
	let metaLength = rawMtLen == false ? file.readIntVLV() : rawMtLen;
	if (type == 0 || type == 127) {
		//metaLength = 1;
	};
	for (let c = 0; c < metaLength; c ++) {
		let byte = file.readInt(1);
		u8Data.push(byte);
		if (byte == 247) {
			// End of SysEx
		} else if (byte == 240) {
			// Start of a new SysEx
		} else if (byte > 127) {
			// Start of a new event
			console.debug(`Early termination: ${u8Data}`);
			u8Data.pop();
			file.backOne();
			file.backOne();
			return new Uint8Array(u8Data);
		};
	};
	//console.debug(`Constructed data: `, u8Data);
	return new Uint8Array(u8Data);
};

let gsChecksum = function (sequence) {
	// Only pass along the three-byte address and their data.
	let checksum = 0;
	sequence.forEach((e) => {
		checksum += e;
		checksum = checksum & 127; // Prevent going out of range
	});
	return (~checksum + 1) & 127;
};

// Why KORG adds a byte every seven bytes is a mistery to me.
// That's because it's an 8-on-7 scheme!
/** @deprecated */
let korgFilter = function (korgArr, iterator) {
	let realDataIndex = 0;
	for (const e of BinaryStreamCodecs.decodeKorg(korgArr)) {
		iterator?.call(korgArr, e, realDataIndex, korgArr);
		realDataIndex ++;
	};
};

let halfByteFilter = function (halfByteArr, iterator) {
	let realData = 0;
	for (let pointer = 0; pointer < halfByteArr.length; pointer ++) {
		if (pointer & 1) {
			realData = (realData << 4) | (halfByteArr[pointer] & 15);
			let i = pointer >> 1;
			iterator(realData, i, halfByteArr);
		} else {
			realData = halfByteArr[pointer] & 15;
		};
	};
};
let halfByteUnpack = function (halfByteArr) {
	let newLength = halfByteArr.length >> 1;
	let unpacked = new Uint8Array(newLength);
	halfByteFilter(halfByteArr, (e, i) => {
		unpacked[i] = e;
	});
	return unpacked;
};

let x5dSendLevel = function (sendParam) {
	let res = Math.floor(sendParam * 14.2);
	if (res < 128) {
		return res;
	} else {
		return 0;
	};
};

// Direct variable modification is required for performance, as global variable fallback is expensive. The implementation below adapts by directly modifying the export.
let getDebugState;
if (Object.hasOwn(self, "chrome") || Object.hasOwn(self, "Deno")) {
	getDebugState = function () {
		return self?.debugMode ?? false;
	};
} else if (Object.hasOwn(self, "require")) {
	// If run on Bun.js or Node.js, output all possible logs.
	// Node.js will likely throw an error, it requires "globalThis" instead of "self". Node.js support is denied within the project anyway.
	//return (typeof self?.require !== "undefined") || (self?.debugMode ?? false);
	getDebugState = function () {
		return true;
	};
} else {
	getDebugState = function () {
		return Object.hasOwn(self, "debugMode") ? self.debugMode : false;
		// Uncomment below to temporarily suppress all debug output.
		//return false;
	};
};

let ascii64Dec = function (text) {
	let targetSize = ((text.length + 1) * 3) >> 2, // Math.ceil(text.length * 3 / 4)
	result = new Uint8Array(targetSize),
	units = (text.length + 3) >> 2;// Math.ceil(text.length / 4)
	for (let i = 0; i < units; i ++) {
		let ai = i << 2, di = i * 3;
		let v = 0;
		for (let i0 = 0; i0 < 4; i0 ++) {
			v <<= 6;
			v |= (text.charCodeAt(ai + i0) - 32) & 63; // No idea about the distribution
		};
		result[di] = v >> 16;
		result[di + 1] = (v >> 8) & 255;
		result[di + 2] = v & 255;
	};
	return result;
};

const bufferToDHex = function (msg, maxLength = 12) {
	let hexaText = "";
	for (let i = 0; i < maxLength && i < msg.length; i ++) {
		if (i > 0) {
			hexaText += " ";
		};
		hexaText += msg[i].toString(16).padStart(2, "0").toUpperCase();
	};
	if (msg.length > maxLength) {
		hexaText += " ...";
	};
	return hexaText;
};
const bufferToBracketed = function (msg, prefixSize = 0, suffixSize = 0) {
	const suffixStart = msg.length - suffixSize, suffixEnd = msg.length - 1;
	let hexaText = "";
	for (let i = 0; i < msg.length; i ++) {
		if (prefixSize > 0) {
			if (i === 0) {
				hexaText += "(";
			} else if (i === prefixSize) {
				hexaText += ")";
			};
		};
		if (i > 0) {
			hexaText += " ";
		};
		if (i === suffixStart && suffixStart !== msg.length) {
			hexaText += "(";
		};
		hexaText += msg[i].toString(16).padStart(2, "0").toUpperCase();
		if (i === suffixEnd && suffixStart !== msg.length) {
			hexaText += ")";
		};
	};
	return hexaText;
};

/** @template {Object} T
* @param {Iterable<T>} ingress
* @returns {Generator<T, void, any>} */
const pruneObjects = function* (ingress) {
	for (const victim of ingress) {
		for (const key of Object.keys(victim)) {
			if (victim[key] == null) {
				delete victim[key];
			};
		};
		yield victim;
	};
};

export {
	arrayCompare,
	toDecibel,
	gsChecksum,
	korgFilter,
	halfByteFilter,
	halfByteUnpack,
	x5dSendLevel,
	customInterpreter,
	ascii64Dec,
	getDebugState,
	bufferToDHex,
	bufferToBracketed,
	pruneObjects
};
