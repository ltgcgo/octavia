// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import LeafBuildInfo from "../common/class/buildInfo.mjs";
import { TargetExtractLLVM } from "../common/class/matchers.mjs";

const antBuild = TargetExtractLLVM.exec(Ant.target ?? "")?.groups;
export const build = new LeafBuildInfo(
	antBuild?.os ?? Ant.host,
	antBuild?.arch ?? (await import("node:process")).arch,
	antBuild?.vendor,
	Ant.target
);
if (antBuild?.env) {
	build.env = antBuild.env;
};