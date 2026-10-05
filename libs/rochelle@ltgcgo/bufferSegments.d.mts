// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* Read and write multiple typed array segments, as if they are a single one.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.bufferSegments
*/

import type {
	int8, uint8,
	int16, uint16,
	int32, uint32,
	int64, uint64,
	float16, float32, float64
} from "./nativeType.d.mts";

/** Floating point typed arrays. */
type FloatArray = Float16Array|Float32Array|Float64Array;
/** Signed integer typed arrays. */
type IntArray = Int8Array|Int16Array|Int32Array;
/** Unsigned integer typed arrays. */
type UintArray = Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array;
/** BigInt typed arrays. */
type BigIntArray = BigInt64Array|BigUint64Array;
/** All typed arrays. */
type TypedArray = IntArray|UintArray|BigIntArray|FloatArray;
type TypedArrayConstructors<T extends TypedArray> = new (...args: any[]) => T;

declare type ArrayComparator<T> = (
	a: T,
	b: T
) => number;
declare type ArrayForEach<U, T extends ArrayLike<U>|TypedArray> = (
	element: U,
	index: number,
	array: T
) => void;
declare type ArrayPredicate<U, T extends ArrayLike<U>|TypedArray> = (
	element: U,
	index: number,
	array: T
) => boolean;
declare type ArrayReducer<U, T extends ArrayLike<U>|TypedArray, V> = (
	reduced: V,
	element: U,
	index: number,
	array: T
) => V;
declare type ArrayTransformer<U, T extends ArrayLike<U>|TypedArray> = (
	element: U,
	index: number,
	array: T
) => U;
declare type ArrayRegions = [
	childIndex: number,
	childStart: number,
	childEnd: number
];
declare type Numbers = number|bigint;

