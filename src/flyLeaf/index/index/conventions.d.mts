// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

export interface DisposableObject {
	close(): void;
}
export interface WrappedAbortSignal {
	/** An abort signal to cancel the operation. Depending on the backend runtime, abort signals may not always be supported.
	*
	* - On Node.js, synchronous method variants tend to ignore abort signals. */
	signal: AbortSignal;
}