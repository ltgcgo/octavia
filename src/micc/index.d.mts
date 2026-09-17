// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Musical Instructions Compiler Collection. Handles MIDI-adjacent file parsing and serialization.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.micc
*/

import type {
	uint8,
	uint16,
	uint32
} from "../../libs/seamstress@ltgcgo/nativeType/index.d.mts";
import type {
	SeamstressChunk,
	SeamstressContext
} from "../../libs/seamstress@ltgcgo/seamstress/index.d.mts";

/** The helper string decoder allowing re-interpretation. */
export class BinaryString {
	/** The attached list of decoders. When all of them fail, Latin 9 will be the fallback. Defaults to UTF-8 only. */
	decoders?: Iterable<TextDecoder>;
	/** The attached buffer to decode. */
	buffer?: Uint8Array|Uint8ClampedArray;
	/** The decoded result. */
	text?: string;
	/** The text encoding label used in the decoded result. */
	label?: string;
	/** Decode the buffer, both return it and overwrite the `text` property. Will error out if there's no attached buffer.
	* @param buffer When this argument is supplied, the `buffer` property will be overridden with it. */
	decode(buffer?: Uint8Array|Uint8ClampedArray): string;
	/** Encode the result into a buffer, both return it and overwrite the `buffer` property. Defaults to UTF-8 encoding with no labels. Will error out if there's no attached text.
	* @param text When this argument is supplied, the `text` property will be overridden with it.
	* @param label When this argument is supplied, the `label` property will be overridden with it. */
	encode(text?: string, label?: string): Uint8Array;
}

