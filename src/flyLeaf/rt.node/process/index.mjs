// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { _leaf_copyTo_ } from "../../common/util/overlay.mjs";
import { allSystemSignals } from "../../common/constant/system.mjs";
import { LeafCommandOutput } from "../../common/class/process.mjs";
import { toUint8Array } from "../../common/method/transform.mjs";
import { fromDenoModern } from "./translate.mjs";

import { env } from "../env/index.mjs";

import NodeChildProcess from "node:child_process";
import NodeProcess from "node:process";

/** @param {number} pid
* @param {import("../../index/index.d.mts").LeafSystemSignal} signal */
export function kill(pid, signal = "SIGTERM") {
	if (allSystemSignals.has(signal) || typeof signal === "number") {
		switch (NodeProcess.platform) {
			case "cygwin":
			case "win32": {
				if (pid < 0) throw(new TypeError("Invalid pid"));
				// Fallthrough
			};
			default: {
				NodeProcess.kill(pid, signal);
			};
		};
	} else {
		throw(new TypeError(`Invalid signal: ${signal}`));
	};
};

/** @param {string|URL} command
* @param {import("../../index/index.d.mts").LeafCommandOptions} options
* @returns {Promise<import("../../index/index.d.mts").LeafCommandOutput>} */
export function spawnAndWait(command, optionOrArgs, options) {
	/** @type {string[]?} */
	let args;
	if (optionOrArgs instanceof Array) {
		args = optionOrArgs;
		options = options ?? {};
	} else if (options == null) {
		options = optionOrArgs ?? {};
		optionOrArgs = undefined;
		args = options.args;
	};
	const translatedOptions = fromDenoModern(options);
	if (!options.clearEnv) {
		_leaf_copyTo_(translatedOptions.env, env.toObject());
	};
	return new Promise((resolve, reject) => {
		const child = NodeChildProcess.execFile(command, args, translatedOptions, (err, stdout, stderr) => {
			if (err) reject(err);
			resolve(new LeafCommandOutput(
				child.exitCode,
				child.signalCode,
				toUint8Array(stdout),
				toUint8Array(stderr)
			));
		});
	});
};

/** @param {string|URL} command
* @param {import("../../index/index.d.mts").LeafCommandOptions} options */
export function spawnAndWaitSync(command, optionOrArgs, options) {
	/** @type {string[]?} */
	let args;
	if (optionOrArgs instanceof Array) {
		args = optionOrArgs;
		options = options ?? {};
	} else if (options == null) {
		options = optionOrArgs ?? {};
		optionOrArgs = undefined;
		args = options.args;
	};
	const translatedOptions = fromDenoModern(options, true);
	if (!options.clearEnv) {
		_leaf_copyTo_(translatedOptions.env, env.toObject());
	};
	const result = NodeChildProcess.spawnSync(command, args, translatedOptions);
	if (result?.error) throw(result.error);
	return new LeafCommandOutput(
		result?.status,
		result?.signal,
		result?.stdout && toUint8Array(result.stdout),
		result?.stderr && toUint8Array(result.stderr)
	);
};