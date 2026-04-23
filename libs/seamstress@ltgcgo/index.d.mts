// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* A safe tag-length-value byte stream handler. Can be customized to handle SMF, IFF, RIFF and more, under the umbrella of SEAM (Simple Extensible Arbitrary Messaging).
* @license LGPL-3.0-only
* @module
*/

/**
* Reading and writing various forms of numeric values.
*/
export class IntegerHandler {
	/**
	* When set to true, methods will use runtime-native APIs and WebAssembly over the pure-JS implementation.
	*/
	static useNative: boolean;
	/**
	* When set to true, methods will no longer conduct type checks. Usually has negligible performance impact unless on poorly-optimized runtimes.
	*/
	static unsafeType: boolean;
	/** Reads a standard MIDI VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static readVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a standard MIDI VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out. */
	static readVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, offset?:number): bigint;
	/** Counts the size of a standard MIDI VLV-8 value in bytes. Will return 0 when failed. */
	static sizeVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a reversible VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readRVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a reversible VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readRVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, offset?:number): bigint;
	/** Counts the size of a reversible VLV-8 value in bytes. Will return 0 when failed. */
	static sizeRVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a boolean. Will error out if out of bounds. One byte has 8 individual bits. `85` will be expanded to `[1, 0, 1, 0, 1, 0, 1, 0]`, while `170` will be expanded to `[0, 1, 0, 1, 0, 1, 0, 1]`. */
	static readBool(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads an int8 value. Will error out if out of bounds. */
	static readInt8(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads an int16 value. Will error out if out of bounds. */
	static readInt16(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): number;
	/** Reads a uint16 value. Will error out if out of bounds. */
	static readUint16(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): number;
	/** Reads an int32 value. Will error out if out of bounds. */
	static readInt32(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): number;
	/** Reads a uint32 value. Will error out if out of bounds. */
	static readUint32(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): number;
	/** Reads an int64 value. Will error out if out of bounds. */
	static readInt64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): bigint;
	/** Reads a uint64 value. Will error out if out of bounds. */
	static readUint64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): bigint;
}

/**
* The context object in use in a stream reading or writing session.
*/
export interface SeamstressContext {
	/**
	* This field may not be present.
	* Defines the maximum length of the stream that's expected. If the stream exceeds the specified size, it will be cut off at the specified size (length <= size + headerSize). It's always desired to keep the size sealed once parsed. Keep undefined when the size is not or cannot be known.
	*/
	size?: number;
	/**
	* This field may not be present.
	* Defines the base structure type of the stream. Common values include `RIFF` for RIFF streams and `FORM` for IFF streams.
	*/
	binaryType?: string;
	/**
	* This field may not be present.
	* Defines the upper format of the stream. Common values include `WAVE` for the Microsoft `.wav` files, and `AIFF` for the Apple `.aif` files.
	*/
	binaryFormat?: string;
}

/**
* A subchunk of a Seamstress stream. Can be non-buffered, slightly buffered or fully buffered.
*/
export interface SeamstressChunk {
	/** Index of the (streamed) chunk in u32, starts from 0 and increases by 1 only when a new chunk is progressed. This is to easily differentiate chunks. */
	id: number;
	/** Cumulative index of the current chunk in u32, starts from 0 and increases by 1 when a new chunk of the same type is progressed. */
	chunkId: number;
	/** Type of the current chunk as either integers or Latin-9 strings. */
	type: number|string;
	/** The offset of the current (sub)chunk. Chunks from `readChunk()` and the first chunk from `readStream()` have this value always set to 0. */
	offset: number;
	/** The offset of the current data (sub)chunk compared to the rest of the binary stream. */
	offsetData: number;
	/** The full size of the current chunk. */
	size: number;
	/** When `true`, the current (streamed) chunk is the last subchunk of the full chunk. Fully buffered chunks always has this value set to `true`. */
	isFinal: boolean;
	/** When `true`, the current (streamed) chunk is a fully buffered chunk. */
	isBuffered: boolean;
	/** The (streamed) payload of the chunk. */
	data: Uint8Array;
	/** The context properties passed from header. */
	context?: SeamstressContext;
	/**
	* @param id Same as `SeamstressChunk.id`.
	* @param chunkId Same as `SeamstressChunk.chunkId`.
	* @param type Same as `SeamstressChunk.type`.
	* @param offset Same as `SeamstressChunk.offset`.
	* @param size Same as `SeamstressChunk.size`.
	*/
	constructor(id: number, chunkId: number, type: number|string, offset: number, size: number): SeamstressChunk;
}

/**
* Strictly validated Seamstress binary stream serializer.
*/
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

