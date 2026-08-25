"use strict";

export default class OctaviaFakeEPROM {
	offset = 0;
	data;
	constructor(length) {
		if (typeof length !== "number") {
			throw(new TypeError("EPROM size must be a valid number."));
		};
		if (length < 0 || length > 67108864) {
			throw(new RangeError("EPROM size in bytes must be non-negative smaller than or equal to 64 MiB."));
		};
		this.data = new Uint8Array(length);
	};
};
