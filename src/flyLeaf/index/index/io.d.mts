// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

export enum LeafSeekMode {
	Start = 0,
	Current = 1,
	End = 2
}

export interface LeafSetRawOptions {
	/**  */
	cbreak: boolean;
}