// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	IntakeNormaliser,
	MICCSequenceMetadata,
	MICC
} from "../../micc/index.mjs";

import {
	ColxiMIDITrack,
	ColxiMIDIFile,
	ColxiMIDIParserBase
} from "./classes.mjs";
import ColxiMethods from "./methods.mjs";


/** Streamed Colxi variant. */
const ColxiMIDIParser = class ColxiMIDIParser extends ColxiMIDIParserBase {
	/** @param {import("../../micc/index.d.mts").UnifiedBinaryIntake} input 
	* @param {(file: import("../index.d.mts").ColxiMIDIFile) => void} callback */
	static async parse(input, callback) {
		const upThis = this;
		const sequence = MICC.parseSmf(IntakeNormaliser.toByteStream(input), {
			"decoders": upThis.decoders,
			"finaliserDepth": 0
		});
		await sequence.ready;
		const file = new ColxiMIDIFile();
		file.formatType = sequence.meta.type;
		file.tracks = sequence.meta.track ?? 0;
		if (sequence.meta.isSmpte) {
			file.timeDivision = sequence.meta.smpte;
		} else {
			file.timeDivision = sequence.meta.tpqn;
		};
		for (const miccTrack of sequence.tracks) {
			switch (miccTrack.vendor) {
				case "yamaha.XFIH":
				case "yamaha.XFKM": {
					if (!upThis.extended) {
						upThis.debug ?? console.debug(`Skipped extension track "${miccTrack.type}" (${miccTrack.vendor}).`);
						break;
					};
					// Fallthrough!
				};
				case "mma.MTrk": {
					const colxiTrack = new ColxiMIDITrack(miccTrack.type);
					for (const e of miccTrack.data) {
						const colxiEvent = ColxiMethods.fromNakedEvent(upThis, e);
						if (colxiEvent.type !== 0) {
							colxiTrack.event.push(colxiEvent);
						};
					};
					file.track.push(colxiTrack);
					break;
				};
				default: {
					upThis.debug ?? console.debug(`Skipped unknown track "${miccTrack.type}" (${miccTrack.vendor}).`);
				};
			};
		};
		if (typeof callback === "function") {
			callback.call(upThis, file);
		};
		return file;
	};
};
/** Buffered Colxi variant. */
const ColxiMIDIParserBuffered = class ColxiMIDIParser extends ColxiMIDIParserBase {
	/** @param {import("../../micc/index.d.mts").UnifiedBinaryIntake} input 
	* @param {(file: import("../index.d.mts").ColxiMIDIFile) => void} callback */
	static async parse(input, callback) {
		const upThis = this;
		/** @type {MICCSequenceMetadata} */
		const metaSink = {};
		const file = new ColxiMIDIFile();
		if (typeof callback === "function") {
			callback.call(upThis, file);
		};
		return file;
	};
};

export {
	ColxiMIDIParser,
	ColxiMIDIParserBuffered
};
