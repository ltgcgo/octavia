"use strict";

import {gsChecksum} from "./utils.js";

const sysexHead = [
	new Uint8Array([240, 67, 16, 76, 7]), // XG
	new Uint8Array([240, 65, 16, 69, 18, 16]), // GS
	new Uint8Array([240, 66, 48, 66, 18, 8, 0, 32]) // NS5R
];

let toBitmapDisplay = function (frameData, type = 0, frameId = 0) {
	if (!frameData?.length) {
		throw Error(`Blank frame data`);
	};
	// 0 for XG, 1 for GS, 2 for NS5R
	let targetBuffer, copyData = frameData.length <= 256;
	switch (type) {
		case 0: {
			targetBuffer = new Uint8Array(56);
			targetBuffer.set(sysexHead[type], 0);
			targetBuffer[55] = 247;
			// Data section starts at index 7
			break;
		};
		case 1: {
			targetBuffer = new Uint8Array(74);
			targetBuffer.set(sysexHead[type], 0);
			targetBuffer[73] = 247;
			targetBuffer[6] = frameId + 1;
			// Data section starts at index 8
			break;
		};
		case 2: {
			targetBuffer = new Uint8Array(89);
			targetBuffer.set(sysexHead[type], 0);
			targetBuffer[88] = 247;
			// Data section starts at index 8
			break;
		};
		default: {
			throw(new Error(`Unknown device target ${type}`));
		};
	};
	return targetBuffer;
};

export {
	toBitmapDisplay
};
