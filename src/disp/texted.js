"use strict";

let arrowGen = function (charArr, value, border, unit) {
	let boundLow = border - (unit >> 1), boundHi = border + (unit >> 1);
	if (value > border) {
		for (let c = 0; value > border; c ++) {
			charArr[c] = (value < boundHi) ? "=" : ">";
			value -= unit;
		};
	} else if (value < border) {
		for (let c = charArr.length - 1; value < border; c --) {
			charArr[c] = (value >= boundLow) ? "=" : "<";
			value += unit;
		};
	};
};

let textedPitchBend = function (number) {
	let result = Array.from("----");
	arrowGen(result, number, 0, 2048);
	return result.join("");
};

let textedPanning = function (number) {
	if (number == 128) {
		return "<<>>";
	};
	let result = Array.from("----");
	arrowGen(result, number, 64, 16);
	return result.join("");
};

export {
	textedPanning,
	textedPitchBend
};
