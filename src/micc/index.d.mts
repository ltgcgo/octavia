// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
    SeamstressContext
} from "../../libs/seamstress@ltgcgo/index.d.mts";

/**
* Musical Instructions Compiler Collection. Handles MIDI-adjacent file parsing and serialization.
* @license LGPL-3.0-only
* @module
*/

// Native implementations
export class NakedMIDIEvent {
	/**
	* Delta time. The time difference of the current event and the previous event.
	*/
	delta: number;
	/**
	* MIDI event type. Type `8` to `15`, and `241` to `255` are all available.
	*/
	type: number;
	/**
	* The desinated channel of the MIDI event. Valid values range from `0` to `127` for events without port defined, or `0` to `15` for events with ports. Will not appear for `0xf0`-`0xff` events.
	*/
	part?: number;
	/**
	* The meta event type. Only applicable for `0xff` (meta) events.
	*/
	meta?: number;
	/**
	* The raw data of the MIDI event.
	*/
	data: Uint8Array;
	/**
	* True means that the running status of the current event was inherited from the previous event. `0xf0`-`0xff` events always have this byte set to false. Valid omissions will be reflected in serializers.
	*/
	isStale: boolean;
	/**
	* The offset of the current event in the original event stream, if the current event is created by a parser. Useful for debugging.
	*/
	offset?: number;
	/**
	* The parsed value of the event set by the finalizer, can be decoded strings. Only applicable to `0xff` (meta) events.
	*/
	parsed?: any;
	/**
	* Populated if the parsed value has additional data. If the parsed value is a string, this property can denote the text encoding used.
	*/
	label?: any;
	/**
	* The parsed time in seconds set by the finalizer.
	*/
	time?: number;
	/**
	* If set to true, the current event has port defined.
	*/
	hasPort: boolean;
	/**
	* The port for the event, usually set by the finalizer.
	*/
	port?: number;
}
/**
* An intermediate object consumed by Octavia's parser and serializer.
*/
export class MIDIEventWithContext {
	/**
	* The actual MIDI event.
	*/
	event: NakedMIDIEvent;
	/**
	* Chunk type. Same as `SeamstressChunk.type`.
	*/
	type: number | string;
	/**
	* Chunk ID. Same as `SeamstressChunk.chunkId`.
	*/
	chunk: number;
}
/**
* A file parsed or to be serialized by MICC.
*/
export class MICCFile {
	/**
	* Resolves when baseline usability is met, e.g. the raw data has been fully parsed.
	*/
	ready: Promise<void>;
	/**
	* Used by parsers to mark the file as ready.
	*/
	markReady(): Promise<void>;
	/**
	* Resolves when full usability is met, e.g. the finalizer has been run.
	*/
	finalized: Promise<void>;
	/**
	* Used by parsers to mark the file as finalized.
	*/
	markFinalized(): Promise<void>;
	/**
	* (WIP) Serialize the file into an SMF file.
	*/
	serializeSmf(): ReadableStream<Uint8Array>;
	/**
	* (WIP) Disassemble the file into MIA instructions.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available.
	*/
	disassemble(data: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
};
/**
* Parse raw MIDI events from buffers.
* @param buffer The input buffer.
* @param context The context object or a boolean. If boolean is provided, setting it to true will include delta time parsing. If a context object is provided, delta time parsing will always be present.
*/
export function smfEventParser(buffer: Uint8Array, context?: boolean|SeamstressContext): NakedMIDIEvent;
/**
* The MIDI serializer.
*/
export class MICC {
	/**
	* A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, X-ASCII will be used.
	*/
	decoders: Array<TextDecoder>;
	/**
	* Parse the incoming Standard MIDI File byte stream.
	*/
	parseSmf(data: ReadableStream<Uint8Array>, context?: object): MICCFile;
	/**
	* Parse the incoming Musical Instructions Assembly (Octavia's 1:1 assembly representation of SMF files) stream.
	*/
	parseMia(data: ReadableStream<Uint8Array>, label?: string): MICCFile;
	/**
	* (WIP) Parse the incoming RMI byte stream.
	*/
	parseRmi(data: ReadableStream<Uint8Array>, context?: object): MICCFile;
	/**
	* Directly assemble MIA into SMF without going through a file object.
	*/
	assemble(data: ReadableStream<string>, context?: object): ReadableStream<Uint8Array>;
	/**
	* Directly disassemble SMF into MIA without going through a file object.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available.
	*/
	disassemble(data: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
};

// Compatibility layers
/**
* A MIDI event in Colxi's scheme.
*/
export class ColxiMIDIEvent {
	/**
	* MIDI delta time.
	*/
	deltaTime: number;
	/**
	* MIDI event type.
	*/
	type: number;
	/**
	* If the event is a meta event, the meta event type.
	*/
	metaType?: number;
	/**
	* Actual data of the event.
	*/
	data: number | Uint8Array | string;
}
/**
* A MIDI track containing events in Colxi's scheme.
*/
export class ColxiMIDITrack {
	/**
	* List of events populated by the track.
	*/
	event: Array<ColxiMIDIEvent>;
	/**
	* The type of the track. Not present in the original implementation.
	*/
	type: string;
}
/**
* The representation of a parsed MIDI file in Colxi's scheme.
*/
export class ColxiMIDIFile {
	/**
	* MIDI file type (0, 1, 2).
	*/
	formatType: number;
	/**
	* The time division used by files. 480 is the most common value.
	*/
	timeDivision: number;
	/**
	* Number of expected tracks specified by the MIDI file. Not guaranteed to the the exact number of tracks supplied by the MIDI file.
	*/
	tracks: number;
	/**
	* Actual tracks with events.
	*/
	track: Array<ColxiMIDITrack>;
}
/**
* View into each MIDI event, supplied to `ColxiMIDIParser.customInterpreter`. Will only be supplied for 0xf0 events.
*/
export class ColxiMIDIView {
	/**
	* The data of the event. Unlike the original implementatino, this only grants view of the current event.
	*/
	data: DataView;
	/**
	* The pointer of the current event. When invoked, for 0xf0 events, the pointer will sit on the SysEx length byte.
	*/
	pointer: number;
	/**
	* Move the apparent pointer. Unlike the original implementation, this method does not affect MIDI file parsing in any way, and is bound-checked.
	* @param offset The relative offset to move the pointer against. -1 moves the pointer to the previous byte, 0 has no effect, and 1 moves the pointer to the next byte.
	* @returns The mutated pointer.
	*/
	movePointer(offset: number): number;
	/**
	* Read multi-byte integers.
	*/
	readInt(readSize: number): number;
	/**
	* Read VLV-8 on the current pointer.
	*/
	readIntVLV(): number;
	/**
	* Read a string. If the `decoders` property of the parser object can be accessed, it will attempt to decode string supplied by the decoders in the `decoders` property, advancing to the next one whenever the current decoder fails. The catch-all decoder is X-ASCII.
	*/
	readStr(readSize: number): string;
};
/**
* Mostly a drop-in replacement for `colxi/midi-parser-js`. If some files are proven to be problematic for the original implementation (e.g. with running status omission), migrating to Octavia's compatibility layer may help handle those files.
*/
export class ColxiMIDIParser {
	/**
	* Parses the input into a structured representation. Note that unlike the original, this method is asynchronous, requiring an `await` statement if callback is not used.
	* @param input MIDI file data to be parsed. Can be a `File` object, one of the two uint8 arrays, and a Base64 string.
	* @param callback The method to invoke when parsing is finished.
	*/
	static parse(input: File | Uint8Array | Uint8ClampedArray | string, callback: (file: ColxiMIDIFile) => void): Promise<ColxiMIDIFile>;
	/**
	* Defines custom interpreter behaviour, should only invoked by the parser. The returned value will populate the data property. Returning `false` will assume default behaviour.
	* @param type The event type.
	* @param view A view into the MIDI data currently being parsed.
	* @param metaLength Length of the meta event. Will only be present for 0xff events.
	*/
	static customInterpreter?: (type: number, view: ColxiMIDIView, metaLength?: number) => any;
	/**
	* A list of text decoders to be used. Not present in the original implementation, this is added to allow correct decoding of MIDI files having multiple text encodings.
	*/
	static decoders?: Array<TextDecoder>;
}
