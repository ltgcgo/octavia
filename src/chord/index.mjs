// 2022-2026 (C) Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

//import chordData from "./generated/chords.json";
import chordData from "./generated/chords.json" with {type: "json"};
import qyPlanRawData from "./generated/qyChordPlan.json" with {type: "json"};

// Chord dictionary

const asciiToneShift = "bbb,bb,b,,#,##,###".split(",");
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
let ChordDict = class ChordDict {
	static getChordRootRaw(chord) {
		let root = (chord >> 8) & 7;
		if (root > 0) {
			return root;
		} else {
			throw(new Error("Invalid chord root."));
		};
	};
	static getChordRoot(chord) {
		return " CDEFGAB"[this.getChordRootRaw(chord)];
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
		} else if (chordXf === 127) {
			return 255;
		} {
			throw(new RangeError(`Unknown XF ID ${chordXf}.`));
		};
	};
	static parseYamaha(buffer, strict = false) {
		let data = [];
		if (buffer.length & 1) {
			throw(new Error("Buffer size isn't even."));
		};
		if (strict && buffer.length !== 4) {
			throw(new Error("Buffer size isn't 4."))
		};
		for (let i = 0; i < buffer.length; i += 2) {
			if (buffer[i | 1] === 0x7f) {
				if (buffer[i] !== 0x7f) {
					data.push((buffer[i] << 8) | this.fromChordType("---"));
				};
				continue;
			} else if (buffer[i | 1] <= 0x22) {
				data.push((buffer[i] << 8) | this.fromChordXF(buffer[i | 1]));
			} else {
				console.warn(`"0x${buffer[i | 1].toString(16)}" is not a valid XF chord.`);
			};
		};
		return data;
	};
	static MASK_STRICT_ACCIDENTAL = 1;
	static MASK_NATIVE_ACCIDENTAL = 2;
	static MASK_SPACED_DELIMITER = 4;
	static PRESET_TUNE = 1;
	static PRESET_SOLTON = 4;
	static stringify(chords, flags = 6) {
		let result = "";
		for (let chord of chords) {
			if (result.length > 0) {
				result += (flags & this.MASK_SPACED_DELIMITER) ? " " : "/";
			};
			result += this.getChordRoot(chord);
			let accidental = (flags & this.MASK_NATIVE_ACCIDENTAL ? actualToneShift : asciiToneShift)[this.getChordShiftRaw(chord)];
			if (accidental.length === 0 && flags & this.MASK_STRICT_ACCIDENTAL) {
				result += " ";
			} else {
				result += accidental;
			};
			result += this.getChordType(this.getChordId(chord));
		};
		return result;
	};
};

// QY display plan (best effort guesses)

const qyPlanMap = new Map();
for (let qyPlan of qyPlanRawData) {
	if (!qyPlanMap.has(qyPlan[0])) {
		qyPlanMap.set(qyPlan[0], {
			"m": qyPlan[1],
			"s": qyPlan[2]
		});
	} else {
		console.debug(`Duplicate plan for chord native ID ${qyPlan[0]} found.`);
	};
};
let getQyPlan = function (chordId) {
	if (qyPlanMap.has(chordId)) {
		return qyPlanMap.get(chordId);
	};
};

export {
	ChordDict,
	getQyPlan
};
