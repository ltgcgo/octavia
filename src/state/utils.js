"use strict";

const u8Enc = new TextEncoder();

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
let korgFilter = function (korgArr, iterator) {
	let realData = 0, dataMask = 0;
	for (let pointer = 0; pointer < korgArr.length; pointer ++) {
		let shifts = (pointer & 7) - 1,
		unmasked = (((dataMask >> shifts) & 1) << 7),
		e = korgArr[pointer];
		e += unmasked;
		if ((pointer & 7) !== 0) {
			iterator(e, realData, korgArr);
			//console.debug(`Unmasked: ${dataMask} >> ${shifts} = ${e}`);
			realData ++;
		} else {
			dataMask = korgArr[pointer];
			//console.debug(`Overlay mask: ${dataMask}`);
		};
	};
};
let korgUnpack = function (korgArr) {
	let newLength = (korgArr.length * 7) >> 3;
	let unpacked = new Uint8Array(newLength);
	korgFilter(korgArr, (e, i) => {
		unpacked[i] = e;
	});
	return unpacked;
};
let korgPack = function (rawArr) {
	let newLength = Math.ceil((rawArr.length << 3) / 7);
	let packed = new Uint8Array(newLength);
	rawArr.forEach((e, i) => {
		let ptrOverlay = Math.floor(i / 7) << 3;
		let ptrData = Math.floor((i << 3) / 7) + 1;
		let ptrShift = i % 7;
		packed[ptrOverlay] |= (e >> 7) << ptrShift;
		packed[ptrData] |= e & 127;
	});
	return packed;
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

let getDebugState = function () {
	// Direct variable modification is required for performance, as global variable fallback is expensive.
	// If run on Bun.js or Node.js, output all possible logs
	//return (typeof self?.require !== "undefined") || (self?.debugMode ?? false);
	return self?.debugMode ?? false;
	return false;
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

const noteRoot = "CDEFGAB";
const noteAcciTet12 = "♭𝄫,𝄫,♭,,♯,𝄪,𝄪♯".split(",");
let getChordName = (root, acciTet48, type) => {};

// The functions below are better put in a dedicated library.
let packBitField = (sourceBuffer, targetBuffer, isStrict = true) => {
	if (typeof sourceBuffer?.length !== "number") {
		throw(new SyntaxError("The source buffer must be an array-like object."));
	};
	let desiredSize = (sourceBuffer.length >>> 3) + (sourceBuffer.length & 7 ? 1 : 0);
	if (targetBuffer) {
		if (typeof targetBuffer?.length !== "number") {
			throw(new SyntaxError("The target buffer must be an array-like object."));
		};
		if (isStrict && targetBuffer < desiredSize) {
			throw(new Error("The target buffer cannot satisfy the packed bit field."));
		};
	} else {
		targetBuffer = new Uint8Array(desiredSize);
	};
	for (let i = 0; i < sourceBuffer.length; i ++) {
		targetBuffer[i >>> 3] |= (sourceBuffer[i] ? 1 : 0) << (i & 7);
	};
	return targetBuffer;
};
let unpackBitField = (sourceBuffer, targetBuffer, maxSize = 0, isStrict = true) => {
	if (sourceBuffer?.BYTES_PER_ELEMENT !== 1) {
		throw(new SyntaxError("The source buffer must be Uint8Array."));
	};
	let desiredSize = sourceBuffer.length << 3;
	if (maxSize > 0) {
		desiredSize = Math.min(desiredSize, maxSize);
	};
	console.debug(sourceBuffer.length, desiredSize);
	if (targetBuffer) {
		if (typeof targetBuffer?.length !== "number") {
			throw(new SyntaxError("The target buffer must be an array-like object."));
		};
		if (isStrict && targetBuffer < desiredSize) {
			throw(new Error("The target buffer cannot satisfy the packed bit field."));
		};
	} else {
		targetBuffer = new Uint8Array(desiredSize);
	};
	let rollingByte = 0;
	for (let i = 0; i < desiredSize; i ++) {
		if (i & 7) {
			rollingByte >>= 1;
		} else {
			rollingByte = sourceBuffer[i >>> 3];
		};
		targetBuffer[i] = rollingByte & 1;
	};
	return targetBuffer;
};
const bufferMaps = [new Map(), new Map()]; // encode and decode array
bufferMaps[0].set("base64", u8Enc.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")); // Defer to browser support when available
bufferMaps[0].set("base64url", u8Enc.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")); // Defer to browser support when available
bufferMaps[0].set("hex", u8Enc.encode("0123456789abcdef")); // Defer to browser support when available
bufferMaps[0].set("ovm43", u8Enc.encode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"));
bufferMaps[0].set("radix64", u8Enc.encode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/"));
bufferMaps[0].set("radix64url", u8Enc.encode("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"));
bufferMaps[0].set("xx", u8Enc.encode("+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"));
bufferMaps[0].set("xxurl", u8Enc.encode("_-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"));
bufferMaps[0].set("z64", u8Enc.encode("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/"));
bufferMaps[0].set("z64url", u8Enc.encode("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"));
for (let [key, value] of bufferMaps[0]) {
	let decodeMap = (new Uint8Array(128)).fill(255); // 255: invalid
	for (let i = 0; i < value.length; i ++) {
		decodeMap[value[i]] = i;
	};
	// 254: ignore
	switch (key) {
		case "hex": {
			for (let i = 10; i < 16; i ++) {
				decodeMap[i + 55] = i;
			};
			break;
		};
		default: {
			decodeMap[9] = 254;
			decodeMap[10] = 254;
			decodeMap[12] = 254;
			decodeMap[13] = 254;
			decodeMap[32] = 254;
			decodeMap[61] = 254;
		};
	};
	bufferMaps[1].set(key, decodeMap);
};
console.debug(bufferMaps);
let bufferFrom = (alphabet = "base64", string, lastChunkHandling = "loose", maxLength = 536870911) => {
	if (typeof string !== "string") {
		throw(new TypeError("Input is not a string."));
	};
	if (!bufferMaps[1].has(alphabet)) {
		throw(new TypeError(`Alphabet "${alphabet}" is not supported.`));
	};
	let decodeMap = bufferMaps[1].get(alphabet);
	let encodeMapSize = bufferMaps[0].get(alphabet).length;
	let buffer;
	switch (alphabet) {
		case "hex": {
			if (Object.hasOwn(Uint8Array, "fromHex")) {
				// Use the built-in method whenever available.
				return Uint8Array.fromHex(string);
			};
			if (string.length & 1) {
				throw(new SyntaxError("The hex string must have an even number of characters."));
			};
			let maxReadLength = Math.min(string.length, maxLength << 1);
			buffer = new Uint8Array(maxReadLength >>> 1);
			for (let i = 0; i < maxReadLength; i ++) {
				let charCode = string.charCodeAt(i);
				if (charCode >= decodeMap.length) {
					throw(new SyntaxError(`"${string[i]}" exceeded decoding capabilities.`));
				};
				let decodedByte = decodeMap[charCode];
				switch (decodedByte) {
					case 254: {
						break;
					};
					case 255: {
						throw(new SyntaxError(`"${string[i]}" is not a valid hex-digit.`));
						break;
					};
					default: {
						if (decodedByte < encodeMapSize) {
							buffer[i >> 1] |= decodedByte << (i & 1 ? 0 : 4);
						} else {
							throw(new SyntaxError(`"${string[i]}" caused an unexpected error.`));
						};
					};
				};
			};
			break;
		};
		default: {
			// Base64 with various alphabets
			let maxReadLength = Math.min(string.length, Math.ceil((maxLength << 2) / 3));
			buffer = new Uint8Array((maxReadLength * 3) >> 2);
			let readRawSize = 0, window3Triple = 0;
			for (let i = 0; i < maxReadLength; i ++) {
				let window3Nibble = readRawSize & 3;
				let charCode = string.charCodeAt(i);
				if (charCode >= decodeMap.length) {
					throw(new SyntaxError(`"${string[i]}" exceeded decoding capabilities.`));
				};
				let decodedByte = decodeMap[charCode];
				//console.debug(decodedByte, i & 3);
				switch (decodedByte) {
					case 254: {
						break;
					};
					case 255: {
						throw(new SyntaxError(`"${string[i]}" is not a valid hex-digit.`));
						break;
					};
					default: {
						if (decodedByte < encodeMapSize) {
							if (alphabet === "ovm43") {
								if (window3Nibble) {
									// Payload
									buffer[window3Triple - 1 + window3Nibble] |= decodedByte;
									if (window3Nibble === 3) {
										window3Triple += 3;
									};
								} else {
									// Overlay
									let recursionGate = Math.min(3, maxReadLength - window3Triple),
									rollingByte = decodedByte;
									for (let i0 = 0; i0 < recursionGate; i0 ++) {
										buffer[window3Triple + i0] = (rollingByte & 3) << 6;
										rollingByte >>= 2;
									};
								};
							} else {};
							readRawSize ++;
						} else {
							throw(new SyntaxError(`"${string[i]}" caused an unexpected error.`));
						};
					};
				};
			};
			let readSizeValidate = readRawSize & 3;
			switch (readSizeValidate) {
				case 0: {
					// Complete Base64.
					break;
				};
				case 1: {
					throw(new SyntaxError("Unexpected incomplete base64 chunk."));
					break;
				};
				case 2:
				case 3: {
					switch (lastChunkHandling) {
						case "strict": {
							let lastPadAt = string.length, i = 0;
							//console.debug(lastPadAt);
							while (string.charCodeAt(lastPadAt - 1) === 61 && lastPadAt > 0) {
								lastPadAt --;
								//console.debug(lastPadAt);
							};
							if (((string.length - lastPadAt + readSizeValidate) & 3) !== 0) {
								throw(new SyntaxError("Unexpected incomplete base64 chunk."));
							};
							break;
						};
						case "stop-before-partial": {
							break;
						};
						default: {
							// Same as "loose"
						};
					};
					break;
				};
			};
		};
	};
	return buffer;
};
let bufferTo = (alphabet = "base64", string, omitPadding = false) => {};

self.bufferFrom = bufferFrom;
self.bufferTo = bufferTo;

export {
	arrayCompare,
	toDecibel,
	gsChecksum,
	korgFilter,
	korgUnpack,
	korgPack,
	halfByteFilter,
	halfByteUnpack,
	x5dSendLevel,
	customInterpreter,
	ascii64Dec,
	getDebugState,
	packBitField,
	unpackBitField,
	bufferFrom,
	bufferTo
};
