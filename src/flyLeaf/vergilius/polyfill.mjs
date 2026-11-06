// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { _leaf_copyTo_ } from "../common/util/overlay.mjs";
import * as LeafPolyfills from "./ponyfill/leaf.mjs";

if (self.Deno) {
	_leaf_copyTo_(self, LeafPolyfills);
};