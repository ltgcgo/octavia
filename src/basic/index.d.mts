// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** The basic building blocks needed to build a visualiser.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.basic
*/

import {
	OctaviaDevice,
	TimeMuxer,
	OctaviaVoiceObject,
	OctaviaVoiceProperties
} from "../state/index.d.mts";
import MiniSignal from "../../libs/twinkle@ltgcgo/miniSignal.d.mts";

/** Properties related to a style pattern. */
declare class StyleProperties {
	/** The short 8-character ID of a style pattern. */
	short?: string;
	/** The full name of a style pattern. */
	full?: string;
}

/** A unified style pattern storage and retrieval class. */
export class StylePool {
	/** Define a short ID and a full name for a style ID under a device. */
	setStyle(dev: number, id: number, short: string, full: string): void;
	/** Remove the short ID and the full name for the style ID under the device. */
	removeStyle(dev: number, id: number): boolean;
	/** Retrieve the style object with the style ID under the device. */
	getStyle(dev: number, id: number): StyleProperties;
	/** Asynchronously load a stream to parse style name definition files. */
	load(stream: ReadableStream<Uint8Array>): Promise<void>;
}

/** A unified file handling utility class. */
export class FileHandler {
	/** Attach an element to the drop zone handler. */
	attachDrop(el: HTMLElement): void;
	/** Detach an element from the drop zone handler. */
	detachDrop(el: HTMLElement): void;
	/** Supply a `Blob` object to the same handler. */
	supplyBlob(blob: Blob): Promise<void>;
	/** Assign an MIME type to an extension.
	*
	* These assignments are added by default. The list is not exhaustive.
	* - `opus`: `audio/opus`
	* - `mpc`, `mpp`, `mp+`: `audio/musepack`
	* - `ogg`, `oga`: `audio/ogg`
	* - `m4a`: `audio/mp4`
	* - `aac`: `audio/aac`
	* - `ac3`: `audio/ac3`
	* - `wav`: `audio/wav`
	* - `wv`: `audio/x-wavpack`
	* - `flac`: `audio/flac`
	* - `mka`: `audio/matroska`
	* - `weba`: `audio/webm`
	* - `f4a`: `audio/x-flv`
	* - `mid`, `midi`, `kar`: `audio/midi`
	* - `rmi`: `audio/vnd.microsoft.rmi`
	* - `mia`: `audio/vnd.ltgc.mia`
	* - `xm`: `audio/vnd.fasttracker.xm`
	* - `s3m`: `audio/vnd.screamtracker.s3m`
	* - `it`: `audio/vnd.impulsetracker.it`
	* - `mptm`: `audio/vnd.openmpt.mptm`
	* - `xws`: `audio/vnd.yamaha.xgworks`
	* - `yws`: `audio/vnd.yamaha.sol`
	* - `jxl`: `image/jxl`
	* - `webp`: `image/webp`
	* - `jph`: `image/jph`
	* - `svg`: `image/svg+xml`
	* - `jp2`, `j2k`, `jpg2`: `image/jp2`
	* - `jpg`, `jpeg`: `image/jpeg`
	* - `png`, `apng`: `image/png`
	* - `ico`: `image/vnd.microsoft.icon`
	* - `bmp`: `image/bmp`
	* - `avif`: `image/avif`
	* - `pbm`: `image/x-portable-bitmap`
	* - `pgm`: `image/x-portable-graymap`
	* - `ppm`: `image/x-portable-pixmap`
	* - `pnm`: `image/x-portable-anymap`
	* - `webm`: `video/webm`
	* - `mkv`: `video/matroska`
	* - `mp4`, `m4v`: `video/mp4`
	* - `flv`, `f4v`: `video/x-flv`
	* - `txt`: `text/plain`
	* - `json`: `application/json`
	* - `bin`: `application/octet-stream`
	*/
	setExtMime(ext: string, mime: string): void;
	/** Assign an alternative MIME type to a main MIME type.
	*
	* These assignments are added by default. The list is not exhaustive.
	* - `audio/musepack`: `audio.x-mpc`, `audio/x-musepack`
	* - `audio/wav`: `audio/wave`, `audio/x-wav`, `audio/vnd.wave`
	*/
	aliasMime(main: string, leaf: string): void;
	/** Add a handler to a specific MIME type or a class of MIME types. More precise MIME declarations are prioritized, however you cannot specify catch-all handlers for `application/`.
	*
	* For example, when a UTF-8-encoded JSON LD blob (`.jsonld`, `application/ld+json; charset=UTF-8`) is supplied, it goes through the following search.
	* 1. Retrieve MIME type from `blob.type`.
	*   1. If that doesn't exist, try to extract the file extension from `blob.name` and match from there.
	*   2. If there are no MIME types assigned to the file extension, error out with `TypeError`.
	*   3. If the file extension cannot be extracted, error out with `TypeError`.
	* 2. Try to obtain the main MIME type if its one of the leaf types.
	* 3. Try to find the handler for `application/ld+json` and execute.
	*   1. If no handler was found, do the same for `application/json`.
	*   2. If that fails again, try `application/`.
	* 4. If all fail, a console warning is printed regarding unhandled files.
	*/
	handleMime(mime: string, func: Function): void;
}

