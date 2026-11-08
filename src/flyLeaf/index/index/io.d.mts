// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

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

export interface LeafLegacyWrappedReader<T> extends DisposableObject, WrappedReadStream<T> {
	read: undefined;
}
export interface LeafLegacyWrappedWriter<T> extends DisposableObject, WrappedWriteStream<T> {
	write: undefined;
}
export interface LeafSetRawOptions {
	/**  */
	cbreak: boolean;
}