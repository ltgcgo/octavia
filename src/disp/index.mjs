"use strict";

import {CustomEventSource} from "../../libs/lightfelt@ltgcgo/ext/customEvents.js";
import {OctaviaDevice} from "../midi/index.mjs";
import MidiParser from "../../libs/midi-parser@colxi/main.min.js";

let RootDisplay = class extends CustomEventSource {
	#midiState = new OctaviaDevice();
	#midiPool;
	reset() {
		// Dispatching the event
		this.dispatchEvent("reset");
		// Clearing all MIDI instructions up
		// And set all controllers to blank
	};
	async load(blob) {
		this.#midiPool = MidiParser.parse(new Uint8Array(await blob.arrayBuffer()));
	};
};

let TuiDisplay = class extends RootDisplay {
	constructor() {
		super();
	};
};

export {
	TuiDisplay
};
