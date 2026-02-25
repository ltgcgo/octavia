// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/**
 * Definitions of different chord representations, for parsing, serializing and more.
 * Chords are packed u16 numbers, with the upper byte defining root note and accidental in the XF format, and the lower byte defining the type of chord, like 0x3100 always denote a C major.
 * @module
 */

export class ChordDict {
	/** Return the root note of a chord as a single-letter string. */
	static getChordRoot(chord: number): string;
	/** Return the semitone shift of a chord as a signed integer. 0 for natural. */
	static getChordShift(chord: number): number;
	/** Return the native ID of a chord. Basically just returning the lower byte. */
	static getChordId(chord: number): number;
	/** Return the identifier of a chord. */
	static getChordType(chord: number): string;
	/** Return the native chord ID from a valid specifier. */
	static fromChordType(chordSpecifier: string): number;
	/** Preset for TUNE chords expression. */
	static PRESET_TUNE: number;
	/** Preset for Solton chords expression. */
	static PRESET_SOLTON: number;
	/** Serialize a chord into a natural expression.
	* @param chords An array of packed chords.
	* @param flags A bitmask of formatting toggles. 0x1 for strict accidental.
	*/
	static stringify(chords: Array<number>, flags: number): string;
	/** Parse a natural chord expression into a chord.
	* @param chordExpr The natural chord expression.
	* @param flags A bitmask of formatting toggles. Same as in `stringify()`.
	*/
	static parse(chordExpr: string, flags: number): Array<number>;
	/** Serialize chords into a Yamaha-compliant buffer.
	* @param chords An array of packed chords.
	* @param strict Strictly limit to only two chords. Defaults to false.
	*/
	static serializeYamaha(chords: Array<number>, strict?: boolean): Uint8Array;
	/** Parse a Yamaha-compliant chord buffer into chords.
	* @param buffer Buffer containing only Yamaha chord data.
	* @param strict Strictly limit to only two chords. Defaults to false.
	*/
	static parseYamaha(buffer: Uint8Array, strict?: boolean): Array<number>;
};
