// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import NodePath from "node:path";
import NodeProcess from "node:process";
import NodeUrl from "node:url";

export const args = NodeProcess.argv.slice(2);
export const mainModule = NodeUrl.pathToFileURL(NodeProcess.argv[1] ?? `${NodeProcess.cwd()}${NodePath.sep}$deno$repl.mts`).href;
export const noColor = NodeProcess.env["NO_COLOR"]?.length > 0;

export function exit(exitCode) {
	NodeProcess.exit(exitCode);
};