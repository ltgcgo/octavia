"use strict";

let toDecibel = function (data = 64) {
	return Math.round(2000 * Math.log10(data / 64)) / 100;
};

export {
	toDecibel
};
