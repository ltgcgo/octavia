// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

import type {
	int8,
	int16,
	int32,
	int64,
	uint16,
	uint32,
	uint64
} from "../nativeType/index.d.mts";

/** A safe tag-length-value byte stream handler. Can be customized to handle SMF, IFF, RIFF and more, under the umbrella of SEAM (Simple Extensible Arbitrary Messaging).
* @license LGPL-3.0-only
* @module cc.ltgc.seamstress */

/** Reading and writing various forms of numeric values. */
export class IntegerHandler {
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
	/** Writes a standard MIDI VLV-8 value to a `Uint8Array` or a `Uint8ClampedArray` from a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
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
	/** Reads an int32 value. Will error out if out of bounds. */
	static readInt32(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): int32;
	/** Reads a uint32 value. Will error out if out of bounds. */
	static readUint32(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): uint32;
	/** Reads an int64 value. Will error out if out of bounds. */
	static readInt64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): int64;
	/** Reads a uint64 value. Will error out if out of bounds. */
	static readUint64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): uint64;
}

/** The context object in use in a stream reading or writing session. */
export interface SeamstressContext {
	/** This field may not be present.
	*
	* Defines the maximum length of the stream that's expected. If the stream exceeds the specified size, it will be cut off at the specified size (length <= size + headerSize). It's always desired to keep the size sealed once parsed. Keep undefined when the size is not or cannot be known. */
	size?: number;
	/** This field may not be present.
	*
	* Defines the base structure type of the stream. Common values include `RIFF` for RIFF streams and `FORM` for IFF streams. */
	binaryType?: string;
	/** This field may not be present.
	*
	* Defines the upper format of the stream. Common values include `WAVE` for the Microsoft `.wav` files, and `AIFF` for the Apple `.aif` files. */
	binaryFormat?: string;
	/** This field may not be present. Used by `Seamstress.meta`.
	*
	* Defines the additional offset of the current stream. */
	seamstressOffset?: number;
	/** This field may not be present. Used by `Seamstress.meta`.
	*
	* Defines the expected size of the current stream. Must be a non-negative integer. */
	seamstressExpectedSize?: number;
	/** This field may not be present. Used by `Seamstress.meta`.
	*
	* Defines the current depth. Starts at `0`. */
	seamstressDepth?: number;
	/** This field may not be present. Used by `Seamstress.meta`.
	*
	* Defines the parent stream ID of the current stream. For debug purposes only. */
	seamstressParentId?: string;
	/** This field may not be present. Used by `Seamstress.meta`.
	*
	* Defines the parent type of the stream. */
	seamstressParentPath?: string[];
	/** This field may not be present. Used by `Seamstress.meta`.
	*
	* Defines the use of the parent types of the stream before the immediate parent. */
	seamstressParentUses?: string;
	/** This field may not be present.
	*
	* Defines the use of the parent type of the stream. */
	seamstressParentUse?: string;
}

