// Middleware!
"use strict";

// Use track 240 to 255 for middleware.

let jsonConvert = function (data, track = 0) {
	let type = data[0] >> 4, part = data[0] & 15;
	let replyObj = {
		track: (track & 15) + 240,
		type,
		data: data.slice(1)
	};
	if (type < 15) {
		replyObj.part = part;
		return replyObj;
	} else {
		if (part == 0) {
			// SysEx
			return replyObj;
		} else {
			console.warn(`Unknown special event channel ${part}.`)
		};
	};
};

let getBridge = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainBus");
};

export {
	jsonConvert,
	getBridge
};
