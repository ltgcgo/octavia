// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

let IntegerHandler = class IntegerHandler {
	static MASK_VLV = 128;
	static MASK_RVLV = 192;
	static RVLV_START = 192;
	static RVLV_MIDDLE = 128;
	static RVLV_END = 64;
	static RVLV_SINGLE = 0;
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
			if ((e & this.MASK_VLV) === 0) {
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
			if ((e & this.MASK_VLV) === 0) {
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
			if ((e & this.MASK_VLV) === 0) {
				return i + 1;
			};
		};
		return 0; // Failure
	};
	static readRVLV(buffer, offset = 0) {
		this.#ensureU8(buffer);
		switch (buffer[offset] & this.MASK_RVLV) {
			case this.RVLV_SINGLE: {
				return buffer[offset] & 63;
				break;
			};
			case this.RVLV_MIDDLE:
			case this.RVLV_END: {
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
		switch (buffer[offset] & this.MASK_RVLV) {
			case this.RVLV_SINGLE: {
				return BigInt(buffer[offset] & 63);
				break;
			};
			case this.RVLV_MIDDLE:
			case this.RVLV_END: {
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
		switch (buffer[offset] & this.MASK_RVLV) {
			case this.RVLV_SINGLE: {
				return 1;
				break;
			};
			case this.RVLV_MIDDLE:
			case this.RVLV_END: {
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
	#u8Dec = new TextDecoder("l9");
	headerSize = 0;
	type = 10; // 0 for non-reversible SEAM stream, 10 for SMF
	readStream(stream, bypassRegulator = false) {};
	readChunks(stream) {};
	writeStrict(headerSerializer) {};
	writeChunks(serializedHeader) {};
	async getMapFromStream(stream) {
		let upThis = this;
		let skipLength = upThis.headerSize,
		chunkStart = 0,
		typeBuffer = new Uint8Array(4),
		sizeBuffer = new Uint8Array(4),
		readState = 0,
		map = new Map();
		/*
		`readState` has the following states.
		0-3: TYPE_READ_B0...3
		4-7: SIZE_READ_B0...3
		8:   BUFFER_SERIALIZE
		*/
		for await (let chunk of stream) {
			if (skipLength >= chunk.length) {
				skipLength -= chunk.length;
				continue;
			};
			let ptr = skipLength;
			while (ptr < chunk.length) {
				console.debug(`${chunkStart + ptr}(${chunkStart} + ${ptr}) - ${readState}`);
				let e = chunk[ptr];
				switch (readState) {
					case 0: {
						typeBuffer.fill(0);
						// Should fall through
					};
					case 1:
					case 2:
					case 3: {
						// Type read
						typeBuffer[readState] = e;
						if ((upThis.type & upThis.MASK_TYPE) === upThis.TYPE_4CC) {
							readState ++;
						} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
							// RVLV-8 types
							let rvlvState = e & IntegerHandler.MASK_RVLV;
							if (readState === 0) {
								if (rvlvState === IntegerHandler.RVLV_SINGLE) {
									readState = 4;
								} else if (rvlvState !== IntegerHandler.RVLV_START) {
									throw(new Error(`Invalid RVLV-8 type read state ${readState} encountered at offset ${chunkStart + ptr}: Did not start RVLV-8 on the first byte.`));
								};
								readState ++;
							} else if (readState === 3) {
								if (rvlvState !== IntegerHandler.RVLV_END) {
									throw(new Error(`Invalid RVLV-8 type read state ${readState} encountered at offset ${chunkStart + ptr}: Did not end RVLV-8 on the last possible byte.`));
								};
								readState = 4;
							} else if (rvlvState === IntegerHandler.RVLV_END) {
								readState = 4;
							} else {
								readState ++;
							};
						} else {
							// VLV-8 types
							let vlvState = e & IntegerHandler.MASK_VLV;
							if (readState === 3) {
								if (vlvState) {
									throw(new Error(`Invalid VLV-8 type read state ${readState} encountered at offset ${chunkStart + ptr}: Did not end VLV-8 on the last possible byte.`));
								};
								readState = 4;
							} else if (vlvState) {
								readState ++;
							} else {
								readState = 4;
							};
						};
						break;
					};
					case 4: {
						sizeBuffer.fill(0);
						// Should fall through
					};
					case 5:
					case 6:
					case 7: {
						// Size read
						sizeBuffer[readState - 4] = e;
						if ((upThis.type & upThis.MASK_LENGTH) === upThis.LENGTH_U32) {
							readState ++;
						} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
							// RVLV-8 sizes
							let rvlvState = e & IntegerHandler.MASK_RVLV;
							if (readState === 4) {
								if (rvlvState === IntegerHandler.RVLV_SINGLE) {
									readState = 8;
								} else if (rvlvState !== IntegerHandler.RVLV_START) {
									throw(new Error(`Invalid RVLV-8 size read state ${readState} encountered at offset ${chunkStart + ptr}: Did not start RVLV-8 on the first byte.`));
								};
								readState ++;
							} else if (readState === 7) {
								if (rvlvState !== IntegerHandler.RVLV_END) {
									throw(new Error(`Invalid RVLV-8 size read state ${readState} encountered at offset ${chunkStart + ptr}: Did not end RVLV-8 on the last possible byte.`));
								};
								readState = 8;
							} else if (rvlvState === IntegerHandler.RVLV_END) {
								readState = 8;
							} else {
								readState ++;
							};
						} else {
							// VLV-8 sizes
							let vlvState = e & IntegerHandler.MASK_VLV;
							if (readState === 7) {
								if (vlvState) {
									throw(new Error(`Invalid VLV-8 size read state ${readState} encountered at offset ${chunkStart + ptr}: Did not end VLV-8 on the last possible byte.`));
								};
								readState = 8;
							} else if (vlvState) {
								readState ++;
							} else {
								readState = 8;
							};
						};
						break;
					};
					default: {
						throw(new Error(`Invalid read state ${readState} encountered at offset ${chunkStart + ptr}.`));
					};
				};
				if (readState === 8) {
					// Read both type and size at once.
					let chunkType, chunkSize;
					if ((upThis.type & upThis.MASK_TYPE) === upThis.TYPE_4CC) {
						chunkType = upThis.#u8Dec.decode(typeBuffer);
					} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
						chunkType = IntegerHandler.readRVLV(typeBuffer);
					} else {
						chunkType = IntegerHandler.readVLV(typeBuffer);
					};
					if (typeof chunkType === "undefined") {
						throw(new Error(`Chunk type read failed at offset ${chunkStart + ptr}.`));
					};
					if ((upThis.type & upThis.MASK_LENGTH) === upThis.LENGTH_U32) {
						chunkSize = IntegerHandler.readUint32(sizeBuffer);
					} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
						chunkSize = IntegerHandler.readRVLV(sizeBuffer);
					} else {
						chunkSize = IntegerHandler.readVLV(sizeBuffer);
					};
					if (typeof chunkSize === "undefined") {
						throw(new Error(`Chunk size read failed at offset ${chunkStart + ptr}.`));
					} else {
						skipLength = chunkSize;
					};
					console.debug(`Chunk ${JSON.stringify(chunkType)}: ${chunkSize} B`);
					if (!map.has(chunkType)) {
						map.set(chunkType, []);
					};
					map.get(chunkType).push([chunkStart + ptr + 1, chunkSize]);
					readState = 0;
				};
				if (skipLength > 0) {
					ptr += skipLength;
					skipLength = 0;
				} else {
					ptr ++;
				};
				if (skipLength < 0) {
					skipLength = 0;
				};
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
