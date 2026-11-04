// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import LeafBuildInfo from "../../common/class/buildInfo.mjs";

const Deno = self.Deno ?? self.Ende;

export const build = new LeafBuildInfo(
	Deno.build.os,
	Deno.build.arch,
	Deno.build.vendor,
	Deno.build.target
);

export const args = Deno.args;
export const exit = Deno.exit;
export const noColor = Deno.noColor;