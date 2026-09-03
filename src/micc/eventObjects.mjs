// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

const MICCBaseElement = class MICCBaseElement {
	group = "micc.unknown";
	constructor(group) {
		if (group?.length > 0) {
			this.group = group;
		};
	};
};

// Octavia natives

const MIDINakedEvent = class MIDINakedEvent extends MICCBaseElement {
	delta = 0;
	type = 0;
	ch = null;
	meta = null;
	/** @type {Uint8Array} */
	data;
	isStale = false;
	/** @type {number?} */
	offset = null;
	/** @type {number|string?} */
	parsed = null;
	/** @type {number?} */
	time = null;
	port = null;
	track = null;
	label;
	constructor(type, delta) {
		super("mma.midiEvent");
		if (typeof type === "number") {
			this.type = type;
		};
		if (typeof delta === "number") {
			this.delta = delta;
		};
	};
};
const WrappedMIDIEvent = class WrappedMIDIEvent {
	event;
	type;
	chunk;
};

// Colxi compatibles

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

export {
	MICCBaseElement,
	MIDINakedEvent,
	ColxiMIDIEvent,
	ColxiMIDITrack,
	ColxiMIDIFile
};
