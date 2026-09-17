"use strict";

/** MIDI Instruction Assembly */
export default class MICCInternalsMIA {
	/** @param {Uint8Array | Uint8ClampedArray | SeamstressChunk} inBuffer
	* @param {import("../index.mjs").MICCSMFMIAHandleOptions} options
	* @returns {string} */
	static dasmSingleEvent(inBuffer, options = {}) {};
	/** @param {string} text
	* @param {import("../index.mjs").MICCSMFMIAHandleOptions} options
	* @returns {Uint8Array} */
	static asmSingleEvent(text, options = {}) {};
};
