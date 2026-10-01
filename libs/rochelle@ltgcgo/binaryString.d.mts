// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* Minimise the Mojibake (文字化け) risk with reusable safe multi-encoding text decoders.
* @license LGPL-3.0-only
* @module cc.ltgc.rochelle.binaryString
*/

/** The helper string decoder object allowing convenient re-interpretation. */
export default class BinaryString {
	/** Return an array of decoders from specified labels. */
	static getDecoders(labels: string[]): TextDecoder[];
	/** Restore original text from text with C escape sequences. */
	textUnescape(text: string): string;
	/** Apply C escape sequences to text. */
	/** The attached list of decoders. When all of them fail, Latin 9 will be the fallback. Defaults to UTF-8 only. */
	decoders?: Iterable<TextDecoder>;
	/** The attached buffer to decode. */
	buffer?: Uint8Array|Uint8ClampedArray;
	/** The decoded result. */
	text?: string;
	/** The [text encoding label](https://encoding.spec.whatwg.org/#names-and-labels) ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)) used in the decoded result. */
	label?: string;
	/** Decode the buffer, both return it and overwrite the `text` property. Will error out if there's no attached buffer.
	* @param buffer When this argument is supplied, the `buffer` property will be overridden with it. */
	decode(buffer?: Uint8Array|Uint8ClampedArray): string;
	/** (WIP) Encode the result into a buffer, both return it and overwrite the `buffer` property. Defaults to UTF-8 encoding with no labels. Will error out if there's no attached text.
	* @param text When this argument is supplied, the `text` property will be overridden with it.
	* @param label When this argument is supplied, the `label` property will be overridden with it. */
	encode(text?: string, label?: string): Uint8Array;
}