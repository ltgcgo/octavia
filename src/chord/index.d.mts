// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
	int8,
	uint8,
	uint16,
	uint32
} from "../../libs/rochelle@ltgcgo/nativeType.d.mts";

/** Definitions of different chord representations, for parsing, serializing and more.
*
* Chords are packed u16 numbers, with the upper byte defining root note and accidental in the XF format, and the lower byte defining the type of chord, like 0x3100 always denote a C major.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.chord
*/

/** The master chord dictionary. */
export class ChordDict {
	/** Return the root note of a chord as a single-letter string.
	* @param chord A packed chord.
	* @param loose When true, let invalid root notes fail silently.
	*/
	static getChordRoot(chord: number, loose?: boolean): string;
	/** Return the root note of a chord as a number starting at 1 for C.
	* @param chord A packed chord.
	* @param loose When true, let invalid root notes fail silently.
	*/
	static getChordRootRaw(chord: number, loose?: boolean): uint16;
	/** Return the semitone shift of a chord as a signed integer. 0 for natural.
	* @param chord A packed chord.
	*/
	static getChordShift(chord: number): int8;
	/** Return the semitone shift of a chord as an unsigned integer. 3 for natural.
	* @param chord A packed chord.
	*/
	static getChordShiftRaw(chord: number): uint8;
	/** Return the native ID of a chord. Basically just returning the lower byte.
	* @param chord A packed chord.
	*/
	static getChordId(chord: number): uint8;
	/** Return the identifier of a native chord ID.
	* @param chord A packed chord.
	*/
	static getChordType(chord: number): string;
	/** Return the native chord ID from a valid specifier. */
	static fromChordType(chordSpecifier: string): uint16;
	/** Return the native chord ID from a valid Yamaha XF ID. */
	static fromChordXF(chordXf: number): uint16;
	/** Preset for TUNE chords expression. */
	static PRESET_TUNE: uint32;
	/** Preset for Solton chords expression. */
	static PRESET_SOLTON: uint32;
	/** Serialize a chord into a natural expression.
	* @param chords An array of packed chords.
	* @param flags A bitmask of formatting toggles. 0x1 for strict accidental.
	*/
	static stringify(chords: Array<uint16>, flags?: uint32): string;
	/** Parse a natural chord expression into a chord.
	* @param chordExpr The natural chord expression.
	* @param flags A bitmask of formatting toggles. Same as in `stringify()`.
	*/
	static parse(chordExpr: string, flags?: uint32): Array<uint16>;
	/** Serialize chords into a Yamaha-compliant buffer.
	* @param chords An array of packed chords.
	* @param strict Strictly limit to only two chords. Defaults to false.
	*/
	static serializeYamaha(chords: Array<uint16>, strict?: boolean): Uint8Array;
	/** Parse a Yamaha-compliant chord buffer into chords.
	* @param buffer Buffer containing only Yamaha chord data.
	* @param strict Strictly limit to only two chords. Defaults to false.
	*/
	static parseYamaha(buffer: Uint8Array, strict?: boolean): Array<uint16>;
}

/** How should a chord be shown with just two components. */
declare class ChordPlanDuo {
	/** The "main" component. For `m7b5`, this value should be `m7`. */
	readonly m: string;
	/** The "sub" component. For `m7b5`, this value should be `b5`. */
	readonly s: string;
}

/** Retrieve the two-component chord display plan. */
export function getFreePlan(chordId: number): ChordPlanDuo|null;
