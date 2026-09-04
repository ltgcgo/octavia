// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** Reusable utilities for time-keeping.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.pendulum
*/

export class NumberSmoother {
	/** How much should the  Valid values fall in the range of `[0, 1]`. Defaults to `1`. */
	factor: number;
	/** Defaults to `0`. */
	value: number;
	/** Supplies a new value. Returns the new smoothed value. */
	supply(value: number): number;
}

// Needed until an implementation of Quick Sort is done. This is easier to implement for now.
export class SortedArrayHost<T> {
	guest: Array<T>;
	readonly sorted: boolean;
	sortOnAdd: boolean;
	add(value: T): void;
	find(value: T): number;
	getSorted(): Array<T>;
	sort(): void;
	sorter?: (a: T, b: T)=>number;
	constructor(guest?: Array<T>);
}

/** Reusable numerical ring FIFO. */
export class Float64RingFIFOQueue {
	[Symbol.iterator](): Iterable<number, void, any>;
	/** Amount of values to be kept. */
	readonly capacity: number;
	/** The actual underlying buffer. Does not guarantee FIFO order. */
	readonly buffer: Float64Array;
	/** Count of currently populated values. Will not exceed the capacity. */
	readonly length: number;
	/** Reset the ring FIFO queue with the specified value. */
	fill(value: number): void;
	/** Return the indices and values in the ring FIFO queue, ordered as FIFO. */
	entries(): Iterable<[number, number], void, any>;
	/** Return the highest value. */
	readonly highest: number;
	/** Return the lowest value. */
	readonly lowest: number;
	/** Return the mean (arithmetic average) of all values. If there are no filled values, returns `undefined`. */
	mean(): number|undefined;
	/** Return the percentile split point of all values. If `snap` is false and `split` is `0.5`, returns the median.
	* @param split The percentage in the range of `[0, 1]`. `0` is the lowest value, `1` is the highest value, and `0.5` is median when `snap` is `false`.
	* @param snap If the result should only be taken from given values unchanged. Defaults to `false`. */
	percentile(split: number, snap?: boolean): number|undefined;
	/** Add a new value to the FIFO queue. If the FIFO is filled fully before, returns the discarded value. */
	push(value: number): number|undefined;
	/** Return a normal array with values in the ring FIFO queue, ordered as FIFO. */
	slice(): number[];
	/** Return the values in the ring FIFO queue, ordered as FIFO. */
	values(): Iterable<number, void, any>;
	constructor(capacity: number);
}

/** Clock tick tracking subsystem. */
export class PendulumRingFIFOTicker {
	[Symbol.iterator](): Iterable<number, void, any>;
	/** Amount of ticks to be tracked. Must be a positive integer less than or equal to 1536. For tempo estimation based on MIDI clock ticks (1/24 of a quarter note), a multiple of `24` is recommended. */
	readonly capacity: number;
	/** When `false`, only until the entire ring FIFO queue is filled will some methods return values. Defaults to `true`. */
	immediate: boolean;
	/** Offset of the supplied index values. Useful for applications like discrete ticking with offset position specified. Defaults to `0`. */
	indexOffset: number;
	/** The index (0-indexed number of ticks) of the last tick with offset applied. */
	readonly lastIndex: number;
	/** If the current clock is paused. Will only be `false` after `resume()` has been called, and a value has been supplied to the ticker. Defaults to `true`.  */
	readonly paused: boolean;
	readonly queue: Float64RingFIFOQueue;
	/** Return the indices and values in the ring FIFO queue, ordered as FIFO. Index affected by `indexOffset`. */
	entries(): Iterable<[number, number], void, any>;
	/** Return the mean (arithmetic average) of all values. If there are no filled ticks, or the queue isn't fully filled when `immediate` is `false`, returns `undefined`. */
	mean(): number|undefined;
	/** Return the median of all values. If there are no filled ticks, or the queue isn't fully filled when `immediate` is `false`, returns `undefined`. */
	median(): number|undefined;
	/** Pause the ticker. Unless resumed, all future ticks will be discarded. */
	pause(): void;
	/** Resume the ticker. Does not reset the internal ring FIFO queue. */
	resume(): void;
	/** Return a normal array with values in the ring FIFO queue, ordered as FIFO. */
	slice(): number[];
	/** Start the ticker. Resets the internal ring FIFO queue. */
	start(): void;
	/** Tick the ticker by adding a new value to the FIFO queue. Returns `true` when the resulting underlying FIFO queue is fully filled. Unit consistency is dependent on the supplied values themselves. */
	tick(value: number): boolean;
	/** Return the values in the ring FIFO queue, ordered as FIFO. */
	values(): Iterable<number, void, any>;
	constructor(capacity: number);
}
