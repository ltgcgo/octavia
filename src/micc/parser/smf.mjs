"use strict";

/** Standard MIDI Files (MIDI 1.0) or raw MIDI 1.0 messages. */
export default class MICCInternalsSMF {
	static parseSingleEvent(buffer, options = {}) {
		let nakedEvent = {};
		return nakedEvent;
	};
	static parseSingleContextEvent(chunkInfo) {
		let parsedEvent = this.parseSingleEvent(chunkInfo.data);
		return parsedEvent;
	};
};
