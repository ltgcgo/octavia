// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

let VLVHandler = class VLVHandler {
	static #MASK_VLV = 128;
	static #MASK_RVLV = 192;
	static #RVLV_START = 192;
	static #RVLV_MIDDLE = 128;
	static #RVLV_END = 64;
	static #RVLV_SINGLE = 0;
	static sizeVLV(buffer, offset = 0) {
		if (buffer.BYTES_PER_ELEMENT !== 1 || typeof buffer?.buffer?.byteLength !== "number") {
			throw(new TypeError("Input must be a Uint8Array."));
		};
		let breakCrit = Math.min(buffer.length, 16);
		for (let i = 0; i < breakCrit; i ++) {
			let e = buffer[i + offset];
			if ((e & this.#MASK_VLV) === 0) {
				return i + 1;
			};
		};
		return 0; // Failure
	};
	static sizeRVLV(buffer, offset = 0) {
		if (buffer.BYTES_PER_ELEMENT !== 1 || typeof buffer?.buffer?.byteLength !== "number") {
			throw(new TypeError("Input must be a Uint8Array."));
		};
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
	readStream(stream) {};
	readChunks(stream) {};
	writeStrict(headerSerializer) {};
	writeChunks(serializedHeader) {};
	async getMapFromStream(stream) {
		let upThis = this;
		let skipLength = upThis.headerSize,
		consumedSize = 0;
		for await (let chunk of stream) {

		};
	};
};

export {
	VLVHandler,
	Seamstress,
	SeamstressChunk,
	SeamstressStrictWriter
}
