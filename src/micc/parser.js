"use strict";

let NakedMIDIEvent = class NakedMIDIEvent {
	delta = 0; // delta time
	type = 255; // event type
	part = 0; // MIDI channel
	meta; // optional meta event type
	data; // actual Uint8Array raw data
	isStale = false; // true if the original event omitted the running status
	offset; // optional for debugging, added if the original binary stream is available, e.g. parsed from a file
	text; // decoded string of meta events, not available until a decoder/finalizer is run
	time; // parsed time in seconds, not available until a finalizer is run
	hasPort = false;
	port = 0; // designated virtual port, only use this after ensuring it as parsed
};
let MIDIEventWithContext = class MIDIEventWithContext {
	event; // the NakedMIDIEvent object
	type; // subchunk.type
	chunk; // subchunk.chunkId
};
let ColxiMIDIEvent = class ColxiMIDIEvent {
	deltaTime = 0;
	type = 255;
	metaType;
	data;
};
let ColxiMIDIFile = class ColxiMIDIFile {
	formatType = 0;
	timeDivision = 480;
	tracks;
	track = [];
};

let smfEventParser = function (buffer) {
	let nakedEvent = {};
	return nakedEvent;
};
let smfEventContextParser = function (chunkInfo) {
	let parsedEvent = smfEventParser(chunkInfo.data);
	return parsedEvent;
};

export {
	NakedMIDIEvent,
	smfEventParser,
	smfEventContextParser,
	ColxiMIDIEvent,
	ColxiMIDIFile
};
