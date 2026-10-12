// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/** Common binary buffer IO operations, including string representation encoding/decoding and safe allocations.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.bufferIO
*/

import type { uint32, TypedArray, Uint8Arrays } from "./nativeType.d.mts";

type numberArray = number[]|TypedArray;

/** Pack a number array into a bit field. */
export function bitFieldPack(sourceBuffer: numberArray, targetBuffer?: Uint8Arrays, options?: {
	/** When `true`, if the target buffer cannot fully accept the packed bitfield, the method will throw. Default to `false`. */
	"strict": boolean,
	/** Elements greater or equal to this value will be considered as `true`. Cannot be lower than `1`. */
	"threshold": number
}): Uint8Array;
/** Unpack a bit field back into number arrays. */
export function bitFieldUnpack<T extends numberArray>(sourceBuffer: Uint8Arrays, targetBuffer?: T, options?: {
	/** The maximum applicable length of the resulting array. */
	"maxSize": number,
	/** When `true`, if the target buffer cannot fully accept the unpacked bitfield, the method will throw. Default to `false`. */
	"strict": boolean,
	/** If an elemnt is `true`, the unpacked element will be populated with this value, otherwise it will become `0`. */
	"value": number
}): T;

/** Return a `Uint8Array` object with the desired size. If the system does not have enough resources, this method will throw. Used to guard against buffer size explosions. */
export function allocateU8(desiredSize: uint32): Uint8Array;

/** Common buffer IO operations. */
export class BufferIO {
	/** Return a new copy of `Uint8Array` having all elements of the specified indices removed. */
	static carve<T extends Uint8Arrays>(buffer: T, carvedIndexList: number[]): T;
	/** Decode binary buffers from encoded strings. Valid alphabets:
	* - `base64`: Standard Base64.
	* - `base64url`: URL-safe Base64.
	* - `hex`: Standard hexadecimal. URL-safe.
	* - `ovm43`: Mapped overlay 3-on-4 from the Lightingale Community, inspired by Korg 7-on-8. URL-safe.
	* - `radix64`: Standard Radix64.
	* - `radix64url`: URL-safe Radix64.
	* - `uu`: Standard uuencoding. Space (` `) is the zero payload.
	* - `uucommon`: Common uuencoding. Backtick replaced space as the zero payload.
	* - `xml`: Standard XML encoding.
	* - `xx`: Standard xxencoding.
	* - `xxurl`: URL-safe xxencoding.
	* - `y64`: Encoding scheme of an unknown origin. URL-safe.
	* - `z64`: Encoding scheme of an unknown origin.
	* - `z64url`: URL-safe z64.
	* @param alphabet The alphabet to use.
	* @param string The encoded string to decode data from.
	* @param lastChunkHandling [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64#lastchunkhandling). */
	static from(alphabet: string, string: string, lastChunkHandling?: string, maxLength?: number): Uint8Array;
	/** (WIP) */
	static to(): string;
}