/** A bitmap with a defined width and height. */
export class BitmapMatrix {
	/** Flag to invert the output. */
	readonly WRITE_INVERTED: number;
	/** Flag to enable writes to all covered pixels instead of masked writes. */
	readonly WRITE_NONMASKED: number;
	/** Width of all frames in pixels. Capped to 4095 pixels. */
	readonly width: number;
	/** Height of all frames in pixels. Capped to 4095 pixels. */
	readonly height: number;
	/** Number of total frames. */
	readonly frames: number;
	/** Length of the underlying buffer. */
	readonly length: number;
	/** Assigned ID. */
	id?: number | string;
	/** Get the view of the underlying buffer for a frame. */
	getFrame(frameId?: number): Uint8Array;
	/** Execute a receiver function on all covered pixels. */
	render(receiver: (e: number, x: number, y: number, a: Uint8Array) => {}, frameId?: number): void;
	/** Write a frame to the target buffer.
	* @param targetBuffer The target display buffer to write to.
	* @param targetWidth The width of the target display buffer.
	* @param mode The bit field/flags of the write mode.
	*/
	write(targetBuffer: Uint8Array, targetWidth: number, frameId?: number, startX?: number, startY?: number, mode?: number): void;
	/**
	* @param width The width of the bitmap.
	* @param height The height of the bitmap.
	* @param packed When `true`, the supplied buffer is a packed bitfield.
	*/
	constructor(width: number, height: number, packed: boolean, buffer: Uint8Array);
}

/** A basic bitmap collection. */
declare class MxBaseBmCollection {
	/** The wrapped promise object that resolves when loading is finished. */
	readonly loaded: MiniSignal;
	/** Returns a list of available bitmap IDs. */
	keys(): string[];
	/** Returns a bitmap without triggers. */
	data(key: string): BitmapMatrix;
	constructor(...fileSrc: string[]);
}
/** A general-purpose bitmap collection. */
declare class MxFlexibleBmCollection extends MxBaseBmCollection {
	/** Load the collection from a text file. */
	load(text: string): Promise<void>;
	/** Load a files from a defined URL or path. */
	loadFile(fileSrc: string): Promise<void>;
	/** Get the bitmap with the associated ID. */
	getBm(resourceName: string): BitmapMatrix;
}
/** A font-oriented bitmap collection. */
declare class MxFontBmCollection extends MxBaseBmCollection {
	/** Load the collection from a text file. */
	load(text: string, overwrite?: boolean, name?: string): Promise<void>;
	/** Load a files from a defined URL or path. */
	loadFile(fileSrc: string, overwrite?: boolean): Promise<void>;
	/** Get the bitmap from the associated code point. */
	getCP(codePoint: number): Uint8Array;
	/** Get a series of bitmaps from the associated code points. */
	getStr(string: string): Uint8Array[];
}

/** A 5×8 font-oriented bitmap collection. */
export class MxFont40 extends MxFontBmCollection {}

/** A 11×16 font-oriented bitmap collection. */
export class MxFont176 extends MxFontBmCollection {}

/** A 16×16 bitmap collection. */
export class MxBm256 extends MxFlexibleBmCollection {}

/** An bitmap collection with arbitrary dimensions. */
export class MxBmDef extends MxFlexibleBmCollection {}

