// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import IntegerHandler from "../../libs/rochelle@ltgcgo/integerHandler.mjs";
import {
	StreamQueue
} from "../../libs/rochelle@ltgcgo/splicer.mjs";

/*import wasmBinary from "../../dist/seamstress.wasm" with {type: "bytes"};

let wasmExports;
if (self.WebAssembly) {(async () => {
	let {module, instance} = await WebAssembly.instantiate(wasmBinary);
	wasmExports = instance.exports;
	console.debug(wasmExports);
})()};*/

const SeamstressChunk = class SeamstressChunk {
	id = 0;
	chunkId = 0;
	sliceId = 0;
	type = undefined;
	offset = 0;
	offsetStream = 0;
	offsetData = 0;
	size = 0;
	chunkSize = 0;
	depth = 0;
	data = undefined;
	context = undefined;
	typePath;
	typeUses;
	get isFinal() {
		if (this.data.length + this.offset === this.size) {
			return true;
		};
		return false;
	};
	get isBuffered() {
		if (
			this.offset === 0 &&
			this.data.length === this.size
		) {
			return true;
		};
		return false;
	};
	get isCollection() {
		return (this.typePath?.length) > 0;
	};
	constructor(id, chunkId, type, offset, size) {
		if (typeof id === "number" && id >= 0) {
			this.id = id;
		} else {
			throw(new TypeError(`Provided invalid value for "id". Must be a non-negative integer.`));
		};
		if (typeof chunkId === "number" && chunkId >= 0) {
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

const seamstressListUseDecoder = new TextDecoder("l9");
const seamstressListUseHandlerFourCC = function (buffer) {
	return {
		seamstressParentUse: seamstressListUseDecoder.decode(buffer)
	};
};

const Seamstress = class Seamstress {
	static MASK_ENDIAN = 0b00000000_00000001;
	static MASK_LENGTH = 0b00000000_00000010;
	static MASK_PADDED = 0b00000000_00001100;
	static MASK_TYPE = 0b00000000_00110000;
	static ENDIAN_B = 0b00000000_00000000;
	static ENDIAN_L = 0b00000000_00000001;
	static LENGTH_VLV = 0b00000000_00000000;
	static LENGTH_U32 = 0b00000000_00000010;
	static PAD_NONE = 0b00000000_00000000;
	static PAD_EVEN = 0b00000000_00000100;
	static TYPE_VLV = 0b00000000_00000000;
	static TYPE_UI8 = 0b00000000_00010000;
	static TYPE_4CC = 0b00000000_00100000;
	MASK_ENDIAN = Seamstress.MASK_ENDIAN;
	MASK_LENGTH = Seamstress.MASK_LENGTH;
	MASK_PADDED = Seamstress.MASK_PADDED;
	MASK_TYPE = Seamstress.MASK_TYPE;
	ENDIAN_B = Seamstress.ENDIAN_B;
	ENDIAN_L = Seamstress.ENDIAN_L;
	LENGTH_VLV = Seamstress.LENGTH_VLV;
	LENGTH_U32 = Seamstress.LENGTH_U32;
	PAD_NONE = Seamstress.PAD_NONE;
	PAD_EVEN = Seamstress.PAD_EVEN;
	TYPE_VLV = Seamstress.TYPE_VLV;
	TYPE_UI8 = Seamstress.TYPE_UI8;
	TYPE_4CC = Seamstress.TYPE_4CC;
	debugMode = false;
	#l9Dec = new TextDecoder("l9");
	#listChunks = new Set();
	#type = 0;
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
	async #enqueueCascade(data, defaultHost, preferredHost) {
		const upThis = this;
		let dPrefix = `[Seamstress ENQU] Stream depth ${data.depth}, chunk ${data.id} (${data.chunkId}), type "${data.type}", size ${data.data.length} B (0x${(data.offsetData).toString(16)}, ${data.offsetStream}, ${data.offset})`;
		let isChild = preferredHost?.closed === false;
		//upThis.debugMode && console.debug(`${dPrefix}: Sending to ${isChild ? "child" : "parent"} scheduled.`);
		if (isChild) {
			await preferredHost.enqueue(data.data);
		} else {
			if (upThis.useCollection && upThis.isCollection(data.type)) {
				throw(new TypeError(`Type "${data.type}" should only be sent to the child, yet the child is not available.`));
			};
			await defaultHost.enqueue(data);
		};
		//upThis.debugMode && console.debug(`${dPrefix}: Was sent to the ${isChild ? "child" : "parent"} stream host.`);
	};
	#applyNestedContext(subchunkData, streamMeta) {
		const upThis = this;
		if (upThis.meta?.seamstressParentPath?.length > 0) {
			subchunkData.typePath = upThis.meta?.seamstressParentPath;
		};
		if (upThis.meta?.seamstressDepth > 0) {
			subchunkData.depth = upThis.meta?.seamstressDepth;
		};
		if (streamMeta?.seamstressParentUse) {
			subchunkData.typeUses = upThis.meta?.seamstressParentUses?.slice() ?? [];
			subchunkData.typeUses.push(streamMeta?.seamstressParentUse);
		};
	};
	#randomId() {
		if (Uint8Array.prototype.toBase64) {
			return (crypto.getRandomValues(new Uint8Array(6)).toBase64({alphabet: "base64url"}));
		} else {
			let map = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
			dummy = "";
			for (let c = 0; c < 8; c ++) {
				dummy += map[Math.floor(Math.random() * map.length)];
			};
			return dummy;
		};
	};
	headerSize = 0;
	get type() {
		return this.#type;
	};
	/*set type(value) {
		throw(new Error(`Attempted to write to a read-only property.`));
	};*/
	meta = {
		seamstressDepth: 0,
		seamstressOffset: 0,
		seamstressExpectedSize: null,
		seamstressParentPath: null,
		seamstressParentUses: null,
		seamstressParentId: null
	};
	headerHandler;
	isCollection(type) {
		return this.#listChunks.has(type);
	};
	addCollection(type) {
		this.#listChunks.add(type);
	};
	delCollection(type) {
		return this.#listChunks.delete(type);
	};
	useCollection = false;
	/** @returns {ReadableStream<SeamstressChunk>} */
	#readStreamInternal(stream, noThrow = false, dropData = false) {
		const upThis = this;
		let skipLength = upThis.headerSize,
		chunkStart = 0, chunkId = 0,
		typeBuffer = new Uint8Array(4),
		sizeBuffer = new Uint8Array(4),
		readState = 0,
		isHeaderRead = upThis.headerSize === 0;
		let seamChunkId = 0, seamChunkMap = new Map(), seamSliceMap = new Map(),
		seamContext = (upThis.headerSize > 0 && upThis.headerHandler !== undefined) ? undefined : {};
		let headerBuffer;
		if (upThis.headerSize > 0) {
			if (upThis.headerHandler !== undefined && typeof upThis.headerHandler !== "function") {
				throw(new TypeError("Seamstress.headerHandler must be a function."));
			} else {
				headerBuffer = [];
			};
		};
		let streamHost = new StreamQueue();
		let handleCollections = upThis.useCollection,
		childStreamHost = null, childStreamRead,
		childStreamHeaderSize = 0,
		childStreamHeaderHandler;
		if (handleCollections) {
			switch (upThis.#type & upThis.MASK_TYPE) {
				case upThis.TYPE_4CC: {
					childStreamHeaderSize = 4;
					childStreamHeaderHandler = seamstressListUseHandlerFourCC;
					break;
				};
				default: {
					// Only FourCC types can have list chunks.
					handleCollections = false;
				};
			};
		};
		// WIP: Disabled nested parsing.
		handleCollections = false;
		if (handleCollections) {
			childStreamRead = new Seamstress();
			childStreamRead.headerSize = childStreamHeaderSize;
			childStreamRead.headerHandler = childStreamHeaderHandler;
			childStreamRead.type = upThis.#type;
		};
		//streamHost.debugMode = true;
		let chunkType, chunkSize;
		/*
		`readState` has the following states.
		0-3: TYPE_READ_B0...3
		4-7: SIZE_READ_B0...3
		8:   BUFFER_SERIALIZE
		*/
		let streamDebugId = upThis.#randomId();
		let dPrefixWait = `[Seamstress WAIT] Stream "${streamDebugId}", depth ${upThis.meta.seamstressDepth}:`;
		//upThis.debugMode && console.info(`[Seamstress RSTR] Stream "${streamDebugId}"${upThis.meta.seamstressParentId ? ` ← "${upThis.meta.seamstressParentId}"` : ""} at depth ${upThis.meta.seamstressDepth} has started${upThis.meta.seamstressParentPath?.length > 0 ? ` (${upThis.meta.seamstressParentUses?.join(".") ?? ""} | ${upThis.meta.seamstressParentPath.join(".")})` : ""}.`);
		(async () => {
			for await (let chunk of stream) {
				if (streamHost.closed) {
					break;
				};
				let dPrefix = `[Seamstress RSTR] Stream depth ${upThis.meta.seamstressDepth}, chunk ${chunkId}`;
				if (skipLength > chunk.length) {
					if (isHeaderRead) {
						let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, chunkSize - skipLength, chunkSize);
						subchunkData.sliceId = upThis.#increaseInMap(seamSliceMap, seamChunkId);
						if (!(dropData && childStreamHost?.readable != null && childStreamHost?.closed)) {
							subchunkData.data = chunk;
						};
						subchunkData.offsetStream = chunkStart;
						subchunkData.offsetData = (upThis.meta?.seamstressOffset ?? 0) + subchunkData.offsetStream;
						subchunkData.context = seamContext;
						upThis.#applyNestedContext(subchunkData, seamContext);
						if (childStreamHost) {
							//upThis.debugMode && console.debug(`${dPrefixWait} Waiting for child stream. Scheduled buffering of an entire chunk.`);
							await childStreamHost.ready;
						};
						await upThis.#enqueueCascade(subchunkData, streamHost, childStreamHost);
						upThis.debugMode && console.debug(`${dPrefix} (${chunkStart}): Should buffer the entire chunk.`);
					} else {
						headerBuffer.push(chunk);
					};
					skipLength -= chunk.length;
					chunkStart += chunk.length;
					continue;
				} else if (skipLength === chunk.length) {
					upThis.debugMode && console.debug(`${dPrefix} (${chunkStart}): Should commit the entire chunk and flush the buffer.`);
					if (isHeaderRead) {
						let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, chunkSize - skipLength, chunkSize);
						subchunkData.sliceId = upThis.#increaseInMap(seamSliceMap, seamChunkId);
						if (!(dropData && childStreamHost?.readable != null && childStreamHost?.closed)) {
							subchunkData.data = chunk;
						};
						subchunkData.offsetStream = chunkStart;
						subchunkData.offsetData = (upThis.meta?.seamstressOffset ?? 0) + subchunkData.offsetStream;
						subchunkData.context = seamContext;
						upThis.#applyNestedContext(subchunkData, seamContext);
						if (childStreamHost) {
							//upThis.debugMode && console.debug(`${dPrefixWait} Waiting for child stream. Scheduled commit of an entire chunk.`);
							await childStreamHost.ready;
						};
						await upThis.#enqueueCascade(subchunkData, streamHost, childStreamHost);
						upThis.debugMode && console.debug(`[Seamstress RSTR] Committed the entire buffer as a normal chunk (${seamChunkId}, ${seamChunkMap.get(chunkType)}), size ${skipLength} B.`);
						seamChunkId ++;
					} else {
						upThis.debugMode && console.debug(`[Seamstress RSTR] Committed the entire buffer as a header chunk, size ${skipLength} B.`);
						headerBuffer.push(chunk);
						if (typeof upThis.headerHandler === "function") {
							seamContext = upThis.headerHandler(upThis.#mergeBuffer(headerBuffer));
						};
						seamContext = seamContext ?? {};
						headerBuffer = undefined;
						isHeaderRead = true;
					};
					skipLength = 0;
					chunkStart += chunk.length;
					continue;
				} else if (skipLength > 0) {
					upThis.debugMode && console.debug(`${dPrefix} (${chunkStart}): Should flush the buffer.`);
					if (isHeaderRead) {
						let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, chunkSize - skipLength, chunkSize);
						subchunkData.sliceId = upThis.#increaseInMap(seamSliceMap, seamChunkId);
						if (!(dropData && childStreamHost?.readable != null && childStreamHost?.closed)) {
							subchunkData.data = chunk.subarray(0, skipLength);
						};
						subchunkData.offsetStream = chunkStart;
						subchunkData.offsetData = (upThis.meta?.seamstressOffset ?? 0) + subchunkData.offsetStream;
						subchunkData.context = seamContext;
						upThis.#applyNestedContext(subchunkData, seamContext);
						if (childStreamHost) {
							upThis.debugMode && console.debug(`${dPrefixWait} Waiting for child stream. Scheduled commit of a chunk.`);
							await childStreamHost.ready;
						};
						await upThis.#enqueueCascade(subchunkData, streamHost, childStreamHost);
						upThis.debugMode && console.debug(`[Seamstress RSTR] Committed the buffer as a normal chunk (${seamChunkId}, ${seamChunkMap.get(chunkType)}), size ${skipLength} B.`);
						seamChunkId ++;
					} else {
						upThis.debugMode && console.debug(`[Seamstress RSTR] Committed the buffer as a header chunk, size ${skipLength} B.`);
						headerBuffer.push(chunk.subarray(0, skipLength));
						if (typeof upThis.headerHandler === "function") {
							seamContext = upThis.headerHandler(upThis.#mergeBuffer(headerBuffer));
						};
						seamContext = seamContext ?? {};
						headerBuffer = undefined;
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
							switch (upThis.#type & upThis.MASK_TYPE) {
								case upThis.TYPE_4CC: {
									readState ++;
									break;
								};
								case upThis.TYPE_UI8: {
									if (readState !== 0) {
										throw(new Error(`Invalid read state for type.`));
									};
									readState = 4;
									break;
								};
								case upThis.TYPE_VLV: {
									if ((upThis.#type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
										// RVLV-8 types
										let rvlvState = e & IntegerHandler.MASK_RVLV;
										if (readState === 0) {
											if (rvlvState === IntegerHandler.RVLV_SINGLE) {
												readState = 4;
												ptr ++;
												break;
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
							switch (upThis.#type & upThis.MASK_LENGTH) {
								case upThis.LENGTH_U32: {
									readState ++;
									break;
								};
								case upThis.LENGTH_VLV: {
									if ((upThis.#type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
										// RVLV-8 sizes
										let rvlvState = e & IntegerHandler.MASK_RVLV;
										if (readState === 4) {
											if (rvlvState === IntegerHandler.RVLV_SINGLE) {
												readState = 8;
												ptr ++;
												break;
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
							};
							break;
						};
						default: {
							throw(new Error(`${dPrefix2}: Invalid read state ${readState} encountered.`));
						};
					};
					let shouldEnqueue = false;
					if (readState === 8) {
						// Read both type and size at once.
						chunkType = undefined;
						chunkSize = undefined;
						switch (upThis.#type & upThis.MASK_TYPE) {
							case upThis.TYPE_4CC: {
								chunkType = upThis.#l9Dec.decode(typeBuffer);
								break;
							};
							case upThis.TYPE_UI8: {
								chunkType = typeBuffer[0];
								break;
							};
							case upThis.TYPE_VLV: {
								if ((upThis.#type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
									chunkType = IntegerHandler.readRVLV(typeBuffer);
								} else {
									chunkType = IntegerHandler.readVLV(typeBuffer);
								};
								break;
							};
						};
						if (typeof chunkType === "undefined") {
							throw(new Error(`${dPrefix2}: Chunk type read failed.`));
						};
						switch (upThis.#type & upThis.MASK_LENGTH) {
							case upThis.LENGTH_U32: {
								chunkSize = IntegerHandler.readUint32(sizeBuffer, (upThis.#type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L);
								break;
							};
							case upThis.LENGTH_VLV: {
								if ((upThis.#type & upThis.MASK_ENDIAN) === upThis.ENDIAN_L) {
									chunkSize = IntegerHandler.readRVLV(sizeBuffer);
								} else {
									chunkSize = IntegerHandler.readVLV(sizeBuffer);
								}
								break;
							};
						};
						if (typeof chunkSize === "undefined") {
							throw(new Error(`${dPrefix2}: Chunk size read failed.`));
						} else {
							skipLength = chunkSize;
							switch (upThis.#type & upThis.MASK_PADDED) {
								case upThis.PAD_EVEN: {
									if (chunkSize & 1) {
										// Pad to a multiple of 2 when specified.
										skipLength += 1;
									};
									break;
								};
							};
						};
						shouldEnqueue = true;
						upThis.#increaseInMap(seamChunkMap, chunkType);
						upThis.debugMode && console.debug(`${dPrefix2}: Set chunk ${JSON.stringify(chunkType)} (#${seamChunkMap.get(chunkType) + 1}), size ${chunkSize} B.`);
						readState = 0;
						// Clean-up of the stale child streams
						if (childStreamHost?.closed === false) {
							//upThis.debugMode && console.debug(`${dPrefixWait} Waiting for the stale child stream to close.`);
							await childStreamHost.closure;
						};
						if (handleCollections) {
							if (upThis.isCollection(chunkType)) {
								childStreamHost = new StreamQueue();
								childStreamRead.debugMode = upThis.debugMode;
								childStreamRead.useCollection = upThis.useCollection;
								childStreamRead.meta.seamstressDepth = upThis.meta.seamstressDepth + 1;
								childStreamRead.meta.seamstressOffset = (upThis.meta.seamstressOffset ?? 0) + chunkStart + ptr + 1;
								childStreamRead.meta.seamstressExpectedSize = chunkSize;
								childStreamRead.meta.seamstressParentPath = (upThis.meta.seamstressParentPath?.slice() ?? []);
								childStreamRead.meta.seamstressParentPath.push(chunkType);
								childStreamRead.meta.seamstressParentId = streamDebugId;
								if (seamContext.seamstressParentUse) {
									childStreamRead.meta.seamstressParentUses = (upThis.meta.seamstressParentUses?.slice() ?? []);
									childStreamRead.meta.seamstressParentUses.push(seamContext.seamstressParentUse);
								};
								console.debug(`[Seamstress CHLD] Started a new child stream for chunk "${chunkType}" at depth ${upThis.meta.seamstressDepth}.`);
								(async () => {
									for await (let childChunk of childStreamRead.#readStreamInternal(childStreamHost.readable, true)) {
										console.debug(`[Seamstress WAIT] Waiting for the next chunk from depth ${upThis.meta.seamstressDepth + 1} at depth ${upThis.meta.seamstressDepth}.`);
										await streamHost.enqueue(childChunk);
										let childReadBytes = childChunk.offsetStream + childChunk.data.length;
										console.debug(`[Seamstress CHLD] Read ${childReadBytes} B (${childChunk.data.length} B) of type "${childChunk.type}" out of ${childStreamRead.meta.seamstressExpectedSize} B from depth ${upThis.meta.seamstressDepth + 1} at depth ${upThis.meta.seamstressDepth}.`);
										/*if (childReadBytes >= childStreamRead.meta.seamstressExpectedSize) {
											console.debug(`[Seamstress CHLD] Child stream closed at depth ${upThis.meta.seamstressDepth}.`);
											childStreamHost.close();
										};*/
									};
									/*if (!childStreamHost.closed) {
										childStreamHost.close();
									};*/
								})().catch((err) => {
									console.warn(err);
									if (childStreamHost?.closed === false) {
										childStreamHost.close();
									};
									console.info(`[Seamstress CHLD] Child stream at depth ${upThis.meta.seamstressDepth + 1} stopped at depth ${upThis.meta.seamstressDepth} due to errors. Parent ID: "${streamDebugId}".`);
									childStreamHost = null;
								});
							} else {
								console.debug(`[Seamstress CHLD] Child stream blanked out at depth ${upThis.meta.seamstressDepth}. Type "${chunkType}" is not a list/collection type. Parent ID: "${streamDebugId}"`);
								//debugger;
								childStreamHost = null;
							};
						};
					};
					ptr ++;
					if (skipLength > 0 || shouldEnqueue) {
						if (skipLength + ptr < chunk.length) {
							let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, 0, chunkSize);
							subchunkData.sliceId = upThis.#increaseInMap(seamSliceMap, seamChunkId);
							if (!(dropData && childStreamHost?.readable != null && childStreamHost?.closed)) {
								subchunkData.data = chunk.subarray(ptr, ptr + skipLength);
								switch (upThis.#type & upThis.MASK_PADDED) {
									case upThis.PAD_EVEN: {
										if (subchunkData.size & 1) {
											subchunkData.data = subchunkData.data.subarray(0, subchunkData.data.length - 1);
										};
										break;
									};
								};
							};
							subchunkData.offsetStream = chunkStart + ptr;
							subchunkData.offsetData = (upThis.meta?.seamstressOffset ?? 0) + subchunkData.offsetStream;
							subchunkData.context = seamContext;
							upThis.#applyNestedContext(subchunkData, seamContext);
							await upThis.#enqueueCascade(subchunkData, streamHost, childStreamHost);
							upThis.debugMode && console.debug(`${dPrefix2}: Enqueue a complete chunk "${chunkType}" (${seamChunkId}, ${seamChunkMap.get(chunkType)}), size ${skipLength} B.`);
							ptr += skipLength;
							skipLength = 0;
							seamChunkId ++;
						} else {
							let subchunkData = new SeamstressChunk(seamChunkId, seamChunkMap.get(chunkType), chunkType, 0, chunkSize);
							subchunkData.sliceId = upThis.#increaseInMap(seamSliceMap, seamChunkId);
							if (!(dropData && childStreamHost?.readable != null && childStreamHost?.closed)) {
								subchunkData.data = chunk.subarray(ptr);
								switch (upThis.#type & upThis.MASK_PADDED) {
									case upThis.PAD_EVEN: {
										if (subchunkData.size & 1) {
											subchunkData.data = subchunkData.data.subarray(0, subchunkData.data.length - 1);
										};
										break;
									};
								};
							};
							subchunkData.offsetStream = chunkStart + ptr;
							subchunkData.offsetData = (upThis.meta?.seamstressOffset ?? 0) + subchunkData.offsetStream;
							subchunkData.context = seamContext;
							upThis.#applyNestedContext(subchunkData, seamContext);
							await upThis.#enqueueCascade(subchunkData, streamHost, childStreamHost);
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
					if (skipLength === 0 && childStreamHost?.closed === false) {
						//upThis.debugMode && console.debug(`${dPrefixWait} Waiting for child stream to empty its backlog.`);
						await childStreamHost.ready;
						childStreamHost.close();
						console.info(`[Seamstress CHLD] Child stream at depth ${upThis.meta.seamstressDepth + 1} stopped at depth ${upThis.meta.seamstressDepth}, offset ${chunkStart + ptr} (0x${(chunkStart + ptr + (upThis.meta?.seamstressOffset ?? 0)).toString(16)}). Parent ID: "${streamDebugId}"`);
						childStreamHost = null;
					};
				};
				chunkStart += chunk.length;
				chunkId ++;
			};
			if (skipLength > 0) {
				const errorContent = `Incoming stream at depth ${upThis.meta.seamstressDepth} may have ended early, with ${skipLength} B still expected.${isHeaderRead ? "" : " The header still hasn't been read."}`;
				if (noThrow) {
					console.warn(errorContent);
				} else {
					throw(new Error(errorContent));
				};
			};
			if (childStreamHost?.closed === false) {
				//upThis.debugMode && console.debug(`${dPrefixWait} Waiting for child stream to close. The parent stream is going to be closed.`);
				await childStreamHost.closure;
			};
			await streamHost.ready;
			streamHost.close();
			//upThis.debugMode && console.info(`[Seamstress RSTR] Stream "${streamDebugId}"${upThis.meta.seamstressParentId ? ` ← "${upThis.meta.seamstressParentId}"` : ""} at depth ${upThis.meta.seamstressDepth} has stopped${upThis.meta.seamstressParentPath?.length > 0 ? ` (${upThis.meta.seamstressParentUses?.join(".") ?? ""}${seamContext?.seamstressParentUse && upThis.meta.seamstressParentUses?.length > 0 ? "." : ""}${seamContext?.seamstressParentUse ?? ""} | ${upThis.meta.seamstressParentPath.join(".")})` : ""}.`);
		})().catch((err) => {
			streamHost.error(err);
		});
		return streamHost.readable;
	};
	readStream(stream, noThrow = false) {
		return this.#readStreamInternal(stream, noThrow);
	};
	regulateStream;
	readRegulated(stream, flushAll = false) {
		const upThis = this;
		if (typeof upThis.regulateStream !== "function") {
			throw(new TypeError("The stream regulator must be a defined function."));
		};
		let streamHost = new StreamQueue();
		let unbuffered = upThis.#readStreamInternal(stream, flushAll);
		let buffer = []; // Maybe a linked list will fit better here? Dynamic arrays could be expensive.
		let id, chunkId, type, size, context;
		const seamSliceMap = new Map();
		let isOffsetWritten = false, offset = 0, offsetData = 0, offsetStream = 0;
		(async () => {
			for await (let unbufferedChunk of unbuffered) {
				({id, chunkId, type, size, context} = unbufferedChunk);
				let inChunkPtr = 0;
				while (inChunkPtr < unbufferedChunk.data.length) {
					let readLength,
					remainingSize = unbufferedChunk.data.length - inChunkPtr;
					try {
						readLength = upThis.regulateStream(inChunkPtr, unbufferedChunk);
					} catch (err) {
						console.error(`[Seamstress SREG] Stream regulator had thrown when reading at 0x${(unbufferedChunk.offsetData + inChunkPtr).toString(16).padStart(6, "0")} (${inChunkPtr} in chunk).`);
						console.debug(unbufferedChunk.context);
						throw(err);
					};
					if (upThis.debugMode) {
						console.debug(`[Seamstress SREG] Stream regulator expected ${readLength} B at 0x${(unbufferedChunk.offsetData + inChunkPtr).toString(16).padStart(6, "0")}.`);
					};
					if (readLength > remainingSize) {
						throw(new RangeError(`Instructed read length ${readLength} exceeds the boundary of the current subchunk, only ${remainingSize} B remains.`));
					} else if (readLength > 0) {
						let subChunk = new SeamstressChunk(id, chunkId, type, unbufferedChunk.offset + inChunkPtr, size);
						subChunk.sliceId = upThis.#increaseInMap(seamSliceMap, id);
						subChunk.offsetData = unbufferedChunk.offsetData + inChunkPtr;
						subChunk.context = context;
						if (buffer.length > 0) {
							buffer.push(unbufferedChunk.data.subarray(inChunkPtr, inChunkPtr + readLength));
							subChunk.data = upThis.#mergeBuffer(buffer);
							buffer = [];
							offset = 0;
							offsetData = 0;
							isOffsetWritten = false;
						} else {
							subChunk.data = unbufferedChunk.data.subarray(inChunkPtr, inChunkPtr + readLength);
						};
						await streamHost.enqueue(subChunk);
						inChunkPtr += readLength;
					} else if (readLength === 0) {
						if (unbufferedChunk.isFinal) {
							let subChunk = new SeamstressChunk(id, chunkId, type, unbufferedChunk.offset + inChunkPtr, size);
							subChunk.sliceId = upThis.#increaseInMap(seamSliceMap, id);
							subChunk.offsetData = unbufferedChunk.offsetData + inChunkPtr;
							subChunk.context = context;
							buffer.push(unbufferedChunk.data.subarray(inChunkPtr));
							subChunk.data = upThis.#mergeBuffer(buffer);
							buffer = [];
							offset = 0;
							offsetData = 0;
							isOffsetWritten = false;
							await streamHost.enqueue(subChunk);
						} else {
							if (isOffsetWritten === false) {
								offset = unbufferedChunk.offset + inChunkPtr;
								offsetStream = unbufferedChunk.offsetStream + inChunkPtr;
								offsetData = unbufferedChunk.offsetData + inChunkPtr;
								isOffsetWritten = true;
							};
							buffer.push(unbufferedChunk.data.subarray(inChunkPtr));
						};
						break;
					} else {
						throw(new Error(`Instructed read length is invalid (${readLength}).`));
					};
				};
			};
			if (buffer.length > 0) {
				if (flushAll) {
					let bufferedChunk = new SeamstressChunk(id, chunkId, type, offset, size);
					bufferedChunk.data = upThis.#mergeBuffer(buffer);
					bufferedChunk.offsetData = offsetData;
					buffer = [];
					bufferedChunk.context = context;
					await streamHost.enqueue(bufferedChunk);
				} else {
					throw(new Error(`Incoming stream at depth ${upThis.meta.seamstressDepth} have ended early, with ${upThis.#countBuffer(buffer)} B still unflushed.`));
				};
			};
			streamHost.close();
		})().catch((err) => {
			streamHost.error(err);
		});
		return streamHost.readable;
	};
	readChunks(stream, flushAll = false) {
		const upThis = this;
		let streamHost = new StreamQueue();
		let unbuffered = upThis.#readStreamInternal(stream, true); // What was the original `true` as the 2nd argument for?
		let buffer = []; // Maybe a linked list will fit better here? Dynamic arrays could be expensive.
		let inProgress = false;
		let id, chunkId, type, size, context, offsetData, offsetStream;
		(async () => {
			for await (let unbufferedChunk of unbuffered) {
				let sizeSum = unbufferedChunk.offset + unbufferedChunk.data.length;
				if (sizeSum > unbufferedChunk.size) {
					const errorMessage = `The total sum of size exceeded declaration (${sizeSum} > ${unbufferedChunk.size}).`;
					switch (upThis.#type & upThis.MASK_PADDED) {
						case upThis.PAD_NONE: {
							throw(new Error(errorMessage));
							break;
						};
						case upThis.PAD_EVEN: {
							if (unbufferedChunk.size + 1 !== sizeSum) {
								throw(new Error(errorMessage));
							};
							break;
						};
					};
				} else if (sizeSum === unbufferedChunk.size) {
					// Commit now!
					if (unbufferedChunk.offset === 0) {
						// The chunk was already fully buffered.
						await streamHost.enqueue(unbufferedChunk);
						upThis.debugMode && console.debug(`[Seamstress RCHK] Committed a fully buffered chunk.`);
					} else {
						// Use the information stored on the first chunk buffer.
						buffer.push(unbufferedChunk.data);
						let bufferedChunk = new SeamstressChunk(id, chunkId, type, 0, size);
						bufferedChunk.data = upThis.#mergeBuffer(buffer);
						bufferedChunk.offsetData = offsetData;
						buffer = [];
						bufferedChunk.context = context;
						await streamHost.enqueue(bufferedChunk);
						upThis.debugMode && console.debug(`[Seamstress RCHK] Committed a buffered chunk.`);
						inProgress = false;
					};
					continue;
				} else if (unbufferedChunk.offset === 0) {
					if (inProgress) {
						if (flushAll) {
							let bufferedChunk = new SeamstressChunk(id, chunkId, type, 0, size);
							bufferedChunk.data = upThis.#mergeBuffer(buffer);
							bufferedChunk.offsetData = offsetData;
							bufferedChunk.context = context;
							await streamHost.enqueue(bufferedChunk);
						};
						console.warn(`Chunk #${id} (${type}, #${chunkId}) has ended early at depth ${upThis.meta.seamstressDepth}, with ${upThis.#countBuffer(buffer)} B still unflushed.`);
						buffer = [];
						//inProgress = false;
					};
					inProgress = true;
					({id, chunkId, type, size, context, offsetData, offsetStream} = unbufferedChunk);
				};
				buffer.push(unbufferedChunk.data);
			};
			if (buffer.length > 0) {
				if (flushAll) {
					let bufferedChunk = new SeamstressChunk(id, chunkId, type, 0, size);
					bufferedChunk.data = upThis.#mergeBuffer(buffer);
					bufferedChunk.offsetStream = offsetStream;
					bufferedChunk.offsetData = offsetData;
					buffer = [];
					bufferedChunk.context = context;
					await streamHost.enqueue(bufferedChunk);
				} else {
					throw(new Error(`Incoming stream at depth ${upThis.meta.seamstressDepth} have ended early, with ${upThis.#countBuffer(buffer)} B still unflushed.`));
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
		const upThis = this;
		let map = new Map();
		for await (const chunk of upThis.#readStreamInternal(stream, true, true)) {
			if (chunk.offset > 0) {
				continue;
			};
			if (!map.has(chunk.type)) {
				map.set(chunk.type, []);
			};
			map.get(chunk.type).push([chunk.offsetData, chunk.size]);
		};
		return map;
	};
	constructor(typeFlags) {
		if (typeof typeFlags !== "number") {
			throw(new TypeError(`Stream type flags must be defined as an integer.`));
		};
		if (!Number.isSafeInteger(typeFlags)) {
			throw(new TypeError(`Stream type flags must be defined as a valid integer.`));
		};
		const upThis = this;
		switch (typeFlags & upThis.MASK_LENGTH) {
			case upThis.LENGTH_VLV:
			case upThis.LENGTH_U32: {
				break;
			};
			default: {
				throw(new Error(`Length type not implemented.`));
			};
		};
		switch (typeFlags & upThis.MASK_PADDED) {
			case upThis.PAD_NONE:
			case upThis.PAD_EVEN: {
				break;
			};
			default: {
				throw(new Error(`Padding type not implemented.`));
			};
		};
		switch (typeFlags & upThis.MASK_TYPE) {
			case upThis.TYPE_VLV:
			case upThis.TYPE_UI8:
			case upThis.TYPE_4CC: {
				break;
			};
			default: {
				throw(new Error(`Chunk type not implemented.`));
			};
		};
		upThis.#type = typeFlags;
		upThis.addCollection("LIST");
	};
};

const SeamstressPresets = Object.seal({
	"IFF": Seamstress.ENDIAN_B | Seamstress.TYPE_4CC | Seamstress.LENGTH_U32 | Seamstress.PAD_EVEN,
	"RIFF": Seamstress.ENDIAN_L | Seamstress.TYPE_4CC | Seamstress.LENGTH_U32 | Seamstress.PAD_EVEN,
	"SMF": Seamstress.ENDIAN_B | Seamstress.TYPE_4CC | Seamstress.LENGTH_U32 | Seamstress.PAD_NONE,
	"WRK": Seamstress.ENDIAN_L | Seamstress.TYPE_UI8 | Seamstress.LENGTH_U32 | Seamstress.PAD_NONE
});

export {
	Seamstress,
	SeamstressChunk,
	SeamstressChunk as SeamstressChunkIterated,
	SeamstressStrictWriter,
	SeamstressPresets
}
