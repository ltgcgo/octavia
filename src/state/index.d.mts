// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

declare interface OctaviaTimeProvider {
	readonly currentTime: number;
}

declare interface OctaviaBankClearOptions {
	msb?: number | number[];
	prg?: number | number[];
	lsb?: number | number[];
}

/** The returned voice object. */
declare interface OctaviaVoiceObject {
	type?;
	drum?;
	voice?;
	/** Voice ID in 8-char Yamaha style. */
	name: string;
	/** Polyphony/element/oscillator count. */
	poly?: number;
	/** Required support level within a standard/line-up. */
	level?: number;
	/** Start IDs. What was supplied in the MSB, PC & LSB tuple. */
	sid: number[];
	/** Initial IDs. What was supplied to the voice retrieval process. */
	iid: number[];
	/** End IDs. What ended up being used to retrieve the voice. */
	eid: number[];
	/** The supplied hint. */
	hint: number;
	/** The single-character "ending" value used to indicate the voice retrieval state.
	* - ` `: Exact match.
	* - `^`: No exact LSB match.
	* - `*`: No exact PC match.
	* - `!`: No exact MSB match.
	* - `?`: Hard failure.
	*/
	ending: string;
	/** The determined 4-character voice section. */
	sect: string;
	/** The determined 3-character voice bank. */
	bank: string;
	/** The determined 2-character voice standard. */
	standard: string;
	/** The determined mode ID. */
	mode: string;
}

/** The returned voice properties. */
declare interface OctaviaVoiceProperties {}

/** A voice bank. */
export class VoiceBank {
	/** Retrieve the voice information with the specified MSB, PC and LSB tuple. */
	get(msb?: number, prg?: number, lsb?: number, mode?: string, hint?: number): OctaviaVoiceObject;
	/** Clear the assigned voices in the specified range. */
	clearRange(options: OctaviaBankClearOptions): void;
	/** Initialize the voice banks. */
	init(): void;
	/** Load a voice bank map. */
	load(text: string, overwrite?: boolean, name?: string, priority?: number): Promise<void>;
	/** Load voice maps from the specified paths or URLs. */
	loadFiles(...paths: string): Promise<void>;
	constructor(...paths: string);
}

/** Time multiplexer. */
export class TimeMuxer {
	/** Attach a source to the time multiplexer. */
	attach(source: HTMLMediaElement | OctaviaTimeProvider): void;
	/** Detach the existing source from this time multiplexer. */
	detach(): void;
	/** Returns the current real time in milliseconds. */
	timeMs(): number;
	/** Sets if the multiplexer should return the current real time. */
	realtime: boolean;
	/** Returns the multiplexed time in seconds as double-precision float. */
	readonly currentTime: number;
	/** Returns the current multiplexed time in milliseconds, but rounded down. */
	now(): number;
	constructor(clockSource?);
}

/** When `true`, the code should be in a debugging state. */
export function getDebugState(): boolean;

/** The allocated values. */
export declare const allocated: {
	/** Amount of ports allocated. */
	readonly port: number;
	/** Amount of total channels available. */
	readonly ch: number;
	/** Buffer size of the voice primitive blocks. */
	readonly chShift: number;
	/** Amount of supported CCs. */
	readonly cc: number;
	/** Amount of notes per channel. */
	readonly nn: number;
	/** Maximum polyphony. */
	readonly pl: number;
	/** Amount of virtual tracks. */
	readonly tr: number;
	/** Buffer size of each individual MT-32 timbre storage. */
	readonly cmt: number;
	/** Amount of supported RPNs. */
	readonly rpn: number;
	/** On second glance, I think this property might got misused. Worth further effort, like refactoring. */
	readonly rpnt: number;
	/** Amount of supported NRPNs. */
	readonly nrpn: number;
	/** Amount of allowed active custom effect slots per part. */
	readonly ace: number;
	/** Amount of drum setups. */
	readonly drm: number;
	/** Amount of supported drum NRPNs. */
	readonly dpn: number;
	/** Amount of notes in a drum part. */
	readonly dnc: number;
	/** Amount of extension slots per part. */
	readonly ext: number;
	/** Amount of global EFX slots. */
	readonly efx: number;
	/** Buffer size of customized voice names. */
	readonly cvn: number;
	/** Buffer size of voice primaries on each part (PC, MSB, LSB). */
	readonly vxPrim: number;
	/** Value of the invalid part. */
	readonly invalidCh: number;
	/** What does this do? I forgot ;P */
	readonly redir: number;
}

