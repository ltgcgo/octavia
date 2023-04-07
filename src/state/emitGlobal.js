"use strict";

import {gsChecksum} from "./utils.js";

const sysexHead = {
	xg: new Uint8Array([240, 67, 16, 76, 7]), // XG
	gs: new Uint8Array([240, 65, 16, 69, 18, 16]), // GS
	ns5r: new Uint8Array([240, 66, 48, 66, 18, 8, 0, 32]) // NS5R
};

let sysexBitmap = function (frameData, type = "xg", frameId = 0, noCopy) {
	if (!frameData?.length) {
		throw Error(`Blank frame data`);
	};
	// 0 for XG, 1 for GS, 2 for NS5R
	let targetBuffer, targetFrame, startOffset = 8,
	canvasWidth = 16 << ((frameData.length - 1) >> 8),
	canvasHeight = 16,
	workWidth = 16, workBit = 7;
	switch (type) {
		case "xg": {
			if (frameData.length > 256) {
				throw(new Error(`Bitmap too large: ${frameData.length} > 256`));
			};
			targetBuffer = new Uint8Array(56);
			targetBuffer.set(sysexHead[type], 0);
			targetBuffer[55] = 247;
			targetFrame = frameData;
			startOffset = 7;
			break;
		};
		case "gs": {
			if (frameData.length > 256) {
				throw(new Error(`Bitmap too large: ${frameData.length} > 256`));
			};
			targetBuffer = new Uint8Array(74);
			targetBuffer.set(sysexHead[type], 0);
			targetBuffer[73] = 247;
			targetBuffer[6] = frameId + 1;
			targetFrame = frameData;
			workBit = 5;
			break;
		};
		case "ns5r": {
			if (frameData.length > 512) {
				throw(new Error(`Bitmap too large: ${frameData.length} > 512`));
			};
			targetBuffer = new Uint8Array(89);
			targetBuffer.set(sysexHead[type], 0);
			targetBuffer[88] = 247;
			// Duplicate the pixel data if the length is smaller than or equal to 256
			if (frameData.length <= 256 && !noCopy) {
				targetFrame = new Uint8Array(frameData.length * 2);
				frameData.forEach((e, i) => {
					targetFrame[i << 1] = e;
					targetFrame[1 + (i << 1)] = e;
				});
			} else {
				targetFrame = frameData;
			};
			workWidth = 32;
			break;
		};
		default: {
			throw(new Error(`Unknown device target ${type}`));
		};
	};
	// Packing bits into bytes
	targetFrame.forEach((e, i) => {
		let canvasX = i % workWidth, canvasY = Math.floor(i / workWidth);
		let pointer = Math.floor(canvasX / workBit) * canvasHeight + canvasY, shifter = workBit - canvasX % workBit - 1;
		targetBuffer[startOffset + pointer] ^= (e ? 1 : 0) << shifter;
	});
	if (type == "gs") {
		targetBuffer[72] = gsChecksum(targetBuffer.subarray(5, 72));
	};
	return targetBuffer;
};

export {
	sysexBitmap
};
