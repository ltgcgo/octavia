"use strict";

import {
	IntegerHandler,
	SeamstressChunk
} from "../../../libs/seamstress@ltgcgo/index.mjs";
import {
	NakedMIDIEvent
} from "../eventObjects.mjs";
import {
	MICCSMFMIAHandleOptions
} from "../index.mjs";

/** Standard MIDI Files (MIDI 1.0) or raw MIDI 1.0 messages. */
export default class MICCInternalsSMF {
	/** @param {Uint8Array | Uint8ClampedArray | SeamstressChunk} buffer
	* @param {MICCSMFMIAHandleOptions} options
	* @returns {NakedMIDIEvent} */
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
		let statusByte = 0, eventType = 0, eventCh = 65535, isStale = false;
		if (buffer[deltaSize] >> 7) {
			statusByte = buffer[deltaSize];
		} else if (!options.isSmfWrapped) {
			throw(new Error(`Running status is not allowed in raw MIDI 1.0 messages.`));
		} else {
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
		const nakedEvent = new NakedMIDIEvent(eventType, deltaTime);
		// Event data
		nakedEvent.ch = eventCh;
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
			default: {
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
		if (!isStale) {
			// Crash the subsequent event that attempts running status reuse, if the event type is 0xf0-0xff.
			options.parserContext.lastStatus = statusByte;
		};
		return nakedEvent;
	};
	/*static parseSingleContextEvent(chunkInfo) {
		const parsedEvent = this.parseSingleEvent(chunkInfo.data);
		return parsedEvent;
	};*/
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
					this.debugMode && console.debug(`Status (fresh): ${statusByte.toString(16)}`);
				} else {
					// Re-use running status.
					if ((subchunk.offset + offset) === 0) {
						throw(new Error(`Stale running status should never be at the start of the chunk at 0x${fullStatusPos.toString(16).padStart(6, "0")}`));
					} else if (eventContext.status >= 0xf0) {
						throw(new Error(`Stale running status should never be ${eventContext.status.toString(16)} at 0x${fullStatusPos.toString(16).padStart(6, "0")}`));
					} else {
						statusByte = eventContext.status;
						isStale = true;
						this.debugMode && console.debug(`Status (stale): ${statusByte.toString(16)}`);
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
				this.debugMode && console.debug(`0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")} (${offset}): ${deltaSize} %o`, subchunk.data.subarray(offset, offset + fullSize));
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