/** The special values used as overrides. */
export declare const overrides: {
	/** The value taken to signify bank 0. */
	readonly bank0: number;
}

/** The state processing engine of Octavia as a virtual device. */
export class OctaviaDevice {
	/** The note is idle. */
	readonly NOTE_IDLE: number;
	/** The note is muted, but recoverable. Typically seen on notes exceeding per-channel polyphony. */
	readonly NOTE_MUTED_RECOVERABLE: number;
	/** The note is in the attack phase. */
	readonly NOTE_ATTACK: number;
	/** The note is in the decay phase. */
	readonly NOTE_DECAY: number;
	/** The note is in the sustain phase. */
	readonly NOTE_SUSTAIN: number;
	/** The note is held by the sustain pedal. */
	readonly NOTE_HELD: number;
	/** The note is in the release phase. */
	readonly NOTE_RELEASE: number;
	/** The note is in the attack phase with sostenuto pedal activated. */
	readonly NOTE_SOSTENUTO_ATTACK: number;
	/** The note is in the decay phase with sostenuto pedal activated. */
	readonly NOTE_SOSTENUTO_DECAY: number;
	/** The note is in the sustain phase with sostenuto pedal activated. */
	readonly NOTE_SOSTENUTO_SUSTAIN: number;
	/** The note is in the held phase with sostenuto pedal activated. */
	readonly NOTE_SOSTENUTO_HELD: number;
	/** The part is melodic. */
	readonly CH_MELODIC: number;
	/** The part is used for drums without drum setups. */
	readonly CH_DRUMS: number;
	/** The part is used for drums with drum setup slot 1. */
	readonly CH_DRUM1: number;
	/** The part is used for drums with drum setup slot 2. */
	readonly CH_DRUM2: number;
	/** The part is used for drums with drum setup slot 3. */
	readonly CH_DRUM3: number;
	/** The part is used for drums with drum setup slot 4. */
	readonly CH_DRUM4: number;
	/** The part is used for drums with drum setup slot 5. */
	readonly CH_DRUM5: number;
	/** The part is used for drums with drum setup slot 6. */
	readonly CH_DRUM6: number;
	/** The part is used for drums with drum setup slot 7. */
	readonly CH_DRUM7: number;
	/** The part is used for drums with drum setup slot 8. */
	readonly CH_DRUM8: number;
	/** Part dump receptions are not restricted in any way. */
	readonly DUMP_ALL: number;
	/** Part dump receptions are only accepted once for each part. */
	readonly DUMP_ONCE: number;
	/** Part dump receptions are only accepted if the dump matches the mode of the part. */
	readonly DUMP_MODE: number;
	/** No extensions are being used for the part. */
	readonly EXT_NONE: number;
	/** PLG-VL is active for the part. */
	readonly EXT_VL: number;
	/** PLG-DX is active for the part. */
	readonly EXT_DX: number;
	/** VL breath control: follow system. */
	readonly VLBC_SYSTEM: number;
	/** VL breath control: from cc2 (breath) or cc11 (expression). */
	readonly VLBC_BRTHEXPR: number;
	/** VL breath control: from initial note velocity. */
	readonly VLBC_VELOINIT: number;
	/** VL breath control: from initial note velocity and note aftertouch. */
	readonly VLBC_VELOALL: number;
	/** The part is inactive. */
	readonly CH_INACTIVE: number;
	/** The part is active. */
	readonly CH_ACTIVE: number;
	/** The part is disabled. */
	readonly CH_DISABLED: number;
	/** The dedicated karaoke reception mode is not activated. */
	readonly KARAOKE_NONE: number;
	/** The dedicated karaoke reception mode is activated for [Text Event Substitution](https://kb.ltgc.cc/octavia/impl/ext.html#text-event-substitution). */
	readonly KARAOKE_TEXT: number;
	/** The dedicated karaoke reception mode is activated for [Yamaha XF](https://kb.ltgc.cc/octavia/impl/ext.html#xf-lyrics). */
	readonly KARAOKE_XF: number;
	/** The supposed LCD contrast level. `0` indicates 0% contrast, `16` indicates 100% contrast. */
	lcdContrast: number;
	/** The linked clock source. */
	clockSource: TimeMuxer;
	/** Model-exclusive states. */
	modelEx: {
		/** States specific to Yamaha XG. */
		"xg": {
			/** Selected voice map.
			* - `0`: MU Basic (Native map for MU50, MU80, MU90, S-YXG50 and most other XG synths)
			* - `1`: MU100 Native (Native map for MU100, MU128, MU500, MU1000, MU2000 and SW1000XG)
			* - `2`: PSR/LE (Native map for S-YXG2006LE and PSR models)
			* - `3`: QY100 (Native map for QY100 and PLG100-XG)
			*/
			"map": number;
			/** Currently activated YMCS Section Control ID. The exact meaning of this value varies between models (QY, PSR). */
			"section": number;
			/** If YMCS Section control has been activated. */
			"sectSwitch": boolean;
			/** Device ID for the selected style pattern in `uint16`. */
			"styleDev": number;
			/** Style pattern ID for the selected style pattern in `uint16`. */
			"styleId": number;
			/** Specified chords in the native chords form. */
			"chords": number[];
			/** When `true`, variation effect applies device-wide instead of only on a single part. */
			"varSys": false;
			/** Which parts have insertion effects active. Slot 0 is for the variation effect; XG only allows 4 effects in total per device. */
			"insPart": Uint8Array;
		},
		/** Part assignments for Yamaha plug-in cards, ordered by internal IDs.
		* - `0`: VL (virtual acoustic). Supported by PLG100-VL, PLG150-VL, S-YXG100PVL, SONDIUS-XG.
		* - `1`: SG (formant singing). Supported by PLG100-SG, S-YXG100PVL.
		* - `2`: DX (frequency/phase modulation from DX7). Supported by PLG100-DX, PLG150-DX, DX200, FS1R.
		* - `3`: AN (virtual analogue from Yamaha AN1x). Supported by PLG150-AN, AN200. Octavia accepts AN1x in this mode.
		* - `4`: PF (piano). Supported by PLG150-PF.
		* - `5`: DR (drums). Supported by PLG150-DR.
		* - `6`: PC (percussion). Supported by PLG150-PC.
		* - `7`: AP (acoustic piano). Supported by PLG150-AP.
		*/
		"yPlg": number[][],
		/** States specific to PLG-VL. */
		"vl": {
			/** The module mode for VL70-m.
			* - `0`: PLG-VL (default). PLG-VL never declares VL module mode.
			* - `1`: VL-XG. The XG-compatible layout on MSB `081` and `097`.
			* - `2`: Voice. The VL-native layout on MSB `033`.
			*/
			"module": number;
			/** System breath mode. Read the documentation on `OctaviaDevice.prototype.VLBC_*` for details. Cannot be `0` (`VLBC_SYSTEM`). */
			"breath": number;
			/** Voice receive channel for VL70-m. */
			"voiceCh": number;
		},
		/** States specific to Roland SoundCanvas. */
		"sc": {
			/** Should the strength metre bars be shown. Defaults to `true`. */
			"showBar": boolean;
			/** Should the bars be flipped vertically (upside-down). */
			"invBar": boolean;
			/** Should the display be white on black instead of black on white. */
			"invDisp": boolean;
			/** The peak hold type.
			* - `0`: No peak hold.
			* - `1`: Descending peak hold. (default)
			* - `2`: Disappearing peak hold.
			* - `3`: Ascending peak hold.
			*/
			"peakHold": number;
		},
		/** States specific to Yamaha CS1x and/or CS2x. */
		"cs1x": {
			/** The selected performance part. Default to `0` (channel 1). */
			"perfCh": number;
		},
		/** States specific to KORG KROSS 2. */
		"kross": {
			/** When `true`, `BMT1` dumps are allowed to toggle parts. */
			"chToggle": boolean;
		},
		/** States specific to PLG-SG. */
		"sg": {
			/** The timestamp of when the last syllable was converted. */
			"convLastSyll": number;
			/** The current line length. */
			"runLineLen": number;
			/** The length where the current line must break into a new line. */
			"maxLineLen": number;
			/** When `true`, the meta event type on the new line should be shown. */
			"splitMask": boolean;
		},
		/** States specific to MT-32. */
		"mt32": {
			/** When `false`, timbre memory writes are disabled. */
			"writeTimbre": boolean;
		}
	};
	/** The detect configurations. */
	readonly detect: Object;
	/** The base voice bank intended for factory voices/instruments. */
	readonly baseBank: VoiceBank;
	/** The user voice bank intended for editable voices/instruments in RAM. */
	readonly userBank: VoiceBank;
	/** When `true`, Octavia will be re-initialized on every mode switch. */
	initOnReset: boolean;
	/** Specifies the customized EFX name from KORG AI² synths. */
	readonly aiEfxName: string;
	/** When `true`, the polyphony tracker's last index pointer will shrink. Defaults to `true` for speeding up note recovery. */
	polyIndexShrink: boolean;
	/** Specifies the latest polyphony tracker index being accessed. */
	readonly polyIndexLatest: number;
	/** Specifies the last polyphony tracker index. */
	readonly polyIndexLast: number;
	/** When `true`, the visualiser should hide voice bank information. Typically seen in Yamaha MU demo songs. */
	lcdHideBankInfo: boolean;
	/** Retrieve the actual assigned part from designated part and its track.
	* @param noConquer When `true`, automatic channel allocation is not triggered.
	*/
	chRedir(part: number, track: number, noConquer?: boolean): number;
	/** Directly retrieve the assigned port from a track. */
	getTrackPort(track: number): number;
	/** Enforce a voice event redispatch on all active channels. */
	forceVoiceRefresh(): void;
	/** Trigger building a receive channel tree. */
	buildRchTree(): void;
	/** Trigger building a CC redirect map. */
	buildRccMap(): void;
	/** Trigger an event showing SysEx indicators on visualisers. */
	invokeSysExIndicator(): void;
	/** Deprecated. Retrieve the internal array indicating if a part is active or not. Refer to `OctaviaDevice.prototype.CH_*` for details. */
	getActive(): Uint8Array;
	/** Returns a number indicating if a part is active or not. Refer to `OctaviaDevice.prototype.CH_*` for details. */
	getChActive(part: number): number;
	/** Writes the part active state and triggers an event conditionally. */
	setChActive(part: number, active?: number): void;
	/** Resets all CC values of all parts. Sets the write states to `0`. */
	resetCcAll(): void;
	/** Returns the CC value from a part.
	* (WIP) When the write state is `0`, the returned values will be replaced by default ones, affected by part number (MT-32), part type and CC number.
	* @param cc Control change number. If a CC is not accepted, `RangeError` will be thrown.
	* @param raw (WIP) When `true`, returns the set value as-is, no attempts on default value replacements will happen.
	*/
	getChCc(part: number, cc: number, raw?: boolean): number;
	/** Writes the CC value of a part. Sets the write state to `1`.
	* @param cc Control change number. If a CC is not accepted, `RangeError` will be thrown.
	*/
	setChCc(part: number, cc: number, value: number): void;
	/** Resets the CC value of a part, optionally writes a value. Sets the write state to `0`.
	* @param cc Control change number. If a CC is not accepted, `RangeError` will be thrown.
	*/
	resetChCc(part: number, cc: number, value: number): void;
	/** Resets all CC values of a part. Sets the write states to `0`. */
	resetChCcAll(part: number): void;
	/** Returns the write state of a CC value from a part. `0` for `false`, `1` for `true`.
	* @param cc Control change number. If a CC is not accepted, `RangeError` will be thrown.
	*/
	getChCcWritten(part: number, cc: number): number;
	/** Returns the source channel of a part. */
	getChSource(part: number): number;
	/** Returns the type of a part. Refer to `OctaviaDevice.prototype.CH_*` for details. */
	getChType(part: number): number;
	/** Writes the type of a part. Refer to `OctaviaDevice.prototype.CH_*` for details.
	* @param mode Deprecated. The native numeric mode.
	* @param disableMsbWrite Deprecated. When `true`, default part bank MSB will not be set.
	*/
	setChType(part: number, type: number, mode?: number, disableMsbWrite?: boolean): void;
	/** Returns the part extension states. */
	getExt(part: number): Uint8Array;
}
