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
	static feedRaw(stream, splitMode = 0) {
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
		let chunk, finished = false;
		let bufferBuilder = [], ptr = 0, lastPtr = 0, lastUnit = 0;
		let sink = new ReadableStream({
			"pull": async (controller) => {
				controller.unsent = true;
				while (controller.unsent) {
					if (!chunk || ptr >= chunk.length) {
						// Commit unfinished buffer
						if (ptr > lastPtr) {
							bufferBuilder.push(chunk.subarray(lastPtr));
							lastPtr = 0;
							console.error(`Read a new chunk.`);
						};
						// Read a new chunk
						let {value, done} = await reader.read();
						chunk = value;
						finished = done;
						// Reset pointer
						ptr = 0;
					};
					if (chunk) {
						// Continue the read operation
						console.error(`Read byte at chunk pointer ${ptr}.`);
						let e = chunk[ptr];
						let commitNow = false;
						switch (e) {
							case 10: {
								if (lastUnit == 13) {
									lastPtr ++;
								} else {
									commitNow = true;
								};
								break;
							};
							case 13: {
								commitNow = true;
								break;
							};
						};
						if (commitNow) {
							if (bufferBuilder.length) {
								console.error(`Building a multi-part buffer.`);
								// Add buffer
								bufferBuilder.push(chunk.subarray(lastPtr, ptr));
								// Calculate buffer size
								let mergeLen = 0;
								for (let i = 0; i < bufferBuilder.length; i ++) {
									mergeLen += bufferBuilder[i].length;
								};
								// Merge buffer
								let mergedBuffer = new Uint8Array(mergeLen);
								let mergedPtr = 0;
								for (let i = 0; i < bufferBuilder.length; i ++) {
									mergedBuffer.set(bufferBuilder[i], mergedPtr);
									mergedPtr += bufferBuilder[i].length;
								};
								// Commit buffer
								controller.send(mergedBuffer);
								// Clear buffer
								bufferBuilder = [];
								console.error(`Multi-part buffer write finished.`);
							} else {
								// Just commit the current segment
								controller.send(chunk.subarray(lastPtr, ptr));
								console.error(`Single buffer write finished.`);
							};
							lastPtr = ptr + 1;
						};
						lastUnit = e;
					} else {
						console.error(`No reading available.`);
					};
					if (finished) {
						console.error(`Stream finished.`);
						// Detect remaining buffer
						if (lastPtr != ptr) {
							bufferBuilder.push(chunk.subarray(lastPtr, ptr));
						};
						// Commit all remaining buffer
						if (bufferBuilder.length) {
							console.error(`Building a multi-part buffer.`);
							// Calculate buffer size
							let mergeLen = 0;
							for (let i = 0; i < bufferBuilder.length; i ++) {
								mergeLen += bufferBuilder[i].length;
							};
							// Merge buffer
							let mergedBuffer = new Uint8Array(mergeLen);
							let mergedPtr = 0;
							for (let i = 0; i < bufferBuilder.length; i ++) {
								mergedBuffer.set(bufferBuilder[i], mergedPtr);
								mergedPtr += bufferBuilder[i].length;
							};
							// Commit buffer
							controller.send(mergedBuffer);
							console.error(`Multi-part buffer write finished.`);
						}
						// Close the stream
						controller.unsent = false;
						controller.close();
					};
					ptr ++;
				};
			}
		}, new ByteLengthQueuingStrategy({"highWaterMark": 256}));
		return sink;
	};
	static feed(stream, splitMode = 0, label) {
		let rawStream = this.feedRaw(stream, splitMode).getReader();
		let decoder = new TextDecoder(label || encodings[splitMode]);
		return new ReadableStream({
			"pull": async (controller) => {
				let {value, done} = await rawStream.read();
				if (value) {
					controller.enqueue(decoder.decode(value));
				};
				if (done) {
					controller.close();
				};
			}
		});
	};
};

export default TextReader;
