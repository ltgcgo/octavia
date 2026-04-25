// 2022-2025 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const readVLV = (buffer) => {
	// Expects Uint8Array or the likes
	let result = 0, ptr = 0, resume = true;
	while (ptr < 4 && resume) {
		if (ptr) {
			result = result << 7;
		};
		result |= buffer[ptr] & 127;
		if (buffer[ptr] < 128) {
			resume = false;
		};
		ptr ++;
	};
	return [result, ptr];
};
const buildVLV = (number) => {
	if (!Number.isInteger(number)) {
		throw(new TypeError(`Must be an integer`));
	};5
	if (number >= 268435456) {
		throw(new RangeError(`Must be within 28 bits (0x0 to 0x0fffffff)`));
	};
	let rawVLVBuffer = new Uint8Array(4);
	let startByte = 3, workInt = number;
	for (let i = 3; i >= 0; i --) {
		if (workInt > 0) {
			rawVLVBuffer[i] = workInt & 127 | (i === 3 ? 0 : 128);
			workInt >>>= 7;
			startByte = i;
		};
	};
	return rawVLVBuffer.subarray(startByte);
};
const readUintBE = (buffer, byteLength) => {
	if (byteLength > 6) {
		throw(new RangeError(`Cannot read more than 48 bits`));
	};
	if (byteLength > buffer.length) {
		throw(new RangeError(`Trying to read out of bounds`));
	};
	let result = 0, ptr = 0;
	while (ptr < byteLength) {
		if (ptr < 3) {
			if (ptr) {
				result = result << 8;
			};
			result |= buffer[ptr];
		} else {
			result *= 256;
			result += buffer[ptr];
		};
		ptr ++;
	};
	return result;
};
const buildUintBE = (number, byteLength) => {
	if (byteLength > 6) {
		throw(new RangeError(`Cannot write more than 48 bits`));
	};
	if (byteLength > buffer.length) {
		throw(new RangeError(`Trying to write out of bounds`));
	};
	if (!Number.isInteger(number)) {
		throw(new TypeError(`Must be an integer`));
	};
	let result = new Uint8Array(byteLength), ptr = byteLength;
	let workInt = number;
	while (ptr > 0) {
		ptr --;
		if (workInt > 2147483647) {
			result[ptr] = workInt % 256;
			workInt /= 256;
		} else {
			result[ptr] = workInt & 255;
			workInt >>>= 8;
		};
	};
	return result;
};
const commitData = (controller, data) => {
	controller.unsent = false;
	controller.enqueue(data);
};

export {
	readVLV,
	buildVLV,
	readUintBE,
	buildUintBE,
	commitData
};
