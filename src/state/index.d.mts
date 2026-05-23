// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

declare interface OctaviaTimeProvider {
	currentTime: number;
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
	currentTime: number;
	/** Returns the current multiplexed time in milliseconds, but rounded down. */
	now(): number;
	constructor(clockSource?);
}

/** The state processing engine of Octavia as a virtual device. */
export class OctaviaDevice {}