/**
* A safe TLV reader and writer. Configure an instance to match the format you want to handle, then use the methods provided.
* ```js
* let binaryParser = new Seamstress();
* // Configure Seamstress to handle Standard MIDI Files.
* binaryParser.headerSize = 0;
* binaryParser.type = Seamstress.TYPE_4CC | Seamstress.ENDIAN_B | Seamstress.LENGTH_U32;
* (async () => {
* 	// If you want to read subchunks without any buffering guarantees.
* 	for await (let subchunk of binaryParser.readStream(req.body)) {
* 		// Read the chunks here.
* 	};
* 	// Use "readRegulated" for slightly buffered subchunks, or "readChunks" for fully buffered chunks.
* })().catch((err) => {
* 	// Error handling here.
* });
* ````
*/
export class Seamstress {
	/**
	* Masks endianness of length values. 0 for BE, 1 for LE.
	* Big-endian VLV denotes VLV-8, while "little-endian VLV" denotes RVLV-8, despite RVLV-8 still being big endian.
	*/
	MASK_ENDIAN: number;
	/** Masks encoding of length values. 0 for VLV-8, 1 for u32. "Little-endian VLV-8" is invalid and will error out. */
	MASK_LENGTH: number;
	/** Masks the boolean of if the chunk payloads are padded or not. A true value will treat chunks as padded to even bytes. */
	MASK_PADDED: number;
	/** Masks type of type chunks. 0 for VLV-8, 1 for FourCC (i32 BE). */
	MASK_TYPE: number;
	ENDIAN_B: number;
	ENDIAN_L: number;
	LENGTH_VLV: number;
	LENGTH_U32: number;
	TYPE_VLV: number;
	TYPE_4CC: number;
	/** Set to true to emit verbose debug messages. */
	debugMode: boolean;
	/** (Non-finalized, WIP) Returns if the list chunk type already exists. Only valid with FourCC types. */
	hasList(type: string): boolean;
	/** (Non-finalized, WIP) Registers a type of list chunk, and returns true when successful (isn't already registered). Only valid with FourCC types. Useful for FourCC-typed list chunks containing subchunks. "LIST" will always be registered for IFF/RIFF files.
	* @param type FourCC in a Latin-9 string.
	*/
	addList(type: string): boolean;
	/** (Non-finalized, WIP) Removes a type of list chunk, and returns true when successful (is registered). Only valid with FourCC types.
	* @param type FourCC in a Latin-9 string.
	*/
	delList(type: string): boolean;
	/** Defines the size of the header. 0 for MIDI files, 12 for RIFF files. Defaults to 0. */
	headerSize: number;
	/** The type flags of the Seamstress instance. */
	type: number;
	/** Handles the header chunk, specified manually. Called by all stream readers. Returns an object detailing on how to handle the header chunk. Only invoked upon reading.
	* @param buffer The header getting passed into the handler.
	* @returns The parsed object that will modify the reader behaviour and provide as the initial context for the streams.
	*/
	headerHandler?(buffer: Uint8Array): SeamstressContext|undefined;
	/**
	* Regulates the incoming stream into desired subchunks, specified manually. Called by `Seamstress.regulateStream()`. When defined, the method receives the incoming stream chunk buffer first, and its return value is used to truncate the chunk for the stream reader.
	* A non-zero value will cause the specified length from the current subchunk to be emitted, which the process repeats until the current subchunk depletes or the method returns a zero. A zero cause the current remaining section to be buffered and prepended to the next subchunk, until the entire chunk ends causing a forced flush, essentially making an all-zero regulated stream a fully-buffered stream. Any other numeric values will cause an error.
	* @param startOffset The intended read start offset of the provided buffer.
	* @param chunkInfo The unmodified info of the current (sub)chunk.
	*/
	regulateStream?(startOffset: number, chunkInfo: SeamstressChunk): number;
	/**
	* Reads the incoming stream, and emits a stream of chunks. The returned stream will not guarantee each chunk to be fully buffered.
	*/
	readStream(stream: ReadableStream<Uint8Array|Uint8ClampedArray>): ReadableStream<SeamstressChunk>;
	/**
	* Reads the incoming stream, and emits a stream of chunks. The returned stream will not guarantee each chunk to be fully buffered, however when the regulator is present, it can be used to ensure that the partial structure of each (in)complete subchunk will be intact. The stream chunk regulation method will be called on each incomplete chunk to regulate the sizes. If there is no regulator, this method will error out immediately.
	* @param flushAll When true, unfinished chunks will also be flushed instead of discarded.
	*/
	readRegulated(stream: ReadableStream<Uint8Array|Uint8ClampedArray>, flushAll?: boolean): ReadableStream<SeamstressChunk>;
	/**
	* Reads the incoming stream, and emits a stream of fully buffered chunks.
	* @param flushAll When true, unfinished chunks will also be flushed instead of discarded.
	*/
	readChunks(stream: ReadableStream<Uint8Array|Uint8ClampedArray>, flushAll?: boolean): ReadableStream<SeamstressChunk>;
	/** (WIP) Writes chunks with strict checks. When header's expected, providing a serializer with a 0-sized header or not providing a serializer will both result in an error. */
	writeStrict(headerSerializer?: Function): SeamstressStrictWriter;
	/** (WIP) Writes chunks in an easier way. Providing a serialized header with a 0-sized header or not providing a serialized header when header's expected will both result in an error. */
	writeChunks(serializedHeader?: Uint8Array): TransformStream<SeamstressChunk, Uint8Array>;
	/** Parses the incoming stream, and emits a map of header types, each with an array of offsets and sizes. This function is virtually useless if the original content of the stream is not kept. */
	getMapFromStream(stream: ReadableStream<Uint8Array|Uint8ClampedArray>): Promise<Map<number|string, Array<Array<number>>>>;
}
