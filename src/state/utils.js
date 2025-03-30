"use strict";

let toDecibel = function (data = 64) {
	return Math.round(2000 * Math.log10(data / 64)) / 100;
};

let customInterpreter = function (type, file, rawMtLen) {
	let u8Data = [];
	let metaLength = rawMtLen == false ? file.readIntVLV() : rawMtLen;
	if (type == 0 || type == 127) {
		//metaLength = 1;
	};
	for (let c = 0; c < metaLength; c ++) {
		let byte = file.readInt(1);
		u8Data.push(byte);
		if (byte == 247) {
			// End of SysEx
		} else if (byte == 240) {
			// Start of a new SysEx
		} else if (byte > 127) {
			// Start of a new event
			console.debug(`Early termination: ${u8Data}`);
			u8Data.pop();
			file.backOne();
			file.backOne();
			return new Uint8Array(u8Data);
		};
	};
	//console.debug(`Constructed data: `, u8Data);
	return new Uint8Array(u8Data);
};

let gsChecksum = function (sequence) {
	// Only pass along the three-byte address and their data.
	let checksum = 0;
	sequence.forEach((e) => {
		checksum += e;
		checksum = checksum & 127; // Prevent going out of range
	});
	return (~checksum + 1) & 127;
};

// Why KORG adds a byte every seven bytes is a mistery to me.
let korgFilter = function (korgArr, iterator) {
	let realData = 0, dataMask = 0;
	for (let pointer = 0; pointer < korgArr.length; pointer ++) {
		let shifts = (pointer & 7) - 1,
		unmasked = (((dataMask >> shifts) & 1) << 7),
		e = korgArr[pointer];
		e += unmasked;
		if ((pointer & 7) !== 0) {
			iterator(e, realData, korgArr);
			//console.debug(`Unmasked: ${dataMask} >> ${shifts} = ${e}`);
			realData ++;
		} else {
			dataMask = korgArr[pointer];
			//console.debug(`Overlay mask: ${dataMask}`);
		};
	};
};
let korgUnpack = function (korgArr) {
	let newLength = (korgArr.length * 7) >> 3;
	let unpacked = new Uint8Array(newLength);
	korgFilter(korgArr, (e, i) => {
		unpacked[i] = e;
	});
	return unpacked;
};
let korgPack = function (rawArr) {
	let newLength = Math.ceil((rawArr.length << 3) / 7);
	let packed = new Uint8Array(newLength);
	rawArr.forEach((e, i) => {
		let ptrOverlay = Math.floor(i / 7) << 3;
		let ptrData = Math.floor((i << 3) / 7) + 1;
		let ptrShift = i % 7;
		packed[ptrOverlay] |= (e >> 7) << ptrShift;
		packed[ptrData] |= e & 127;
	});
	return packed;
};

let halfByteFilter = function (halfByteArr, iterator) {};

let x5dSendLevel = function (sendParam) {
	let res = Math.floor(sendParam * 14.2);
	if (res < 128) {
		return res;
	} else {
		return 0;
	};
};

let getDebugState = function () {
	if (self.Bun) {
		return true; // If run on Bun.js, output all possible logs
	};
	return self.debugMode ?? false;
};

const noteRoot = "CDEFGAB";
const noteAcciTet12 = "♭𝄫,𝄫,♭,,♯,𝄪,𝄪♯".split(",");
let getChordName = (root, acciTet48, type) => {};

export {
	toDecibel,
	gsChecksum,
	korgFilter,
	korgUnpack,
	korgPack,
	x5dSendLevel,
	customInterpreter,
	getDebugState
};
