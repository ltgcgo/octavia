// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
    SeamstressContext
} from "../../libs/seamstress@ltgcgo/index.d.mts";

/**
* Musical Instructions Compiler Collection. Handles MIDI-adjacent file parsing and serialization.
* @license LGPL-3.0-only
* @module
*/

// Native implementations
export class NakedMIDIEvent {}
/**
* Parse raw MIDI events from buffers.
* @param buffer The input buffer.
* @param context The context object or a boolean. If boolean is provided, setting it to true will include delta time parsing. If a context object is provided, delta time parsing will always be present.
*/
export function smfEventParser(buffer: Uint8Array, context?: boolean|SeamstressContext): NakedMIDIEvent;

// Compatibility layers
export class ColxiMIDIEvent {
	deltaTime: number;
	type: number;
	metaType: number;
	data: number | Uint8Array | string;
}
export class ColxiMIDITrack {
	event: Array<ColxiMIDIEvent>;
	type: string;
}
export class ColxiMIDIFile {
	formatType: number;
	timeDivision: number;
	tracks: number;
	track: Array<ColxiMIDITrack>;
}
/**
* View into each MIDI event, supplied to `ColxiMIDIParser.customInterpreter`. Will only be supplied for 0xf0 events.
*/
export class ColxiMIDIView {
	/**
	* The data of the event. Unlike the original implementatino, this only grants view of the current event.
	*/
	data: DataView;
	/**
	* The pointer of the current event. When invoked, for 0xf0 events, the pointer will sit on the SysEx length byte.
	*/
	pointer: number;
	/**
	* Move the apparent pointer. Unlike the original implementation, this method does not affect MIDI file parsing in any way, and is bound-checked.
	* @param offset The relative offset to move the pointer against. -1 moves the pointer to the previous byte, 0 has no effect, and 1 moves the pointer to the next byte.
	* @returns The mutated pointer.
	*/
	movePointer(offset: number): number;
	/**
	* Read multi-byte integers.
	*/
	readInt(readSize: number): number;
	/**
	* Read VLV-8 on the current pointer;
	*/
	readIntVLV(): number;
	/**
	* Read a string. If the `decoders` property of the parser object can be accessed, it will attempt to decode string supplied by the decoders in the `decoders` property, advancing to the next one whenever the current decoder fails. The catch-all decoder is X-ASCII.
	*/
	readStr(readSize: number): string;
};
export class ColxiMIDIParser {
	static parse(input: File | Uint8Array | Uint8ClampedArray | string, callback: (file: ColxiMIDIFile) => void): Promise<ColxiMIDIFile>;
	static customInterpreter?: (type: number, view: object, metaLength: number) => any;
	static decoders?: Array<TextDecoder>;
}
