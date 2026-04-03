// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/**
 * Generic stream enqueuing, merging and splitting.
 * @module
 */

/**
 * Asynchronously enqueue readable streams, and combine multiple readable streams together. State of the streams supplying to the queue does not matter.
 * ```js
 * let streamQueue = new StreamQueue();
 * streamQueue.pipeFrom(request.body);
 * ```
 */
export class StreamQueue {
	/** Set to true to emit verbose debug messages. */
	debugMode: boolean;
	/**
	 * Set the params used by the result stream.
	 * @param underlyingSource Define the behaviour of the result stream. Only "start" and "cancel" are available.
	 * @param queuingStrategy Optionally define the queuing strategy of the result stream. Will affect the backpressure.
     */
	constructor(underlyingSource?: object, queuingStrategy?: object);
	/**
	 * Enqueue a chunk into the stream with enforced backpressure. Will only resolve when the internal backpressure is relieved. If trying to enqueue a chunk without respecting backpressure, the method will immediately error out.
	 * @param chunk The chunk to enqueue.
	 */
	enqueue(chunk: any): Promise<void>;
	/**
	 * Pipe the content of a ReadableStream to the result stream. Backpressure applied.
	 * @param source The ReadableStream to read from.
	 */
	pipeFrom(source: ReadableStream): void;
	/** Resolve to supplied reason when the result stream gets cancelled. */
	cancelled: Promise<any>;
	/** Close the result stream. */
	close(): void;
	/** If the result stream is closed. */
	closed: boolean;
	/** Resolve when the result stream gets closed. */
	closure: Promise<void>;
	/**
	 * Error the result stream out.
	 * @param err The supplied error object.
	 */
	error(err: any): void;
	/** The result stream. */
	readable: ReadableStream;
}

/**
 * Split one readable stream into multiple. State of the subsequent streams do not affect the source stream. Reading from any of the subsequent streams will relieve the backpressure of the source stream.
 * ```js
 * let streamServer = new StreamServe(request.body);
 * ```
 */
export class StreamServe {
	attach(source: ReadableStream): void;
	detach(): void;
	attached: boolean;
	pipe(): ReadableStream;
	pipeTo(sink: WritableStream): void;
	cancel(): void;
	canceled: boolean;
	cancellation: Promise<void>;
	close(): void;
	closed: boolean;
	closure: Promise<void>;
}

/**
 * Normalize chunks of a byte stream to a specific size. Originally from WingBlade.
 * ```js
 * let choked = new ChokerStream(65536, false);
 * choked.attach(incomingReadable);
 * let request = await fetch("https://example.com/", {
 * 	method: "post",
 * 	body: choked.source
 * });
 * ```
 */
export class ChokerStream {
	constructor(maxChunkSize: number, alwaysCopy: boolean);
	alwaysCopy: boolean;
	chunkSize: number;
	source: ReadableStream;
	sink: ReadableStream;
	attach(source: ReadableStream): void;
	attached: boolean;
}
