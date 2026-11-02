// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import "../../common/init.mjs";

import LeafVersion from "../../common/class/version.mjs";

const versionObject = new LeafVersion(self.process?.versions);
versionObject.backend = "Node";
versionObject.engine = "V8";

export default versionObject;