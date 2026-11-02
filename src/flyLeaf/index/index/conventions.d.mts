// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

export interface DisposableObject {
	close(): void;
}
export interface WrappedAbortSignal {
	/** An abort signal to cancel the operation. */
	signal: AbortSignal;
}