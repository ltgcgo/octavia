"use strict";

/** @param {number} size
* @param {number} threshold*/
const runLengthSubtract = (size, threshold) => {
	if (size > threshold) {
		return size - threshold - 1; //
	} else if (size === threshold) {
		return -1;
	} else {
		return 0;
	};
};

/** @param {Uint8Array|Uint8ClampedArray} buffer
* @param {boolean|null} isLittleEndian
* @returns {number} */
const decode7bitUint = function (buffer, isLittleEndian = false) {
	if (buffer?.BYTES_PER_ELEMENT !== 1) {
		throw(new TypeError(`Input buffer must be one of the 8-bit typed arrays.`));
	};
	if (!(buffer?.length <= 4)) {
		throw(new RangeError(`Length of the input buffer must be between 0 and 4.`));
	};
	let decoded = 0;
	if (isLittleEndian) {
		for (let i = 0; i < buffer.length; i ++) {
			decoded |= (buffer[i] & 127) << (i * 7);
		};
	} else {
		for (let i = 0; i < buffer.length; i ++) {
			decoded = (decoded << 7) | (buffer[i] & 127);
		};
	};
	return decoded;
};

/** @param {Uint8Array|Uint8ClampedArray} buffer */
const encodeRunLength = function (buffer, repeatThreshold = 4) {
	if (!(Number.isSafeInteger(repeatThreshold) && repeatThreshold >= 2)) {
		throw(new RangeError(`Repeat threshold must be an integer larger than 1.`));
	};
	switch (buffer.constructor) {
		case Uint8Array:
		case Uint8ClampedArray: {
			if (buffer.length <= 0) {
				throw(new RangeError("The buffer must not be empty."));
			};
			break;
		};
		default: {
			throw(new TypeError("The buffer must be an Uint8Array."));
		};
	};
	// Length calculation pass.
	const sizeCriterion = 127 + repeatThreshold; // Prepare for later integration with MIDI-style VLV-8.
	let requiredSize = buffer.length;
	let lastByte = buffer[0], repeatSize = 1;
	for (let i = 1; i < buffer.length; i ++) {
		const e = buffer[i];
		if (e === lastByte) {
			repeatSize ++;
		};
		if (repeatSize >= sizeCriterion || e !== lastByte) {
			requiredSize -= runLengthSubtract(repeatSize, repeatThreshold);
			repeatSize = 0;
		};
		lastByte = e;
	};
	if (repeatSize > 0) {
		requiredSize -= runLengthSubtract(repeatSize, repeatThreshold);
	};
	// Compression pass. REQUIRES FULL REWRITE!
	const compressed = new Uint8Array(requiredSize);
	compressed[0] = buffer[0];
	lastByte = buffer[0], repeatSize = 1;
	let compressedPointer = 1, byteUnwritten = true;
	for (let i = 1; i < buffer.length; i ++) {
		const e = buffer[i];
		if (e === lastByte) {
			repeatSize ++;
		};
		if (repeatSize >= sizeCriterion || e !== lastByte) {
			if (repeatSize >= repeatThreshold) {
				// Can be enhanced with VLV here!
				compressed[compressedPointer] = repeatSize - repeatThreshold;
				compressedPointer ++;
				compressed[compressedPointer] = e;
				compressedPointer ++;
				byteUnwritten = false;
			};
			repeatSize = 0;
		};
		if (repeatSize <= repeatThreshold && byteUnwritten) {
			compressed[compressedPointer] = e;
			compressedPointer ++;
		};
		lastByte = e;
		byteUnwritten = true;
	};
	if (repeatSize >= repeatThreshold) {
		compressed[compressedPointer] = repeatSize - repeatThreshold;
		compressedPointer ++;
	};
	return compressed;
};

export {
	decode7bitUint
};
