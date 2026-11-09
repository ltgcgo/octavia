// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

export interface DisposableObject {
	close(): void;
}
export interface ExtendedReadableByteStream extends ReadableStream<Uint8Array> {
	/** Consumes the stream, and return its content as a buffered `ArrayBuffer`. */
	arrayBuffer(): Promise<ArrayBuffer>;
	/** Consumes the stream, and return its content as a `Blob`. Does not exist in Deno. */
	//blob(): Promise<Blob>;
	/** Consumes the stream, and return its content as a buffered `Uint8Array`. */
	bytes(): Promise<Uint8Array>;
	/** Consumes the stream, and return its content as a parsed JSON object. */
	json(): Promise<any>; // Cannot write recursive types.
	/** Consumes the stream, and return its content as a buffered text. */
	text(): Promise<string>;
}
/** Do not use this interface in your code. This interface does not actually exist. Its entire use is to signal errors, and potentially prevent invalid code from building in the first place. */
export interface Throws<T extends Error> {
	error: T;
}
export interface WrappedAbortSignal {
	/** An abort signal to cancel the operation. Depending on the backend runtime, abort signals may not always be supported.
	*
	* - On Node.js, synchronous method variants tend to ignore abort signals. */
	signal?: AbortSignal;
}
export interface WrappedAbortSignalRequired {
	/** An abort signal to cancel the operation. Depending on the backend runtime, abort signals may not always be supported.
	*
	* - On Node.js, synchronous method variants tend to ignore abort signals. */
	signal: AbortSignal;
}
export interface WrappedReadStream<T> {
	readable: ReadableStream<T>;
}
export interface WrappedWriteStream<T> {
	writable: WritableStream<T>;
}