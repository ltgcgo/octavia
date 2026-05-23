// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
	OctaviaDevice,
	TimeMuxer,
	OctaviaVoiceObject
} from "../state/index.mjs";

/** A unified style pattern storage and retrieval class. */
export class StylePool {
	/** Define a short ID and a full name for a style ID under a device. */
	setStyle(dev: number, id: number, short: string, full: string): boolean;
	/** Remove the short ID and the full name for the style ID under the device. */
	removeStyle(dev: number, id: number): boolean;
	/** Retrieve the style object with the style ID under the device. */
	getStyle(dev: number, id: number): boolean;
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

/** The basis needed to build a basic visualiser with Octavia. */
export class RootDisplay {
	/** Denotes that the bitmaps use a universal layout. */
	BM_UNIVERSAL: number;
	/** Denotes that the bitmaps use a Yamaha MU-compatible layout. */
	BM_YAMAHA_MU: number;
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
	/** Trigger visualiser resets. The sequencer will not be cleared. */
	reset(): void;
	/** Trigger visualiser initialization. Will also trigger a reset. The sequencer will be cleared. */
	init(): void;
	/** Load a supported file, like SMF. */
	loadFile(blob: Blob): Promise<void>;
	/** Load a name map that maps voice IDs to full blown names in MDAT format. */
	loadMap(text: string, overwrite?: boolean, priority?: number, name: string): Promise<void>;
	/** Load an EFX name map. */
	loadEfx(text: string, overwrite?: boolean): Promise<void>;
	/** Load a voice property map. */
	loadProps(stream: ReadableStream<Uint8Array>, overwrite?: boolean, priority?: number, name: string): Promise<void>;
	/** Load a bunch of voice property maps from defined paths or URLs. */
	loadPropsPaths(paths: string[]): Promise<void>;
	/** Attempt to refresh a cached voice on a part. */
	refreshCachedChVoice(ch: number, forcedRefreshObject: Object): Object;
	/** Retrieve the cached voice on a part. */
	getCachedChVoice(ch: number);
	/** Retrieve a mapped full name from a voice ID. */
	getMapped(id: string);
	/** Retrieve the mapped EFX name from the MSB and LSB combo. */
	getEfx(data: number[]): string;
	/** Retrieve the properties for a voice. */
	getProps(voiceObject: OctaviaVoiceObject): Object;
	/** Get the bitmap for a voice. */
	getVoxBm(voiceObject: OctaviaVoiceObject, bmType?: number): Object;
	/** Get the voice bitmap for a part. */
	getChBm(ch: number, bmType?: number, voiceObject?: OctaviaVoiceObject): Object;
	/** Get the supposed current frame of the part from frame count. */
	getChBmState(part: number, frames?: number);
	/** Start tracking selected device/visualiser states. When `true`, tracking has successfully begun. */
	attachState(state: string): boolean;
	/** Stop tracking selected device/visualiser states. When `true`, tracking has successfully stopped. */
	detachState(state: string): boolean;
	/** A recreated bitmap display buffer following Yamaha MU behaviour. When `true`, the bitmap buffer has been written. Requires `mu` states to be tracked.
	* @param buffer The bitmap display buffer.
	*/
	muWriteBm(buffer: Uint8Array, part: number, voiceObject?: OctaviaVoiceObject): boolean;
}