/** The basis needed to build a basic visualiser with Octavia.
* ```js
* const ExampleVisualiser = class ExampleVisualiser extends RootDisplay {};
* ```
*/
export class RootDisplay {
	/** Denotes that the bitmaps use a universal layout. */
	readonly BM_UNIVERSAL: number;
	/** Denotes that the bitmaps use a Yamaha MU-compatible layout. */
	readonly BM_YAMAHA_MU: number;
	/** The attached `OctaviaDevice` object. */
	device?: OctaviaDevice;
	/** The defined pool of styles. */
	styles?: StylePool;
	/** Device-specific or visualiser-specific states. */
	dState?: Object;
	/** The attached multiplexed time source. */
	clockSource?: TimeMuxer;
	/** How long in milliseconds will the bitmap show the activated state. */
	msActive: number;
	/** How long in milliseconds will each frame in the bitmap show. */
	msFrame: number;
	/** How long in milliseconds will the bitmap because too "exhausted" to be activated. */
	msExhaust: number;
	/** When true, the strength metres will use linear smoothing instead of exponential. */
	smoothLinear: boolean;
	/** How fast should the strength metres increase to its true value. */
	smoothAttack: number;
	/** How fast should the strength metres decrease to its true value. */
	smoothDecay: number;
	/** The pixel text font used in the visualiser. */
	textFont?: MxFontBmCollection;
	/** Trigger visualiser resets. The sequencer will not be cleared. */
	reset(): void;
	/** Trigger visualiser initialization. Will also trigger a reset. The sequencer will be cleared. */
	init(): void;
	/** Load a supported file, like SMF. */
	loadFile(blob: Blob): Promise<void>;
	/** Load a name map that maps voice IDs to full blown names in MDAT format. */
	loadMap(text: string, overwrite?: boolean, priority?: number, name?: string): Promise<void>;
	/** Load an EFX name map. */
	loadEfx(text: string, overwrite?: boolean): Promise<void>;
	/** Load a voice property map. */
	loadProps(stream: ReadableStream<Uint8Array>, overwrite?: boolean, priority?: number, name?: string): Promise<void>;
	/** Load a bunch of voice property maps from defined paths or URLs. */
	loadPropsPaths(paths: string[]): Promise<void>;
	/** Attempt to refresh a cached voice on a part. */
	refreshCachedChVoice(ch: number, forcedRefreshObject: OctaviaVoiceObject): OctaviaVoiceObject;
	/** Retrieve the cached voice on a part. */
	getCachedChVoice(ch: number): OctaviaVoiceObject;
	/** Get the current catched voice of a channel without triggers. */
	getChCachedVoiceRaw(ch: number): OctaviaVoiceObject;
	/** Retrieve a mapped full name from a voice ID. */
	getMapped(id: string): string;
	/** Retrieve the mapped EFX name from the MSB and LSB combo. */
	getEfx(data: number[]): string;
	/** Retrieve the properties for a voice. */
	getProps(voiceObject: OctaviaVoiceObject): OctaviaVoiceProperties;
	/** Get the bitmap for a voice. */
	getVoxBm(voiceObject: OctaviaVoiceObject, bmType?: number): MxBaseBmCollection;
	/** Get the voice bitmap for a part. */
	getChBm(ch: number, bmType?: number, voiceObject?: OctaviaVoiceObject): MxBaseBmCollection;
	/** Get the supposed current frame of the part from frame count. */
	getChBmState(part: number, frames?: number): number;
	/** Start tracking selected device/visualiser states. When `true`, tracking has successfully begun. */
	attachState(state: string): boolean;
	/** Stop tracking selected device/visualiser states. When `true`, tracking has successfully stopped. */
	detachState(state: string): boolean;
	/** A recreated bitmap display buffer following Yamaha MU behaviour. When `true`, the bitmap buffer has been written. Requires `mu` states to be tracked.
	* @param buffer The bitmap display buffer.
	*/
	muWriteBm(buffer: Uint8Array, part: number, voiceObject?: OctaviaVoiceObject): boolean;
	/** The total note progress in fractional beats without any offset. */
	readonly noteProgress: number;
	/** The total note progress in fractional notes determined by the denominator (crotchets/quarter notes by default) with offset. Do NOT use this to count notes cumulatively! */
	readonly noteOverall: number;
	/** The total note progress in bars. */
	readonly noteBar: number;
	/** The note progress in beats within the current bar. */
	readonly noteBeat: number;
	/** The offset used to calculate note progress. */
	readonly noteOffset: number;
	/** Get the current time signature. */
	getTimeSig(): number[];
	/** Get the current tempo. */
	getTempo(): number;
	/** Get the time of the last note activated on the specified part. */
	getChLastNoteAt(part: number): number;
	/** Get the time of the current bitmap exhaustion state on the specified part. */
	getChLastNoteExhausted(part: number): number;
	/** Iterate through cached voices on all active parts. */
	eachVoice(iter: (e: OctaviaVoiceObject, i: number, a: OctaviaVoiceObject[]) => {}, all?: boolean): void;
	/** Send a MIDI event straight to the device. */
	sendCmd(raw: Object): void;
	/** Execute MIDI events till the specified point in time. */
	render(time: number): Object;
	constructor(device: OctaviaDevice, atk?: number, dcy?: number, linear?: boolean);
}

/** A display that always will focus on a single part. Automatically hooks into the focused part switch events. */
export class FocusedPartDisplay extends RootDisplay {
	/** The current focused part. Downstream classes should handle negative wrap-arounds. */
	part: number;
	/** The current suggested port range. `1` port equals to `16` parts, `2` ports equal to `32` parts, and so on. Default to `0`, meaning "ignore". */
	portRange: number;
	/** The current focused start port. Default to `255` (`allocated.invalidCh`), meaning "ignore". */
	portStart: number;
	/** If `false`, the focus won't follow future part events. Defaults to `true`. */
	rxPartEvents: boolean;
	constructor(device: OctaviaDevice, atk?: number, dcy?: number, linear?: boolean);
}
