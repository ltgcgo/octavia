// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import * as LeafEnum from "../util/enum.mjs";

export const LeafSeekMode = LeafEnum.finalise(LeafEnum.linear(
	["Start", "Current", "End"]
));
export const SeekMode = LeafSeekMode;