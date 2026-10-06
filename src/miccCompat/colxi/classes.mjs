// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import {
	BinaryString
} from "../../../libs/rochelle@ltgcgo/binaryString.mjs";
import {
	IntegerHandler
} from "../../../libs/seamstress@ltgcgo/index.mjs";
import {
	MICCConstants,
	MIDINakedEvent
} from "../../micc/index.mjs";
import UnifiedShimBase from "../common/shimBase.mjs";

const ColxiMIDIView = class ColxiMIDIView {
	/** @type {Uint8Array} */
	#buffer;
	/** @type {DataView} */
	#data;
	get data() {
		return this.#data;
	};
	/** @type {BinaryString} */
	#decoder;
	#pointer = 0;
	get pointer() {
		return this.#pointer;
	};
	#typeCheckInt(value) {
		if (typeof value !== "number") {
			throw(new RangeError("Provided value must be a number."));
		} else if (Number.isSafeInteger(value)) {
			return;
		};
		throw(new RangeError("Provided value must be a safe integer."));
	};
	/** @param {MIDINakedEvent} miccEvent
	* @param {BinaryString} decoders */
	constructor(miccEvent, decoders) {
		const upThis = this;
		upThis.#buffer = miccEvent.data.slice();
		upThis.#data = new DataView(upThis.#buffer.buffer);
		switch (miccEvent.type) {
			case MICCConstants.MIDI_SYSEX_NEW:
			case MICCConstants.MIDI_SYSEX_RESUME: {
				upThis.#pointer = -IntegerHandler.lengthVLV(miccEvent.data.length);
				break;
			};
		};
		if (decoders instanceof BinaryString) {
			upThis.#decoder = decoders;
		} else {
			throw(new Error(`Binary string multi-decoder is not supplied.`));
		};
	};
	movePointer(offset = 0) {
		const upThis = this;
		upThis.#typeCheckInt(offset);
		const newPtr = upThis.#pointer + offset;
		upThis.#pointer = Math.max(0, Math.min(upThis.#buffer.length, newPtr));
		return upThis.#pointer;
	};
	readInt(readSize = 0) {
		const upThis = this, i = upThis.#pointer;
		upThis.#typeCheckInt(readSize);
		if (upThis.#pointer < 0 || upThis.#pointer >= upThis.#buffer.length) {
			throw(new RangeError(`Attempted an out-of-bound integer read.`));
		};
		let readResult;
		switch (readSize) {
			case 1: {
				readResult = upThis.#buffer[i];
				break;
			};
			case 2: {
				readResult = upThis.#data.getUint16(i);
				break;
			};
			case 3: {
				readResult = IntegerHandler.readUint24(upThis.#buffer, false, i);
				break;
			};
			case 4: {
				readResult = upThis.#data.getUint32(i);
				break;
			};
			case 5: {
				readResult = upThis.#data.getUint32(i);
				readResult += upThis.#buffer[i + 4] * 4294967296;
				break;
			};
			case 6: {
				readResult = upThis.#data.getUint32(i);
				readResult += upThis.#data.getUint16(i + 4) * 4294967296;
				break;
			};
			default: {
				throw(new RangeError(`Attempted an integer read with invalid sizes.`));
			};
		};
		upThis.movePointer(readSize);
		return readResult;
	};
	readIntVLV() {
		const upThis = this;
		if (upThis.#pointer < 0) {
			upThis.#pointer = 0;
			return upThis.#buffer.length;
		} else if (upThis.#pointer < upThis.#buffer.length) {
			const readSize = IntegerHandler.sizeVLV(upThis.#buffer);
			if (readSize > 0 && readSize <= 4) {
				const readResult = IntegerHandler.readVLV(upThis.#buffer, upThis.#pointer);
				upThis.movePointer(readSize);
				return readResult;
			};
			throw(new RangeError(`Attempted a corrupted VLV read.`));
		} else {
			throw(new RangeError(`Attempted an out-of-bound VLV read.`));
		};
	};
	readStr(readSize = 0) {
		const upThis = this, i = upThis.#pointer;
		const textBuffer = upThis.#buffer.subarray(i, upThis.movePointer(readSize));
		return upThis.#decoder.decode(textBuffer);
	};
};
const ColxiMIDIEvent = class ColxiMIDIEvent {
	/** @type {number?} */
	channel;
	/** @type {number} */
	deltaTime;
	/** @type {number} */
	type = 0;
	/** @type {number?} */
	metaType;
	/** @type {number|string|Uint8Array|undefined} */
	data = undefined;
	constructor(deltaTime) {
		if (typeof deltaTime === "number") {
			this.deltaTime = deltaTime;
		};
	};
};
const ColxiMIDITrack = class ColxiMIDITrack {
	/** @type {ColxiMIDIEvent[]} */
	event = [];
	/** @type {string} */
	type;
	constructor(type) {
		this.type = type;
	};
};
const ColxiMIDIFile = class ColxiMIDIFile {
	formatType = 0;
	/** @type {number|[number, number]} */
	timeDivision = 480;
	tracks = 0;
	/** @type {ColxiMIDITrack[]} */
	track = [];
};
/** Basis for both Colxi variants. */
const UnifiedShimColxi = class UnifiedShimColxi extends UnifiedShimBase {
	static customInterpreter = true;
};

export {
	ColxiMIDIView,
	ColxiMIDIEvent,
	ColxiMIDITrack,
	ColxiMIDIFile,
	UnifiedShimColxi
};