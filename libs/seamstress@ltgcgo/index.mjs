// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	StreamQueue
} from "../../libs/rochelle@ltgcgo/splicer.mjs";

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
			for (let i = 1; i < 4; i ++) {
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
		} else {
			return result;
		};
	};
};

let SeamstressChunk = class SeamstressChunk {
	id = 0;
	chunkId = 0;
	type = undefined;
	offset = 0;
	size = 0;
	data = undefined;
	context = undefined;
	get isFinal() {
		if (this.data.length + this.offset === size) {
			return true;
		};
		return false;
	};
	get isBuffered() {
		if (
			this.offset === 0 &&
			this.data.length === size
		) {
			return true;
		};
		return false;
	};
	constructor(id, chunkId, type, offset, size) {
		if (typeof id === "number" && id >= 0) {
			this.id = id;
		} else {
			throw(new TypeError(`Provided invalid value for "id". Must be a non-negative integer.`));
		};
		if (typeof chunkId === "number" && id >= 0) {
			this.chunkId = chunkId;
		} else {
			throw(new TypeError(`Provided invalid value for "chunkId". Must be a non-negative integer.`));
		};
		switch (typeof type) {
			case "number": {
				if (type >= 0) {
					this.type = type;
				} else {
					throw(new RangeError(`Provided invalid value for "type". Must be a non-negative integer or a string.`));
				};
				break;
			};
			case "string": {
				this.type = type;
				break;
			};
			default: {
				throw(new TypeError(`Provided invalid value for "type". Must be a non-negative integer or a string.`));
			};
		};
		if (typeof size === "number" && size >= 0) {
			this.size = size;
		} else {
			throw(new TypeError(`Provided invalid value for "size". Must be a non-negative integer.`));
		};
		if (typeof offset === "number" && offset >= 0 && offset <= size) {
			this.offset = offset;
		} else {
			throw(new TypeError(`Provided invalid value for "offset". Must be a non-negative integer.`));
		};
	};
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
	MASK_ENDIAN = 1;
	MASK_LENGTH = 2;
	MASK_PADDED = 4;
	MASK_TYPE = 8;
	ENDIAN_B = 0;
	ENDIAN_L = 1;
	LENGTH_VLV = 0;
	LENGTH_U32 = 2;
	TYPE_VLV = 0;
	TYPE_4CC = 8;
	debugMode = false;
	#u8Dec = new TextDecoder("l9");
	#increaseInMap(map, key) {
		if (map.has(key)) {
			let value = map.get(key);
			if (typeof value === "number" && value >= 0) {
				map.set(key, ++ value);
				return value;
			} else {
				throw(new TypeError(`Key "${key}" in the provided map must contain non-negative numeric values.`));
			};
		} else {
			map.set(key, 0);
			return 0;
		};
	};
	#countBuffer(bufferIterator) {
		let summedSize = 0;
		for (let buffer of bufferIterator) {
			summedSize += buffer.length;
		};
		return summedSize;
	};
	#mergeBuffer(bufferIterator) {
		// The buffer iterator must be usable twice! Preferrably a linked list over an array resized relentlessly.
		let summedBuffer = new Uint8Array(this.#countBuffer(bufferIterator));
		let summedPointer = 0;
		for (let buffer of bufferIterator) {
			summedBuffer.set(buffer, summedPointer);
			summedPointer += buffer.length;
		};
		return summedBuffer;
	};
	headerSize = 0;
	type = 0; // 0 for non-reversible SEAM stream, 10 for SMF
	readStream(stream, bypassRegulator = false) {
		let upThis = this;
		let skipLength = upThis.headerSize,
		chunkStart = 0, chunkId = 0,
		typeBuffer = new Uint8Array(4),
		sizeBuffer = new Uint8Array(4),
		readState = 0,
		isHeaderRead = upThis.headerSize === 0;
		let seamChunkId = 0, seamChunkMap = new Map(),
		seamContext = (upThis.headerSize > 0 && upThis.headerHandler !== undefined) ? undefined : {};
		if (upThis.headerSize > 0 && upThis.headerHandler !== undefined && typeof upThis.headerHandler !== "function") {
			throw(new TypeError("Seamstress.headerHandler must be a function."));
		};
		let streamHost = new StreamQueue();
		//streamHost.debugMode = true;
		let chunkType, chunkSize;
		/*
		`readState` has the following states.
		0-3: TYPE_READ_B0...3
		4-7: SIZE_READ_B0...3
		8:   BUFFER_SERIALIZE
		*/
		(async () => {
			for await (let chunk of stream) {
				if (streamHost.closed) {
					break;
				};
				let dPrefix = `Stream chunk ${chunkId}`;
				if (skipLength > chunk.length) {
					let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, chunkSize - skipLength, chunkSize);
					subchunkData.data = chunk;
					await streamHost.enqueue(subchunkData);
					upThis.debugMode && console.debug(`${dPrefix} (${chunkStart}): Should buffer the entire chunk.`);
					skipLength -= chunk.length;
					chunkStart += chunk.length;
					continue;
				} else if (skipLength === chunk.length) {
					upThis.debugMode && console.debug(`${dPrefix} (${chunkStart}): Should commit the entire chunk and flush the buffer.`);
					if (isHeaderRead) {
						let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, chunkSize - skipLength, chunkSize);
						subchunkData.data = chunk;
						await streamHost.enqueue(subchunkData);
						upThis.debugMode && console.debug(`Committed the entire buffer as a normal chunk (${seamChunkId}, ${seamChunkMap.get(chunkType)}), size ${skipLength} B.`);
						seamChunkId ++;
					} else {
						upThis.debugMode && console.debug(`Committed the entire buffer as a header chunk, size ${skipLength} B.`);
						isHeaderRead = true;
					};
					skipLength = 0;
					chunkStart += chunk.length;
					continue;
				} else if (skipLength > 0) {
					upThis.debugMode && console.debug(`${dPrefix} (${chunkStart}): Should flush the buffer.`);
					if (isHeaderRead) {
						let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, chunkSize - skipLength, chunkSize);
						subchunkData.data = chunk.subarray(0, skipLength);
						await streamHost.enqueue(subchunkData);
						upThis.debugMode && console.debug(`Committed the buffer as a normal chunk (${seamChunkId}, ${seamChunkMap.get(chunkType)}), size ${skipLength} B.`);
						seamChunkId ++;
					} else {
						upThis.debugMode && console.debug(`Committed the buffer as a header chunk, size ${skipLength} B.`);
						isHeaderRead = true;
					};
				};
				let ptr = skipLength;
				skipLength = 0;
				while (ptr < chunk.length) {
					if (streamHost.closed) {
						break;
					};
					let dPrefix2 = `${dPrefix} (${chunkStart + ptr}, ${chunkStart} + ${ptr})`;
					//console.debug(`${chunkStart + ptr}(${chunkStart} + ${ptr}) - ${readState}`);
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
										ptr ++;
										continue;
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
										ptr ++;
										continue;
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
							throw(new Error(`${dPrefix2}: Invalid read state ${readState} encountered.`));
						};
					};
					if (readState === 8) {
						// Read both type and size at once.
						chunkType = undefined;
						chunkSize = undefined;
						if ((upThis.type & upThis.MASK_TYPE) === upThis.TYPE_4CC) {
							chunkType = upThis.#u8Dec.decode(typeBuffer);
						} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
							chunkType = IntegerHandler.readRVLV(typeBuffer);
						} else {
							chunkType = IntegerHandler.readVLV(typeBuffer);
						};
						if (typeof chunkType === "undefined") {
							throw(new Error(`${dPrefix2}: Chunk type read failed.`));
						};
						if ((upThis.type & upThis.MASK_LENGTH) === upThis.LENGTH_U32) {
							chunkSize = IntegerHandler.readUint32(sizeBuffer, (upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L);
						} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
							chunkSize = IntegerHandler.readRVLV(sizeBuffer);
						} else {
							chunkSize = IntegerHandler.readVLV(sizeBuffer);
						};
						if (typeof chunkSize === "undefined") {
							throw(new Error(`${dPrefix2}: Chunk size read failed.`));
						} else {
							skipLength = chunkSize;
							if ((upThis.type & upThis.MASK_PADDED) && (chunkSize & 1)) {
								// Pad to a multiple of 2 when specified.
								skipLength += 1;
							};
						};
						upThis.debugMode && console.debug(`${dPrefix2}: Set chunk ${JSON.stringify(chunkType)} (#${upThis.#increaseInMap(seamChunkMap, chunkType) + 1}), size ${chunkSize} B.`);
						readState = 0;
					};
					ptr ++;
					if (skipLength > 0) {
						if (skipLength + ptr < chunk.length) {
							let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, 0, chunkSize);
							subchunkData.data = chunk.subarray(ptr, ptr + skipLength);
							await streamHost.enqueue(subchunkData);
							upThis.debugMode && console.debug(`${dPrefix2}: Enqueue a complete chunk "${chunkType}" (${seamChunkId}, ${seamChunkMap.get(chunkType)}), size ${skipLength} B.`);
							ptr += skipLength;
							skipLength = 0;
							seamChunkId ++;
						} else {
							let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, 0, chunkSize);
							subchunkData.data = chunk.subarray(ptr);
							await streamHost.enqueue(subchunkData);
							upThis.debugMode && console.debug(`${dPrefix2}: Enqueue a potentially incomplete chunk (${seamChunkId}, ${seamChunkMap.get(chunkType)}) "${chunkType}", size ${chunk.length - ptr} B.`);
							skipLength += ptr - chunk.length;
							ptr = chunk.length;
							if (skipLength === 0) {
								seamChunkId ++;
							};
						};
					} else if (skipLength < 0) {
						skipLength = 0;
					};
				};
				chunkStart += chunk.length;
				chunkId ++;
			};
			if (skipLength > 0) {
				console.warn(`Incoming stream may have ended early, with ${skipLength} B still expected.${isHeaderRead ? "" : " The header still hasn't been read."}`);
			};
			streamHost.close();
		})().catch((err) => {
			streamHost.error(err);
		});
		return streamHost.readable;
	};
	readChunks(stream, flushAll = false) {
		let upThis = this;
		let streamHost = new StreamQueue();
		let unbuffered = upThis.readStream(stream, true);
		let buffer = []; // Maybe a linked list will fit better here? Dynamic arrays could be expensive.
		let inProgress = false;
		let id, chunkId, type, size, context;
		(async () => {
			for await (let unbufferedChunk of unbuffered) {
				let sizeSum = unbufferedChunk.offset + unbufferedChunk.data.length;
				if (sizeSum > unbufferedChunk.size) {
					throw(new Error(`The total sum of size exceeded declaration (${sizeSum} > ${unbufferedChunk.size}).`));
				} else if (sizeSum === unbufferedChunk.size) {
					// Commit now!
					if (unbufferedChunk.offset === 0) {
						// The chunk was already fully buffered.
						await streamHost.enqueue(unbufferedChunk);
						console.debug(`Committed a fully buffered chunk.`);
					} else {
						// Use the information stored on the first chunk buffer.
						buffer.push(unbufferedChunk.data);
						let bufferedChunk = new SeamstressChunk(id, chunkId, type, 0, size);
						bufferedChunk.data = upThis.#mergeBuffer(buffer);
						buffer.splice(0);
						bufferedChunk.context = context;
						await streamHost.enqueue(bufferedChunk);
						console.debug(`Committed a buffered chunk.`);
						inProgress = false;
					};
					continue;
				} else if (unbufferedChunk.offset === 0) {
					if (inProgress) {
						if (flushAll) {
							let bufferedChunk = new SeamstressChunk(id, chunkId, type, 0, size);
							bufferedChunk.data = upThis.#mergeBuffer(buffer);
							bufferedChunk.context = context;
							await streamHost.enqueue(bufferedChunk);
						};
						console.warn(`Chunk #${id} (${type}, #${chunkId}) has ended early, with ${upThis.#countBuffer(buffer)} B still unflushed.`);
						buffer.splice(0);
						//inProgress = false;
					};
					inProgress = true;
					({id, chunkId, type, size, context} = unbufferedChunk);
				};
				buffer.push(unbufferedChunk.data);
			};
			if (buffer.length > 0) {
				if (flushAll) {
					let bufferedChunk = new SeamstressChunk(id, chunkId, type, 0, size);
					bufferedChunk.data = upThis.#mergeBuffer(buffer);
					buffer.splice(0);
					bufferedChunk.context = context;
					await streamHost.enqueue(bufferedChunk);
				} else {
					console.warn(`Incoming stream may have ended early, with ${upThis.#countBuffer(buffer)} B still unflushed.`);
				};
			};
			streamHost.close();
		})().catch((err) => {
			streamHost.error(err);
		});
		return streamHost.readable;
	};
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
				chunkStart += chunk.length;
				continue;
			};
			let ptr = skipLength;
			skipLength = 0;
			while (ptr < chunk.length) {
				//console.debug(`${chunkStart + ptr}(${chunkStart} + ${ptr}) - ${readState}`);
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
						chunkSize = IntegerHandler.readUint32(sizeBuffer, (upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L);
					} else if ((upThis.type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
						chunkSize = IntegerHandler.readRVLV(sizeBuffer);
					} else {
						chunkSize = IntegerHandler.readVLV(sizeBuffer);
					};
					if (typeof chunkSize === "undefined") {
						throw(new Error(`Chunk size read failed at offset ${chunkStart + ptr}.`));
					} else {
						skipLength = chunkSize;
						if ((upThis.type & upThis.MASK_PADDED) && (chunkSize & 1)) {
							// Pad to a multiple of 2 when specified.
							skipLength += 1;
						};
					};
					//console.debug(`Chunk ${JSON.stringify(chunkType)}: ${chunkSize} B`);
					if (!map.has(chunkType)) {
						map.set(chunkType, []);
					};
					map.get(chunkType).push([chunkStart + ptr + 1, chunkSize]);
					readState = 0;
				};
				ptr ++;
				if (skipLength > 0) {
					if (skipLength + ptr < chunk.length) {
						ptr += skipLength;
						skipLength = 0;
					} else {
						skipLength += ptr - chunk.length;
						ptr = chunk.length;
					};
				} else if (skipLength < 0) {
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
