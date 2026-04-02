// 2025-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* An insanely safe IFF-like byte stream handler.
* @license LGPL-3.0-only
* @module
*/

export class IntegerHandler {
	/** Reads a standard MIDI VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 4 bytes, after which it will error out. */
	static readVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a standard MIDI VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 4 bytes, after which it will error out. */
	static readVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, offset?:number): BigInt;
	/** Counts the size of a standard MIDI VLV-8 value in bytes. Will return 0 when failed. */
	static sizeVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a reversible VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a standard JavaScript number. Will be clamped to 16 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readRVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a reversible VLV-8 value from a `Uint8Array` or a `Uint8ClampedArray` into a BigInt. Will be clamped to 16 bytes, after which it will error out. Invalid RVLV values will also error out. */
	static readRVLVBigInt(buffer: Uint8Array|Uint8ClampedArray, offset?:number): BigInt;
	/** Counts the size of a reversible VLV-8 value in bytes. Will return 0 when failed. */
	static sizeRVLV(buffer: Uint8Array|Uint8ClampedArray, offset?: number): number;
	/** Reads a boolean. Will error out if out of bounds. A 1-sized array has 8 boolean values, 2-sized has 16, and vice versa. `85` will be expanded to `[1, 0, 1, 0, 1, 0, 1, 0]`, while `170` will be expanded to `[0, 1, 0, 1, 0, 1, 0, 1]`. */
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
	static readInt64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): BigInt;
	/** Reads a uint64 value. Will error out if out of bounds. */
	static readUint64(buffer: Uint8Array|Uint8ClampedArray, isLittleEndian?: boolean, offset?: number): BigInt;
}

export interface SeamstressContext {
	/** Defines the maximum length of the stream that's expected. If the stream exceeds the specified size, it will be cut off at the specified size (length <= size + headerSize). It's always desired to keep the size sealed once parsed. */
	size?: number;
}

export interface SeamstressChunk {
	/** Index of the (streamed) chunk in u32, starts from 0 and increases by 1 only when a new chunk is progressed. This is to easily differentiate chunks. */
	id: number;
	/** Type of the (streamed) chunk as Latin-9 strings. */
	type: number|string;
	/** The offset of the chunk. Chunks from `readChunk()` and first chunk from `readStream()` are all  */
	offset: number;
	/** The (streamed) payload of the chunk. */
	data: Uint8Array;
	/** The context properties passed from header. */
	context: SeamstressContext|undefined;
}

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
	/** (Non-finalized) Returns if the list chunk type already exists. Only valid with FourCC types. */
	hasList(type: string): boolean;
	/** (Non-finalized) Registers a type of list chunk, and returns true when successful (isn't already registered). Only valid with FourCC types. Useful for FourCC-typed list chunks containing subchunks. "LIST" will always be registered for IFF/RIFF files.
	* @param type FourCC in a Latin-9 string.
	*/
	addList(type: string): boolean;
	/** (Non-finalized) Removes a type of list chunk, and returns true when successful (is registered). Only valid with FourCC types.
	* @param type FourCC in a Latin-9 string.
	*/
	delList(type: string): boolean;
	/** Defines the size of the header. 0 for MIDI files, 12 for RIFF files. Defaults to 0. */
	headerSize: number;
	/** The type flags of the Seamstress instance. */
	type: number;
	/** Handles the header chunk. Returns an object detailing on how to handle the header chunk. Only invoked upon reading.
	* @param buffer The header getting passed into the handler.
	* @returns The parsed object that will modify the reader behaviour and provide as the initial context for the streams.
	*/
	headerHandler?(buffer: Uint8Array): SeamstressContext|undefined;
	/**
	* Regulates the incoming stream. When defined, the method receives the incoming stream chunk buffer first, and its return value is used to truncate the chunk for the stream reader, with the truncated buffer prepended to the next stream chunk.
	* When returning any non-positive integer, the chunk will not be truncated in any way, and the rest of the stream chunk for the current chunk will bypass the regulator method altogether. Returning an integer that's larger than the size of the current stream chunk, the whole chunk will be buffered and wait for merging with the next chunk. If a chunk contains many subchunks, this method will help ensure that the incomplete chunks received will always contain complete subchunks.
	*/
	regulateStream?(chunkInfo: SeamstressChunk): number;
	/**
	* Reads the incoming stream, and emits a stream of chunks. The returned stream will not guarantee each chunk to be fully buffered.
	* @param bypassRegulator When true, the stream chunk regulation method will never be called.
	*/
	readStream(stream: ReadableStream<Uint8Array|Uint8ClampedArray>, bypassRegulator: boolean): ReadableStream<SeamstressChunk>;
	/** Reads the incoming stream, and emits a stream of fully buffered chunks. */
	readChunks(stream: ReadableStream<Uint8Array|Uint8ClampedArray>): ReadableStream<SeamstressChunk>;
	/** Writes chunks with strict checks. When header's expected, providing a serializer with a 0-sized header or not providing a serializer will both result in an error. */
	writeStrict(headerSerializer?: Function): SeamstressStrictWriter;
	/** Writes chunks in an easier way. Providing a serialized header with a 0-sized header or not providing a serialized header when header's expected will both result in an error. */
	writeChunks(serializedHeader?: Uint8Array): TransformStream<SeamstressChunk, Uint8Array>;
	/** Parses the incoming stream, and emits a map of header types, each with an array of offsets and sizes. This function is virtually useless if the original content of the stream is not kept. */
	getMapFromStream(stream: ReadableStream<Uint8Array|Uint8ClampedArray>): Promise<Map<number|string, Array<Array<number>>>>;
}
