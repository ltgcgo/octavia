// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const ColxiMIDIView = class ColxiMIDIView {};
const ColxiMIDIEvent = class ColxiMIDIEvent extends MICCBaseElement {
	/** @type {number?} */
	channel;
	/** @type {number} */
	deltaTime;
	/** @type {number} */
	type = 0;
	/** @type {number?} */
	metaType;
	/** @type {number|string|Uint8Array|undefined} */
	data = undefined;
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
	/** @type {ColxiMIDIEvent[]} */
	event = [];
	/** @type {string} */
	type;
	constructor(type) {
		this.type = type;
	};
};
const ColxiMIDIFile = class ColxiMIDIFile {
	formatType = 0;
	/** @type {number|[number, number]} */
	timeDivision = 480;
	tracks = 0;
	/** @type {ColxiMIDITrack[]} */
	track = [];
};
/** Basis for both Colxi variants. */
const ColxiMIDIParserBase = class ColxiMIDIParser {
	static debug = false;
	static customInterpreter = true;
	/** @type {Iterable<TextDecoder>?} */
	static decoders = BinaryString.getDecoders("u8", "sjis");
	static extended = true;
};

export {
	ColxiMIDIView,
	ColxiMIDIEvent,
	ColxiMIDITrack,
	ColxiMIDIFile,
	ColxiMIDIParserBase
};