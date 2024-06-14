"use strict";

let u8Enc = new TextEncoder();

let readVLV = function (buffer) {
	// Expects Uint8Array or the likes
	let result = 0, ptr = 0, resume = true;
	while (ptr < 4 && resume) {
		if (ptr) {
			result = result << 7;
		};
		result |= buffer[ptr] & 127;
		if (buffer[ptr] < 128) {
			resume = false;
		};
		ptr ++;
	};
	return [result, ptr];
};
let readUintBE = function (buffer, byteLength) {
	let result = 0, ptr = 0;
	if (byteLength > 6) {
		throw(new RangeError(`Cannot read more than 48 bits`));
	};
	if (byteLength > buffer.length) {
		throw(new RangeError(`Trying to read out of bounds`));
	};
	while (ptr < byteLength) {
		if (ptr < 3) {
			if (ptr) {
				result = result << 8;
			};
			result |= buffer[ptr];
		} else {
			result *= 256;
			result += buffer[ptr];
		};
		ptr ++;
	};
	return result;
};

ReadableStreamDefaultController.prototype.send = function (data) {
	this.unsent = false;
	this.enqueue(data);
};

let streamDisassemble = function (source) {
	let reader = source.getReader();
	let totalPtr = 0, ptr = 0, ptrStart = 0, chunk;
	let sectStart = 0, sectLength = 0;
	let state = 0, strBuf = "",
	nextState = 0, // transient state
	finalState = 0, // final state to jump to
	intValue = 0;
	let extLen = 0, startNextSect = false, part = 0;
	let trackIndex = 0;
	let sink = new ReadableStream({
		"pull": async (controller) => {
			controller.unsent = true;
			while (controller.unsent) {
				// Chunk read handling
				if (!chunk || ptr >= chunk.length) {
					//console.info(`[Reader]  Reading a new chunk.`);
					let {value, done} = await reader.read();
					if (chunk) {
						totalPtr += chunk.length;
						//console.info(`[Reader]  Submitted the last chunk.`);
					};
					ptr = 0;
					chunk = value;
					if (done) {
						//console.info(`[Reader]  All chunks have been read.`);
						controller.close();
						return;
					};
				};
				let e = chunk[ptr];
				//console.info(`${`${e}`.padStart(3, "0")}-${e.toString(16).padStart(2, "0")}(${String.fromCharCode(Math.max(32, e))}) L: ${ptr - ptrStart}, S: ${ptrStart}, I: ${ptr}, TS: ${totalPtr + ptrStart}, TI: ${totalPtr + ptr}, TL: ${chunk.length} [${state}]`);
				switch (state) {
					case 0: { // Chunk marker search
						//console.info("Searching for chunk markers...");
						strBuf += String.fromCharCode(e);
						switch (strBuf) {
							case "MThd": {
								//console.info("MIDI Header chunk!");
								controller.send(u8Enc.encode(`:hd\n`));
								state = 1;
								nextState = 3;
								finalState = 4;
								ptrStart = ptr + 1;
								strBuf = "";
								break;
							};
							case "MTrk": {
								//console.info("MIDI Track chunk!");
								trackIndex ++;
								controller.send(u8Enc.encode(`:tr#${trackIndex}\n`));
								state = 1;
								nextState = 3;
								finalState = 5;
								ptrStart = ptr + 1;
								strBuf = "";
								break;
							};
							default: {
								if (strBuf.length >= 4) {
									strBuf = strBuf.substring(1, 4);
								};
							}
						};
						break;
					};
					case 1: {
						// 32-bit length int read
						//console.info(`Reading uint32...`);
						let i = ptr - ptrStart;
						if (!i) {
							intValue = 0;
						};
						intValue = intValue << 8;
						intValue |= e;
						if (i >= 3) {
							if (intValue < 0) {
								intValue += 4294967296;
							};
							state = nextState;
							ptr --;
						};
						break;
					};
					case 2: {
						// VLV int read
						//console.info(`Reading VLV...`);
						let i = ptr - ptrStart;
						if (!i) {
							intValue = 0;
						};
						intValue = intValue << 7;
						intValue |= e & 127;
						if (e < 128 || i >= 3) {
							//console.info(`VLV read done: ${intValue}.`);
							if (i) {
								//console.info(`This is a multi-byte VLV read.`);
								ptr += i;
							};
							state = nextState;
							if (startNextSect) {
								ptrStart = ptr + 1;
								startNextSect = false;
							};
							ptr --;
						};
						break;
					};
					case 3: {
						// Write length
						//console.info(`Writing length...`);
						controller.send(u8Enc.encode(`\tln ${intValue}\n`));
						state = finalState;
						ptrStart = ptr + 1;
						break;
					};
					case 4: {
						// MIDI head read
						//console.info(`Reading MThd...`);
						let i = ptr - ptrStart;
						if (!(i & 1)) {
							intValue = 0;
						};
						intValue = intValue << 8;
						intValue |= e;
						if (i & 1) {
							switch (i >> 1) {
								case 0: {
									controller.send(u8Enc.encode(`\tft ${intValue}\n`));
									break;
								};
								case 1: {
									controller.send(u8Enc.encode(`\ttc ${intValue}\n`));
									break;
								};
								case 2: {
									if (intValue < 32768) {
										controller.send(u8Enc.encode(`\tdv ${intValue}\n`));
									} else {
										controller.send(u8Enc.encode(`\ttd ${intValue}\n`));
									};
									state = 0;
									ptrStart = ptr + 1;
									intValue = 0;
									break;
								};
							};
						};
						break;
					};
					case 5: {
						// Read delta time
						//console.info(`Reading delta time...`);
						state = 2;
						nextState = 6;
						ptr --;
						break;
					};
					case 6: {
						// Write delta time and jump to different event types
						let i = ptr - ptrStart;
						if (i) {
							//console.info(`Reading event type...`);
							switch (e) {
								case 240: {
									state = 15;
									break;
								};
								case 247: {
									state = 16;
									break;
								};
								case 255: {
									state = 7;
									break;
								};
								default: {
									state = e >> 4;
									part = e & 15;
									ptrStart = ptr + 1;
								};
							};
						} else {
							//console.info(`Delta time: ${intValue}`);
							if (intValue) {
								controller.send(u8Enc.encode(`\tdt ${intValue}\n`));
							};
						};
						break;
					};
					case 7: {
						// Meta event init, jump to 17 for full reads
						//console.info(`Reading meta...`);
						controller.send(u8Enc.encode(`\tmt ${e}`));
						state = 2;
						nextState = 17;
						startNextSect = true;
						ptrStart = ptr + 1;
						break;
					};
					case 15: {
						// SysEx event init, jump to 17 for full reads
						//console.info(`Reading SysEx...`);
						controller.send(u8Enc.encode(`\tse`));
						state = 2;
						nextState = 17;
						ptr --;
						startNextSect = true;
						ptrStart = ptr + 1;
						break;
					};
					case 16: {
						// SysEx multi-segment event init, jump to 17 for full reads
						//console.info(`Reading SysEx multi-segment...`);
						controller.send(u8Enc.encode(`\tsc`));
						state = 2;
						nextState = 17;
						ptr --;
						startNextSect = true;
						ptrStart = ptr + 1;
						break;
					};
					case 17: {
						// Multi-byte direct dump
						let i = ptr - ptrStart;
						if (i == 0) {
							extLen = intValue;
							//console.info(`Extension length: ${extLen}`);
							controller.send(u8Enc.encode(` ${extLen}`));
						};
						if (i < 0) {} else if (i < extLen) {
							controller.send(u8Enc.encode(` ${e.toString(16).padStart(2, "0")}`));
						} else {
							controller.send(u8Enc.encode(`\n`));
							ptr --;
							state = 5;
							ptrStart = ptr + 1;
						};
						break;
					};
					case 8: {
						// Note off
						//console.info(`Note off!`);
						let i = ptr - ptrStart;
						if (i) {
							controller.send(u8Enc.encode(` ${e}\n`));
							state = 5;
							ptrStart = ptr + 1;
						} else {
							controller.send(u8Enc.encode(`\tof ${part.toString(16)} ${e}`));
						};
						break;
					};
					case 9: {
						// Note on
						//console.info(`Note on!`);
						let i = ptr - ptrStart;
						if (i) {
							controller.send(u8Enc.encode(` ${e}\n`));
							state = 5;
							ptrStart = ptr + 1;
						} else {
							controller.send(u8Enc.encode(`\ton ${part.toString(16)} ${e}`));
						};
						break;
					};
					case 10: {
						// Note aftertouch (PAT)
						//console.info(`Note AT!`);
						let i = ptr - ptrStart;
						if (i) {
							controller.send(u8Enc.encode(` ${e}\n`));
							state = 5;
							ptrStart = ptr + 1;
						} else {
							controller.send(u8Enc.encode(`\tpa ${part.toString(16)} ${e}`));
						};
						break;
					};
					case 11: {
						// Control change
						//console.info(`Control change!`);
						let i = ptr - ptrStart;
						if (i) {
							controller.send(u8Enc.encode(` ${e}\n`));
							state = 5;
							ptrStart = ptr + 1;
						} else {
							controller.send(u8Enc.encode(`\tcc ${part.toString(16)} ${e}`));
						};
						break;
					};
					case 12: {
						// Program change
						//console.info(`Program change!`);
						controller.send(u8Enc.encode(`\tpc ${part.toString(16)} ${e}\n`));
						state = 5;
						ptrStart = ptr + 1;
						break;
					};
					case 13: {
						// Channel aftertouch (CAT)
						//console.info(`Channel AT!`);
						controller.send(u8Enc.encode(`\tca ${part.toString(16)} ${e}\n`));
						state = 5;
						ptrStart = ptr + 1;
						break;
					};
					case 14: {
						// Pitch bend
						//console.info(`Pitch bend!`);
						let i = ptr - ptrStart;
						if (!i) {
							intValue = 0;
						};
						intValue |= e << (i << 3);
						if (i) {
							controller.send(u8Enc.encode(`\tpb ${part.toString(16)} ${intValue - 8192}\n`));
							state = 5;
							ptrStart = ptr + 1;
						};
						break;
					};
					default: {
						//console.info("Unhandled state.");
						controller.close();
					};
				};
				ptr ++;
			};
			//console.info("Data pulled.");
		}
	}, new ByteLengthQueuingStrategy({"highWaterMark": 256}));
	return sink;
};

export {
	streamDisassemble
};
