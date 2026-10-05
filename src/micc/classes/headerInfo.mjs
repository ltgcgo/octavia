// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	IntegerHandler
} from "../../../libs/seamstress@ltgcgo/index.mjs";

import {
	MICCBaseElement
} from "./fundamentals.mjs";

const MICCHeaderInfo = class extends MICCBaseElement {
	/** @param {string?} ext  */
	constructor(ext) {
		if (typeof ext === "string") {
			super(`ltgc.micc.header:${ext}`);
		} else {
			super(`ltgc.micc.header`);
		};
	};
};
const MICCHeaderSMF = class extends MICCHeaderInfo {
	type = 0;
	isSmpte = false;
	tpqn = 480;
	/** @type {[number, number]} */
	smpte;
	track = 0;
	/** @param {Uint8Array} buffer  */
	constructor(buffer) {
		super("smf");
		const metadata = this;
		const smfFormat = IntegerHandler.readUint16(buffer, false, 0);
		const smfTracks = IntegerHandler.readUint16(buffer, false, 2);
		const smfDivision = IntegerHandler.readInt16(buffer, false, 4);
		switch (smfFormat) {
			case 0: {
				if (smfTracks > 1) {
					console.info(`Type 0 expected ${smfTracks} tracks instead of 1. This is non-standard and may break other parsers.`);
				};
				// Fallthrough.
			};
			case 1:
			case 2: {
				metadata.type = smfFormat;
				break;
			};
			default: {
				throw(new RangeError(`Unknown SMF type ${smfFormat}.`));
			};
		};
		metadata.track = smfTracks;
		if (smfDivision < 0) {
			metadata.isSmpte = true;
			metadata.smpte = [256 - buffer[4], buffer[5]];
			let frameConvBase = metadata.smpte[0];
			switch (frameConvBase) {
				case 29:
				case 59:
				case 89:
				case 119: {
					// Divide by 29.
					frameConvBase += Math.round(frameConvBase * 0.0344827586);
					break;
				};
			};
			metadata.tpqn = (metadata.smpte[1] * frameConvBase) >> 1;
			console.debug(`SMPTE-based time division is not fully supported yet. Offset maps may not function.`);
		} else {
			metadata.tpqn = smfDivision;
		};
		if (buffer.length > 6) {
			console.info(`The file header contains non-standard fields and may break other parsers.`);
		};
	};
};

export {
	MICCHeaderInfo,
	MICCHeaderSMF
};