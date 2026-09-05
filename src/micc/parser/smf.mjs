"use strict";

import {
	IntegerHandler,
	SeamstressChunk
} from "../../../libs/seamstress@ltgcgo/index.mjs";
import {
	bufferCarveOut
} from "../../state/utils/bufferIo.mjs";
import {
	MIDINakedEvent
} from "../eventObjects.mjs";
import {
	MICCSMFMIAHandleOptions
} from "../index.mjs";

/** Standard MIDI Files (MIDI 1.0) or raw MIDI 1.0 messages. */
export default class MICCInternalsSMF {
	/** @param {Uint8Array | Uint8ClampedArray | SeamstressChunk} inBuffer
	* @param {MICCSMFMIAHandleOptions} options
	* @returns {MIDINakedEvent} */
	static parseSingleEvent(inBuffer, options = {}) {
		let buffer;
		switch (inBuffer?.constructor) {
			case Uint8Array:
			case Uint8ClampedArray: {
				buffer = inBuffer;
				break;
			};
			default: {
				if (inBuffer?.data?.constructor === Uint8Array) {
					buffer = inBuffer.data;
				} else {
					throw(new TypeError(`Input buffer must be Uint8Array or SeamstressChunk.`));
				};
			};
		};
		// Delta time
		let deltaSize = 0;
		if (options.hasDelta) {
			if (buffer.length < 1) {
				throw(new Error(`Delta time expects at least a single byte.`));
			};
			deltaSize = IntegerHandler.sizeVLV(buffer);
			if (deltaSize > 4 || deltaSize <= 0) {
				throw(new RangeError(`Invalid delta time.`));
			};
		};
		const deltaTime = deltaSize > 0 ? IntegerHandler.readVLV(buffer) : 0;
		options.parserContext = options.parserContext ?? {};
		// Status byte
		if (buffer.length < (1 + deltaSize)) {
			throw(new Error(`Status byte expects at least a single byte.`))
		};
		let statusByte = 0, eventType = 0, eventCh = null, isStale = false;
		if (buffer[deltaSize] >> 7) {
			statusByte = buffer[deltaSize];
		} /*else if (!options.isSmfWrapped) {
			throw(new Error(`Running status is not allowed in raw MIDI 1.0 messages.`));
		}*/ else {
			isStale = true;
			statusByte = options.parserContext.lastStatus;
			if (!(statusByte >= 0x80 && statusByte < 0xf0)) {
				throw(new Error(`Invalid running status.`));
			};
		};
		if (statusByte >= 0xf0) {
			eventType = statusByte;
			if (options.parserContext.lastSysExHung) {
				switch (eventType) {
					case 0xff: // Meta events aren't sent over the wire.
					case 0xf0:
					case 0xf7: {
						break;
					};
					default: {
						throw(new Error(`The last SysEx event was not terminated.`));
					};
				};
			} else {
				if (eventType === 0xf7) {
					throw(new Error(`Illegal SysEx continuation. The previous SysEx event had already terminated.`));
				};
			};
		} else if (statusByte & 0x80) {
			eventType = statusByte >> 4;
			eventCh = statusByte & 15;
		} else {
			throw(new RangeError(`Invalid status byte ${statusByte}.`));
		};
		const nakedEvent = new MIDINakedEvent(eventType, deltaTime);
		if (inBuffer.offsetData >= 0) {
			nakedEvent.offset = inBuffer.offsetData;
		};
		// Event data
		if (eventCh >= 0) {
			nakedEvent.ch = eventCh;
		};
		nakedEvent.isStale = isStale;
		let dataEndPointer = deltaSize + (isStale ? 0 : 1);
		let dataStartPointer = dataEndPointer;
		switch (eventType) {
			case 8:
			case 9:
			case 10:
			case 11:
			case 14: {
				dataEndPointer += 2;
				break;
			};
			case 12:
			case 13: {
				dataEndPointer += 1;
				break;
			};
			case 240: {
				if (options.isSmfWrapped) {
					// SMF allows 0xF7 to appear in a subsequent 0xF7 event.
					const dataSizeLength = IntegerHandler.sizeVLV(buffer, dataEndPointer);
					if (dataSizeLength <= 0 || dataSizeLength > 4) {
						throw(new RangeError(`Invalid data length.`));
					};
					dataStartPointer += dataSizeLength;
					dataEndPointer += dataSizeLength + IntegerHandler.readVLV(buffer, dataEndPointer);
					//options.parserContext.lastSysExHung = dataSizeLength > 0 ? buffer[dataEndPointer - 1] !== 0xf7 : false;
				} else {
					// A lack of 0xF7 here is corruption.
					const endPointer = buffer.indexOf(0xf7, dataEndPointer);
					if (endPointer >= dataEndPointer) {
						dataEndPointer = endPointer + 1;
					} else {
						throw(new Error(`Incomplete new SysEx.`));
					};
				};
				break;
			};
			case 247: {
				if (!options.isSmfWrapped) {
					throw(new Error(`0xF7 event can only exist in SMF.`));
				};
				const dataSizeLength = IntegerHandler.sizeVLV(buffer, dataEndPointer);
				if (dataSizeLength <= 0 || dataSizeLength > 4) {
					throw(new RangeError(`Invalid data length.`));
				};
				dataStartPointer += dataSizeLength;
				dataEndPointer += dataSizeLength + IntegerHandler.readVLV(buffer, dataEndPointer);
				//options.parserContext.lastSysExHung = dataSizeLength > 0 ? buffer[dataEndPointer - 1] !== 0xf7 : false;
				break;
			};
			case 255: {
				if (!options.isSmfWrapped) {
					throw(new Error(`0xFF event can only exist in SMF.`));
				};
				if (buffer.length <= dataEndPointer) {
					throw(new Error(`Incomplete meta event: meta type does not exist.`))
				};
				nakedEvent.meta = buffer[dataEndPointer];
				dataEndPointer ++;
				if (buffer.length <= dataEndPointer) {
					throw(new Error(`Incomplete meta event: size does not exist.`))
				};
				const dataSizeLength = IntegerHandler.sizeVLV(buffer, dataEndPointer);
				if (dataSizeLength <= 0 || dataSizeLength > 4) {
					throw(new RangeError(`Invalid data length.`));
				};
				dataStartPointer += dataSizeLength + 1;
				dataEndPointer += dataSizeLength + IntegerHandler.readVLV(buffer, dataEndPointer);
				break;
			};
			case 248:
			case 250:
			case 251:
			case 252:
			case 254: {
				if (options.isSmfWrapped) {
					throw(new Error(`Realtime event ${eventType.toString(16).toUpperCase()} can only exist raw.`));
				};
				break;
			};
			case 241:
			case 243: {
				if (options.isSmfWrapped) {
					throw(new Error(`Common event ${eventType.toString(16).toUpperCase()} can only exist raw.`));
				};
				dataEndPointer += 1;
				break;
			};
			case 242: {
				if (options.isSmfWrapped) {
					throw(new Error(`Song position pointers can only exist raw.`));
				};
				dataEndPointer += 2;
				break;
			};
			default: {
				console.error(inBuffer);
				throw(new TypeError(`Unknown MIDI event type ${eventType}.`));
			};
		};
		// Final pass
		if (buffer.length < dataEndPointer) {
			throw(new Error(`Received an incomplete event.`));
		};
		nakedEvent.data = buffer.subarray(dataStartPointer, dataEndPointer);
		let isSysExActive = false;
		if (eventType >= 8 && eventType < 255) {
			// Meta events are left as-is.
			// SysEx events allow for concatenation thanks to the existing backlog of SMFs.
			const scanRegion = options.loosenForSpeed ? Math.min(nakedEvent.data.length, 24) : nakedEvent.data.length;
			if (eventType === 0xf0) {
				isSysExActive = true;
			} else if (eventType === 0xf7) {
				isSysExActive = options.parserContext.lastSysExHung;
			};
			for (let i = 0; i < scanRegion; i ++) {
				const e = nakedEvent.data[i];
				switch (eventType) {
					case 0xf0:
					case 0xf7: {
						if (e === 0xf7) {
							if (isSysExActive) {
								isSysExActive = false;
							} else {
								throw(new Error(`Illegal termination after terminated SysEx event.`));
							};
							//continue;
						} else if (e === 0xf0) {
							if (isSysExActive) {
								// Also rejects the live message embedding trick.
								throw(new RangeError(`New SysEx events cannot appear without the previous SysEx event terminating.`));
							} else {
								isSysExActive = true;
								//continue;
							};
						} else if (e >= 0x80) {
							throw(new RangeError(`SysEx payloads cannot contain bytes greater than or equal to 0x80.`));
						} else if (isSysExActive === false) {
							throw(new Error(`SysEx payloads cannot contain bytes after termination and before new initialisation.`));
						};
						break;
					};
					default: {
						if (e >= 0x80) {
							throw(new RangeError(`Channel events cannot contain bytes greater than or equal to 0x80.`));
						};
					};
				};
			};
		};
		if (eventType === 0xf0 || eventType === 0xf7) {
			// Separated safety check due to `loosenForSpeed`.
			options.parserContext.lastSysExHung = options.loosenForSpeed ? (nakedEvent.data.length > 0 ? nakedEvent.data[nakedEvent.data.length - 1] !== 0xf7 : false) : isSysExActive;
		};
		if (!isStale && eventType < 0xf8) {
			// Crash the subsequent event that attempts running status reuse, if the event type is 0xf0-0xff.
			options.parserContext.lastStatus = statusByte;
		};
		return nakedEvent;
	};
	/*static parseSingleContextEvent(chunkInfo) {
		const parsedEvent = this.parseSingleEvent(chunkInfo.data);
		return parsedEvent;
	};*/
	/** @param {MIDINakedEvent} event
	* @param {MICCSMFMIAHandleOptions} options */
	static emitSingleEvent(event, options = {}) {
		if (event.constructor !== MIDINakedEvent && event.group !== "mma.midiEvent") {
			throw(new TypeError(`Provided event is not of type MIDINakedEvent.`));
		};
		options.parserContext = options.parserContext ?? {};
		let finalSize = 0;
		let deltaPtr = -1, statusPtr = -1, dataPtr = -1, dataStartPtr = -1;
		// Delta time size
		if (options.hasDelta) {
			deltaPtr = 0;
			finalSize += IntegerHandler.lengthVLV(event.delta);
		};
		statusPtr = finalSize;
		// Status byte size
		if (event.type >= 0xf0 && event.type <= 0xff) {
			if (event.isStale) {
				throw(new Error(`System messages forbid running status.`));
			};
			finalSize += 1;
		} else if (event.type >= 8 && event.type < 15) {
			if (event.isStale) {
				/*if (!options.isSmfWrapped) {
					throw(new Error(`Running status is not allowed in raw MIDI 1.0 messages.`));
				} else */if (options.parserContext.lastStatus >= 0xf0) {
					throw(new Error(`Invalid running status: no system message inheritance.`));
				} else if (options.parserContext.lastStatus !== ((event.type << 4) | (event.ch & 15))) {
					throw(new Error(`Invalid running status: status mismatch.`));
				};
			} else if (Number.isSafeInteger(event.ch)) {
				finalSize += 1;
			} else {
				throw(new TypeError(`Channel must be an integer.`));
			};
		};
		dataPtr = finalSize;
		let checkPayload = 0, checkPayloadSize = 0;
		// Payload size
		switch (event.type) {
			case 8:
			case 9:
			case 10:
			case 11:
			case 14: {
				finalSize += 2;
				checkPayloadSize = 2;
				checkPayload = 1;
				break;
			};
			case 12:
			case 13: {
				finalSize += 1;
				checkPayloadSize = 1;
				checkPayload = 1;
				break;
			}
			case 0xf7: {
				if (!options.isSmfWrapped) {
					throw(new Error(`0xF7 events can only occur in SMF.`));
				};
				// Fallthrough.
			};
			case 0xf0: {
				if (options.isSmfWrapped) {
					finalSize += IntegerHandler.lengthVLV(event.data.length);
					dataStartPtr = finalSize;
				} else if (event.data[event.data.length - 1] !== 0xf7) {
					throw(new Error(`Incomplete new SysEx.`));
				};
				finalSize += event.data.length;
				break;
			};
			case 0xff: {
				if (!options.isSmfWrapped) {
					throw(new Error(`0xFF events can only occur in SMF.`));
				};
				if (Number.isSafeInteger(event.meta) && event.meta >= 0 && event.meta <= 0xff) {
					//finalSize += 1; // Meta type.
					finalSize += 1 + IntegerHandler.lengthVLV(event.data.length);
					dataStartPtr = finalSize;
					finalSize += event.data.length;
				} else {
					throw(new Error(`Invalid meta type.`));
				};
				break;
			};
			default: {
				throw(new TypeError(`Unknown event type ${event.type}.`));
			};
		};
		switch (checkPayload) {
			case 0: {
				break;
			};
			case 1: {
				// Channel events.
				if (event.data.length !== checkPayloadSize) {
					throw(new Error(`Event data size does not match its event type.`));
				};
				if (event.ch >= 0) {
					if (event.ch <= 15) {
						// No-op
					} else if (event.port === 255 && event.ch <= 255) {
						console.warn(`Event on CH${event.ch + 1} have not yet been flattened, causing potential loss in SMF/MIDI 1.0 binary assembly. Flatten events first before utilising extended ranges.`);
					} else {
						throw(new RangeError(`Channel out of range.`));
					};
				} else {
					throw(new RangeError(`Channel must be a non-negative integer.`));
				};
				for (let i = 0; i < event.data.length; i ++) {
					if (event.data[i] >= 0x80) {
						throw(new RangeError(`Channel events cannot contain bytes greater than or equal to 0x80.`));
					};
				};
				break;
			};
			default: {
				throw(new Error(`Reached undefined payload check state.`));
			};
		};
		//console.debug(finalSize);
		// Assemble the final bytes. Validity checks for system messages are not the responsibility of this method.
		const buffer = new Uint8Array(finalSize);
		if (deltaPtr >= 0) {
			IntegerHandler.writeVLV(buffer, event.delta, deltaPtr);
		};
		if (statusPtr < 0) {
			throw(new Error(`Status byte slot unrecognised.`));
		};
		if (!event.isStale) {
			buffer[statusPtr] = event.type >= 0xf0 ? event.type : (event.type << 4) | (event.ch & 15);
		};
		if (dataPtr < 0) {
			throw(new Error(`Data byte slot unrecognised.`));
		};
		if (dataStartPtr < 0) {
			dataStartPtr = dataPtr;
		};
		switch (event.type) {
			case 8:
			case 9:
			case 10:
			case 11:
			case 12:
			case 13:
			case 14: {
				break;
			};
			case 0xf7:
			case 0xf0: {
				if (options.isSmfWrapped) {
					IntegerHandler.writeVLV(buffer, event.data.length, dataPtr);
				};
				break;
			};
			case 0xff: {
				buffer[dataPtr] = event.meta;
				IntegerHandler.writeVLV(buffer, event.data.length, dataPtr + 1);
				break;
			};
			default: {
				throw(new TypeError(`Unknown event type ${event.type}.`));
			};
		};
		buffer.set(event.data, dataStartPtr);
		// Assembly finished.
		if (!event.isStale && event.type < 0xf8) {
			// SysRT doesn't change running status.
			options.parserContext.lastStatus = event.type <= 15 ? (event.type << 4) | (event.ch & 15) : event.type;
		};
		//this.debugMode && console.debug(buffer);
		return buffer;
	};
	/** @param {Uint8Array|Uint8ClampedArray} buffer
	* @param {MICCSMFMIAHandleOptions} options
	* @returns {Generator<MIDINakedEvent, void, any>} */
	static *parseRawEvents(buffer, options = {}) {
		// `parseSingleEvent` is quite strict against malformed events with running status support. If this fails to guard against malformed data, that method will.
		if (options.hasDelta || options.isSmfWrapped) {
			throw(new Error(`Only raw MIDI 1.0 messages are allowed.`));
		};
		let state = 0, runningStatus = options?.parserContext?.lastStatus ?? 0;
		let messageStart = -1, messageKnock = [], remainingSize = 0;
		let submitBuffer = false, noValidDataYet = true;
		//let isStale = false;
		for (let i = 0; i < buffer.length; i ++) {
			const e = buffer[i];
			if (e >> 3 === 31) {
				// System realtime
				if (state > 0) {
					messageKnock.push(i);
				};
				yield this.parseSingleEvent(buffer.subarray(i, i + 1), options);
			} else {
				if (noValidDataYet && messageStart >= 0 && messageStart < i && e >= 128) {
					const invalidMessage = buffer.subarray(messageStart, i);
					console.warn(`(${i}) Invalid message segment:\n`, invalidMessage);
				};
				switch (state) {
					case 0: {
						// Waiting for any status byte.
						let messageSize = -1;
						//isStale = false;
						if (e >= 240) {
							// System
							if (e < 248) {
								runningStatus = 0;
							};
							switch (e) {
								case 0xf6: {// 0-byte payload
									messageSize = 0;
									break;
								};
								case 0xf1:
								case 0xf3: {// 1-byte payload
									messageSize = 1;
									break;
								};
								case 0xf2: {// 2-byte payload
									messageSize = 2;
									break;
								};
								case 0xf0: {
									messageStart = i;
									state = 1;
									noValidDataYet = false;
									if (messageKnock.length > 0) {
										messageKnock.splice(0, messageKnock.length);
									};
									break;
								};
								case 0xf7: {
									console.warn(`(${i}) Orphaned SysEx End received.`);
									break;
								};
								default: {
									console.debug(`(${i}) Undefined status ${e}.`);
								};
							};
						} else if (e >= 128) {
							runningStatus = e;
							messageSize = 2;
							// Channel
							switch (e >> 4) {
								case 12:
								case 13: {
									messageSize = 1;
									break;
								};
							};
						} else if (runningStatus !== 0) {
							if (runningStatus >= 128 && runningStatus < 240) {
								//isStale = true;
								messageSize = 2;
								// Channel
								switch (runningStatus >> 4) {
									case 12:
									case 13: {
										messageSize = 1;
										break;
									};
								};
							} else {
								throw(new Error(`Invalid running status.`));
							}
						};
						if (messageSize >= 0 && messageKnock.length > 0) {
							messageKnock.splice(0, messageKnock.length);
						};
						if (messageSize > 0) {
							messageStart = i;
							remainingSize = messageSize;
							state = 2;
						} else if (messageSize === 0) {
							if (e !== 0xf0) {
								yield this.parseSingleEvent(buffer.subarray(i, i + 1), options);
								messageStart = i + 1;
							};
						};
						break;
					};
					case 1: {
						// SysEx data payload filtering
						if (messageStart < 0) {
							throw(new Error(`(${i}) SysEx filter has no start pointer.`));
						};
						//let carvedSize = -1;
						switch (e) {
							case 0xf7: {
								// SysEx End
								submitBuffer = true;
								break;
							};
							case 0xf0:
							case 0xf1:
							case 0xf2:
							case 0xf3:
							case 0xf4:
							case 0xf5:
							case 0xf6: {
								// Invalid state
								throw(new Error(`Invalid system common inside SysEx.`));
								break;
							};
						};
						/*if (carvedSize >= 0) {
							for (let iCarve = 0; iCarve <= carvedSize; iCarve ++) {
								messageKnock.push(i + iCarve);
							};
							yield this.parseSingleEvent(buffer.subarray(i, i + carvedSize + 1), options);
							i += carvedSize;
							carvedSize = -1;
						};*/
						break;
					};
					case 2: {
						if (e >= 128) {
							//throw(new RangeError(`Event payloads cannot contain bytes greater than or equal to 0x80.`));
							console.debug(`Event payloads cannot contain bytes greater than or equal to 0x80 (${e}). Dropped previous payload and re-synchronised.`);
							noValidDataYet = true;
							messageStart = i;
							i --;
							state = 0;
							submitBuffer = false;
						} else if (--remainingSize < 1) {
							submitBuffer = true;
						};
						break;
					};
					default: {
						console.debug(`Undefined state ${state}. ${e}`);
					};
				};
				if (submitBuffer) {
					submitBuffer = false;
					noValidDataYet = false;
					yield this.parseSingleEvent(bufferCarveOut(buffer.subarray(messageStart, i + 1), messageKnock), options);
					messageKnock.splice(0, messageKnock.length);
					state = 0;
					messageStart = i + 1;
				};
			};
		};
		switch (state) {
			case 0: {
				break;
			};
			case 1: {
				throw(new Error(`Incomplete new SysEx.`));
				break;
			};
			case 2: {
				yield this.parseSingleEvent(bufferCarveOut(buffer.subarray(messageStart), messageKnock), options);
				break;
			};
		};
	};
	/** @param {number} offset
	* @param {SeamstressChunk} subchunk  */
	static streamRegulator(offset, subchunk) {
		switch (subchunk.type) {
			case "MTrk":
			case "XFIH":
			case "XFKM": {
				let eventContext = subchunk.context;
				delete eventContext.statusPos;
				delete eventContext.sizePos; // f0, ff
				delete eventContext.dataPos; // f0, ff
				let deltaSize = IntegerHandler.sizeVLV(subchunk.data, offset);
				let remainingSize = subchunk.data.length - offset;
				if (deltaSize <= 0 || deltaSize > 4) {
					if (deltaSize === 0 && remainingSize < 4) {
						return 0;
					};
					throw(new RangeError(`Delta time is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
				};
				if (deltaSize >= remainingSize) {
					return 0;
				};
				let statusPos = offset + deltaSize;
				eventContext.statusPos = deltaSize;
				let fullStatusPos = statusPos + subchunk.offsetData;
				let statusByte = 0, isStale = false;
				if (subchunk.data[statusPos] & 0x80) {
					// Status byte.
					statusByte = subchunk.data[statusPos];
					eventContext.status = statusByte;
					//this.debugMode && console.debug(`Status (fresh): ${statusByte.toString(16)}`);
				} else {
					// Re-use running status.
					if ((subchunk.offset + offset) === 0) {
						throw(new Error(`Stale running status should never be at the start of the chunk at 0x${fullStatusPos.toString(16).padStart(6, "0")}`));
					} else if (eventContext.status >= 0xf0) {
						throw(new Error(`Stale running status should never be ${eventContext.status.toString(16)} at 0x${fullStatusPos.toString(16).padStart(6, "0")}`));
					} else {
						statusByte = eventContext.status;
						isStale = true;
						//this.debugMode && console.debug(`Status (stale): ${statusByte.toString(16)}`);
					};
				};
				let fullSize = deltaSize;
				switch (statusByte) {
					case 0xf0:
					case 0xf7: {
						// SysEx and SysEx continuation.
						let seSizeSize = IntegerHandler.sizeVLV(subchunk.data, offset + deltaSize + 1);
						let seRSize = remainingSize - deltaSize - 1;
						if (seSizeSize <= 0 || seSizeSize > 4) {
							if (seSizeSize === 0 && seRSize < 4) {
								return 0;
							};
							throw(new Error(`SysEx size is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
						};
						eventContext.sizePos = deltaSize + 1;
						eventContext.dataPos = eventContext.sizePos + seSizeSize;
						fullSize += 1 + seSizeSize + IntegerHandler.readVLV(subchunk.data, offset + deltaSize + 1);
						break;
					};
					case 0xff: {
						// Metadata.
						let mdSizeSize = IntegerHandler.sizeVLV(subchunk.data, offset + deltaSize + 2);
						let mdRSize = remainingSize - deltaSize - 2;
						if (mdSizeSize <= 0 || mdSizeSize > 4) {
							if (mdSizeSize === 0 && mdRSize < 4) {
								return 0;
							};
							throw(new Error(`Metadata size is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
						};
						eventContext.sizePos = deltaSize + 2;
						eventContext.dataPos = eventContext.sizePos + mdSizeSize;
						fullSize += 2 + mdSizeSize + IntegerHandler.readVLV(subchunk.data, offset + deltaSize + 2);
						break;
					};
					default: {
						switch (statusByte >> 4) {
							case 8:
							case 9:
							case 10:
							case 11:
							case 14: {
								// Normal events.
								fullSize += isStale ? 2 : 3;
								break;
							};
							case 12:
							case 13: {
								// Normal events.
								fullSize += isStale ? 1 : 2;
								break;
							};
							case 15: {
								throw(new Error(`Unknown SMF status 0x${statusByte.toString(16)} at 0x${(fullStatusPos).toString(16).padStart(6, "0")}.`));
								break;
							};
							default: {
								// Malformed SMF data!
								throw(new Error(`SMF data malformed at 0x${(fullStatusPos).toString(16).padStart(6, "0")}.`));
							};
						};
					};
				};
				if (remainingSize < fullSize) {
					return 0;
				};
				//this.debugMode && console.debug(`0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")} (${offset}): ${deltaSize} %o`, subchunk.data.subarray(offset, offset + fullSize));
				return fullSize;
				break;
			};
			case "MThd":
			default: {
				return 0;
			};
		};
	};
};
