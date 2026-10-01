// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import MICCConstants from "./constants.mjs";
import {
	MICCSequenceMetadata,
	MICCTrackerMetadata
} from "./metadata.mjs";

import trackVendorData from "../../data/generated/trackVendors.json" with {type: "json"};
import MICCInternalsFinalisers from "./finalisers.mjs";

const MICCBaseElement = class MICCBaseElement {
	group = "ltgc.micc.unknown";
	constructor(group) {
		if (group?.length > 0) {
			this.group = group;
		};
	};
};
const MICCTrackElement = class MICCTrackElement extends MICCBaseElement {
	/** @type {number?} */
	offset = null;
	constructor(group) {
		super(group ?? "ltgc.micc.trackChild");
	};
};
const MICCTrack = class MICCTrack extends MICCTrackElement {
	/** @type {(MICCTrackElement|import("./event.mjs").MIDIBaseEvent|import("./event.mjs").MIDINakedEvent|import("./event.mjs").MIDIUMPEvent)[]} */
	data = [];
	/** @type {string} */
	type;
	/** @type {string} */
	vendor;
	constructor(type) {
		super("mma.smfTrack");
		const vendor = trackVendorData[type];
		if (vendor) {
			this.type = type;
			this.vendor = `${vendor}.${type}`;
		} else {
			throw(new TypeError(`Unknown type "${type}".`));
		};
	};
};

const MICCSequence = class MICCSequence {
	finaliserDepth = 1;
	meta = new MICCSequenceMetadata();
	tracker = new MICCTrackerMetadata();
	/** @type {Iterable<TextDecoder>} */
	decoders;
	/** @type {object} */
	offset;
	/** @type {Map<string, MICCBaseElement[]>} */
	pool = new Map();
	/** @type {(MICCTrack)[]} */
	tracks = [];
	#ready = false;
	/** @type {Promise<void>} */
	ready;
	#finalised = false;
	/** @type {Promise<void>} */
	finalised;
	/** @type {() => void} */
	markReady;
	/** @type {() => void} */
	markFinalised;
	/** @type {(err: any) => void} */
	reject;
	disassemble() {};
	/** @param {number} asType  */
	finalise(asType) {
		const upThis = this;
		if (upThis.finaliserDepth < 1) {
			console.debug(`Finalisation has been disabled.`);
			return;
		};
		try {
			switch (asType) {
				case MICCConstants.AS_MIDI: {
					for (const track of upThis.tracks) {
						switch (track.vendor) {
							case "mma.MTrk":
							case "yamaha.XFIH":
							case "yamaha.XFKM": {
								for (const event of track.data) {
									MICCInternalsFinalisers.smfMetaFilter(upThis, event, upThis.finaliserDepth > 1);
								};
								break;
							};
						};
					};
					break;
				};
				case MICCConstants.AS_TRACKER: {
					// WIP
					console.debug(`WIP`);
					break;
				};
				default: {
					throw(new TypeError(`Unknown finalisation type "${asType}".`));
				};
			};
		} catch (err) {
			upThis.reject(err);
		};
	};
	flatten() {};
	propagate() {};
	serialise() {};
	constructor() {
		const upThis = this;
		let rejectReady, rejectFinalised;
		upThis.ready = new Promise((o, x) => {
			rejectReady = x;
			upThis.markReady = function () {
				upThis.#ready = true;
				o();
			};
		});
		upThis.finalised = new Promise((o, x) => {
			rejectFinalised = x;
			upThis.markFinalised = function () {
				if (!upThis.#ready) {
					throw(new Error(`The sequence has not yet been marked ready.`));
				};
				upThis.#finalised = true;
				o();
			};
		});
		upThis.reject = function (err) {
			if (!upThis.#ready) {
				rejectReady(err);
			};
			if (!upThis.#finalised) {
				rejectFinalised(err);
			};
		};
	};
};

export {
	MICCBaseElement,
	MICCTrackElement,
	MICCTrack,
	MICCSequence
};