/** A subchunk of a Seamstress stream. Can be non-buffered, slightly buffered or fully buffered. */
export class SeamstressChunk {
	/** Index of the (streamed) chunk in u32, starts from 0 and increases by 1 only when a new chunk is progressed. This is to easily differentiate chunks. */
	id: uint32;
	/** Cumulative index of the current chunk in u32, starts from 0 and increases by 1 when a new chunk of the same type is progressed. */
	chunkId: uint32;
	/** Cumulative index of the current subchunk in u32, starts from 0 for every new chunk and increases by 1 when a new subchunk in the same chunk.
	* 
	* This field is always `0` for fully buffered chunks. */
	sliceId: uint32;
	/** Type of the current chunk as either integers or Latin-9 strings. */
	type: number|string;
	/** If the current chunk is a child of a parent chunk (e.g. `LIST`), this property will contain the full path of the current chunk. */
	typePath?: string[];
	/** If the current chunk is a child of a parent chunk (e.g. `LIST`), this property will contain the use (e.g. list chunk types) of all parent chunks. */
	typeUses?: string[];
	/** The offset of the current (sub)chunk. Chunks from `readChunk()` and the first chunk from `readStream()` have this field always set to `0`. */
	offset: number;
	/** (WIP) The offset of the current data (sub)chunk compared to the rest of the scoped binary stream session. */
	offsetStream: number;
	/** The offset of the current data (sub)chunk compared to the rest of the full binary stream instance, like the offset within a file. */
	offsetData: number;
	/** The full size of the current chunk. */
	size: number;
	/** When `true`, the current (streamed) chunk is the last subchunk of the full chunk. Fully buffered chunks always has this value set to `true`. List chunks themselves are never fully buffered. */
	isFinal: boolean;
	/** When `true`, the current (streamed) chunk is a fully buffered chunk. List chunks themselves are never fully buffered. */
	isBuffered: boolean;
	/** When `true`, the current (streamed) chunk is a list chunk. This property is dependent on the `typePath` property. */
	isCollection: boolean;
	/** The depth of the current (streamed) chunk. Starts at `0`. */
	depth: number;
	/** The (streamed) payload of the chunk as `Uint8Array`. For RIFF `LIST` chunks, this denotes the type of the `LIST` chunk as a string. */
	data: Uint8Array|string;
	/** The context properties passed from header. */
	context?: SeamstressContext;
	/** @param id Same as `SeamstressChunk.id`.
	* @param chunkId Same as `SeamstressChunk.chunkId`.
	* @param type Same as `SeamstressChunk.type`.
	* @param offset Same as `SeamstressChunk.offset`.
	* @param size Same as `SeamstressChunk.size`. */
	constructor(id: uint32, chunkId: uint32, type: number|string, offset: number, size: number);
}

/** Strictly validated Seamstress binary stream serializer. */
export class SeamstressStrictWriter {
	/** The result of the serialized stream. */
	readable: ReadableStream<Uint8Array>;
	/** Passes the context object through the header serializer. Will error out if the original header size is not a positive integer (e.g. MIDI files). */
	writeHeader(context: SeamstressContext): void;
	/** Writes the start of a new chunk. Will error out if unfinished writes still exist (the unsatisfied size is still a positive integer). Does not support LIST subchunks directly, pre-serialization is required. */
	writeChunkHead(type: number|string, size: number): void;
	/** Writes a slice of chunk to the serialized stream. */
	writeChunkData(data: Uint8Array|Uint8ClampedArray): void;
	/** Finalizes the serialized stream. Will error out if unfinished writes still exist (the unsatisfied size is still a positive integer). */
	finalize(): void;
	/** Takes over the reader of the output stream, and emit everything as a single ArrayBuffer. */
	buffer(): Promise<ArrayBuffer>;
}

/** A set of pre-defined format configurations to be used with `Seamstress`. Additional setup may still be required. */
export class SeamstressPresets {
	/** IFF-based format. Examples below.
	* - `.aif`, `.aiff`: Apple AIFF. */
	static readonly IFF: number;
	/** RIFF-based format. Examples below.
	* - `.bun`: Cakewalk Bundle.
	* - `.dls`: Downloadable Sound.
	* - `.rmi`: RIFF-contained Standard MIDI File.
	* - `.wav`: Microsoft WAVE.
	* - `.webp`: WebP. */
	static readonly RIFF: number;
	/** SMF-like format. Examples below.
	* - `.mid`, `.kar`: Standard MIDI File.
	* - `.xws`: XGworks Original File. */
	static readonly SMF: number;
	/** Cakewalk-like format. */
	static readonly WRK: number;
}

