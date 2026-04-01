// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

let IntegerHandler = class IntegerHandler {
	static #MASK_VLV = 128;
	static #MASK_RVLV = 192;
	static #RVLV_START = 192;
	static #RVLV_MIDDLE = 128;
	static #RVLV_END = 64;
	static #RVLV_SINGLE = 0;
	static #ensureU8(buffer) {
		if (buffer.constructor !== Uint8Array && buffer.constructor !== Uint8ClampedArray) {
			throw(new TypeError("Input must be a Uint8Array."));
		};
	};
	static readVLV(buffer, offset = 0) {
		// VLV-8 are all big-endian.
		let upThis = this;
		upThis.#ensureU8(buffer);
		let breakCrit = Math.min(buffer.length, 4),
		breakTest = breakCrit - 1,
		result = 0;
		for (let i = 0; i < breakCrit; i ++) {
			let e = buffer[i + offset];
			if (i > 0) {
				result <<= 7;
			};
			result |= e & 127;
			if ((e & this.#MASK_VLV) === 0) {
				break;
			} else if (breakTest >= breakCrit) {
				throw(new Error(`VLV-8 did not terminate at the end of the read buffer.`));
			};
		};
		return result;
	};
	static readVLVBigInt(buffer, offset = 0) {
		// VLV-8 are all big-endian.
		let upThis = this;
		upThis.#ensureU8(buffer);
		let breakCrit = Math.min(buffer.length, 16),
		breakTest = breakCrit - 1,
		result = 0n;
		for (let i = 0; i < breakCrit; i ++) {
			let e = buffer[i + offset];
			if (i > 0) {
				result <<= 7n;
			};
			result |= BigInt(e & 127);
			if ((e & this.#MASK_VLV) === 0) {
				break;
			} else if (breakTest >= breakCrit) {
				throw(new Error(`VLV-8 did not terminate at the end of the read buffer.`));
			};
		};
		return result;
	};
	static sizeVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
		let breakCrit = Math.min(buffer.length, 16);
		for (let i = 0; i < breakCrit; i ++) {
			let e = buffer[i + offset];
			if ((e & this.#MASK_VLV) === 0) {
				return i + 1;
			};
		};
		return 0; // Failure
	};
	static readRVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
		switch (buffer[offset] & this.#MASK_RVLV) {
			case this.#RVLV_SINGLE: {
				return buffer[offset] & 63;
				break;
			};
			case this.#RVLV_MIDDLE:
			case this.#RVLV_END: {
				throw(new Error(`Invalid RVLV start state. (${offset} + 0)`));
				break;
			};
		};
		// The only valid state for the first offset byte in the buffer at this point is RVLV_START.
		let storedState = 3, // 1-3: END, MIDDLE, START
		breakCrit = Math.min(buffer.length, 4),
		breakTest = breakCrit - 1,
		result = buffer[offset] & 63;
		for (let i = 1; i < breakCrit; i ++) {
			let e = buffer[i + offset],
			currentState = e >> 6;
			if (
				currentState === 0 ||
				(storedState === 3 && (0b00001001 >> currentState & 1)) ||
				(storedState === 2 && currentState > storedState)
			) {
				throw(new Error(`Invalid transitioning state: ${storedState} → ${currentState}. (${offset} + 0)`));
				return;
			};
			result <<= 6;
			result |= e & 63;
			if (currentState === 1) {
				break;
			} else if (i >= breakTest) {
				throw(new Error(`RVLV-8 did not terminate at the end of the read buffer.`));
			};
			storedState = currentState;
		};
		return result;
	};
	static readRVLVBigInt(buffer, offset = 0) {
		this.#ensureU8(buffer);
		switch (buffer[offset] & this.#MASK_RVLV) {
			case this.#RVLV_SINGLE: {
				return BigInt(buffer[offset] & 63);
				break;
			};
			case this.#RVLV_MIDDLE:
			case this.#RVLV_END: {
				throw(new Error(`Invalid RVLV start state. (${offset} + 0)`));
				break;
			};
		};
		// The only valid state for the first offset byte in the buffer at this point is RVLV_START.
		let storedState = 3, // 1-3: END, MIDDLE, START
		breakCrit = Math.min(buffer.length, 4),
		breakTest = breakCrit - 1,
		result = BigInt(buffer[offset] & 63);
		for (let i = 1; i < breakCrit; i ++) {
			let e = buffer[i + offset],
			currentState = e >> 6;
			if (
				currentState === 0 ||
				(storedState === 3 && (0b00001001 >> currentState & 1)) ||
				(storedState === 2 && currentState > storedState)
			) {
				throw(new Error(`Invalid transitioning state: ${storedState} → ${currentState}. (${offset} + 0)`));
				return;
			};
			result <<= 6n;
			result |= BigInt(e & 63);
			if (currentState === 1) {
				break;
			} else if (i >= breakTest) {
				throw(new Error(`RVLV-8 did not terminate at the end of the read buffer.`));
			};
			storedState = currentState;
		};
		return result;
	};
	static sizeRVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
		switch (buffer[offset] & this.#MASK_RVLV) {
			case this.#RVLV_SINGLE: {
				return 1;
				break;
			};
			case this.#RVLV_MIDDLE:
			case this.#RVLV_END: {
				//console.debug(`Invalid start state. (${offset} + 0)`);
				return 0;
				break;
			};
		};
		// The only valid state for the first offset byte in the buffer at this point is RVLV_START.
		let storedState = 3, // 1-3: END, MIDDLE, START
		breakCrit = Math.min(buffer.length, 16);
		for (let i = 1; i < breakCrit; i ++) {
			let e = buffer[i + offset],
			currentState = e >> 6;
			if (
				currentState === 0 ||
				(storedState === 3 && (0b00001001 >> currentState & 1)) ||
				(storedState === 2 && currentState > storedState)
			) {
				//console.debug(`Invalid transitioning state: ${storedState} → ${currentState}. (${offset} + 0)`);
				return 0;
			} else if (currentState === 1) {
				return i + 1;
			};
			storedState = currentState;
		};
	};
	static readBool(buffer, offset = 0) {
		this.#ensureU8(buffer);
		if (offset < 0 || offset > 4294967295 || (offset >>> 3) >= buffer.length) {
			throw(new RangeError(`Invalid binary offset. (${offset})`));
		};
		return (buffer[offset >> 3] >> (offset & 7) & 1) !== 0;
	};
	static readInt8(buffer, offset = 0) {
		this.#ensureU8(buffer);
		if (offset < 0 || offset >= buffer.length) {
			throw(new RangeError(`Invalid offset. (${offset})`));
		};
		let result = buffer[offset];
		if (result >> 7) {
			result -= 256;
		};
		return result;
	};
	static readInt32(buffer, isLittleEndian = false, offset = 0) {
		this.#ensureU8(buffer);
		if (offset < 0 || offset + 3 >= buffer.length) {
			throw(new RangeError(`Invalid offset. (${offset})`));
		};
		let result = buffer[offset];
		if (isLittleEndian) {
			for (let i = 1; i < 3; i ++) {
				result |= buffer[offset + i] << (i << 3);
			};
		} else {
			for (let i = 1; i < 4; i ++) {
				result <<= 8;
				result |= buffer[offset + i];
			};
		};
		return result;
	};
	static readUint32(buffer, isLittleEndian = false, offset = 0) {
		let result = this.readInt32(buffer, isLittleEndian, offset);
		if (result >>> 31) {
			return 4294967296 + result;
		};
	};
};

