"use strict";

const BinaryStreamCodecs = class BinaryStreamCodecs {
	/** Stream from KORG 8-on-7 bytes. Does not allocate the full decoded buffer.
	* @param {Uint8Array | Uint8ClampedArray} buffer */
	static *decodeKorg(buffer) {
		let overlayByte = 0;
		for (let i = 0; i < buffer.length; i ++) {
			const e = buffer[i], chunk = i >>> 3;
			if ((i & 7) === 0) {
				// Overlay byte.
				overlayByte = e;
			} else {
				// Data byte.
				const realBitIndex = (i & 7) - 1;
				const highBit = (overlayByte >> (realBitIndex)) & 1;
				yield (highBit << 7) | (e & 127);
			};
		};
	};
	/** Encode from raw buffer to KORG 8-on-7 bytes. Does not allocate the full decoded buffer.
	* @param {Uint8Array | Uint8ClampedArray} inBuffer */
	static *encodeKorg(inBuffer) {
		for (let i = 0; i < inBuffer.length; i += 7) {
			const chunkMax = Math.min(i + 7, inBuffer.length),
			chunkView = inBuffer.subarray(i, chunkMax);
			let overlayByte = 0;
			for (let i1 = 0; i1 < chunkView.length; i1 ++) {
				overlayByte |= (chunkView[i1] & 128) >> (7 - i1);
			};
			yield overlayByte;
			for (let i1 = 0; i1 < chunkView.length; i1 ++) {
				yield chunkView[i1] & 127;
			};
		};
	};
};
const BinaryBufferCodecs = class BinaryBufferCodecs {
	/** Decode from KORG 8-on-7 bytes to raw buffer. Allocates the full decoded buffer.
	* @param {Uint8Array | Uint8ClampedArray} inBuffer */
	static decodeKorg(inBuffer) {
		const outBuffer = new Uint8Array((inBuffer.length * 7) >>> 3);
		let overlayByte = 0;
		for (let i = 0; i < inBuffer.length; i ++) {
			const e = inBuffer[i], chunk = i >>> 3;
			if ((i & 7) === 0) {
				// Overlay byte.
				overlayByte = e;
			} else {
				// Data byte.
				const realBitIndex = (i & 7) - 1;
				const highBit = (overlayByte >> (realBitIndex)) & 1;
				outBuffer[chunk * 7 + realBitIndex] = (highBit << 7) | (e & 127);
			};
		};
		return outBuffer;
	};
	/** Encode from raw buffer to KORG 8-on-7 bytes. Allocates the full decoded buffer.
	* @param {Uint8Array | Uint8ClampedArray} inBuffer */
	static encodeKorg(inBuffer) {
		const outBuffer = new Uint8Array(Math.ceil((inBuffer.length << 3) / 7));
		for (let i = 0; i < inBuffer.length; i += 7) {
			const chunkMax = Math.min(i + 7, inBuffer.length),
			chunkView = inBuffer.subarray(i, chunkMax),
			outChunkStart = Math.floor(i / 7) << 3;
			let overlayByte = 0;
			for (let i1 = 0; i1 < chunkView.length; i1 ++) {
				overlayByte |= (chunkView[i1] & 128) >> (7 - i1);
			};
			outBuffer[outChunkStart] = overlayByte;
			for (let i1 = 0; i1 < chunkView.length; i1 ++) {
				outBuffer[outChunkStart + i1 + 1] = chunkView[i1] & 127;
			};
		};
		return outBuffer;
	};
};
const IterableUtils = class IterableUtils {
	/** Turn an iterator into an asynchronous `forEach`.
	* @param {Iterable<T>} iterable
	* @param {(e: number, i?: number, a?: Iterable<T>) => {}} callback
	*/
	static eachSync(iterable, callback) {
		let i = 0;
		for (const e of iterable) {
			callback.call(iterable, e, i, iterable);
			i ++;
		};
	};
	/** Turn an async iterator into an asynchronous `forEach`.
	* @param {AsyncIterable<T>} iterable
	* @param {async (e: number, i?: number, a?: Iterable<T>) => {}} callback
	*/
	static async eachAsync(iterable, callback) {
		let i = 0;
		for await (const e of iterable) {
			await callback.call(iterable, e, i, iterable);
			i ++;
		};
	};
};

export {
	BinaryStreamCodecs,
	BinaryBufferCodecs,
	IterableUtils
};