/** Represents a `ArrayBuffer`-like container for all actual buffers. */
declare class SegmentContainer<T extends ArrayBufferView> {
	/** The allowed type of the children enforced at runtime. */
	readonly type: DataViewConstructor|TypedArrayConstructors<TypedArray>;
	/** The contained buffer segments. This can be mutated however desired, however throws will happen if the element is not of type `{T}`. This is always a proxy. */
	readonly buffer: T[];
	/** The total size of all contained visible buffer segments in bytes. If no segment is added, this is always `0`. */
	readonly byteLength: number;
	readonly detached: false;
	readonly maxByteLength: number;
	readonly resizable: false;
	/** The amount of contained buffer segments. If no segment is added, this is always `0`. */
	readonly size: number;
	/** Returns the regions needed to be accessed for a given logical range. */
	regions(startIndex?: number, endIndex?: number): ArrayRegions[];
	/** Returns a copy of fully concatenated `ArrayBuffer`, from visible data in the specified range of all children. For detaching and transferring, this method is required. */
	slice(startIndex?: number, endIndex?: number): ArrayBuffer;
}
/** Represets a valid view of binary data buffers. */
declare class BufferSegmentsView<T extends ArrayBufferView> {
	/** How many bytes does an element of the view contain.
	* - `0`: `DataView`
	* - `1`: `Int8Array`, `Uint8Array`, `Uint8ClampedArray`
	* - `2`: `Int16Array`, `Uint16Array`, `Float16Array`
	* - `4`: `Int32Array`, `Uint32Array`, `Float32Array`
	* - `8`: `BigInt64Array`, `BigUint64Array`, `Float64Array` */
	readonly BYTES_PER_ELEMENT: number;
	/** The contained buffer segments. This can be mutated however desired, however throws will happen if the element is not of type `{T}`. */
	readonly buffer: SegmentContainer<T>;
	/** The total size of all contained visible buffer segments in bytes. If no segment is added, this is always `0`. */
	readonly byteLength: number;
	/** The amount of contained buffer segments. If no segment is added, this is always `0`. */
	readonly size: number;
	/** Returns a copy of fully concatenated view from visible data of all children. */
	concat(): T;
	/** Returns the regions needed to be accessed for a given logical range. */
	regions(startIndex?: number, endIndex?: number): ArrayRegions[];
}
/** Represents a unified `DataView` for all underlying buffer segments. */
export class DataViewSegments extends BufferSegmentsView<DataView> {
	/** The allowed type of the children enforced at runtime. */
	readonly type: DataViewConstructor;
	getInt8(offset: number, isLittleEndian?: boolean): int8;
	setInt8(offset: number, value: int8, isLittleEndian?: boolean): void;
	getUint8(offset: number, isLittleEndian?: boolean): uint8;
	setUint8(offset: number, value: uint8, isLittleEndian?: boolean): void;
	getInt16(offset: number, isLittleEndian?: boolean): int16;
	setInt16(offset: number, value: int16, isLittleEndian?: boolean): void;
	getUint16(offset: number, isLittleEndian?: boolean): uint16;
	setUint16(offset: number, value: uint16, isLittleEndian?: boolean): void;
	getInt32(offset: number, isLittleEndian?: boolean): int32;
	setInt32(offset: number, value: int32, isLittleEndian?: boolean): void;
	getUint32(offset: number, isLittleEndian?: boolean): uint32;
	setUint32(offset: number, value: uint32, isLittleEndian?: boolean): void;
	getBigInt64(offset: number, isLittleEndian?: boolean): int64;
	setBigInt64(offset: number, value: int64, isLittleEndian?: boolean): void;
	getBigUint64(offset: number, isLittleEndian?: boolean): uint64;
	setBigUint64(offset: number, value: uint64, isLittleEndian?: boolean): void;
	getFloat16(offset: number, isLittleEndian?: boolean): float16;
	setFloat16(offset: number, value: float16, isLittleEndian?: boolean): void;
	getFloat32(offset: number, isLittleEndian?: boolean): float32;
	setFloat32(offset: number, value: float32, isLittleEndian?: boolean): void;
	getFloat64(offset: number, isLittleEndian?: boolean): float64;
	setFloat64(offset: number, value: float64, isLittleEndian?: boolean): void;
}
/** Represents a unified `TypedArray` for all underlying buffer segments.
*
* `arrSegs[index] can also be used, however using `values()` is recommended instead if accessing logically continuous regions to minimise overhead. */
export class TypedArraySegments<T extends TypedArray, U extends Numbers> extends BufferSegmentsView<T> implements ArrayLike<U> {
	[n: number]: U;
	readonly [Symbol.iterator]: ArrayIterator<U>;
	/** If the elements of the view are `BigInt`s.
	* - `true`: `BigInt64Array`, `BigUint64Array`.
	* - `false`: Everything else. */
	readonly IS_BIGINT: boolean;
	/** If the elements of the view are guaranteed integers.
	* - `false`: `Float16Array`, `Float32Array`, `Float64Array`.
	* - `true`: Everything else. */
	readonly IS_INTEGER: boolean;
	/** If the elements of the view are signed.
	* - `false`: `Uint8Array`, `Uint16Array`, `Uint32Array`, `BigUint64Array`.
	* - `true`: Everything else. */
	readonly IS_SIGNED: boolean;
	/** The starting offset of the visible view. This must be an integer multiple of `BYTES_PER_ELEMENT`. */
	readonly byteOffset: number;
	/** The total length of all contained visible typed array segments. If no segment is added, this is always `0`. */
	readonly length: number;
	/** The allowed type of the children enforced at runtime. */
	readonly type: TypedArrayConstructors<T>;
	/** Retrieves the element from the segments with a 0-based index. Negative values count back from the end. */
	at(index: number): U|undefined;
	/** Shallow copies one region of the array to another.
	*
	* If the backing buffers are aliased, silent corruption can happen. */
	copyWithin(target: number, start: number, end?: number): this;
	/** Returns an iterator for the specified elements from appropriate segments. */
	entries(startIndex?: number, endIndex?: number): ArrayIterator<U>;
	/** Returns `false` if any element does not satisfy the supplied tester, otherwise `true`. */
	every(predicate: ArrayPredicate<U, this>, thisArg?: this): boolean;
	/** Fills the elements with the provided value in the specified range.
	*
	* If the backing buffers are aliased, silent corruption can happen. */
	fill(value: U, startIndex?: number, endIndex?: number): void;
	/** Creates a new non-segmented typed array populated with elements satisfying the supplied tester. */
	filter(predicate: ArrayPredicate<U, this>, thisArg?: this): T;
	/** Returns the first element satisfying the supplied tester. */
	find(predicate: ArrayPredicate<U, this>, thisArg?: this): U|undefined;
	/** Returns the index of the first element satisfying the supplied tester. */
	findIndex(predicate: ArrayPredicate<U, this>, thisArg?: this): number;
	/** Returns the last element satisfying the supplied tester. */
	findLast(predicate: ArrayPredicate<U, this>, thisArg?: this): U|undefined;
	/** Returns the index of the lfast element satisfying the supplied tester. */
	findLastIndex(predicate: ArrayPredicate<U, this>, thisArg?: this): number;
	forEach(forEach: ArrayForEach<U, T>, thisArg?: this): void;
	includes(value: U, fromIndex?: number): boolean;
	indexOf(value: U, fromIndex?: number): number;
	join(separator?: string): string;
	keys(): ArrayIterator<U>;
	lastIndexOf(value: U, fromIndex?: number): number;
	/** Creates a new non-segmented typed array populated with elements modified by the filter. */
	map(forEach: ArrayTransformer<U, T>, thisArg?: this): T;
	reduce<V>(reducer: ArrayReducer<U, T, V>, initValue?: V): V;
	reduceRight<V>(reducer: ArrayReducer<U, T, V>, initValue?: V): V;
	reverse(): void;
	/** Stores values supplied by the iterable object to the specified starting position.
	*
	* If the backing buffers are aliased, silent corruption can happen. */
	set(iterator: ArrayLike<U>|Iterable<U>, startIndex?: number): void;
	/** Creates a new non-segmented typed array populated with elements specified by the range. */
	slice(startIndex?: number, endIndex?: number): T;
	/** Returns `true` if any element satisfies the supplied tester, otherwise `false`. */
	some(predicate: ArrayPredicate<U, this>, thisArg?: this): boolean;
	// `sort` is not available. Use `toSorted` instead.
	/** Creates a contained view of the current view with the specified range. */
	subarray(startIndex?: number, endIndex?: number): TypedArraySegments<T, U>;
	/** Creates a new non-segmented typed array populated with all visible elements in the reversed order. */
	toReversed(): T;
	/** Creates a new non-segmented typed array populated with all visible elements in the sorted order. */
	toSorted(sorter?: ArrayComparator<number>): T;
	/** Returns an iterator for the specified elements from appropriate segments. */
	values(startIndex?: number, endIndex?: number): ArrayIterator<U>;
	/** Creates a new non-segmented typed array populated with all visible elements, but with the value at the defined index replaced with a given one. */
	with(index: number, value: U): T;
	constructor(type: TypedArrayConstructors<T>);
}
type BigIntArraySegments<T extends BigIntArray> = TypedArraySegments<T, bigint>;
type NumericArraySegments<T extends TypedArray> = TypedArraySegments<T, number>;

