"use strict";

let textedPitchBend = function (number) {
	let result = Array.from("----");
	if (number > 0) {
		for (let c = 0; number > 0; c ++) {
			result[c] = (number < 1024) ? "=" : ">";
			number -= 2048;
		};
	} else if (number < 0) {
		for (let c = 3; number < 0; c --) {
			result[c] = (number >= -1024) ? "=" : "<";
			number += 2048;
		};
	};
	return result.join("");
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
