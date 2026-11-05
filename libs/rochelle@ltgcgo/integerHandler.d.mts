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
	uint8,
	uint16,
	uint32,
	uint64,
	Uint8Arrays,
	TypedArray
} from "./nativeType.d.mts";

/** Common properties shared by all handlers. */
export class BaseIntegerHandler {
	/** When set to true, methods will use runtime-native APIs and WebAssembly over the pure-JS implementation. */
	static useNative: boolean;
	/** Defaults to true. When set to true, methods will throw instead of emitting warnings at certain places, including but not limited to:
	* - Encoding canonicality test: Non-canonical encodings are one of the common sources of security vulnerabilities. If compatibility outweighs potential vulnerability, you can disable the strict check. */
	static useStrict: boolean;
	/** When set to true, methods will no longer conduct type checks. Usually has negligible performance impact unless on poorly-optimized runtimes. */
	static unsafeType: boolean;
	/** Counts the total bits required to store an unsigned BigInt. `0` is `0`, parallel to `Math.clz32`. */
	static bitsBigUint(value: bigint): uint32;
	protected static assertU8(buffer: unknown): asserts buffer is Uint8Arrays;
	protected static assertNumber(value: unknown): asserts value is number;
	protected static assertBigInt(value: unknown): asserts value is bigint;
	protected static grabDataView(typedArray: TypedArray): DataView;
}

