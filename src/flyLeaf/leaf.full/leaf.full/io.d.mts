// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import {
	WrappedReadStream,
	WrappedWriteStream
} from "../leaf.async/conventions.d.mts";
import {
	LeafHandlerReadable as LeafHandlerReadableAsync,
	LeafHandlerWritable as LeafHandlerWritableAsync,
	LeafIoTeletype,
	LeafSetRawOptions
} from "../leaf.async/io.d.mts";

/** A readable object implementing several methods. */
export interface LeafHandlerReadable extends LeafHandlerReadableAsync {
	/** The synchronous variant of `read`.
	* @deprecated */
	readonly readSync?: (byob: Uint8Array) => number|null;
}

/** A writable object implementing several methods. */
export interface LeafHandlerWritable extends LeafHandlerWritableAsync {
	/** The synchronous variant of `write`.
	* @deprecated */
	readonly writeSync?: (byob: Uint8Array) => number|null;
}

/** Write streams for standard IO. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export interface LeafStandardSink extends WrappedWriteStream<Uint8Array>, LeafHandlerWritable, LeafIoTeletype {}

/** Read streams for standard IO. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export interface LeafStandardSource extends WrappedReadStream<Uint8Array>, LeafHandlerReadable, LeafIoTeletype {}

/** Standard input. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export interface LeafStandardTeleTypeInput extends LeafStandardSource {
	/** Put the console (teletype) under raw mode when true, or canonical mode when false.
	*
	* Reading from a raw teletype is faster than reading from a canonical teletype. Unless explicitly specified otherwise, characters are handled as-is, and all special processing of the characters is disabled. */
	setRaw(isRaw: boolean, options?: LeafSetRawOptions): void;
}

/** Standard error. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export const stderr: LeafStandardSink;
/** Standard input. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export const stdin: LeafStandardTeleTypeInput;
/** Standard output. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export const stdout: LeafStandardSink;