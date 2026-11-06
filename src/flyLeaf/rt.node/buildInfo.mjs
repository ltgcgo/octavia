// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import LeafBuildInfo from "../common/class/buildInfo.mjs";

import NodeProcess from "node:process";

const instanceReport = NodeProcess.report.getReport();

const build = new LeafBuildInfo(
	NodeProcess.platform,
	NodeProcess.arch
);
const buildEnvComponents = [];
if (
	typeof instanceReport?.header?.glibcVersionRuntime === "string" ||
	typeof instanceReport?.header?.glibcVersionCompiler === "string"
) {
	buildEnvComponents.push("gnu");
};
if (buildEnvComponents.length > 0) {
	build.env = buildEnvComponents.join("-");
	build.target = `${build.arch}-${build.vendor}-${build.os}-${build.env}`;
};

export {
	build
};