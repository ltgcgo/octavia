// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	BinaryString
} from "../../../libs/rochelle@ltgcgo/binaryString.mjs";
import {
	MICCTrackElement
} from "./fundamentals.mjs";

// Octavia natives

const MIDIBaseEvent = class MIDIBaseEvent extends MICCTrackElement {
	delta = 0;
	type = 0;
	/** @type {number?} */
	ch = null;
	/** @type {Uint8Array} */
	data;
	/** @type {number|BinaryString?} */
	parsed = null;
	/** @type {number?} */
	tick = null;
	port = null;
	label;
	constructor(group) {
		super(group ?? "ltgc.micc.baseEvent");
	};
};
const MIDINakedEvent = class MIDINakedEvent extends MIDIBaseEvent {
	/** @type {number?} */
	meta = null;
	isStale = false;
	/** @type {number?} */
	track = null;
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
const MIDIUMPEvent = class MIDINakedEvent extends MIDIBaseEvent {
	constructor(type, delta) {
		super("mma.midiUmp");
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

export {
	MIDIBaseEvent,
	MIDINakedEvent,
	MIDIUMPEvent
};
