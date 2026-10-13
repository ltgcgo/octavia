// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0
// Originally from Seamstress.

/** Common integer-binary IO operations.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.integerHandler */

import type {
	int8,
	int16,
	int32,
	int64,
	uint16,
	uint32,
	uint64
} from "./nativeType.d.mts";

/** Reading and writing various forms of numeric values. */
export default class IntegerHandler {
	/** When set to true, methods will use runtime-native APIs and WebAssembly over the pure-JS implementation. */
	static useNative: boolean;
	/** When set to true, methods will error out instead of emitting warnings at places. */
	static useStrict: boolean;
	/** When set to true, methods will no longer conduct type checks. Usually has negligible performance impact unless on poorly-optimized runtimes. */
	static unsafeType: boolean;
	/** Counts the total bits required to store an unsigned BigInt. `0` is `0`, parallel to `Math.clz32`. */
	static bitsBigUint(value: bigint): number;
	/** Counts the size of a standard MIDI VLV-8 value in bytes, up to `16`. Will return `0` when failed (expected size goes over `16`). */
	static sizeVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Counts the size of an integer to be emitted as a standard MIDI VLV-8 value in bytes. Will return 0 when failed. */
	static lengthVLV(value: number): number;
	/** Counts the size of an integer to be emitted as a standard MIDI VLV-8 value in bytes. Will return 0 when failed. */
	static lengthVLVBigInt(value: bigint): number;
	/** Reads a standard MIDI VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static readVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a standard MIDI VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out. */
	static readVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, offset?:number): bigint;
	/** Writes a standard MIDI VLV-8 value to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static writeVLV(buffer: Uint8Array|Uint8ClampedArray, value: number, offset?: number): void;
	/** Writes a standard MIDI VLV-8 value to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static writeVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, value: bigint, offset?: number): void;
	/** Writes a standard MIDI VLV-8 value to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static emitVLV(value: number): Uint8Array;
	/** Writes a standard MIDI VLV-8 value to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 16 bytes, after which it will error out. */
	static emitVLVBigInt(value: bigint): Uint8Array;
	/** Counts the size of a reversible VLV-8 value in bytes, up to `16`. Will return 0 when failed (expected size goes over `16`). */
	static sizeRVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Counts the size of an integer to be emitted as a reversible VLV-8 value in bytes. Will return 0 when failed. */
	static lengthRVLV(value: number): number;
	/** Counts the size of an integer to be emitted as a reversible VLV-8 value in bytes. Will return 0 when failed. */
	static lengthRVLVBigInt(value: bigint): number;
	/** Reads a reversible VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readRVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a reversible VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readRVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, offset?:number): bigint;
	/** Reads a boolean, returned as one of `0` (`false`) and `1` (`true`). Will error out if out of bounds. One byte has 8 individual bits. `85` will be expanded to `[1, 0, 1, 0, 1, 0, 1, 0]`, while `170` will be expanded to `[0, 1, 0, 1, 0, 1, 0, 1]`. */
	static readBool(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads an int8 value. Will error out if out of bounds. */
	static readInt8(buffer: Uint8Array|Uint8ClampedArray, offset?: number): int8;
	/** Reads an int16 value. Will error out if out of bounds. */
	static readInt16(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): int16;
	/** Reads a uint16 value. Will error out if out of bounds. */
	static readUint16(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): uint16;
	/** Reads an int24 value. Will error out if out of bounds. */
	static readInt24(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): int32;
	/** Reads a uint24 value. Will error out if out of bounds. */
	static readUint24(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): uint32;
	/** Reads an int32 value. Will error out if out of bounds. */
	static readInt32(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): int32;
	/** Reads a uint32 value. Will error out if out of bounds. */
	static readUint32(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): uint32;
	/** Reads an int64 value. Will error out if out of bounds. */
	static readInt64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): int64;
	/** Reads a uint64 value. Will error out if out of bounds. */
	static readUint64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): uint64;
}