"use strict";

const u8Enc = new TextEncoder();

/** @type {Map<string,Uint8Array>[]} */
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
//console.debug(bufferMaps);

/**  @param {string} alphabet
* @param {string} string
* @param {string} lastChunkHandling
* @param {number} maxLength
* @returns {Uint8Array} */
const bufferFrom = function bufferFrom (alphabet = "base64", string, lastChunkHandling = "loose", maxLength = 536870911) {
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
			if (Object.hasOwn(Uint8Array, "fromBase64")) {
				// Use the built-in method whenever available.
				switch (alphabet) {
					case "base64":
					case "base64url": {
						return Uint8Array.fromBase64(string, {
							alphabet,
							lastChunkHandling
						});
						break;
					};
				};
			};
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
							} else {
								if (window3Nibble < 3) {
									buffer[window3Triple + window3Nibble] = (decodedByte << ((window3Nibble + 1) << 1)) & 255;
								};
								if (window3Nibble > 0) {
									buffer[window3Triple + window3Nibble - 1] |= decodedByte >> ((3 - window3Nibble) << 1);
								};
							};
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

/** @param {string} alphabet
* @param {Uint8Array} buffer
* @param {boolean} omitPadding
* @returns {string} */
const bufferTo = function bufferTo (alphabet = "base64", buffer, omitPadding = false) {};
self.bufferTo = bufferTo;

/** @param {Uint8Array|Uint8ClampedArray} buffer
* @param {number[]} carvedList
* @returns {Uint8Array|Uint8ClampedArray} */
const bufferCarveOut = function (buffer, carvedList = []) {
	if (carvedList?.length > 0) {
		const filteredBuffer = new Uint8Array(buffer.length - carvedList.length);
		for (let i = 0; i < carvedList.length; i ++) {
			const e0 = i === 0 ? 0 : carvedList[i - 1] + 1;
			const e1 = carvedList[i];
			if (e1 - e0 > 1) {
				filteredBuffer.set(buffer.subarray(e0, e1), e0 - i);
			};
		};
		const lastKnockout = carvedList[carvedList.length - 1];
		filteredBuffer.set(buffer.subarray(lastKnockout + 1), lastKnockout - carvedList.length + 1);
		return filteredBuffer;
	} else {
		return buffer;
	}
};

export {
	bufferFrom,
	bufferTo,
	bufferCarveOut
};