/** Read-only handlers for standard MIDI VLV-8, a big-endian multi-byte variable width encoding scheme. Unlike LEB128, MIDI VLV-8 is big-endian.
*
* This encoding scheme is **not** self-synchronising. */
export class VLVReader extends BaseIntegerHandler {
	static MASK_VLV: 128;
	/** Counts the size of a standard MIDI VLV in bytes, up to `16`. Will return `0` when incomplete or failed (expected size goes over `16`). */
	static size(buffer: Uint8Arrays, offset?: number): uint8;
	/** Counts the size of an integer to be emitted as a standard MIDI VLV in bytes. Will return 0 when failed. */
	static estimate(value: number): uint8;
	/** Counts the size of an integer to be emitted as a standard MIDI VLV in bytes. Will return 0 when failed. */
	static estimateBigInt(value: bigint): uint8;
	/** Reads a standard MIDI VLV from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static read(buffer: Uint8Arrays, offset?: number): number;
	/** Reads a standard MIDI VLV from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readBigInt(buffer: Uint8Arrays, offset?:number): bigint;
}

/** Readers and writers for standard MIDI VLV-8, a big-endian multi-byte variable width encoding scheme. Unlike LEB128, MIDI VLV-8 is big-endian.
*
* This encoding scheme is **not** self-synchronising. */
export class VLVHandler extends VLVReader {
	/** Writes a standard MIDI VLV to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static write(buffer: Uint8Arrays, value: number, offset?: number): void;
	/** Writes a standard MIDI VLV to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static writeBigInt(buffer: Uint8Arrays, value: bigint, offset?: number): void;
	/** Writes a standard MIDI VLV to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static emit(value: number): Uint8Array;
	/** Writes a standard MIDI VLV to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 16 bytes, after which it will error out. */
	static emitBigInt(value: bigint): Uint8Array;
}

/** Read-only handlers for reversible VLV-8, a big-endian multi-byte variable width encoding scheme.
*
* This encoding scheme is self-synchronising. */
export class RVLVReader extends BaseIntegerHandler {
	static MASK_RVLV: 192;
	static RVLV_START: 192;
	static RVLV_MIDDLE: 128;
	static RVLV_END: 64;
	static RVLV_SINGLE: 0;
	/** Counts the size of a reversible VLV in bytes, up to `16`. Will return 0 when failed (expected size goes over `16`). */
	static size(buffer: Uint8Arrays, offset?: number): uint8;
	/** Counts the size of an integer to be emitted as a reversible VLV in bytes. Will return 0 when failed. */
	static estimate(value: number): number;
	/** Counts the size of an integer to be emitted as a reversible VLV in bytes. Will return 0 when failed. */
	static estimateBigInt(value: bigint): number;
	/** Reads a reversible VLV from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static read(buffer: Uint8Arrays, offset?: number): number;
	/** Reads a reversible VLV from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readBigInt(buffer: Uint8Arrays, offset?: number): bigint;
}

/** (WIP) Read-only handlers for LEB128, a little-endian multi-byte variable width encoding scheme. Unlike MIDI VLV-8, LEB128 is little-endian.
*
* This encoding scheme is **not** self-synchronising. */
export class LEBReader extends BaseIntegerHandler {
	/** Counts the size of a LEB128 value in bytes, up to `16`. Will return `0` when incomplete or failed (expected size goes over `16`). */
	static size(buffer: Uint8Arrays, offset?: number): uint8;
	/** Counts the size of an integer to be emitted as a LEB128 value in bytes. Will return 0 when failed. */
	static estimate(value: number): uint8;
	/** Counts the size of an integer to be emitted as a LEB128 value in bytes. Will return 0 when failed. */
	static estimateBigInt(value: bigint): uint8;
	/** Reads a LEB128 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static read(buffer: Uint8Arrays, offset?: number): number;
	/** Reads a LEB128 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readBigInt(buffer: Uint8Arrays, offset?:number): bigint;
}

/** Read-only handlers for OpenMPT tagged integers, a little-endian multi-byte variable width encoding scheme.
*
* This encoding scheme is self-synchronising. */
export class TIntReader extends BaseIntegerHandler {
	/** Counts the size of a tagged 16-bit integer in bytes. Will return 0 when failed. */
	static sizeTInt16(buffer: Uint8Arrays, offset?: number): uint8;
	/** Reads a tagged 16-bit unsigned integer in bytes.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readTUint16(buffer: Uint8Arrays, offset?: number): uint16;
	/** Reads a tagged 16-bit signed integer in bytes.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readTInt16(buffer: Uint8Arrays, offset?: number): int16;
	/** Counts the size of a tagged 32-bit integer in bytes. Will return 0 when failed. */
	static sizeTInt32(buffer: Uint8Arrays, offset?: number): uint8;
	/** Reads a tagged 32-bit unsigned integer in bytes.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readTUint32(buffer: Uint8Arrays, offset?: number): uint32;
	/** Reads a tagged 32-bit signed integer in bytes.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readTInt32(buffer: Uint8Arrays, offset?: number): int32;
	/** Counts the size of a tagged 64-bit integer in bytes. Will return 0 when failed. */
	static sizeTInt64(buffer: Uint8Arrays, offset?: number): uint8;
	/** Reads a tagged 64-bit unsigned integer in bytes. Values exceeding [0, 2⁴⁶) will error out.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. Canonicality checks currently does not work as expected. */
	static readTUint64(buffer: Uint8Arrays, offset?: number): number;
	/** Reads a tagged 64-bit signed integer in bytes. Values exceeding [-2⁴⁶, 2⁴⁶) will error out.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. Canonicality checks currently does not work as expected. */
	static readTInt64(buffer: Uint8Arrays, offset?: number): number;
	/** Reads a tagged 64-bit unsigned integer as `BigInt` in bytes.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static readTBigUint64(buffer: Uint8Arrays, offset?: number): uint64;
	/** Reads a tagged 64-bit signed integer as `BigInt` in bytes.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. Canonicality checks currently does not work as expected. */
	static readTBigInt64(buffer: Uint8Arrays, offset?: number): int64;
}

/** (WIP) Read-only handlers for slightly extended Unicode Codepoint Transformation Format, a big-endian multi-byte variable width encoding scheme. The encoding space has been expanded from 4 bytes of the original UTF-8 to 8 bytes, permitting values within the [0, 2⁴²) range.
*
* This encoding scheme is self-synchronising. */
export class UCTFReader extends BaseIntegerHandler {
	/** Counts the size of a UCTF value in bytes, up to `8`. Will return `0` when incomplete or failed (expected size goes over `8`). */
	static size(buffer: Uint8Arrays, offset?: number): uint8;
	/** Counts the size of an integer to be emitted as a UCTF value in bytes. Will return 0 when failed. */
	static estimate(value: number): uint8;
	/** Counts the size of an integer to be emitted as a UCTF value in bytes. Will return 0 when failed. */
	static estimateBigInt(value: bigint): uint8;
	/** Reads a UCTF value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number.
	*
	* If strict mode is enabled, non-canonical encodings will throw, otherwise warnings will be emitted. */
	static read(buffer: Uint8Arrays, offset?: number): number;
}

/** Readers and writers for various forms of numeric values. */
export class NativeHandler extends BaseIntegerHandler {
	/** Reads a boolean, returned as one of `0` (`false`) and `1` (`true`). Will error out if out of bounds. One byte has 8 individual bits. `85` will be expanded to `[1, 0, 1, 0, 1, 0, 1, 0]`, while `170` will be expanded to `[0, 1, 0, 1, 0, 1, 0, 1]`. */
	static readBool(buffer: Uint8Arrays, offset?: number): uint8;
	/** Reads an int8 value. Will error out if out of bounds. */
	static readInt8(buffer: Uint8Arrays, offset?: number): int8;
	/** Reads an int16 value. Will error out if out of bounds. */
	static readInt16(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): int16;
	/** Reads a uint16 value. Will error out if out of bounds. */
	static readUint16(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): uint16;
	/** Reads an int24 value. Will error out if out of bounds. */
	static readInt24(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): int32;
	/** Reads a uint24 value. Will error out if out of bounds. */
	static readUint24(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): uint32;
	/** Reads an int32 value. Will error out if out of bounds. */
	static readInt32(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): int32;
	/** Reads a uint32 value. Will error out if out of bounds. */
	static readUint32(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): uint32;
	/** Reads an int64 value. Will error out if out of bounds. */
	static readInt64(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): int64;
	/** Reads a uint64 value. Will error out if out of bounds. */
	static readUint64(buffer: Uint8Arrays, isLittleEndian?: boolean, offset?: number): uint64;
}