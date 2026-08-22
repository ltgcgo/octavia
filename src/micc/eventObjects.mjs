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

const NakedMIDIEvent = class NakedMIDIEvent extends MICCBaseElement {
	delta = 0;
	type = 0;
	ch = 256;
	meta;
	data;
	isStale = false;
	offset;
	parsed;
	time;
	port = 255;
	track = 65535;
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

export {
	MICCBaseElement,
	NakedMIDIEvent,
	ColxiMIDIEvent
};
