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
		let shifts = pointer % 8 - 1,
		unmasked = (((dataMask >> shifts) & 1) << 7),
		e = korgArr[pointer];
		e += unmasked;
		if (pointer % 8 != 0) {
			iterator(e, realData, korgArr);
			//console.debug(`Unmasked: ${dataMask} >> ${shifts} = ${e}`);
			realData ++;
		} else {
			dataMask = korgArr[pointer];
			//console.debug(`Overlay mask: ${dataMask}`);
		};
	};
};

let x5dSendLevel = function (sendParam) {
	let res = Math.floor(sendParam * 14.2);
	if (res < 128) {
		return res;
	} else {
		return 0;
	};
};

export {
	toDecibel,
	gsChecksum,
	korgFilter,
	x5dSendLevel,
	customInterpreter
};
