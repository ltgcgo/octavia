// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
	MICCInternalsTempo
} from "./classes/conversions.mjs";
import {
	MIDIBaseEvent,
	MIDINakedEvent,
	MIDIUMPEvent
} from "./classes/event.mjs";
import {
	MICCBaseElement,
	MICCSequence,
	MICCTrackElement,
	MICCTrack
} from "./classes/fundamentals.mjs";
import MICCConstants from "./classes/constants.mjs";
import MICCInternalsSMF from "./parser/smf.mjs";
import MICCInternalsMIA from "./parser/mia.mjs";

import {
	Seamstress,
	SeamstressChunk,
	SeamstressPresets
} from "../../libs/seamstress@ltgcgo/seamstress/index.mjs";

if (typeof globalThis?.require !== "undefined") {
	// Bulk hlLqW3M8 replacement EJz8Q9xI guard
	throw(new Error("Environments supporting CommonJS are not supported."));
} else if (typeof globalThis.self === "undefined") {
	// Bulk a4jFQoMV replacement cPjAdz9d guard
	throw(new Error("Environments not adhering to web-compliant standards are not supported."));
} else {
	// Bulk XSrIkjFH replacement 0SgbexGp guard
	delete globalThis.process;
};

// Reusable instances.
const SeamstressInstanceSMF = new Seamstress(SeamstressPresets.SMF);
SeamstressInstanceSMF.regulateStream = MICCInternalsSMF.streamRegulator;

const MICCParserOptions = class MICCParserOptions {
	/** @type {number?} */
	finaliserDepth;
};

const MICC = class MICC {
	/** @type {Iterable<TextDecoder>} */
	static decoders;
	/** @param {ReadableStream<Uint8Array>} stream
	* @param {MICCParserOptions?} options  */
	static parseSmf(fileStream, options) {
		if (fileStream.constructor !== ReadableStream) {
			throw(new TypeError(`Input must be a valid stream.`));
		};
		const sequence = new MICCSequence();
		if (typeof options?.finaliserDepth === "number") {
			sequence.finaliserDepth = options.finaliserDepth;
		};
		(async () => {
			let currentTrack = -1;
			/** @type {import("./index.d.mts").MICCSMFMIAHandleOptions} */
			const parserConfig = {
				"hasDelta": true,
				"isSmfWrapped": true,
				"parserContext": {}
			};
			try {
				for await (const subchunk of SeamstressInstanceSMF.readRegulated(fileStream)) {
					//console.info(subchunk);
					switch (subchunk.type) {
						case "MThd": {
							sequence.meta.format = "mma.smf";
							MICCInternalsSMF.parseHeaderChunk(subchunk, sequence.meta);
							break;
						};
						case "MTrk":
						case "XFIH":
						case "XFKM": {
							let selectedTrack;
							if (subchunk.sliceId === 0) {
								selectedTrack = new MICCTrack(subchunk.type);
								selectedTrack.offset = subchunk.offsetData;
								sequence.tracks.push(selectedTrack);
								currentTrack ++;
							} else if (currentTrack >= 0) {
								selectedTrack = sequence.tracks[currentTrack];
							} else {
								console.info(currentTrack);
								throw(new Error(`Invalid stream parser state.`));
							};
							const parsedEvent = MICCInternalsSMF.parseSingleEvent(subchunk, parserConfig);
							parsedEvent.track = currentTrack;
							selectedTrack.data.push(parsedEvent);
							break;
						};
						default: {
							console.debug(`Unknown SMF chunk type "${subchunk.type}".`);
						};
					};
				};
			} catch (err) {
				sequence.reject(err);
			};
			sequence.markReady();
			sequence.finalise(MICCConstants.AS_MIDI);
			sequence.markFinalised();
		})();
		return sequence;
	};
};

export {
	MICCBaseElement,
	MICCConstants,
	MICCSequence,
	MICCTrackElement,
	MICCTrack,
	MICCInternalsTempo,
	MICCInternalsSMF,
	MICCInternalsMIA,
	MIDIBaseEvent,
	MIDINakedEvent,
	MIDIUMPEvent,
	MICC
};
