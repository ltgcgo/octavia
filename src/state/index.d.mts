// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import type {
	NakedMIDIEvent
} from "../micc/index.d.mts";

/** The core MIDI processing engine with an absurd coverage.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.state
*/

/** Any object applicable as a time source. */
declare interface OctaviaTimeProvider {
	readonly currentTime: number;
}

/** Defines what's the range of clearing voice definitions. */
declare interface OctaviaBankClearOptions {
	msb?: number | number[];
	prg?: number | number[];
	lsb?: number | number[];
}

/** The returned voice object. */
declare interface OctaviaVoiceObject {
	type?: any;
	drum?: any;
	voice?: any;
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
	* - `#`: Fallback.
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
export interface OctaviaVoiceProperties {}

/** Master settings tied to a device. */
declare class OctaviaDeviceMasterSettings {
	/** The master volume. A fractional number between `0` and `100`, with 14-bit maximum-allowed accuracy. */
	volume: number;
}

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
	loadFiles(...paths: string[]): Promise<void>;
	constructor(...paths: string[]);
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
	constructor(clockSource?: HTMLMediaElement | OctaviaTimeProvider);
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
	hideVoiceDetails: boolean;
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
	/** Deprecated. Returns all pressed keys with velocity in a channel. */
	getVel(part: number): Uint8Array;
	/** Get the current bitmap display state. */
	getBitmap(): {
		/** The bitmap buffer. */
		bitmap: Uint8Array;
		/** The timestamp when the buffer should expire. */
		expire: number;
	};
	/** Get the current letter display state. */
	getLetter(): {
		/** The letter text. */
		text: string;
		/** The timestamp when the text was set. */
		set: number;
		/** The timestamp when the text should expire. */
		expire: number;
	};
	/** Set the current letter display.
	* @param data The source buffer of the letter display text.
	* @param source The call source of this method. Used for debugging.
	* @param offset How many spaces should preceed the text.
	* @param delay How long until the current letter display expires.
	*/
	setLetter(data: Uint8Array | Uint8ClampedArray, source?: string, offset?: number, delay?: number): void;
	/** Set the current letter display.
	* @param data The source buffer of the letter display text.
	* @param source The call source of this method. Used for debugging.
	* @param delay How long until the current letter display expires.
	*/
	setLetterText(data: string, source?: string, delay?: number): void;
	/** Get the global device mode. */
	getMode(): string;
	// Should also introduce per-device mode here on top of per-port mode.
	/** Get the global master settings. */
	getMaster(): OctaviaDeviceMasterSettings;
	// Should also introduce per-device master settings here.
	/** Returns the per-mode substitution database. */
	getSubDb(): Record<string, Uint8Array>;
	/** Retrieve the single voice primitive component.
	* - `0`: program number
	* - `1`: cc0 (bank MSB)
	* - `2`: cc32 (bank LSB)
	*/
	getChPrimitive(part: number, component: number, useSubDb?: boolean): number;
	/** Retrieve the voice primitive components of a part. Unlike `OctaviaDevice.prototype.getChPrimitive()`, the layout is different.
	* - `0`: cc0 (bank MSB)
	* - `1`: program number
	* - `2`: cc32 (bank LSB)
	*/
	getChPrimitives(part: number, useSubDb?: boolean): Uint8Array;
	/** Commit changes made in the voice primitives of a part. */
	pushChPrimitives(part: number): void;
	/** Retrieve the custom voice name buffer of a part. */
	getChCvnBuffer(part: number, maxBufferLength?: number): Uint8Array;
	/** Retrieve a single register value from the custom voice name buffer of a part. */
	getChCvnRegister(part: number, registerIndex: number): number;
	/** Write a single register value to the custom voice name buffer of a part. */
	setChCvnRegister(part: number, registerIndex: number, value: number): void;
	/** Retrieve the custom voice name as a string from a part.
	* @param preserveEnd When `true`, the trailing whitespaces will not be removed.
	*/
	getChCvnString(part: number, preserveEnd?: boolean): string;
	/** Retrieve the write state of the custom voice name buffer of a part. */
	getChCvnIsWritten(part: number): number;
	/** Clear the custom voice name buffer of a part. */
	resetChCvn(part: number): void;
	/** Retrieve the voice object based on the voice primitives, mode and hint. This method wraps both `OctaviaDevice.prototype.userBank` and `OctaviaDevice.prototype.baseBank`, where `userBank` takes precedence over `baseBank`. */
	getVoice(msb: number, prg: number, lsb: number, mode?: string, hint?: number): OctaviaVoiceObject;
	/** Retrieve the voice object of a part. This method will also take custom voice names into account. */
	getChVoice(part: number): OctaviaVoiceObject;
	/** Retrieve the 14-bit raw pitch shift value of a part. Range in `[-8192, 8191]`. */
	getChRawPitch(part: number): number;
	/** Retrieve the calculated pitch shift value of a part, influenced by pitch bends, coarse tuning and fine tuning. */
	getChPitch(part: number): number;
	/** Retrieve the polyphony/note state from a polyphony slot. */
	getPolyState(polyIndex?: number): number;
	// Effect type and sink methods all need to add per-device support.
	/** Retrieve the effect type from a slot. Slot `0` to `2` are for reverb, chorus and variation/delay respectively, and slot `3` and onwards are all insertion. */
	getEffectType(slot?: number): Uint8Array;
	/** Directly writes both MSB and LSB to an effect slot. */
	setEffectType(slot: number, msb: number, lsb: number): void;
	/** Directly writes one of MSB and LSB to an effect slot.
	* @param isLsb When `true`, this writes to LSB. MSB otherwise.
	*/
	setEffectTypeRaw(slot: number, isLsb: boolean, value: number): void;
	/** Commits updates to the effect types.
	* @param isHidden `true` tells the event receivers that the effect should not be visible.
	*/
	pushEffectType(slot?: number, isHidden?: number): void;
	// (WIP) Allows the "many parts to many effect slots" model in the future on top of multi-device support, so the normal effect routing and XG effect routing can be united under one model.
	/** Retrieve the effect slot the part is being routed to. This method currently assumes a "one effect slot from many parts" model.
	*
	* Yamaha XG uses a different effect slot routing system in a "many effect slots from one part" model, allowing multiple to collide on the same, so this method alone isn't enough to retrieve the whole picture.
	*/
	getChEffectSink(part: number): number;
	/** Writes the effect slot the part is being routed to.
	*
	* Slot `0` doesn't mean "reverb" here, unlike in other methods, as Octavia assumes "reverb" to always be available.
	*/
	setChEffectSink(part: number, slot?: number): void;
	/** Writes the part the effect slot is routing from.
	*
	* Slot `0` is reserved for variation effect under insertion mode.
	*/
	setXgChEffectSink(part: number, slot?: number): void;
	setDetectionTargets(mode?: string, port?: number): void;
	/** Sets the target GS/SC level.
	* - `0`: SC-55
	* - `1`: SC-88 (valid for SC)
	* - `2`: SC-88 Pro (valid for SC)
	* - `3`: SC-8850
	* @param useSc When `true`, the SC target will be set instead of GS. Triggered by SC Mode Set SysEx on SC-88 and SC-88 Pro.
	* @param gsLevel Which GS level to target.
	*/
	setGsTargets(useSc?: boolean, gsLevel?: number): void;
	/** Returns the current config. */
	getConfigs(): Object;
	/** Sets the restrictions on dump SysEx strings. Refer to `OctaviaDevice.prototype.DUMP_*` for details. */
	setDumpLimit(limit: number): void;
	/** Allocate a control change number to an Active Custom Effect slot on all parts. */
	assignAce(cc: number): void;
	/** Allocate a control change number to an Active Custom Effect slot on a part. */
	assignChAce(part: number, cc: number): void;
	/** Initialise all drum parameters. */
	initDrums(): void;
	/** (WIP) Initialise drum parameters on a slot. */
	initDrumSlot(slot: number): void;
	/** Reset and initialise the device.
	* - `0`: Full reset (default).
	* - `1`: Hard reset. Skips some states.
	*/
	init(type?: number): void;
	/** Retrieve the string mode identifier of a part. */
	getChMode(part: number, noFallback?: boolean): string;
	/** Retrieve the numerical mode identifier of a part. */
	getChModeId(part: number, noFallback?: boolean): number;
	/** Sets the mode of a part with a numerical identifier. */
	setChModeId(part: number, modeId?: boolean): string;
	/** Retrieve the string mode identifier of a port. */
	getPortMode(part: number, noFallback?: boolean): string;
	/** Retrieve the numerical mode identifier of a port. */
	getPortModeId(part: number, noFallback?: boolean): number;
	/** Set the mode of a port with a numerical identifier. */
	setPortModeId(part: number, modeId?: boolean): string;
	/** Copy the setup of a part from another part. Needs rethinking and reworking. */
	copyChSetup(sourcePart: number, targetPart: number, failWhenActive?: boolean): void;
	/** Get the first write part for a drum slot. */
	getDrumFirstWrite(part: number): number;
	/** Set the first write part for a drum slot. Part setup copying will happen on subsequent parts of the same slot.
	* @param disable When `true`, the first write status of the part will be reset.
	*/
	setDrumFirstWrite(part: number, disable?: boolean): void;
	/** Get the first write part for a part's drum slot. */
	getChDrumFirstWrite(part: number): number;
	/** Switch the global mode.
	* - `0`: Change only when without a defined mode. No reset.
	* - `1`: Change. Reset when without a defined mode.
	* - `2`: Change with reset regardless.
	* - `3`: Do not reset.
	* @param forced The force switch level described above. Resets happen when `OctaviaDevice.prototype.initOnReset` is `true`.
	* @param setTarget When `true`, `OctaviaDevice.prototype.setDetectionTargets()` will be called.
	*/
	switchMode(mode: string, forced?: number, setTarget?: boolean): void;
	/** (WIP) Retrieve the raw strength of all parts, values range between 0 and 16383. */
	getRawStrengths(): Uint8Array;
	/** Retrieve the strength of all parts, values are all within [0, 32767], affected by cc7 and cc11.
	* @param fullScale When `true`, the range will become [0, 32768] instead.
	*/
	getStrengths(fullScale?: boolean): Uint8Array;
	/** Wipe the raw strength buffer clean for the next round. */
	clearStrength(): void;
	/** The older MIDI event object executor. */
	runJson(json: Object): void;
	/** (WIP) Execute a decoded MIDI event. */
	runEvent(event: NakedMIDIEvent): void;
	/** (WIP) Directly execute an undecoded MIDI event on a port. */
	runRaw(eventBuffer: Uint8Array | Uint8ClampedArray, port?: number): void;
	/** Load custom user voices from files in supported formats.
	*
	* Supported formats:
	* - `s7e`: Yamaha S90 ES
	* - `pcg`: KORG programs (KROSS 2)
	* @param format The format specifier.
	* @param blob The `Blob` instance of the file.
	*/
	loadBank(format: string, blob: Blob): void;
	/** (WIP) Load custom user voices from files in supported formats.
	*
	* Supported formats:
	* - `s7e`: Yamaha S90 ES
	* - `pcg`: KORG programs (KROSS 2)
	* @param format The format specifier.
	* @param blob The `ReadableStream` instance of the file.
	*/
	streamBank(format: string, blob: ReadableStream<Uint8Array | Uint8ClampedArray>): Promise<void>;
}
