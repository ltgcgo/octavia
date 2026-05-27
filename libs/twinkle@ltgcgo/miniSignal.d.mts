// 2023-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

/** A tiny task completeness signalling helper. */
export default class MiniSignal extends EventTarget {
	/** Returns a `Promise` that resolves after the defined duration in milliseconds. */
	static sleep(ms: number): Promise<void>;
	/** A `Promise` that resolves when `finish()` is called. */
	readonly finished: Promise<void>;
	/** Resolves the attached `Promise`. */
	finish(): void;
	/** Returns the attached `Promise` when not finished, `null` otherwise. */
	wait(): Promise<void> | undefined;
}
