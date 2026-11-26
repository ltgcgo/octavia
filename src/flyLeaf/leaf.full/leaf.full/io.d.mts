// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import {
	WrappedReadStream,
	WrappedWriteStream
} from "../../leaf.async/leaf.async/conventions.d.mts";
import {
	LeafHandlerReadableAsync,
	LeafHandlerWritableAsync,
	LeafIoTeletype,
	LeafSetRawOptions
} from "../../leaf.async/leaf.async/io.d.mts";

/** A readable object implementing several methods. */
export interface LeafHandlerReadableFull extends LeafHandlerReadableAsync {
	/** The synchronous variant of `read`.
	* @deprecated */
	readonly readSync?: (byob: Uint8Array) => number|null;
}
/** A readable object implementing several methods. */
export type LeafHandlerReadable = LeafHandlerReadableFull;

/** A writable object implementing several methods. */
export interface LeafHandlerWritableFull extends LeafHandlerWritableAsync {
	/** The synchronous variant of `write`.
	* @deprecated */
	readonly writeSync?: (byob: Uint8Array) => number|null;
}
/** A writable object implementing several methods. */
export type LeafHandlerWritable = LeafHandlerWritableFull;

/** Write streams for standard IO. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export interface LeafStandardSinkFull extends WrappedWriteStream<Uint8Array>, LeafHandlerWritableFull, LeafIoTeletype {}
/** Write streams for standard IO. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export type LeafStandardSink = LeafStandardSinkFull;

/** Read streams for standard IO. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export interface LeafStandardSourceFull extends WrappedReadStream<Uint8Array>, LeafHandlerReadableFull, LeafIoTeletype {}
/** Read streams for standard IO. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export type LeafStandardSource = LeafStandardSourceFull;

/** Standard input. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export interface LeafStandardTeleTypeInputFull extends LeafStandardSourceFull {
	/** Put the console (teletype) under raw mode when true, or canonical mode when false.
	*
	* Reading from a raw teletype is faster than reading from a canonical teletype. Unless explicitly specified otherwise, characters are handled as-is, and all special processing of the characters is disabled. */
	setRaw(isRaw: boolean, options?: LeafSetRawOptions): void;
}
/** Standard input. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export type LeafStandardTeleTypeInput = LeafStandardTeleTypeInputFull;

/** Standard error. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export const stderr: LeafStandardSinkFull;
/** Standard input. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export const stdin: LeafStandardTeleTypeInputFull;
/** Standard output. To prevent ordering issues, avoid mixing streams with BYOB IO, or avoid BYOB IO at all. */
export const stdout: LeafStandardSinkFull;