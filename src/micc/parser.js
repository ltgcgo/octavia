"use strict";

// Octavia native

let NakedMIDIEvent = class NakedMIDIEvent {
	delta = 0;
	type = 255;
	part = 0;
	meta;
	data;
	isStale = false;
	offset;
	parsed;
	time;
	hasPort = false;
	port = 0;
};
let MIDIEventWithContext = class MIDIEventWithContext {
	event;
	type;
	chunk;
};

let smfEventParser = function (buffer, context) {
	let nakedEvent = {};
	return nakedEvent;
};
let smfEventContextParser = function (chunkInfo) {
	let parsedEvent = smfEventParser(chunkInfo.data);
	return parsedEvent;
};

// Colxi compatibility

let ColxiMIDIEvent = class ColxiMIDIEvent {
	deltaTime = 0;
	type = 255;
	metaType;
	data;
};
let ColxiMIDITrack;
let ColxiMIDIFile = class ColxiMIDIFile {
	formatType = 0;
	timeDivision = 480;
	tracks;
	track = [];
};
let ColxiMIDIView;
let ColxiMIDIParser;

export {
	NakedMIDIEvent,
	MIDIEventWithContext,
	smfEventParser,
	smfEventContextParser,
	ColxiMIDIEvent,
	ColxiMIDITrack,
	ColxiMIDIFile,
	ColxiMIDIView,
	ColxiMIDIParser
};