// Native implementations
/** Utility constants for MICC. */
declare class MICCConstants {
	/** Note off events. */
	static readonly MIDI_NOTE_OFF: uint8;
	/** Note on events. */
	static readonly MIDI_NOTE_ON: uint8;
	/** Note/polyphonic aftertouch events. */
	static readonly MIDI_NOTE_AT: uint8;
	/** Control change events. */
	static readonly MIDI_CONTROL: uint8;
	/** Program change events. */
	static readonly MIDI_PROGRAM: uint8;
	/** Channel aftertouch events. */
	static readonly MIDI_CH_AT: uint8;
	/** Channel pitch bend events. */
	static readonly MIDI_CH_PITCH: uint8;
	/** New SysEx events. */
	static readonly MIDI_SYSEX_NEW: uint8;
	/** MIDI time code events. Should not appear in files. */
	static readonly MIDI_TIME_CODE: uint8;
	/** Song position pointer events. Should not appear in files. */
	static readonly MIDI_SONG_POSITION: uint8;
	/** Song select events. Should not appear in files. */
	static readonly MIDI_SONG_SELECT: uint8;
	/** Tune request events. Should not appear in files. */
	static readonly MIDI_TUNE_REQUEST: uint8;
	/** Resumed SysEx events. Should not appear on live wire. */
	static readonly MIDI_SYSEX_RESUME: uint8;
	/** MIDI real-time clock events. Should not appear in files. */
	static readonly MIDI_CLOCK: uint8;
	/** MIDI real-time play control start events. Should not appear in files. */
	static readonly MIDI_START: uint8;
	/** MIDI real-time play control continue events. Should not appear in files. */
	static readonly MIDI_RESUME: uint8;
	/** MIDI real-time play control stop events. Should not appear in files. */
	static readonly MIDI_STOP: uint8;
	/** MIDI real-time active sensing events. Should not appear in files. */
	static readonly MIDI_ACTIVE_SENSE: uint8;
	/** MIDI real-time reset events. Should not appear in files. */
	static readonly MIDI_RESET: uint8;
	/** Meta events, remapped from `0xff`. Should not appear on live wire. */
	static readonly MIDI_META: uint8;
	/** Track pointer block: normal. Compatible with XGworks. */
	static readonly PTRB_NORMAL: uint16;
	/** Track pointer block: linked (pointer). Compatible with XGworks. */
	static readonly PTRB_LINKED: uint16;
	/** Finalisation type: MIDI. */
	static readonly AS_MIDI: number;
	/** Finalisation type: Tracker. */
	static readonly AS_TRACKER: number;
	/** File type: Unset. */
	static readonly FILE_UNSET: uint16;
	/** File type: SMF type 0 - single track. */
	static readonly FILE_SMF_SINGLE: uint16;
	/** File type: SMF type 1 - multiple tracks. */
	static readonly FILE_SMF_MULTIPLE: uint16;
	/** File type: SMF type 2 - sequential tracks. */
	static readonly FILE_SMF_SEQUENTIAL: uint16;
	/** File type: Standard MIDI Clip/SMF2. */
	static readonly FILE_SMF_CLIP: uint16;
	/** File type: Korg Synth Internal Song. */
	static readonly FILE_SMF_KORG_SONG: uint16;
	/** File type: Cakewalk project. */
	static readonly FILE_SEQ_CAKEWALK: uint16;
	/** File type: REAPER project. */
	static readonly FILE_SEQ_REAPER: uint16;
	/** File type: Sequence Object Linking project. */
	static readonly FILE_SEQ_SOL: uint16;
	/** File type: XGworks project. */
	static readonly FILE_SEQ_XGWORKS: uint16;
	/** File type: Ultimate Soundtracker/ProTracker (MOD). Support not implemented until needed. */
	static readonly FILE_TRK_PRO: uint16;
	/** File type: SoundFX (SFX). Support not implemented until needed. */
	static readonly FILE_TRK_SOUNDFX: uint16;
	/** File type: Music Editor/OctaMED (MED). Support not implemented until needed. */
	static readonly FILE_TRK_OCTAMED: uint16;
	/** File type: Scream Tracker 2 (S3M). Support not implemented until needed. */
	static readonly FILE_TRK_SCREAM2: uint16;
	/** File type: UltraTracker (ULT). Support not implemented until needed. */
	static readonly FILE_TRK_ULTRA: uint16;
	/** File type: FastTracker II (XM). Support not implemented until needed. */
	static readonly FILE_TRK_FAST2: uint16;
	/** File type: Scream Tracker 3 (S3M). Support not implemented until needed. */
	static readonly FILE_TRK_SCREAM3: uint16;
	/** File type: Impulse Tracker (IT). */
	static readonly FILE_TRK_IMPULSE: uint16;
	/** File type: OpenMPT (MPTM). */
	static readonly FILE_TRK_OPENMPT: uint16;
}
/** Base type for some MICC classes.
*
* The group specifier is `ltgc.micc.unknown`. */
export class MICCBaseElement {
	/** The assigned group specifier. */
	group: string;
	constructor(group: string);
}
/** Base type for subtypes capable of populating tracks.
*
* The group specifier is `ltgc.micc.trackChild`. */
export class MICCTrackElement extends MICCBaseElement {}
/** Representation of a MIDI event.
*
* The group specifier is `ltgc.micc.baseEvent`. */
export class MIDIBaseEvent extends MICCTrackElement {
	/** Delta time. The time difference of the current event and the previous event. Defaults to `0`. */
	delta: uint32;
	/** MIDI event type. Type `8` to `14`, and `240` to `255` are all available. `0` means "unset". */
	type: uint8;
	/** The desinated channel of the MIDI event. Valid values range from `0` to `255` for events without port defined, or `0` to `15` for events with port defined. Will be null by default for `0xf0`-`0xff` events, while some `0xff` events will have `ch` and `port` attached by the event funnel or the finaliser. Defaults to `null`. */
	ch?: uint8;
	/** The raw data of the MIDI event. */
	data: Uint8Array;
	/** The offset of the current event in the original root event stream, if the current event was created from a file-like binary event stream (e.g. SMF). Useful for debugging, unused by assemblers and serializers. This isn't the chunk offset value. */
	offset?: number;
	/** The parsed value of the event set by the finaliser, can be decoded strings. Only applicable to some `0xff` (meta) events, unused by assemblers and serializers. */
	parsed?: number|string;
	/** The parsed time in MIDI ticks, usually set by the event funnel. Use a time offset map to grab the actual seconds. Unused by assemblers and serializers. */
	tick?: number;
	/** The port for the event, usually set by the event funnel or the finaliser. Defaults to `null`. Unless used by multi-port event transports, this is unused by assemblers and serializers. */
	port?: uint8;
	/** Populated if the parsed value has additional data. If the parsed value is a string, this property can denote the text encoding used. Unused by assemblers and serializers. */
	label?: any;
	constructor(group?: string);
}
/** Representation of a MIDI 1.0 event and an SMF event.
*
* The group specifier is `mma.midiEvent`. */
export class MIDINakedEvent extends MIDIBaseEvent {
	/** The meta event type. Only applicable to `0xff` (meta) events. Defaults to `null`. */
	meta?: uint8;
	/** True means that the running status of the current event was inherited from the previous event. `0xf0`-`0xff` events always have this byte set to false. Valid omissions will be reflected in serialisers. */
	isStale: boolean;
	/** The track number for the event, usually set by the event funnel. Defaults to `null`. Unused by assemblers and serializers. */
	track?: uint32;
}
/** Representation of a MIDI 2.0 event.
*
* The group specifier is `mma.midiUmp`. */
export class MIDIUMPEvent extends MIDIBaseEvent {
}
/** An intermediate object consumed by Octavia's parser and serialiser. */
export class WrappedMIDIEvent {
	/** The actual MIDI event. */
	event: MIDINakedEvent;
	/** Chunk type. Same as `SeamstressChunk.type`. */
	type: number|string;
	/** Chunk ID. Same as `SeamstressChunk.chunkId`. */
	chunk: number;
}
declare interface MICCSMFMIAParserContext {
	/** Status byte of the last event. Same as `MIDINakedEvent.type`. */
	lastStatus?: uint8;
	/** If the last event was a `dt` event. the delta time specified by it. Should always be reset to `0` for each non-`dt` event. Used only by the MIA parser. */
	lastDelta?: uint32;
	/** If the last SysEx event was not ended by `0xF7`. Used by parsers to reject invalid SysEx send states. */
	lastSysExHung?: boolean;
}
declare interface MICCSMFMIAHandleOptions {
	/** An optional object to attach assembly status to. */
	asmContext?: MICCSMFMIAParserContext;
	/** An optional object to attach parsing status to. */
	parserContext?: MICCSMFMIAParserContext;
	/** Provides optional binary stream context for parsing. */
	streamContext?: SeamstressContext;
	/** Setting this to true will include delta time parsing. Defaults to `false.` */
	hasDelta?: boolean;
	/** If the event has been wrapped in SMF. This can affect how parsers and serialisers function. */
	isSmfWrapped?: boolean;
	/** Should the parser ignore some safety checks for potentially large messages. */
	loosenForSpeed?: boolean;
	/** When `true`, disassemblers will prefer the readable alternative syntax whenever available. */
	preferReadable?: boolean;
}
/** Internal methods for MIA assembly and disassembly. */
export class MICCInternalsMIA {
	/** Convert single MIA lines into split tokens. Rejects with leading colons (`:`). */
	static lexLine(text: string): string[];
	/** Disassemble single raw MIDI events into MIA lines directly. */
	static dasmSingleEvent(buffer: Uint8Array|Uint8ClampedArray|SeamstressChunk, options?: MICCSMFMIAHandleOptions): string;
	/** Assemble single MIA lines into raw MIDI events directly. */
	static asmSingleEvent(text: string, options?: MICCSMFMIAHandleOptions): Uint8Array;
	/** Parse single MIA lines into parsed MIDI events. Depends on `MICCInternalsSMF.parseSingleEvent`. */
	static parseSingleEvent(text: string, options?: MICCSMFMIAHandleOptions): MIDINakedEvent;
	/** Stringify parsed MIDI events into MIA lines. Depends on `MICCInternalsSMF.emitSingleEvent`. */
	static emitSingleEvent(event: MIDINakedEvent, options?: MICCSMFMIAHandleOptions): string;
}
/** Internal methods for MIDI 1.0/SMF parsing and serialising. */
export class MICCInternalsSMF {
	/** Parse single raw MIDI events from buffers. Requires clean full single events.
	* @param buffer The input buffer.
	* @param options Parser options. Only reuse the same options object for a single SMF track. */
	static parseSingleEvent(buffer: Uint8Array|Uint8ClampedArray|SeamstressChunk, options?: MICCSMFMIAHandleOptions): MIDINakedEvent;
	/** Serialise single parsed MIDI events into clean buffers. */
	static emitSingleEvent(event: MIDINakedEvent, options?: MICCSMFMIAHandleOptions): Uint8Array;
	/** Parse _raw_ MIDI events from buffers, which doesn't guarantee the buffer itself to be clean. For raw event ingestion only, like from real-time MIDI port IO.
	* @param buffer The input buffer.
	* @param options Parser options. Only reuse the same options object for a single port in a single MIDI 1.0 session. */
	static parseRawEvents(buffer: Uint8Array|Uint8ClampedArray, options?: MICCSMFMIAHandleOptions): Generator<MIDINakedEvent, void, any>;
	/** Regulates the incoming _SMF_ stream. Set as `Seamstress.regulateStream()`. */
	static streamRegulator(offset: number, subchunk: SeamstressChunk): number;
}
/** A pointer to the actual clip tracks.
*
* The group specifier is `ltgc.micc.pointer`. */
export class MICCPointer extends MICCTrackElement {
	/** Type of the current pointer. Largely follows XGworks. */
	type: uint16;
	/** Starting MIDI tick of the referred block. */
	start: number;
	/** Expected ending MIDI tick of the referred block. */
	end: number;
	/** Selected block ID. */
	block: uint32;
	/** Name of the current block. Empty names will become undefined. */
	name?: string;
	/** Direct object reference to the normal block, supplied by a finaliser. */
	parsed?: MICCTrack;
}
/** A track containing events.
*
* The group identifier is `mma.smfTrack`. */
export class MICCTrack extends MICCTrackElement {
	/** Track type. For SMF and XWS files, this is usually the FourCC type. */
	type: string;
	/** Vendor specifier of the track type. */
	vendor: string;
	/** Data carried by the chunk, usually a list of events. */
	data: MICCTrackElement[];
}
/** The base class for oscillators and instruments.
*
* The group specifier is `ltgc.micc.voice`. */
declare class MICCBaseVoice extends MICCBaseElement {
	/** The group type. `0` for single oscillators, `1` for grouped oscillators, `2` for instruments. */
	voiceGroup: uint8;
}
/** A defined oscillator. Represents a single oscillator (PCM samples, FM parameters, VL parameters, AN parameters...).
*
* The group specifier is `ltgc.micc.voice.single`. */
export class MICCOscillator extends MICCBaseVoice {}
/** A defined multi-oscillator. Represents a set of oscillators, commonly seen in KORG AI² synths in the form of multi-samples. Will always be referred to by an instrument, and direct usage in tracks will error out.
*
* The group specifier is `ltgc.micc.voice.group`. */
export class MICCOscillatorGroup extends MICCBaseVoice {}
/** A defined instrument.
*
* The group specifier is `ltgc.micc.voice.instrument`. */
export class MICCInstrument extends MICCBaseVoice {}
/** Base type for metadata.
*
* The group specifier is `ltgc.micc.meta`. */
export class MICCBaseMetadata extends MICCBaseElement {}
/** The contained metadata of the current file.
*
* The group specifier is `ltgc.micc.meta.midi`. */
export class MICCSequenceMetadata extends MICCBaseMetadata {
	/** The full format specifier of the current file. */
	format: string;
	/** MIDI time division. `480` is the most common.
	*
	* For tracker music with 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 32, 40, 48, 60, 80, 96, 120, 160 or 240 rows per beat, `480` will be used. `600` will be used with 25, 50, 75, 100, 150, 200, 300 or 600 rows. `720` will be used with 9, 18, 36, 40, 45, 72, 144, 180, 360, 720 rows. `960` will be used with 64, 192, 320, 480 or 960 rows. Any other value that doesn't have an existing mapping will cause the value `4096` be used, with the actual tick time be rounded to the nearest value.
	*
	* Patterns (measures) with overridden row numbers of beats, overiiden row numbers of measures, derived denominators not a power of 2, or derived non-integer nominators will have the value rounded up to the nearest equivalent valid MIDI time signature in the raw time signature MIDI event, then have custom meta events that shifts the offset map. */
	division: uint16;
	/** Definition vary by file type.
	*
	* For Standard MIDI Files, this indicates the SMF file type. For tracker files, this indicates the original format used. Full definition under `MICCConstants.FILE_*`. */
	type: uint16;
	/** Amount of expected tracks. For tracker music, this denotes allocated channels instead. */
	track?: number;
	/** For files utilising pointers, amount of expected normal MIDI blocks/clips. This is typically seen in project (sequencer) files and tracker music. */
	clip?: number;
	/** For files utilising styles, amount of expected styles. Currently unused. */
	style?: number;
	/** For formats directly specifying names. Pure Standard MIDI Files and XWS files don't have this field, but formats like tracker music modules and KORG SNG have it. */
	title?: string;
}
/** (WIP) A single edit record. */
export class MICCEditRecord {}
/** (WIP) A single MIDI macro. */
export class MICCMacroMIDI {}
/** The contained additional metadata of the current file, only makes sense for trackers. Aims at 100% compatibility with [Impulse Tracker](https://breezewiki.com/fileformats/wiki/Impulse_tracker).
*
* The group specifier is `ltgc.micc.meta.tracker`. */
export class MICCTrackerMetadata extends MICCBaseMetadata {
	/** If the file is a tracker. */
	isTracker: boolean;
	/** If true, G effect will be linked with E and F. Defaults to `false` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	*
	* This field should be superceded with a field more capable of defining effect flows. */
	linkEffects: boolean;
	/** The "created" field. */
	created?: number;
	/** The "compatible" field. */
	compatible?: number;
	/** The amount of expected audio channels. Default value is `2`. */
	channels: number;
	/** Initial ticking speed.  Defaults to `1` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	initSpeed: number;
	/** Initial tempo. Should *not* treat the defined tempo values as the real tempo. Defaults to `120` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	initTempo: number;
	/** Panpot separation. Valid values are integers in [0, 128]. */
	panSplit?: number;
	/** Pitch bend sensitivity. Valid values are [-24, 24].  Defaults to `2` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	pitchDepth: number;
	/** Rows per beat. Defaults to `24` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	rowBeat: number;
	/** Rows per measure. Defaults to `96` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.. */
	rowMeasure: number;
	/** Global volume. `uint16`, with `32768` denoting the maximum possible value. Defaults to `32768` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	volumeGlobal: number;
	/** Mixing volume. `uint16`, with `32768` denoting the maximum possible value. Defaults to `32768` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	volumeMix: number;
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
	/** Initial channel panpot. Unlike MIDI, it's an integer in the range of [0, 128]. 0 is full left, 128 is full right. Initialises to `64` for MIDI compatibility. */
	initTrackPan?: number[];
	/** Initial channel volume. Initialises to `100` for MIDI compatibility. */
	initTrackVol?: number[];
	/** (WIP) List of MIDI macros. */
	macros?: MICCMacroMIDI[];
	/** The attached message in the tracker. */
	message?: BinaryString;
	/** List of oscillators used. */
	oscillators?: MICCOscillator[];
	/** (WIP) List of edit records. */
	records?: MICCEditRecord[];
	/** List of instruments used. */
	voices?: MICCInstrument[];
}
/**
* A file parsed or to be serialised by MICC.
*/
export class MICCSequence {
	/** Resolves when baseline usability is met, e.g. the raw data has been fully parsed. Will reject when the parser fails with parser error. */
	ready: Promise<void>;
	/** Used by parsers to mark the file as ready. */
	markReady(): Promise<void>;
	/** Resolves when full usability is met, e.g. the finaliser has been run. Will reject when the parser fails with parser error. */
	finalised: Promise<void>;
	/** When set to `false`, the finaliser will not be called, and the related promise will resolve instantly when the raw data has been fully parsed. */
	finalise: boolean;
	/** Used by parsers to mark the file as finalised. */
	markFinalised(): Promise<void>;
	/** Runs the finalization process. Re-runs are useful for programs that mutate events, e.g. editors. */
	finalise(asType: number): Promise<void>;
	/** Runs the propagation process to convert parsed properties, which may have been modified, back into raw data used by assemblers and serialisers. */
	propagate(asType: number): Promise<void>;
	/** Used by parsers to reject the file.
	* @param err The error object to be passed to both promise objects. */
	reject(err: any): void;
	/** (WIP) Serialise the current `MICCSequence` object into a file.
	* @param format The format to be serialised into. Supports `smf`, `xws` (WIP). */
	serialise(format: string): ReadableStream<Uint8Array>;
	/** (WIP) Flatten the current `MICCSequence` object into a defined structure, usually before serialization. This action is destructive and irreversible.
	* @param format The formatted structure to be serialised into. Supports `smf`, `seq` (WIP), `trk`. */
	flatten(format: string): Promise<void>;
	/** (WIP) Disassemble the file into MIA instructions. Will error out if the file type isn't one of `SMF_SINGLE`, `SMF_MULTIPLE` and `SMF_SEQUENTIAL`.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available. */
	disassemble(data: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
	/** The metadata of the current file. */
	meta: MICCSequenceMetadata;
	/** If the current file is a tracker, the additional metadata of the current file. */
	tracker: MICCTrackerMetadata;
	/** The resource pool of the current file, usually used by pointer events. Standard MIDI Files don't create this. */
	pool?: Map<string, MICCBaseElement[]>;
	/** Tracks contained by the current file. */
	tracks: MICCTrack[];
	/** The offset map for the track mapping time to ticks and time signature changes. */
	offset: Object;
	/** Get tempo from microseconds-per-minute for MIDI. */
	tempoFromMPM(mpm: number): number;
	/** Turn tempo into microseconds-per-minute for MIDI. The final result will be rounded to the nearest integer. */
	tempoToMPM(tempo: number): number;
	/** Get tempo from declared tempo, tracker tick speed and rows-per-beat. */
	tempoFromTracker(rows: number, tickSpeed: number, definedTempo: number): number;
}
/** The MIDI serialiser. */
export class MICC extends MICCConstants {
	/** A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, X-ASCII will be used. */
	decoders: Iterable<TextDecoder>;
	// Pure MIDI.
	/** Parse the incoming Standard MIDI File byte stream. */
	parseSmf(data: ReadableStream<Uint8Array>, context?: object): MICCSequence;
	/** Parse the incoming Musical Instructions Assembly (Octavia's 1:1 assembly representation of Standard MIDI Files) stream. */
	parseMia(data: ReadableStream<Uint8Array>, label?: string): MICCSequence;
	/** (WIP) Parse the incoming RMI byte stream. Contained Standard MIDI Files will be flattened. */
	parseRmi(data: ReadableStream<Uint8Array>, context?: object): MICCSequence;
	// MIDI-containing project files.
	/** (WIP) Parse the incoming XWS byte stream. */
	parseXws(data: ReadableStream<Uint8Array>, context?: object): MICCSequence;
	// Tracker files.
	/** (WIP) Parse the incoming Impulse Tracker byte stream. */
	parseIt(data: ReadableStream<Uint8Array>, context?: object): MICCSequence;
	// Assembly and disassembly.
	/** Directly assemble MIA into SMF without going through a file object. */
	assemble(data: ReadableStream<string>, context?: object): ReadableStream<Uint8Array>;
	/** Directly disassemble SMF into MIA without going through a file object.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available. */
	disassemble(data: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
}
