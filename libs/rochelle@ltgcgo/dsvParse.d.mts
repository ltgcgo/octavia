// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

/**
* A streamed reader for delimiter-separated values.
* @module
*/

export class DSVParser {
	static MASK_TYPE: number;
	static MASK_DATA: number;
	/** An [RFC 4180-compliant](https://datatracker.ietf.org/doc/html/rfc4180) CSV. */
	static TYPE_CSV: number;
	/** A TSV augmented with C escape sequences. \t and \n must be escaped at all times. */
	static TYPE_TSV: number;
	/** String as values. */
	static DATA_TEXT: number;
	/** JSON as values. First line emitted as-is. */
	static DATA_JSON: number;
	/** Parse a stream of strings as a DSV.
	* @param mode A bitmask of delimiter type and data type.
	* @param stream The stream of strings consumed as DSV.
	*/
	static parse(mode: number, stream: ReadableStream<String>): ReadableStream<Array<String|Number|Array<any>|Object>>;
	/** Parse a stream of strings as a DSV, but emits JSON objects instead. Just a helper which treats the first line of DSVs as fields. */
	static parseObjects(mode: number, stream: ReadableStream<String>): ReadableStream<Array<Object>>;
}
