// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

const MICCSequenceMetadata = class MICCSequenceMetadata {
	clip = 0;
	isSmpte = false;
	/** @type {number?} */
	tpqn;
	/** @type {[number, number]?} */
	smpte;
	style = 0;
	track = 0;
	type = 1;
	/** @type {string} */
	format;
	/** @type {string?} */
	title;
};

const MICCTrackerMetadata = class MICCTrackerMetadata {
	isTracker = false;
};

export {
	MICCSequenceMetadata,
	MICCTrackerMetadata
};