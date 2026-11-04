// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import LeafBuildInfo from "../common/class/buildInfo.mjs";

import NodeProcess from "node:process";

export const build = new LeafBuildInfo(
	Ant.host,
	NodeProcess.arch,
	Ant.target
);