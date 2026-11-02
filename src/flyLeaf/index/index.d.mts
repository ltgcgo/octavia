// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
	version,
	LeafVersion
} from "./index/env.d.mts";

export {
	version
}

/** Globals from Fly Leaf. It's recommended to use separate imports instead for runtime-agnostic interfacing. */
export default class FlyLeafGlobals {
	static version: LeafVersion
}