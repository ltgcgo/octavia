// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Fake classes intended to specify native types. For documentation only.
* @license LGPL-3.0-only
* @module cc.ltgc.seamstress.nativeType
*/

// Fake signed integers.
export type int8 = number
export type int16 = number
export type int32 = number
export type int64 = bigint
export type int128 = bigint
export type isize = bigint

// Fake unsigned integers.
export type uint8 = number
export type uint16 = number
export type uint32 = number
export type uint64 = bigint
export type uint128 = bigint
export type usize = bigint
export type uintptr = bigint

// Fake floats.
export type float16 = number
export type float32 = number
export type float64 = number
// JS cannot represent f128.
export type complex32 = Float32Array
export type complex64 = Float32Array
export type complex128 = Float64Array
export type quaternion64 = Float32Array
export type quaternion128 = Float32Array
export type quaternion256 = Float64Array

// Endian-specific.
export type i8be = int8
export type i8le = int8
export type i16be = int16
export type i16le = int16
export type i32be = int32
export type i32le = int32
export type i64be = int64
export type i64le = int64
export type i128be = int128
export type i128le = int128
export type u8be = int8
export type u8le = int8
export type u16be = int16
export type u16le = int16
export type u32be = int32
export type u32le = int32
export type u64be = int64
export type u64le = int64
export type u128be = int128
export type u128le = int128

// Aliases.
export type byte = uint8
export type rune = int32

export default class NativeType {
}
