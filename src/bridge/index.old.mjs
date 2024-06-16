// Middleware!
"use strict";

import {allocated} from "../state/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";
import {rawToPool} from "../basic/transform.js";
import {customInterpreter} from "../state/utils.js";

MidiParser.customInterpreter = customInterpreter;

// Use track 240 to 255 for middleware.
let toJson = function (data, track = 0) {
	let type = data[0] >> 4, part = data[0] & 15;
	let replyObj = {
		track: (track & 15) + 240,
		type,
		data: data.slice(1)
	};
	if (type < 15) {
		replyObj.part = part;
		return replyObj;
	} if (type == 12) {
		replyObj.data = data[1];
	} else {
		if (part == 0) {
			// SysEx
			return replyObj;
		} else {
			console.warn(`Unknown special event channel ${part}.`)
		};
	};
};
let fromJson = function (json) {
	let type = json.type, part = json.part;
	if (type == 255) {
		// Directly reject sending meta events
		return;
	};
	let binLength = 3;
	if (type == 12) {
		binLength = 2;
	} else if (type == 15) {
		binLength = json.data.length + 1;
	};
	let newInstr = new Uint8Array(binLength);
	if (type != 15) {
		newInstr[0] = json.type * 16 + json.part;
	} else {
		newInstr[0] = 240;
	};
	if (type == 12) {
		newInstr[1] = json.data;
	} else {
		if (json.data.forEach) {
			json.data.forEach((e, i) => {
				newInstr[i + 1] = e;
			});
		} else {
			console.debug(`Type ${type} value ${json.data.constructor.name} cannot be iterated.`);
		};
	};
	return newInstr;
};

let getBridge = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainInput");
};
let getBridgeOut = function () {
	return new BroadcastChannel("cc.ltgc.octavia:MainOutput");
};

export {
	toJson,
	fromJson,
	getBridge,
	getBridgeOut
};
