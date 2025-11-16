// Copyright 2025 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* An insanely safe IFF-like byte stream handler.
* @module
*/

export interface SeamstressContext {
	/** Defines the maximum length of the stream that's expected. If the stream exceeds the specified size, it will be cut off at the specified size (length <= size + headerSize). It's always desired to keep the size sealed once parsed. */
	size?: number;
};

export interface SeamstressChunk {
	/** Index of the (streamed) chunk in u32, starts from 0 and increases by 1 only when a new chunk is progressed. This is to easily differentiate chunks. */
	id: number;
	/** Type of the (streamed) chunk as Latin-9 strings. */
	type: number|string;
	/** The (streamed) payload of the chunk. */
	data: Uint8Array;
	/** The context properties passed from header. */
	context: SeamstressContext?;
};

export class SeamstressStrictWriter {
	/** The result of the serialized stream. */
	readable: ReadableStream<Uint8Array>;
	/** Passes the context object through the header serializer. Will error out if the original header size is not a positive integer (e.g. MIDI files). */
	writeHeader(context: SeamstressContext): void;
	/** Writes the start of a new chunk. Will error out if unfinished writes still exist (the unsatisfied size is still a positive integer). Does not support LIST subchunks directly, pre-serialization is required. */
	writeChunkHead(type: number|string, size: number): void;
	/** Writes a slice of chunk to the serialized stream. */
	writeChunkData(data: Uint8Array): void;
	/** Finalizes the serialized stream. Will error out if unfinished writes still exist (the unsatisfied size is still a positive integer). */
	finalize(): void;
	/** Takes over the reader of the output stream, and emit everything as a single ArrayBuffer. */
	async buffer(): ArrayBuffer;
};

export class Seamstress {
	/** Masks endianness of length values. 0 for BE, 1 for LE. */
	static MASK_ENDIAN: number;
	/** Masks encoding of length values. 0 for VLV-8, 1 for u32. "Little-endian VLV-8" is invalid and will error out. */
	static MASK_LENGTH: number;
	/** Masks the boolean of if the chunk payloads are padded or not. A true value will treat chunks as padded to even bytes. */
	static MASK_PADDED: number;
	/** Masks type of type chunks. 0 for VLV-8, 1 for FourCC (i32 BE). */
	static MASK_TYPE: number;
	static ENDIAN_B: number;
	static ENDIAN_L: number;
	static LENGTH_VLV: number;
	static LENGTH_U32: number;
	static TYPE_VLV: number;
	static TYPE_4CC: number;
	/** Returns if the list chunk type already exists. Only valid with FourCC types. */
	hasList(type: string): boolean;
	/** Registers a type of list chunk, and returns true when successful (isn't already registered). Only valid with FourCC types. Useful for FourCC-typed list chunks containing subchunks. "LIST" will always be registered for IFF/RIFF files.
	* @param type FourCC in a Latin-9 string.
	*/
	addList(type: string): boolean;
	/** Removes a type of list chunk, and returns true when successful (is registered). Only valid with FourCC types.
	* @param type FourCC in a Latin-9 string.
	*/
	delList(type: string): boolean;
	/** Defines the size of the header. 0 for MIDI files, 12 for RIFF files. Defaults to 0. */
	headerSize: number;
	/** Handles the header chunk. Returns an object detailing on how to handle the header chunk. Only invoked upon reading.
	* @param buffer The header getting passed into the handler.
	* @returns The parsed object that will modify the reader behaviour and provide as the initial context for the streams.
	*/
	headerHandler?(buffer: Uint8Array): SeamstressContext?;
	/** Reads the incoming stream, and emits a stream of chunks. The returned stream will not guarantee each chunk to be fully buffered. */
	readStream(stream: ReadableStream<Uint8Array>): ReadableStream<SeamstressChunk>;
	/** Reads the incoming stream, and emits a stream of fully buffered chunks. */
	readChunks(stream: ReadableStream<Uint8Array>): ReadableStream<SeamstressChunk>;
	/** Writes chunks with strict checks. Providing a serializer with a 0-sized header or not providing a serializer when header's expected will both result in an error. */
	writeStrict(headerSerializer?: Function<Uint8Array>): SeamstressStrictWriter;
	/** Writes chunks in an easier way. Providing a serialized header with a 0-sized header or not providing a serialized header when header's expected will both result in an error. */
	writeChunks(serializedHeader?: Uint8Array): TransformStream<SeamstressChunk, Uint8Array>;
	/** Parses the incoming stream, and emits a map of header types, each with an array of offsets and sizes. This function is virtually useless if the original content of the stream is not kept. */
	async getMapFromStream(stream: ReadableStream<Uint8Array>): Object<number|string, Array<Array<number>>>;
};
