// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import chordData from "./generated/chords.json";
//import chordData from "./generated/chords.json" with {type: "json"};

const asciiToneShift = "bbb,bb,b, ,#,##,###".split(",");
const actualToneShift = "♭𝄫,𝄫,♭,♮,♯,𝄪,𝄪♯".split(",");

const chordTypeMap = new Map(); // From chord IDs to other info
const mapFromXf = new Uint8Array(35); // From Yamaha XF IDs to native chord type IDs
const mapFromSp = new Map(); // From specifiers to native chord type IDs

for (let chord of chordData) {
	if (typeof chord.id === "number") {
		chordTypeMap.set(chord.id, chord);
		if (typeof chord.xf === "number") {
			mapFromXf[chord.xf] = chord.id;
		};
		for (let specifier of chord.sp) {
			mapFromSp.set(specifier, chord.id);
		};
	};
};

//console.debug(mapFromXf);

let ChordDict = class ChordDict {
	static getChordRoot(chord) {
		let root = (chord >> 8) & 7;
		if (root > 0) {
			return " CDEFGAB"[root];
		} else {
			throw(new Error("Invalid chord root."));
		};
	};
	static getChordShiftRaw(chord) {
		let shift = chord >> 12;
		if (shift < 7) {
			return shift;
		} else {
			throw(new RangeError("Invalid semitone shift."));
		};
	};
	static getChordShift(chord) {
		return this.getChordShiftRaw(chord) - 3;
	};
	static getChordId(chord) {
		return chord & 255;
	};
	static getChordType(chordId) {
		if (chordTypeMap.has(chordId)) {
			return chordTypeMap.get(chordId).sp[0];
		} else {
			throw(new RangeError(`Unknown chord ID ${chordId}.`));
		};
	};
	static fromChordType(chordSpecifier) {
		if (mapFromSp.has(chordSpecifier)) {
			return mapFromSp.get(chordSpecifier);
		} else {
			throw(new Error(`Unknown specifier "${chordSpecifier}".`));
		};
	};
	static fromChordXF(chordXf) {
		if (chordXf >= 0 && chordXf < mapFromXf.length) {
			return mapFromXf[chordXf];
		} else {
			throw(new RangeError(`Unknown XF ID ${chordXf}.`));
		};
	};
};

export {
	ChordDict
};
