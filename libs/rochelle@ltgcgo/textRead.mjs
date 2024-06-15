// Copyright 2024 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

// Takes a stream, and read decoded text by line on demand

"use strict";

const encodings = ["utf-8", "utf-16", "utf-16be"];

ReadableStreamDefaultController.prototype.send = ReadableStreamDefaultController.prototype.send || function (data) {
	this.unsent = false;
	this.enqueue(data);
};

let TextReader = class {
	static SPLIT_UTF_8 = 0;
	static SPLIT_UTF_16_LE = 1;
	static SPLIT_UTF_16_BE = 2;
	static readRaw(stream, splitMode = 0) {
		if (splitMode?.constructor != Number ||
			splitMode < 0 ||
			splitMode >= encodings.length) {
			throw(new TypeError("Invalid split mode"));
		};
		if (splitMode) {
			throw(new Error("UTF-16LE/BE currently not implemented"));
		};
		if (!stream || stream?.constructor != ReadableStream) {
			throw(new TypeError("Not a readable stream"));
		};
		let reader = stream.getReader();
		let value, done = false;
		let bufferBuilder = [], ptr = 0, lastPtr = 0;
		let sink = new ReadableStream({
			"pull": async (controller) => {
				if (!chunk || ptr >= chunk.length) {
					// Read a new chunk
					{value, done} = await reader.read();
					// Commit unfinished buffer
					if (ptr > lastPtr) {
						chunk.subarray(ptr);
					};
					// Reset pointer
					ptr = 0;
				};
				if (chunk) {
					// Continue the read operation
				};
				if (done) {
					// Commit all remaining buffer
					// Close the stream
				};
			};
		}, new ByteLengthQueuingStrategy({"highWaterMark": 256}));
		return sink;
	};
};

export default TextReader;