/** Represets a collection of binary data buffers. */
export class BufferSegments {
	/** Returns `true` if `arg` is one valid variant of `BufferSegmentsView`, such as `DataViewSegments` or `TypedArraySegments`. */
	static isView(arg: unknown): arg is BufferSegmentsView<ArrayBufferView>;
	/** Returns a blank segmented data view. */
	static getView(type: DataViewConstructor): DataViewSegments;
	/** Returns a blank segmented typed array. */
	static getView<T extends BigIntArray>(type: TypedArrayConstructors<T>): BigIntArraySegments<T>;
	/** Returns a blank segmented typed array. */
	static getView<T extends TypedArray>(type: TypedArrayConstructors<T>): NumericArraySegments<T>;
	/** Constructs typed array segments from the provided iterable. */
	static from<T extends BigIntArray>(a: Iterable<T>): BigIntArraySegments<T>;
	/** Constructs typed array segments from the provided iterable. */
	static from<T extends TypedArray>(a: Iterable<T>): NumericArraySegments<T>;
	/** Constructs typed array segments from the provided arguments. */
	static of<T extends BigIntArray>(... a: T[]): BigIntArraySegments<T>;
	/** Constructs typed array segments from the provided arguments. */
	static of<T extends TypedArray>(... a: T[]): NumericArraySegments<T>;
}