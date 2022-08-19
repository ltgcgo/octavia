"use strict";

let textedPitchBend = function (number) {
	let normalized = number;
	let result = "--";
	if (normalized > 0) {
		let truncated = normalized >> 11;
		result = ["=-", ">-", ">=", ">>"][truncated];
	} else if (normalized < 0) {
		let inverted = Math.abs(normalized) >> 11;
		result = ["-=", "-<", "=<", "<<", "<<"][inverted];
	};
	return result;
};
let textedPanning = function (number) {
	let result = Array.from("----");
	if (number > 64) {
		for (let c = 0; number > 64; c ++) {
			result[c] = (number < 72) ? "=" : ">";
			number -= 16;
		};
	} else if (number < 64) {
		for (let c = 3; number < 64; c --) {
			result[c] = (number >= 56) ? "=" : "<";
			number += 16;
		};
	};
	return result.join("");
};

export {
	textedPanning,
	textedPitchBend
};
