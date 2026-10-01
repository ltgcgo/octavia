// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	MICCSequenceMetadata,
	MICCTrackerMetadata
} from "./metadata.mjs";

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

const MICCSequence = class MICCSequence {
	enableFinalisation = true;
	meta = new MICCSequenceMetadata();
	tracker = new MICCTrackerMetadata();
	/** @type {object} */
	offset;
	/** @type {Map<string, MICCBaseElement>} */
	pool = new Map();
	/** @type {MICCTrackElement[]} */
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
	finalise() {};
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
	MICCSequence
};