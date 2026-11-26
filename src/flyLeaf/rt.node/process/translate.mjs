// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { getTranslatedDefault } from "../../common/method/process.mjs";
import { _leaf_copyTo_, _leaf_yield_ } from "../../common/util/overlay.mjs";

/** @type {Map<import("../../leaf.full/index.d.mts").LeafStdIoMode, "pipe"|"inherit"|"ignore">} */
const stdioModeMap = new Map();
stdioModeMap.set("inherit", "inherit");
stdioModeMap.set("null", "ignore");
stdioModeMap.set("piped", "pipe");

const stdioDefault = getTranslatedDefault(stdioModeMap);

/** @param {import("../../leaf.full/index.d.mts").LeafCommandOptions} denoOpts
* @returns {import("node:child_process").SpawnOptions & import("node:child_process").ExecFileOptionsWithBufferEncoding} */
export function fromDenoModern(denoOpts, isOutput = false) {
	const {
		//clearEnv,
		cwd,
		detached,
		env,
		gid,
		signal,
		stderr,
		stdin,
		stdout,
		uid,
		windowsRawArguments
	} = denoOpts ?? {};
	const newEnv = _leaf_copyTo_({}, env);
	return {
		stdio: [
			stdioModeMap.get(stdin) ?? stdioDefault[+isOutput].stdin,
			stdioModeMap.get(stdout) ?? stdioDefault[+isOutput].stdout,
			stdioModeMap.get(stderr) ?? stdioDefault[+isOutput].stderr
		],
		shell: false,
		encoding: "buffer",
		cwd,
		detached: detached ?? false,
		env: newEnv,
		gid,
		uid,
		signal,
		windowsVerbatimArguments: windowsRawArguments ?? false
	};
};