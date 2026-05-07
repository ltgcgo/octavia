// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
    SeamstressContext
} from "../../libs/seamstress@ltgcgo/index.mjs";

/**
* Musical Instructions Compiler Collection. Handles MIDI-adjacent file parsing and serialization.
* @license LGPL-3.0-only
* @module
*/

// Native implementations
/** Utility constants for MICC. */
declare class MICCConstants {
	/** Note off events. */
	static MIDI_NOTE_OFF: number;
	/** Note on events. */
	static MIDI_NOTE_ON: number;
	/** Note/polyphonic aftertouch events. */
	static MIDI_NOTE_AT: number;
	/** Control change events. */
	static MIDI_CONTROL: number;
	/** Program change events. */
	static MIDI_PROGRAM: number;
	/** Channel aftertouch events. */
	static MIDI_CHANNEL_AT: number;
	/** Channel pitch bend events. */
	static MIDI_CHANNEL_PITCH: number;
	/** New SysEx events. */
	static MIDI_SYSEX_NEW: number;
	/** Resumed SysEx events. */
	static MIDI_SYSEX_RESUME: number;
	/** MIDI clock events. Should not appear in files. */
	static MIDI_CLOCK: number;
	/** MIDI play control start events. Should not appear in files. */
	static MIDI_START: number;
	/** MIDI play control continue events. Should not appear in files. */
	static MIDI_RESUME: number;
	/** MIDI play control stop events. Should not appear in files. */
	static MIDI_STOP: number;
	/** MIDI active sensing events. Should not appear in files. */
	static MIDI_ACTIVE_SENSE: number;
	/** Metadata events. */
	static MIDI_METADATA: number;
	/** Track pointer block: normal. Compatible with XGworks. */
	static PTRB_NORMAL: number;
	/** Track pointer block: linked (pointer). Compatible with XGworks. */
	static PTRB_LINKED: number;
	/** File type: SMF type 0 - single track. */
	static FILE_SMF_SINGLE: number;
	/** File type: SMF type 1 - multiple tracks. */
	static FILE_SMF_MULTIPLE: number;
	/** File type: SMF type 2 - sequential tracks. */
	static FILE_SMF_SEQUENTIAL: number;
	/** File type: XGworks project. */
	static FILE_SEQ_XGWORKS: number;
	/** File type: FastTracker II (XM). Support postponed until needed. */
	static FILE_TRK_FAST2: number;
	/** File type: Scream Tracker 3 (S3M). Support postponed until needed. */
	static FILE_TRK_SCREAM3: number;
	/** File type: Impulse Tracker (IT). */
	static FILE_TRK_IMPULSE: number;
}
/** Base type that can populate `MICCTrack`. */
export class MICCBaseElement {
	/**
	* The assigned group specifier. For standard MIDI events, this is always set to `mma.midiEvent`.
	*/
	group: string;
}
/** Representation of a MIDI event. The group specifier is `mma.midiEvent`. */
export class NakedMIDIEvent extends MICCBaseElement {
	/**
	* Delta time. The time difference of the current event and the previous event.
	*/
	delta: number;
	/**
	* MIDI event type. Type `8` to `15`, and `241` to `255` are all available.
	*/
	type: number;
	/**
	* The desinated channel of the MIDI event. Valid values range from `0` to `127` for events without port defined, or `0` to `15` for events with port defined. Will not appear for `0xf0`-`0xff` events.
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
	* The parsed time in MIDI ticks set by the finalizer. Use a time offset map to grab the actual seconds.
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
/** An intermediate object consumed by Octavia's parser and serializer. */
export class WrappedMIDIEvent {
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
/** A pointer to the actual clip tracks. The group specifier is `ltgc.pointer`. */
export class MICCPointer extends MICCBaseElement {
	/** Type of the current pointer. Largely follows XGworks. */
	type: number;
	/** Starting MIDI tick of the referred block. */
	start: number;
	/** Expected ending MIDI tick of the referred block. */
	end: number;
	/** Selected block ID. */
	block: number;
	/** Name of the current block. Empty names will become undefined. */
	name?: string;
	/** The starting time of the current pointer, supplied by a finalizer. */
	time?: number;
	/** Direct object reference to the normal block, supplied by a finalizer. */
	parsed?: MICCTrack;
}
/** A track containing events. */
export class MICCTrack {
	/** Track type. For SMF and XWS files, this is usually the FourCC type. */
	type: string;
	/** Vendor specifier of the track type. */
	vendor: string;
	/** Data carried by the chunk, usually a list of events. */
	data: Array<MICCBaseElement>;
}
/** The contained metadata of the current file. */
export class MICCFileMetadata {
	/** The full format specifier of the current file. */
	format: string;
	/**
	* MIDI time division. `480` is the most common.
	* For tracker music with 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 32, 40, 48, 60, 80, 96, 120, 160, 240 or 480 rows per beat, `480` will be used. `600` will be used with 25, 50, 75, 100, 150, 200, 300 or 600 rows. `720` will be used with 9, 18, 36, 40, 45, 72, 144, 180, 360, 720 rows. `960` will be used with 64, 192, 320 or 960 rows. Any other value that doesn't have an existing mapping will cause the value `4096` be used, with the actual tick time be rounded to the nearest value.
	* Patterns (measures) with overridden row numbers of beats, overiiden row numbers of measures, derived denominators not a power of 2, or derived non-integer nominators will have the value rounded up to the nearest equivalent valid MIDI time signature in the raw time signature MIDI event, then have custom meta events that shifts the offset map.
	*/
	division: number;
	/**
	* Definition vary by file type.
	* For SMF files, this indicates the SMF file type. For tracker files, this indicates the original format used. Full definition under `MICCConstants.FILE_*`.
	*/
	type: number;
	/** Amount of expected tracks. For tracker music, this denotes allocated channels instead. */
	track?: number;
	/** For files utilizing pointers, amount of expected normal MICI blocks/clips. This is typically seen in project (sequencer) files and tracker music. */
	clip?: number;
	/** For files utilizing styles, amount of expected styles. Currently unused. */
	style?: number;
	/** For formats directly specifying names. Pure SMF files and XWS files don't have this field, but formats like tracker music modules and KORG SNG have it. */
	title?: string;
}
/**
* The contained additional metadata of the current file, only makes sense for trackers. Aims at 100% compatibility with [Impulse Tracker](https://breezewiki.com/fileformats/wiki/Impulse_tracker).
*/
export class MICCTrackerMetadata {
	/** The "created" field. */
	created?: number;
	/** The "compatible" field. */
	compatible?: number;
	/** The amount of expected audio channels. Default value is `2`. */
	channels: number;
	/** Global volume. `uint16`, with `32768` denoting the maximum possible value. */
	volume: number;
	/**
	* If true, G effect will be linked with E and F. Defaults to `false` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	* This field should be superceded with a field more capable of defining effect flows.
	*/
	linkEffects: boolean;
	/** If true, the sliders are all linear. Some trackers for older systems may set this field to `false` to use hardware-accelerated sliders (e.g. Amiga). Defaults to `true` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	isLinear: boolean;
	/** If true, edit history is attached. Defaults to `false`. */
	useEditHistory: boolean;
	/** If true, highlights are embedded. Defaults to `false`. */
	useHighlights: boolean;
	/** If true, indicates that MIDI macros are used. Defaults to `true` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	useMidiMacros: boolean;
	/** If true, use legacy effects. Defaults to `false` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.*/
	useOldEfx: boolean;
	/** If true, song messages are attached. Defaults to `false`. */
	useSongMessages: boolean;
	/** If true, the file uses instruments/voices instead of raw oscillators (e.g. samples, FM oscillators). Defaults to `true` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	useVoices: boolean;
}
/**
* A file parsed or to be serialized by MICC.
*/
export class MICCFile {
	/**
	* Resolves when baseline usability is met, e.g. the raw data has been fully parsed. Will reject when the parser fails with parser error.
	*/
	ready: Promise<void>;
	/**
	* Used by parsers to mark the file as ready.
	*/
	markReady(): Promise<void>;
	/**
	* Resolves when full usability is met, e.g. the finalizer has been run. Will reject when the parser fails with parser error.
	*/
	finalized: Promise<void>;
	/**
	* When set to true, the finalizer will not be called, and the related promise will resolve instantly when the raw data has been fully parsed.
	*/
	noFinalization: boolean;
	/**
	* Used by parsers to mark the file as finalized.
	*/
	markFinalized(): Promise<void>;
	/**
	* Runs the finalization process. Re-runs are useful for programs that mutate events, e.g. editors.
	*/
	finalize(): Promise<void>;
	/**
	* Used by parsers to reject the file.
	* @param err The error object to be passed to both promise objects.
	*/
	reject(err: any): void;
	/**
	* (WIP) Serialize the current `MICCFile` object into a file.
	* @param format The format to be serialized into. Supports `smf`, `xws` (WIP).
	*/
	serialize(format: string): ReadableStream<Uint8Array>;
	/**
	* (WIP) Flatten the current `MICCFile` object into a defined structure, usually before serialization. This action is destructive and irreversible.
	* @param format The formatted structure to be serialized into. Supports `smf`, `seq` (WIP), `trk`.
	*/
	flatten(format: string): Promise<void>;
	/**
	* (WIP) Disassemble the file into MIA instructions. Will error out if the file type isn't one of `SMF_SINGLE`, `SMF_MULTIPLE` and `SMF_SEQUENTIAL`.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available.
	*/
	disassemble(data: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
	/** The metadata of the current file. */
	meta: MICCFileMetadata;
	/** If the current file is a tracker, the additional metadata of the current file. */
	tracker: MICCTrackerMetadata;
	/**
	* The resource pool of the current file, usually used by pointer events. SMF files don't create this.
	*/
	pool?: Map<string, Array<MICCBaseElement>>;
	/**
	* Tracks contained by the current file.
	*/
	tracks: Array<MICCTrack>;
	/**
	* The offset map for the track mapping time to ticks and time signature changes.
	*/
	offset: Object;
}
/**
* Parse raw MIDI events from buffers.
* @param buffer The input buffer.
* @param context The context object or a boolean. If boolean is provided, setting it to true will include delta time parsing. If a context object is provided, delta time parsing will always be present.
*/
export function smfEventParser(buffer: Uint8Array, context?: boolean|SeamstressContext): NakedMIDIEvent;
/**
* The MIDI serializer.
*/
export class MICC extends MICCConstants {
	/**
	* A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, X-ASCII will be used.
	*/
	decoders: Array<TextDecoder>;
	// Pure MIDI.
	/**
	* Parse the incoming Standard MIDI File byte stream.
	*/
	parseSmf(data: ReadableStream<Uint8Array>, context?: object): MICCFile;
	/**
	* Parse the incoming Musical Instructions Assembly (Octavia's 1:1 assembly representation of SMF files) stream.
	*/
	parseMia(data: ReadableStream<Uint8Array>, label?: string): MICCFile;
	/**
	* (WIP) Parse the incoming RMI byte stream. Contained SMF files will be flattened.
	*/
	parseRmi(data: ReadableStream<Uint8Array>, context?: object): MICCFile;
	// MIDI-containing project files.
	/**
	* (WIP) Parse the incoming XWS byte stream.
	*/
	parseXws(data: ReadableStream<Uint8Array>, context?: object): MICCFile;
	// Tracker files.
	/**
	* (WIP) Parse the incoming Impulse Tracker byte stream.
	*/
	parseIt(data: ReadableStream<Uint8Array>, context?: object): MICCFile;
	// Assembly and disassembly.
	/**
	* Directly assemble MIA into SMF without going through a file object.
	*/
	assemble(data: ReadableStream<string>, context?: object): ReadableStream<Uint8Array>;
	/**
	* Directly disassemble SMF into MIA without going through a file object.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available.
	*/
	disassemble(data: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
}

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
}
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