let SeamstressChunk = class SeamstressChunk {
	id = 0;
	type = null;
	offset = 0;
	data = null;
	context = null;
};

let SeamstressStrictWriter = class SeamstressStrictWriter {};

let Seamstress = class Seamstress {
	static MASK_ENDIAN = 1;
	static MASK_LENGTH = 2;
	static MASK_PADDED = 4;
	static MASK_TYPE = 8;
	static ENDIAN_B = 0;
	static ENDIAN_L = 1;
	static LENGTH_VLV = 0;
	static LENGTH_U32 = 2;
	static TYPE_VLV = 0;
	static TYPE_4CC = 8;
	headerSize = 0;
	type = 10; // 0 for non-reversible SEAM stream, 10 for SMF
	readStream(stream) {};
	readChunks(stream) {};
	writeStrict(headerSerializer) {};
	writeChunks(serializedHeader) {};
	async getMapFromStream(stream) {
		let upThis = this;
		let skipLength = upThis.headerSize,
		chunkStart = 0,
		consumedSize = 0,
		map = new Map();
		for await (let chunk of stream) {
			let ptr = skipLength,
			lastSkippedAt = 0;
			skipLength = 0;
			if (ptr >= chunk.length) {
				skipLength = ptr - chunk.length;
				console.debug(`Skipped the chunk altogether. ${chunk.length} B skipped, ${skipLength} B remaining.`);
				continue;
			};
			while (ptr < chunk.length) {
				if (upThis.type & upThis.MASK_TYPE === upThis.TYPE_4CC) {
					// Typical FourCC types
					skipLength = 4;
				} else if (upThis.type & upThis.MASK_ENDIAN === upThis.ENDIAN_L) {
					// Reversible VLV
					skipLength = VLVHandler.sizeRVLV(chunk, ptr);
				} else {
					// Standard VLV
					skipLength = VLVHandler.sizeVLV(chunk, ptr);
				};
				console.debug(`Skip type size set to ${skipLength} B`);
				if (upThis.type & upThis.MASK_LENGTH === upThis.LENGTH_U32) {
					// Typical FourCC types
					let lengthSize = 4;
					skipLength += lengthSize;
				} else if (upThis.type & upThis.MASK_ENDIAN === upThis.ENDIAN_L) {
					// Reversible VLV
					let lengthSize = VLVHandler.sizeRVLV(chunk, ptr + skipLength);
					skipLength += lengthSize;

				} else {
					// Standard VLV
					let lengthSize = VLVHandler.sizeVLV(chunk, ptr + skipLength);
					skipLength += lengthSize;
				};
				console.debug(`Skip type and length size set to ${skipLength} B`);
				if (skipLength > 0) {
					lastSkippedAt = ptr;
					ptr += skipLength;
				} else {
					console.debug(`Type and length read failed. Continuing iteration to prevent infinite loops.`);
					ptr ++;
				};
				skipLength = 0;
			};
			if (skipLength > 0) {
				console.debug(`Skipped to the next chunk. ${skipLength} B skipped at ${lastSkippedAt}/${chunk.length}, ${skipLength + lastSkippedAt - chunk.length} B remaining.`);
				skipLength += lastSkippedAt - chunk.length;
			};
			chunkStart += chunk.length;
		};
		return map;
	};
};

export {
	IntegerHandler,
	Seamstress,
	SeamstressChunk,
	SeamstressStrictWriter
}
