"use strict";

let toDecibel = function (data = 64) {
	return Math.round(2000 * Math.log10(data / 64)) / 100;
};

// Why KORG adds a byte every seven bytes is a mistery to me.
let korgFilter = function (korgArr, iterator) {
	let realData = 0;
	for (let pointer = 0; pointer < korgArr.length; pointer ++) {
		if (pointer % 8 != 0) {
			iterator(korgArr[pointer], realData, korgArr);
			realData ++;
		};
	};
};

let x5dSendLevel = function (sendParam) {
	return Math.floor(sendParam * 14.2);
};

export {
	toDecibel,
	korgFilter,
	x5dSendLevel
};
