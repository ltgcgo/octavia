// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Musical Instructions Compiler Collection. Standards-aware. Handles MIDI-adjacent and tracker file parsing and serialisation.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.micc
*/

import type {
	int8,
	uint8,
	uint16,
	uint32,
	float64
} from "../../libs/rochelle@ltgcgo/nativeType.d.mts";
import type {
	SeamstressChunk,
	SeamstressContext
} from "../../libs/seamstress@ltgcgo/index.d.mts";
import type {
	BinaryString
} from "../../libs/rochelle@ltgcgo/binaryString.d.mts";

export type UnifiedBinaryIntake = string|ArrayBuffer|ArrayBufferView|Blob|File|HTMLInputElement|FileList|ReadableStream<Uint8Array>|AsyncIterable<Uint8Array>;

/** Normalise various input types into target types. */
export class IntakeNormaliser {
	/** Normalise into array buffers. */
	static toBuffer(intake: UnifiedBinaryIntake): Promise<ArrayBuffer>;
	/** Normalise into byte arrays (`Uint8Array` or `Uint8ClampedArray`). */
	static toBytes(intake: UnifiedBinaryIntake): Promise<Uint8Array|Uint8ClampedArray>;
	/** Normalise into input types accepted by native MICC parsers (if you don't trust yourself). */
	static toByteStream(intake: UnifiedBinaryIntake): ReadableStream<Uint8Array>|AsyncIterable<Uint8Array>;
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
	/** Meta event: Sequence number. */
	static readonly META_SEQ_NUMBER: uint8;
	/** Meta event: Text. */
	static readonly META_TEXT: uint8;
	/** Meta event: Copyright notice. */
	static readonly META_COPYRIGHT: uint8;
	/** Meta event: Title, or sequence name. */
	static readonly META_TITLE: uint8;
	/** Meta event: Instrument name. */
	static readonly META_INSTRUMENT: uint8;
	/** Meta event: Lyrics feed. For various lyrics extensions, [read here](https://kb.ltgc.cc/octavia/impl/ext.html#lyrics). */
	static readonly META_LYRICS: uint8;
	/** Meta event: Marker. */
	static readonly META_MARKER: uint8;
	/** Meta event: Cue point. */
	static readonly META_CUE_POINT: uint8;
	/** Meta event: Voice name. */
	static readonly META_VOICE_NAME: uint8;
	/** Meta event: Device name. */
	static readonly META_DEVICE_NAME: uint8;
	/** Meta event: Track channel assign. */
	static readonly META_TRACK_CH: uint8;
	/** Meta event: Track port assign. For XGworks port assign, [read here](https://kb.ltgc.cc/octavia/impl/ext.html#xgworks-port-assign). */
	static readonly META_TRACK_PORT: uint8;
	/** Meta event: Track end. */
	static readonly META_TRACK_END: uint8;
	/** Meta event: Set tempo. */
	static readonly META_SET_TEMPO: uint8;
	/** Meta event: Set SMPTE offset. */
	static readonly META_SET_SMPTE_OFFSET: uint8;
	/** Meta event: Set time signature. */
	static readonly META_SET_TIME_SIG: uint8;
	/** Meta event: Set key signature. */
	static readonly META_SET_KEY_SIG: uint8;
	/** Meta event: Sequencer exclusive. */
	static readonly META_SEQEX: uint8;
	/** Track pointer block: normal. Compatible with XGworks. */
	static readonly PTRB_NORMAL: uint16;
	/** Track pointer block: linked (pointer). Compatible with XGworks. */
	static readonly PTRB_LINKED: uint16;
	/** (WIP) Finalisation type: MIDI. */
	static readonly AS_MIDI: uint8;
	/** (WIP) Finalisation type: Tracker. */
	static readonly AS_TRACKER: uint8;
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
/** Conversion of tempo for MICC. */
export class MICCInternalsTempo {
	/** Get tempo from microseconds-per-quarter-note for MIDI. */
	fromMPQN(mpqn: uint32): number;
	/** Turn tempo into microseconds-per-quarter-note for MIDI. The final result will be rounded to the nearest integer. */
	toMPQN(tempo: number): uint32;
	/** Get tempo from declared tempo, tracker tick speed and rows-per-beat. */
	fromTracker(rows: number, tickSpeed: number, definedTempo: number): number;
}
/** Base type for some MICC classes.
*
* The group specifier is `ltgc.micc.unknown`. */
export class MICCBaseElement {
	/** The assigned group specifier. */
	group: string;
	constructor(group: string);
}
/** Base type for information related to various file headers.
*
* The group specifier is `ltgc.micc.header`. */
export class MICCHeaderInfo extends MICCBaseElement {}
/** Parsed information from the SMF header chunk.
*
* The group specifier is `ltgc.micc.header:smf`. */
export class MICCHeaderSMF extends MICCHeaderInfo {
	/** SMF file type/format. */
	type: 0|1|2;
	/** When true, the native division value is in SMPTE instead.
	*
	* MICC does not yet fully support SMPTE-based time divisions. */
	isSmpte: boolean;
	/** MIDI time division in ticks per quarter note. */
	tpqn?: uint16;
	/** MIDI time division in SMPTE frames. Detailed information on interpretation should refer to Octavia documentation. */
	smpte?: [uint8, uint8];
	/** Amount of declared tracks. */
	track?: uint16;
}
/** Base type for subtypes capable of populating tracks.
*
* The group specifier is `ltgc.micc.trackChild`. */
export class MICCTrackElement extends MICCBaseElement {
	/** The offset of the current atom in the original root stream, if the current atom was created from a file-like binary stream (e.g. SMF) rather than from other means (e.g. MIA).
	*
	* Useful for debugging, unused by assemblers and serializers. This is not the chunk offset. */
	offset?: uint32;
	/** The size of the current atom in the original root stream, if the current atom was created from a file-like binary stream (e.g. SMF) rather than from other means (e.g. MIA).
	*
	* Useful for debugging, unused by assemblers and serializers. This is not the chunk offset. */
	byteSize?: uint32;
}
/** Representation of a MIDI event.
*
* The group specifier is `ltgc.micc.baseEvent`. */
export class MIDIBaseEvent extends MICCTrackElement {
	/** Delta time. The time difference of the current event and the previous event. Defaults to `0`. */
	delta: uint32;
	/** MIDI event type. Type `8` to `14`, and `239` to `255` are all available. `0` means "unset". */
	type: uint8;
	/** The desinated channel of the MIDI event. Valid values range from `0` to `255` for events without port defined, or `0` to `15` for events with port defined. Will be null by default for `0xf0`-`0xff` events, while some `0xff` events will have `ch` and `port` attached by the event funnel or the finaliser. Defaults to `null`. */
	ch?: uint8;
	/** The raw data of the MIDI event. */
	data: Uint8Array;
	/** The parsed value of the event set by the finaliser, can be decoded strings. Only applicable to some `0xff` (meta) events, unused by assemblers and serializers. */
	parsed?: number|BinaryString;
	/** The parsed time in MIDI ticks, usually set by the event funnel. Use a time offset map to grab the actual seconds. Unused by assemblers and serializers. */
	tick?: uint32;
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
	type: uint8|uint32|string;
	/** Chunk ID. Same as `SeamstressChunk.chunkId`. */
	chunk: uint32;
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
	/** A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, Latin-9 will be used. */
	//decoders: Iterable<TextDecoder>;
	/** Setting this to true will include delta time parsing. Defaults to `false.` */
	hasDelta?: boolean;
	/** If the event has been wrapped in SMF. This can affect how parsers and serialisers function. */
	isSmfWrapped?: boolean;
	/** Should the parser ignore some safety checks for potentially large messages. */
	loosenForSpeed?: boolean;
	/** When `true`, disassemblers will prefer the readable alternative syntax whenever available. */
	preferReadable?: boolean;
}
declare class MICCParserOptions {
	/** A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, Latin-9 will be used. */
	decoders?: Iterable<TextDecoder>;
	/** Defines how deep should the finalisers go. Same as `MICCSequence.finaliserDepth`. */
	finaliserDepth?: int8;
}
/** Internal methods for MIA assembly and disassembly. */
export class MICCInternalsMIA {
	/** Convert single MIA lines into split tokens. Rejects with leading colons (`:`). */
	static lexLine(text: string): string[];
	/** Parse single MIA lines into parsed MIDI events. */
	static parseSingleEvent(text: string, options?: MICCSMFMIAHandleOptions): MIDINakedEvent;
	/** Stringify parsed SMF header chunk into MIA lines. */
	static emitHeaderSMF(metadata: MICCSequenceMetadata): Generator<string, void, any>;
	/** Stringify parsed MIDI events into MIA lines. */
	static emitSingleEvent(event: MIDINakedEvent, options?: MICCSMFMIAHandleOptions): string;
	/** Disassemble SMF header chunk into MIA lines. */
	static dasmHeaderSMF(buffer: Uint8Array|Uint8ClampedArray|SeamstressChunk): Generator<string, void, any>;
	/** Disassemble single raw MIDI events into MIA lines directly. */
	static dasmSingleEvent(buffer: Uint8Array|Uint8ClampedArray|SeamstressChunk, options?: MICCSMFMIAHandleOptions): string;
	/** Assemble single MIA lines into raw MIDI events directly. */
	static asmSingleEvent(text: string, options?: MICCSMFMIAHandleOptions): Uint8Array;
}
/** Internal methods for MIDI 1.0/SMF parsing and serialising. */
export class MICCInternalsSMF {
	/** Parse the header chunk, and populate the given metadata object. */
	static parseHeaderChunk(buffer: Uint8Array|Uint8ClampedArray|SeamstressChunk, metadata: MICCSequenceMetadata): void;
	/** Parse single raw MIDI events from buffers. Requires clean full single events.
	* @param buffer The input buffer.
	* @param options Parser options. Only reuse the same options object for a single SMF track. */
	static parseSingleEvent(buffer: Uint8Array|Uint8ClampedArray|SeamstressChunk, options?: MICCSMFMIAHandleOptions): MIDINakedEvent;
	/** Serialise single parsed MIDI events into clean buffers. */
	static emitSingleEvent(event: MIDINakedEvent, options?: MICCSMFMIAHandleOptions): Uint8Array;
	/** Parse _clean_ full MIDI events from buffers. Returns the number of bytes read. Use `parseRawEvents` for raw live events.
	* @param offset The starting offset.
	* @param buffer The input buffer.
	* @param options Parser options. Do not reuse the same options object for different sessions. */
	static parseCleanEvents(offset: number, buffer: Uint8Array|Uint8ClampedArray, options?: MICCSMFMIAHandleOptions): Generator<MIDINakedEvent, number, any>;
	/** Parse _raw_ MIDI events from buffers, which doesn't guarantee the buffer itself to be clean. For raw event ingestion only, like from real-time MIDI port IO.
	* @param buffer The input buffer.
	* @param options Parser options. Only reuse the same options object for a single port in a single MIDI 1.0 session. */
	static parseRawEvents(buffer: Uint8Array|Uint8ClampedArray, options?: MICCSMFMIAHandleOptions): Generator<MIDINakedEvent, void, any>;
	/** Iterates the incoming _SMF_ stream and populates the provided sequence object directly. Passed to `Seamstress.readIterated()`. Depends on `parseCleanEvents`.
	* @param options Parser options. Only reuse the same options object for a single port in a single MIDI 1.0 session. */
	static streamIterator(
		offset: number,
		subchunk: SeamstressChunk,
		options: MICCSMFMIAHandleOptions
	): number;
	/** Regulates the incoming _SMF_ stream. Set as `Seamstress.regulateStream`. May be superceded by `streamIterator` to slash . */
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
	/** The full format specifier of the current file. Data dump exchanges pass this field along, without a new specifer like `ltgc.*`. Examples below.
	* ## MIDI
	* - `12tone.cakewalk`
	* - `12tone.cakewalk.bundle`
	* - `korg.song`
	* - `ltgc.mia`
	* - `mma.smf`
	* - `mma.smf2`
	* - `yamaha.sol`
	* - `yamaha.xgworks`
	* ## Tracker
	* - `tracker.fast2`
	* - `tracker.impulse`
	* - `tracker.modplug`
	* - `tracker.octamed`
	* - `tracker.pro`
	* - `tracker.scream2`
	* - `tracker.scream3`
	* - `tracker.soundfx`
	* - `tracker.ultra` */
	format: string;
	/** When true, the native division value is in SMPTE instead.
	*
	* MICC does not yet fully support SMPTE-based time divisions. */
	isSmpte: boolean;
	/** MIDI time division in ticks per quarter note. `480` is the most common. If SMPTE frames division are provided instead, this will instead be the halved product of the apparent frame rate and frame ticks.
	*
	* For tracker music with 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 32, 40, 48, 60, 80, 96, 120, 160 or 240 rows per beat, `480` will be used. `600` will be used with 25, 50, 75, 100, 150, 200, 300 or 600 rows. `720` will be used with 9, 18, 36, 40, 45, 72, 144, 180, 360, 720 rows. `960` will be used with 64, 192, 320, 480 or 960 rows. Any other value that doesn't have an existing mapping will cause the value `4096` be used, with the actual tick time be rounded to the nearest value.
	*
	* Patterns (measures) with overridden row numbers of beats, overiiden row numbers of measures, derived denominators not a power of 2, or derived non-integer nominators will have the value rounded up to the nearest equivalent valid MIDI time signature in the raw time signature MIDI event, then have custom meta events that shifts the offset map. */
	tpqn?: uint16;
	/** MIDI time division in SMPTE frames. Detailed information on interpretation should refer to Octavia documentation.
	*
	* Tracker modules do not populate this value.
	*
	* ## Raw SMPTE frame rate value
	* Permitted values (first element) are listed below.
	* - Film: `24`, `48`, `72`, `96`
	* - PAL, SÉCAM: `25`, `50`, `75`, `100`
	* - NTSC (drop frame): `29` (29.97), `59` (59.94), `89` (89.91), `119` (119.88)
	* - NTSC: `30`, `60`, `90`, `120`. */
	smpte?: [uint8, uint8];
	/** Definition vary by file type.
	*
	* For Standard MIDI Files, this indicates the SMF file type. For tracker files, this indicates the original format used. Full definition under `MICCConstants.FILE_*`. */
	type: uint16;
	/** Amount of expected tracks. For tracker music, this denotes allocated channels instead, due to each track occupying a single monophonic channel. Always check the actual track count! */
	track?: uint16;
	/** For files utilising pointers, amount of expected normal MIDI blocks/clips. This is typically seen in project (sequencer) files due to their tendency to reuse blocks, and tracker music as their patterns are treated as clips. Always check the actual clip count! */
	clip?: uint32;
	/** For files utilising styles, amount of expected styles. Currently unused. Always check the actual style count! */
	style?: uint32;
	/** For formats directly specifying names. Pure Standard MIDI Files and XWS files don't have this field natively, but formats like tracker music modules and KORG SNG have it.
	*
	* For tracker modules, trailing spaces are passed through, while trailing nulls are trimmed. If nulls exist before non-nulls and before the final null byte, they are passed through instead.
	* - SMF parsing may populate this field if string decoding is enabled during finalisation, but SMF serialisation does not use this field.
	* - XM restricts this to 20 bytes. CP437 is enforced upon serialisation.
	* - IT restricts this to 25 bytes with a null at the 26th byte, with the final null bytes always trimmed. CP437 is enforced upon serialisation. */
	title?: BinaryString;
}
/** (WIP) A single edit record. */
export class MICCEditRecord {}
/** (WIP) A single MIDI macro. */
export class MICCMacroMIDI {}
/** The contained additional metadata of the current file, only makes sense for trackers. Aims to achieve 100% compatibility with `.xm` and [`.it`](https://kb.ltgc.cc/octavia/impl/format/it.html). Further documentation available at [tracker](https://kb.ltgc.cc/octavia/spec/tmod/#meta-fields).
*
* The group specifier is `ltgc.micc.meta.tracker`. */
export class MICCTrackerMetadata extends MICCBaseMetadata {
	/** If the file is a tracker. */
	isTracker: boolean;
	/** For XM. The "tracker name" or branding string in Latin-9. Defaults to an empty string.
	* - For XM, this defaults to `Octavia MICC (minor Octavia version)`, e.g. `Octavia MICC 0.6    `.
	* - For IT and MPTM, this is always set to the default value. */
	branding: string;
	/** For IT and MPTM. The amount of expected audio channels. Default value is `2`.
	* - For XM, this is always set to the default value.
	* - For IT and MPTM, this is always set to either `1` or `2` by the "use stereo" field. */
	channels: uint8;
	/** For IT and MPTM. The amount of expected audio channels. Default value is `false`.
	* - For XM, this is always set to the default value.
	* - For IT and MPTM, this is always set to either `1` or `2` by the "use stereo" field. */
	extendedFilterRange: boolean;
	/** For XM, IT and MPTM. The logarithmic frequency curve used by the module. Some trackers for older systems may set this field to Paula to use hardware-accelerated sliders on Amiga.
	*
	* Defaults to linear for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	* - `0`: Linear scale. Default for all tracker formats supporting this field.
	* - `1`: Amiga Paula scale. Default for all tracker formats not supporting this field. */
	frequencyCurve: uint8;
	/** For XM, IT and MPTM. The full raw header data, used selectively to pass data through losslessly within the same format. */
	headerData: Uint8Array;
	/** For IT and MPTM. When `true`, `rowBeat` and `rowMeasure` are used. Defaults to `true` for MIDI compatibility.
	* - For XM, this is always `false`.
	* - For IT and MPTM, this is always set accordingly by the "has time signature hint" flag. */
	hintTimeSignature: boolean;
	/** For IT and MPTM. If true, `G` control (portamento to) will be linked with `E` (portamento down) and `F` (portamento up) controls. Defaults to `false` for MIDI compatibility, while Impulse/ModPlug modules will always cause this field to be set accordingly. */
	linkPortamento: boolean;
	/** For XM. The "ID text" or file magic string in Latin-9. Defaults to an empty string.
	* - For XM, this defaults to `Extended Module: `.
	* - For IT and MPTM, this is always set to the default value. */
	magic: string;
	/** For IT and MPTM. Panpot separation. Valid values are integers in [0, 32768].
	* - For XM, this is always set to `32768`.
	* - IT and MPTM map the value to [0, 128]. */
	panSplit?: uint16;
	/** For IT and MPTM. MIDI pitch bend sensitivity. Valid values are [-24, 24].  Defaults to `2` for MIDI compatibility.
	* - For XM, this is always set to `2`.
	* - For IT and MPTM, this is always set accordingly. */
	pitchDepth: int8;
	/** For XM. The index of the pattern in the pattern order table to jump back to a sequence finishes. This is always `0` for other formats, and is treated as `0` if the index is out of bound. */
	restartIndex: uint16;
	/** For XM, used by players. The MICC tick value resolved from `restartIndex`, thus always unused by serialisers. This is always `0` for other formats. */
	readonly restartTick: uint32;
	/** For IT and MPTM. Rows per beat, toggled by `hintTimeSignature`. Defaults to `32` for MIDI compatibility.
	* - For XM, this is always set to `4`.
	* - For IT and MPTM, this is always set accordingly. */
	rowBeat: uint8;
	/** For IT and MPTM. Rows per measure, toggled by `hintTimeSignature`. Defaults to `128` for MIDI compatibility.
	* - For XM, this is always set to `16`.
	* - For IT and MPTM, this is always set accordingly. */
	rowMeasure: uint8;
	/** For IT and MPTM. When `true`, slots with zeroed volume will not be mixed.
	*
	* Purely for data fidelity, as this field has long been deprecated. */
	silentMix: boolean;
	/** For XM. Contains the declare number of slots (tracker channels). Defaults to `0`.
	* - For XM, this is always set by the "slot count" field and validated by the finaliser. Valid values include intergers in (0, 128].
	* - For IT, this is set by the finaliser due to the field's absence. Valid values include intergers in (0, 64].
	* - For MPTM, this is set by the extended ModPlug metadata and validated by the finaliser. Valid values include intergers in (0, 128). */
	slots: uint16;
	/** For XM, IT and MPTM. Initial ticking speed. Defaults to `1` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	*
	* This is rounded to the nearest integer and bound to [0, 255]. */
	speed: float64;
	/** For XM, IT and MPTM. Initial declared tempo in BPM. Should *not* treat the declared tempo values as the real tempo.
	*
	* Defaults to `120` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	* - For MOD, this is always `125`.
	* - For XM, valid values include intergers in [32, 960].
	* - For S3M, valid values include intergers in [33, 255].
	* - For IT, valid values include intergers in [32, 255].
	* - For MPTM, valid values include intergers in [32, 1000]. */
	tempo: float64;
	/** For IT and MPTM. If true, edit history is attached. Defaults to `false`. */
	useEditHistory: boolean;
	/** For IT and MPTM. If true, highlights are embedded. Defaults to `false`. */
	useHighlights: boolean;
	/** For IT and MPTM. If true, indicates that MIDI macros are used. Defaults to `true` for MIDI compatibility, while tracker files will always cause this field to be set accordingly. */
	useMidiMacros: boolean;
	/** For IT and MPTM. When `true`, MIDI pitch bends are enabled, with the actual depth defined by `pitchDepth`. Defaults to `true`.
	* - For XM, this is always set to `false`.
	* - For IT and MPTM, this is always set accordingly by the "MIDI pitch control" field. */
	usePitch: boolean;
	/** For IT and MPTM. If true, use legacy effects. Defaults to `false` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.*/
	useOldEfx: boolean;
	/** For IT and MPTM. If true, song messages are attached. Defaults to `false`. */
	useSongMessages: boolean;
	/** For IT and MPTM. If true, the file uses instruments instead of raw oscillators (e.g. samples, FM oscillators). Defaults to `true` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	* - For XM, this is always `true`. */
	useInstruments: boolean;
	/** For IT and MPTM. Master volume. `32768` denotes the maximum possible value. Defaults to `32768` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	* - For XM, this is always set to `32768`.
	* - For IT and MPTM, this is always mapped to [0, 128]. */
	volumeMaster: uint16;
	/** For IT and MPTM. Oscillator volume. `32768` denotes the maximum possible value. Defaults to `32768` for MIDI compatibility, while tracker files will always cause this field to be set accordingly.
	* - For IT and MPTM, this is always mapped to [0, 128]. */
	volumeOscillator: uint16;
	/** For IT and MPTM. The "created" field. [256, 768) denotes two-byte Impulse Tracker versions. Defaults to `0xD64C` (LÖ, Lightingale Octavia).
	* - For XM, this is always set to the default value.
	* - For IT and MPTM, this is always set accordingly. */
	itCreated: uint16;
	/** For IT and MPTM. The "compatible" field. [256, 768) denotes two-byte Impulse Tracker versions. Defaults to `0x0214`.
	* - For XM, this is always set to the default value.
	* - For IT and MPTM, this is always set accordingly. */
	itCompatible: uint16;
	/** (WIP) For IT and MPTM. When `true`, the controls use the Scream 3 convention. Defaults to `false`.
	* - For XM, this is always set to `false`.
	* - For IT and MPTM, this is always set accordingly. */
	itIsScream: boolean;
	/** (WIP) For IT and MPTM. The 4-byte reserved field. Defaults to `4D 49 43 43`. */
	itReservedField: Uint8Array;
	/** For XM. The "version number" field. Defaults to `0x0104`.
	* - For XM, this is always set accordingly.
	* - For IT and MPTM, this is always set to the default value. */
	xmCompatible: uint16;
	/** For XM. When `true`, the indent byte will be `0x00` to signal a stripped XM, instead of `0x1A` in standard XM.
	* - For XM, this is always set accordingly. Setting this flag will override all other XM strip flags, so write cautiously.
	* - For IT and MPTM, this is always `false`. */
	xmStripDeclare: boolean;
	/** For XM. When `true`, the serialiser will attempt stripping the pattern table instead of emitting 256 bytes.
	* - For XM, this is always set accordingly.
	* - For IT and MPTM, this is always `false`. */
	xmStripPatterns: boolean;
	/** For XM. When `true`, the serialiser will zero out the compatible version number.
	* - For XM, this is always set accordingly.
	* - For IT and MPTM, this is always `false`. */
	xmStripVersion: boolean;
	/** (WIP) For IT and MPTM. List of MIDI macros.
	* - For XM, this is always absent.
	* - For IT and MPTM, this always exist if "request MIDI macros" is `true`, even if the size is 0. Following the de-facto Impulse Tracker implementation, the "has MIDI macro" field is ignored during parsing, and set to the same value as "request MIDI macros" upon serialisation. */
	macros?: MICCMacroMIDI[];
	/** For IT and MPTM. The attached message in the tracker. The length always agree with the "message size" field with no trimming.
	* - For XM, this is always absent.
	* - For IT, this always exist if "has song message" is `true`. CP437 is enforced upon serialisation.
	* - For MPTM, this always exist if "has song message" is `true`. Permits CP437, UTF-8, UTF-16LE and UTF-16BE. Non-CP437 encodings require a preceding BOM. */
	message?: BinaryString;
	/** For IT and MPTM. Binary offset of the message payload, always set to `0` when absent. For non-zero values, if no other data collide, the message payload is always attempted to be placed at the exact offset upon serialisation. Purely for data fidelity.
	* - For XM, this is always `0`.
	* - For IT and MPTM, this is always set accordingly. */
	messageOffset: uint32;
	/** For IT and MPTM. Initial slot loudness. Initialises to `32768` for MIDI compatibility.
	* - For XM, the values are always maximum.
	* - For IT and MPTM, this is always mapped to [0, 64]. */
	loudness: uint16[];
	/** For XM, IT and MPTM. List of oscillators used. The serialiser will throw if this is empty. */
	oscillators: MICCOscillator[];
	/** For XM, IT and MPTM. Pattern order table, which is used to populate the actual track. Tracker serialisation uses this field instead of the tracks.
	*
	* Values in the [0, 32767] range point to 0-indexed patterns. `0xFFFE` is "skip", and `0xFFFF` is "terminate".
	* - For XM, valid values include [0, 256). `0xFFFE` and `0xFFFF` are omitted. Must have (0, 256] elements.
	* - For IT, valid values include [0, 200). ModPlug extends this to [0, 240). Must have (0, 256) elements.
	* - For MPTM, valid values include [0, 240). */
	patternOrder: uint16[];
	/** For XM, IT and MPTM. Actual pattern data. The same table is kept under `MICCSequence.pool`.
	* - For XM, valid values include [0, 256). `0xFFFE` and `0xFFFF` are omitted. Must have (0, 256] elements.
	* - For IT, valid values include [0, 200). ModPlug extends this to [0, 240). Must have (0, 256) elements.
	* - For MPTM, valid values include [0, 240). */
	patterns: MICCTrackElement[]; // The pattern data hasn't been designed at all.
	/** For IT and MPTM. Initial slot panpot. Unlike MIDI, it's an integer in the range of [0, 128]. 0 is full left, 128 is full right. Initialises to `64` for MIDI compatibility.
	* - For XM, the values are always centre. */
	panpots: uint8[];
	/** (WIP) For IT and MPTM. List of edit records.
	* - For XM, this is always absent.
	* - For IT and MPTM, this always exist if "has edit history" is `true`. */
	records?: MICCEditRecord[];
	/** For XM, IT and MPTM. List of instruments used.
	* - For XM, this is always populated, and must have [0, 128] elements.
	* - For IT and MPTM, this field is only present if "voice type" is set to "instrument", and must have [1, 256) elements. */
	instruments?: MICCInstrument[];
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
	/** Defines how deep should the finalisers go.
	* - When set to `0`, the finaliser will refuse to run, and the related promise will resolve instantly when the raw data has been fully parsed.
	* - When set to `1`, only data containing primitive values will be parsed, like numbers and strings.
	* - When set to `2`, data having extended structure will also be parsed. */
	finaliserDepth: int8;
	/** Used by parsers to mark the file as finalised. */
	markFinalised(): Promise<void>;
	/** Runs the finalization process. Re-runs are useful for programs that mutate events, e.g. editors. */
	finalise(asType: uint8): Promise<void>;
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
	disassemble(stream: ReadableStream<Uint8Array>, useReadable?: boolean, context?: object): ReadableStream<string>;
	/** A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, Latin-9 will be used. */
	decoders: Iterable<TextDecoder>;
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
}
/** Musical Instructions Compiler Collection. */
export class MICC extends MICCConstants {
	// Persisted settings.
	/** When `true`, prints out more debug messages. Defaults to `false`. */
	static debug: boolean;
	/** A set of text decoders to use. Starting from the first, if the current decoder fails, the next decoder will be used. If all specified decoders fail, or this property is empty, Latin-9 will be used.
	*
	* Defaults to UTF-8 → Latin-9 → Shift JIS. */
	static decoders: Iterable<TextDecoder>;
	// Pure MIDI.
	/** Parse the incoming Standard MIDI File byte stream. */
	static parseSmf(stream: ReadableStream<Uint8Array>, options?: MICCParserOptions): MICCSequence;
	/** Parse the incoming Musical Instructions Assembly (Octavia's 1:1 assembly representation of Standard MIDI Files) stream. */
	static parseMia(stream: ReadableStream<Uint8Array>, label?: string): MICCSequence;
	/** (WIP) Parse the incoming RMI byte stream. Contained Standard MIDI Files will be flattened. */
	static parseRmi(stream: ReadableStream<Uint8Array>, options?: MICCParserOptions): MICCSequence;
	// MIDI-containing project files.
	/** (WIP) Parse the incoming XWS byte stream. */
	static parseXws(stream: ReadableStream<Uint8Array>, options?: MICCParserOptions): MICCSequence;
	// Tracker files.
	/** (WIP) Parse the incoming Impulse Tracker byte stream. */
	static parseIt(stream: ReadableStream<Uint8Array>, options?: MICCParserOptions): MICCSequence;
	// Assembly and disassembly.
	/** Directly assemble MIA into SMF without going through a sequence object. */
	static assemble(data: ReadableStream<string>, options?: MICCParserOptions): ReadableStream<Uint8Array>;
	/** Directly disassemble SMF into MIA without going through a sequence object.
	* @param useReadable When true, the emitted MIA instructions will use human-readable equivalents whenever available. */
	static disassemble(stream: ReadableStream<Uint8Array>, useReadable?: boolean, options?: MICCParserOptions): ReadableStream<string>;
}