/** A safe TLV reader and writer. Configure an instance to match the format you want to handle, then use the methods provided.
* ```js
* // Configure Seamstress to handle Standard MIDI Files.
* const binaryParser = new Seamstress(Seamstress.TYPE_4CC | Seamstress.ENDIAN_B | Seamstress.LENGTH_U32 | Seamstress.PAD_NONE);
* binaryParser.headerSize = 0;
* // You can also use the preset directly.
* const binaryParser = new Seamstress(SeamstressPresets.SMF);
* binaryParser.headerSize = 0;
* (async () => {
* 	// If you want to read subchunks without any buffering guarantees.
* 	for await (let subchunk of binaryParser.readStream(req.body)) {
* 		// Read the chunks here.
* 	};
* 	// Use "readRegulated" for slightly buffered subchunks, or "readChunks" for fully buffered chunks.
* })().catch((err) => {
* 	// Error handling here.
* });
* ```` */
export class Seamstress {
	/** Masks endianness of length values. 0 for BE, 1 for LE.
	*
	* Big-endian VLV denotes VLV-8, while "little-endian VLV" denotes RVLV-8, despite RVLV-8 still being big endian. */
	readonly MASK_ENDIAN: number;
	/** Masks endianness of length values. 0 for BE, 1 for LE.
	*
	* Big-endian VLV denotes VLV-8, while "little-endian VLV" denotes RVLV-8, despite RVLV-8 still being big endian. */
	static readonly MASK_ENDIAN: number;
	/** Masks encoding of length values. 0 for VLV-8, 1 for u32. "Little-endian VLV-8" selects RVLV-8. */
	readonly MASK_LENGTH: number;
	/** Masks encoding of length values. 0 for VLV-8, 1 for u32. "Little-endian VLV-8" selects RVLV-8. */
	static readonly MASK_LENGTH: number;
	/** Masks the boolean of if the chunk payloads are padded or not. Check `Seamstress.PAD_*` for further information. */
	readonly MASK_PADDED: number;
	/** Masks the boolean of if the chunk payloads are padded or not. Check `Seamstress.PAD_*` for further information. */
	static readonly MASK_PADDED: number;
	/** Masks type of type chunks. 0 for VLV-8, 1 for byte (`u8`), 2 for FourCC (`i32be`). */
	readonly MASK_TYPE: number;
	/** Masks type of type chunks. 0 for VLV-8, 1 for byte (`u8`), 2 for FourCC (`i32be`). */
	static readonly MASK_TYPE: number;
	/** Use big endian layout for multi-byte values. */
	readonly ENDIAN_B: number;
	/** Use big endian layout for multi-byte values. */
	static readonly ENDIAN_B: number;
	/** Use little endian layout for multi-byte values. */
	readonly ENDIAN_L: number;
	/** Use little endian layout for multi-byte values. */
	static readonly ENDIAN_L: number;
	/** Use MIDI VLV-8 for chunk sizes. */
	readonly LENGTH_VLV: number;
	/** Use MIDI VLV-8 for chunk sizes. */
	static readonly LENGTH_VLV: number;
	/** Use unsigned 32-bit integer for chunk sizes. */
	readonly LENGTH_U32: number;
	/** Use unsigned 32-bit integer for chunk sizes. */
	static readonly LENGTH_U32: number;
	/** Disable chunk padding. */
	readonly PAD_NONE: number;
	/** Disable chunk padding. */
	static readonly PAD_NONE: number;
	/** Pad chunks to even bytes. */
	readonly PAD_EVEN: number;
	/** Pad chunks to even bytes. */
	static readonly PAD_EVEN: number;
	/** Use MIDI VLV-8 for chunk types. */
	readonly TYPE_VLV: number;
	/** Use MIDI VLV-8 for chunk types. */
	static readonly TYPE_VLV: number;
	/** Use unsigned 8-bit integer for chunk types. */
	readonly TYPE_UI8: number;
	/** Use unsigned 8-bit integer for chunk types. */
	static readonly TYPE_UI8: number;
	/** Use FourCC as strings for chunk types. */
	readonly TYPE_4CC: number;
	/** Use FourCC as strings for chunk types. */
	static readonly TYPE_4CC: number;
	/** Set to true to emit verbose debug messages. */
	debugMode: boolean;
	/** (WIP) Returns if the list chunk type already exists. Only valid with FourCC types. */
	isCollection(type: string): boolean;
	/** (WIP) Registers a type of list chunk, and returns true when successful (isn't already registered). Only valid with FourCC types. Useful for FourCC-typed list chunks containing subchunks. "LIST" will always be registered for IFF/RIFF files.
	* @param type FourCC in a Latin-9 string. */
	addCollection(type: string): void;
	/** (WIP) Removes a type of list chunk, and returns true when successful (is registered). Only valid with FourCC types.
	* @param type FourCC in a Latin-9 string. */
	delCollection(type: string): boolean;
	/** (WIP) When `true`, list chunks are handled automatically whenever possible. */
	useCollection: boolean;
	/** Defines the size of the header. 0 for MIDI files, 12 for RIFF files. Defaults to 0. */
	headerSize: number;
	/** The type flags of the Seamstress instance. Seamstress will error out if this is not a valid integer.
	*
	* Do NOT hard code numeric literals for type flags, construct the bit-fields on-demand instead. You can reuse the constructed bit-fields. */
	readonly type: number;
	/** Additional context applicable to all subsequent chunks that affects reader behaviour. */
	meta?: SeamstressContext;
	/** Handles the header chunk, specified manually. Called by all stream readers. Returns an object detailing on how to handle the header chunk. Only invoked upon reading.
	* @param buffer The header getting passed into the handler.
	* @returns The parsed object that will modify the reader behaviour and provide as the initial context for the streams. */
	headerHandler?(buffer: Uint8Array): SeamstressContext|undefined;
	/** Regulates the incoming stream into desired subchunks, specified manually. Called by `Seamstress.regulateStream()`. When defined, the method receives the incoming stream chunk buffer first, and its return value is used to truncate the current chunk for the stream reader.
	*
	* A non-zero value will cause the specified length from the current subchunk to be emitted, which the process repeats until the current subchunk depletes or the method returns a zero.
	*
	* When the method returns a `0`, it will cause the current remaining section to be buffered and prepended to the next subchunk, until the entire chunk ends causing a forced flush, essentially making an all-zero regulated stream a fully-buffered stream. The views of subsequent chunks handed to the regulator method will be supplied as-is without merging. Use `SeamstressChunk.context` to have state persist across subchunk.
	*
	* Any other numeric values will cause an error.
	* @param startOffset The intended read start offset of the provided buffer.
	* @param chunkInfo The unmodified info of the current (sub)chunk. */
	regulateStream?(startOffset: number, chunkInfo: SeamstressChunk): number;
	/** Reads the incoming stream, and emits a stream of chunks. The returned stream will not guarantee each chunk to be fully buffered. */
	readStream(stream: ReadableStream<Uint8Array|Uint8ClampedArray>): ReadableStream<SeamstressChunk>;
	/** Reads the incoming stream, and emits a stream of chunks. The returned stream will not guarantee each chunk to be fully buffered, however when the regulator is present, it can be used to ensure that the partial structure of each (in)complete subchunk will be intact. The stream chunk regulation method will be called on each incomplete chunk to regulate the sizes. If there is no regulator, this method will error out immediately.
	* @param flushAll When true, unfinished chunks will also be flushed instead of discarded. */
	readRegulated(stream: ReadableStream<Uint8Array|Uint8ClampedArray>, flushAll?: boolean): ReadableStream<SeamstressChunk>;
	/** Reads the incoming stream, and emits a stream of fully buffered chunks.
	* @param flushAll When true, unfinished chunks will also be flushed instead of discarded. */
	readChunks(stream: ReadableStream<Uint8Array|Uint8ClampedArray>, flushAll?: boolean): ReadableStream<SeamstressChunk>;
	/** (WIP) Writes chunks with strict checks. When header's expected, providing a serializer with a 0-sized header or not providing a serializer will both result in an error.
	*
	* This function does *not* natively handle list chunks by itself. */
	writeStrict(headerSerializer?: Function): SeamstressStrictWriter;
	/** (WIP) Writes chunks in an easier way. Providing a serialized header with a 0-sized header or not providing a serialized header when header's expected will both result in an error.
	*
	* This function does *not* natively handle list chunks by itself. */
	writeChunks(serializedHeader?: Uint8Array): TransformStream<SeamstressChunk, Uint8Array>;
	/** Parses the incoming stream, and emits a map of chunk types, each with an array of `[Seamstress.offsetData, Seamstress.size]` pairs.
	*
	* This function is virtually useless if the original content of the stream is not kept. This function does *not* handle list chunks. */
	getMapFromStream(stream: ReadableStream<Uint8Array|Uint8ClampedArray>): Promise<Map<number|string, Array<Array<number>>>>;
	/** @param typeFlags The type flags of the Seamstress instance. Check `Seamstress.type` for details. */
	constructor(typeFlags: number);
}
