"use strict";

let NakedMIDIEvent = class NakedMIDIEvent {
	delta = 0; // delta time
	type = 255; // event type
	part = 0; // MIDI channel
	meta; // optional meta event type
	data; // actual Uint8Array raw data
	isStale = false; // true if the original event omitted the running status
	text; // decoded string of meta events, not available until a decoder/finalizer is run
	time; // parsed time in seconds, not available until a finalizer is run
	hasPort = false;
	port = 0; // designated virtual port, only use this after ensuring it as parsed
};
let MIDIEventWithContext = class MIDIEventWithContext {
	event; // the NakedMIDIEvent object
	type; // subchunk.type
	chunk; // subchunk.chunkId
};

let smfEventRegulator = function (offset, subchunk) {
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
				throw(new Error(`Delta time is invalid at 0x${(subchunk.offsetData + offset).toString(16).padStart(6, "0")}`));
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
let smfEventParser = function (buffer) {
	let nakedEvent = {};
	return nakedEvent;
};
let smfEventContextParser = function (chunkInfo) {
	let parsedEvent = smfEventParser(chunkInfo.data);
	return parsedEvent;
};

export {
	smfEventRegulator,
	smfEventParser,
	smfEventContextParser,
	NakedMIDIEvent
};
