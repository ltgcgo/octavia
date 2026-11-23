// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import {
	DisposableObject,
	WrappedReadStream,
	WrappedWriteStream
} from "./conventions.d.mts";

export enum LeafSeekMode {
	/**  */
	Start = 0,
	/**  */
	Current = 1,
	/**  */
	End = 2
}
export const SeekMode: LeafSeekMode;

/** A readable object implementing several methods. */
export interface LeafHandlerReadable {
	/** Read the source into your own brought buffer, then return the bytes read.
	*
	* There is no guarantee that all bytes will be flushed in a single method. `0` is valid and not a signal for EoF, and `null` is the only signal for EoF. */
	readonly read?: (byob: Uint8Array) => Promise<number|null>;
	/** The synchronous variant of `read`. */
	readonly readSync?: (byob: Uint8Array) => number|null;
}

/** A writable object implementing several methods. */
export interface LeafHandlerWritable {
	/** Write your own brought buffer into the sink, then return the bytes written.
	*
	* There is no guarantee that all bytes will be flushed in a single method. `0` is valid and not a signal for EoF. */
	readonly write?: (byob: Uint8Array) => Promise<number|null>;
	/** The synchronous variant of `write`. */
	readonly writeSync?: (byob: Uint8Array) => number|null;
}

/** Details on console string representation conversion. There is no guarantee that all features will be supported by every single runtime. */
export interface LeafInspectOptions {
	/** Maximum amount of characters allowed on a single line. Defaults to `80`. */
	breakLength?: number;
	/** Use ANSI colours in console output. Defaults to false. */
	colors?: boolean;
	/** Attempt to cram more than a single entry on the same line. Defaults to true. */
	compact?: boolean;
	/** Maximum traversal depth for complex objects. Defaults to `4`. */
	depth?: number;
	/** Should escape sequences be used. Exact effect unknown. Defaults to true. */
	escapeSequences?: boolean;
	/** Should values returned by getters be used instead. Defaults to false. */
	getters?: boolean;
	/** Maximum traversal amount of iterable entries. Defaults to `100`. */
	iterableLimit?: number;
	/** Include the non-enumerable properties in an object. Defaults to false. */
	showHidden?: boolean;
	/** Include the target and handlers of a proxy. Proxies handled by Vergilius are always exempt. Defaults to false. */
	showProxy?: boolean;
	/** Should keyed object entries (objects, sets, maps) be sorted by key. Defaults to false. */
	sorted?: boolean;
	/** Maximum allowed length of a string before ellipsis truncation. */
	strAbbreviateSize?: number;
	/** Should a trailing comma be added for multi-line collections. Defaults to false. */
	trailingComma?: boolean;
}
export type InspectOptions = LeafInspectOptions;

/** A possible teletype object. */
declare interface LeafIoTeletype {
	/** If true, the object is connected to a console (teletype). */
	isTerminal(): boolean;
}

export interface LeafLegacyWrappedReader<T> extends DisposableObject, WrappedReadStream<T> {
	read: undefined;
}
export interface LeafLegacyWrappedWriter<T> extends DisposableObject, WrappedWriteStream<T> {
	write: undefined;
}

/** Details on console raw mode. */
export interface LeafSetRawOptions {
	/** Whether characters corresponding to a single should still be generated.
	*
	* Ignored when deactivating raw mode. May only function on POSIX systems. */
	cbreak: boolean;
}
export type SetRawOptions = LeafSetRawOptions;

/** Write streams for standard IO. */
export interface LeafStandardSink extends WrappedWriteStream<Uint8Array>, LeafHandlerWritable, LeafIoTeletype {}

/** Read streams for standard IO. */
export interface LeafStandardSource extends WrappedReadStream<Uint8Array>, LeafHandlerReadable, LeafIoTeletype {}

/** Standard input. */
export interface LeafStandardTeleTypeInput extends LeafStandardSource {
	/** Put the console (teletype) under raw mode when true, or canonical mode when false.
	*
	* Reading from a raw teletype is faster than reading from a canonical teletype. Unless explicitly specified otherwise, characters are handled as-is, and all special processing of the characters is disabled. */
	setRaw(isRaw: boolean, options?: LeafSetRawOptions): void;
}

/** Dimensions of the connected console (teletype/TTY). */
export interface LeafTeletypeDimensions {
	/** Maximum amount of characters per line allowed. */
	columns: number;
	/** Maximum lines of characters. */
	rows: number;
}

/** Get the current dimensions of the console (teletype) reported by the OS. If none of the three standard IOs are connected to a console, this method errors out, so it's safer to check `Deno.stdout.isTerminal` before calling this method. */
export function consoleSize(): LeafTeletypeDimensions;
/** Convert the target value into the same string used by console logging. There is no guarantee that all features will be supported by every single runtime. */
export function inspect(target: unknown, options?: LeafInspectOptions): string;