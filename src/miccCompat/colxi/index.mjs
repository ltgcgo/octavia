// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const ColxiMIDIEvent = class ColxiMIDIEvent extends MICCBaseElement {
	deltaTime = 0;
	type = 255;
	channel;
	metaType;
	data;
	constructor(type, deltaTime) {
		super("colxi.midiEvent");
		if (typeof type === "number") {
			this.type = type;
		};
		if (typeof deltaTime === "number") {
			this.deltaTime = deltaTime;
		};
	};
};
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

/** Basis for both Colxi variants. */
const ColxiMIDIParserBase = class ColxiMIDIParser {
	static customInterpreter = true;
	/** @type {Iterable<TextDecoder>?} */
	static decoders;
	static extended = true;
};
/** Streamed Colxi variant. */
const ColxiMIDIParser = class ColxiMIDIParser extends ColxiMIDIParserBase {
	static async parse() {};
};
/** Buffered Colxi variant. */
const ColxiMIDIParserBuffered = class ColxiMIDIParser extends ColxiMIDIParserBase {
	static async parse() {};
};

export {
	ColxiMIDIEvent,
	ColxiMIDIFile,
	ColxiMIDITrack,
	ColxiMIDIView,
	ColxiMIDIParser,
	ColxiMIDIParserBuffered
};
