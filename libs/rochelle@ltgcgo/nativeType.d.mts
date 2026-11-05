// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Fake classes intended to specify native types. For documentation only.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.nativeType
*/

// Fake signed integers.
/** Go-style type. */
export type int8 = number
/** Go-style type. */
export type int16 = number
/** Go-style type. */
export type int32 = number
/** Go-style type. */
export type int64 = bigint
/** Rust/Odin-style type in Go form. */
export type int128 = bigint
/** Rust-style type. Architecture-native integer. */
export type isize = bigint

// Fake unsigned integers.
/** Go-style type. */
export type uint8 = number
/** Go-style type. */
export type uint16 = number
/** Go-style type. */
export type uint32 = number
/** Go-style type. */
export type uint64 = bigint
/** Rust/Odin-style type in Go form. */
export type uint128 = bigint
/** Rust-style type. Architecture-native integer. */
export type usize = bigint
/** Go/Odin-style type. */
export type uintptr = bigint

// Fake floats.
/** Rust/Odin-style type in Go form. */
export type float16 = number
/** Go-style type. */
export type float32 = number
/** Go-style type. */
export type float64 = number
// JS cannot represent f128.
/** Odin-style type in Go form. */
export type complex32 = Float32Array
/** Go/Odin-style type. */
export type complex64 = Float32Array
/** Go/Odin-style type. */
export type complex128 = Float64Array
/** Odin-style type. */
export type quaternion64 = Float32Array
/** Odin-style type. */
export type quaternion128 = Float32Array
/** Odin-style type. */
export type quaternion256 = Float64Array

// Endian-specific.
/** Odin-style type. */
export type i8be = int8
/** Odin-style type. */
export type i8le = int8
/** Odin-style type. */
export type i16be = int16
/** Odin-style type. */
export type i16le = int16
/** Odin-style type. */
export type i32be = int32
/** Odin-style type. */
export type i32le = int32
/** Odin-style type. */
export type i64be = int64
/** Odin-style type. */
export type i64le = int64
/** Odin-style type. */
export type i128be = int128
/** Odin-style type. */
export type i128le = int128
/** Odin-style type. */
export type u8be = int8
/** Odin-style type. */
export type u8le = int8
/** Odin-style type. */
export type u16be = int16
/** Odin-style type. */
export type u16le = int16
/** Odin-style type. */
export type u32be = int32
/** Odin-style type. */
export type u32le = int32
/** Odin-style type. */
export type u64be = int64
/** Odin-style type. */
export type u64le = int64
/** Odin-style type. */
export type u128be = int128
/** Odin-style type. */
export type u128le = int128

// Aliases.
/** Go/Odin-style alias. */
export type byte = uint8
/** Go/Odin-style alias. */
export type rune = int32

/** Floating point typed arrays. */
export type FloatArray = /*Float16Array|*/Float32Array|Float64Array;
/** Signed integer typed arrays. */
export type IntArray = Int8Array|Int16Array|Int32Array;
/** Unsigned 8-bit integer typed arrays. */
export type Uint8Arrays = Uint8Array|Uint8ClampedArray;
/** Unsigned integer typed arrays. */
export type UintArray = Uint8Arrays|Uint16Array|Uint32Array;
/** BigInt typed arrays. */
export type BigIntArray = BigInt64Array|BigUint64Array;
/** All typed arrays. */
export type TypedArray = IntArray|UintArray|BigIntArray|FloatArray;
/** All typed array constuctors. */
export type TypedArrayConstructors<T extends TypedArray> = new (...args: any[]) => T;
/** All array buffer view constuctors. */
export type ArrayBufferViewConstructors<T extends ArrayBufferView> = new (...args: any[]) => T;
