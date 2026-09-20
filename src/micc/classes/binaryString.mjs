// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

const BinaryString = class BinaryString {
	/** @type {Iterable<TextDecoder>|null} */
	decoders;
	/** @type {Uint8Array|Uint8ClampedArray|null} */
	buffer;
	/** @type {string} */
	text;
	/** @type {string} */
	label;
	/** @param {Uint8Array|Uint8ClampedArray|null} buffer
	* @returns {string} */
	decode(buffer) {
		switch (buffer.constructor) {};
	};
	/** @param {string} text
	* @param {string} label
	* @returns {Uint8Array} */
	encode(text, label) {};
};

export {
	BinaryString
};