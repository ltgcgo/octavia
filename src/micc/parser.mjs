"use strict";

import {
	NakedMIDIEvent,
	WrappedMIDIEvent,
	ColxiMIDIEvent
} from "./eventObjects.mjs";

const smfEventParser = function (buffer, context) {
	let nakedEvent = {};
	return nakedEvent;
};
const smfEventContextParser = function (chunkInfo) {
	let parsedEvent = smfEventParser(chunkInfo.data);
	return parsedEvent;
};

// Colxi compatibility


const ColxiMIDITrack = class ColxiMIDITrack {
	event;
	type;
};
const ColxiMIDIFile = class ColxiMIDIFile {
	formatType = 0;
	timeDivision = 480;
	tracks;
	track = [];
};
const ColxiMIDIView = class ColxiMIDIView {};
const ColxiMIDIParser = class ColxiMIDIParser {};

export {
	smfEventParser,
	smfEventContextParser,
	ColxiMIDIEvent,
	ColxiMIDITrack,
	ColxiMIDIFile,
	ColxiMIDIView,
	ColxiMIDIParser
};
