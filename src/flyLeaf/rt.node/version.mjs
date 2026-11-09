// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import LeafVersion from "../common/class/version.mjs";

export const version = new LeafVersion(self.process?.versions);
version.backend = "Node";
version.engine = "V8";
version.release = self.process?.versions?.node;