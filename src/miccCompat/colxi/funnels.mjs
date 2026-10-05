// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	Seamstress,
	SeamstressPresets
} from "../../../libs/seamstress@ltgcgo/index.mjs";
import { MICCInternalsSMF } from "../../micc/index.mjs";
import {
	IntakeNormaliser,
	MICCSequenceMetadata,
	MICC
} from "../../micc/index.mjs";

import {
	ColxiMIDITrack,
	ColxiMIDIFile,
	UnifiedShimColxi
} from "./classes.mjs";
import ColxiMethods from "./methods.mjs";

const SeamstressInstanceSMF = new Seamstress(SeamstressPresets.SMF);

/** Streamed Colxi variant. */
const ColxiMIDIParserStreamed = class ColxiMIDIParserStreamed extends UnifiedShimColxi {
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
		let iteratedTracks = 0;
		for (const miccTrack of sequence.tracks) {
			switch (miccTrack.vendor) {
				case "yamaha.XFIH":
				case "yamaha.XFKM": {
					if (!upThis.extended) {
						upThis.debug ?? console.debug(`Skipped extension track "${miccTrack.type}" (${miccTrack.vendor}).`);
						continue;
					};
					// Fallthrough!
				};
				case "mma.MTrk": {
					if (iteratedTracks >= file.tracks && !upThis.extended) continue;
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
					continue;
				};
				iteratedTracks ++;
			};
		};
		if (typeof callback === "function") {
			callback.call(upThis, file);
		};
		return file;
	};
};
/** Buffered Colxi variant. */
const ColxiMIDIParser = class ColxiMIDIParser extends UnifiedShimColxi {
	/** @param {import("../../micc/index.d.mts").UnifiedBinaryIntake} input
	* @param {(file: import("../index.d.mts").ColxiMIDIFile) => void} callback */
	static async parse(input, callback) {
		const upThis = this;
		/** @type {MICCSequenceMetadata} */
		const metaSink = {};
		const file = new ColxiMIDIFile();
		let iteratedTracks = 0;
		for await (const chunk of SeamstressInstanceSMF.readChunks(IntakeNormaliser.toByteStream(input))) {
			switch (chunk.type) {
				// Header
				case "MThd": {
					MICCInternalsSMF.parseHeaderChunk(chunk, metaSink);
					file.formatType = metaSink.type;
					file.tracks = metaSink.track ?? 0;
					if (metaSink.isSmpte) {
						file.timeDivision = metaSink.smpte;
					} else {
						file.timeDivision = metaSink.tpqn;
					};
					continue;
				};
				// Track-like chunks
				case "XFIH":
				case "XFKM": {
					if (!upThis.extended) {
						upThis.debug ?? console.debug(`Skipped extension track "${chunk.type}".`);
						continue;
					};
					// Fallthrough!
				};
				case "MTrk": {
					if (iteratedTracks >= file.tracks && !upThis.extended) continue;
					const colxiTrack = new ColxiMIDITrack(chunk.type);
					for (const miccEvent of ColxiMethods.parseEventBulk(chunk.data)) {
						const colxiEvent = ColxiMethods.fromNakedEvent(upThis, miccEvent);
						if (colxiEvent.type !== 0) {
							colxiTrack.event.push(colxiEvent);
						};
					};
					file.track.push(colxiTrack);
					break;
				};
				default: {
					upThis.debug ?? console.debug(`Skipped unknown track "${miccTrack.type}" (${miccTrack.vendor}).`);
					continue;
				};
			};
			iteratedTracks ++;
		};
		if (typeof callback === "function") {
			callback.call(upThis, file);
		};
		return file;
	};
};

export {
	ColxiMIDIParser,
	ColxiMIDIParserStreamed
};
