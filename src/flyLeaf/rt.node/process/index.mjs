// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { _leaf_copyTo_ } from "../../common/util/overlay.mjs";
import { allSystemSignals } from "../../common/constant/system.mjs";
import {
	LeafChildRunStatusModern,
	LeafCommandOutput
} from "../../common/class/process.mjs";
import { toExtendedReadable, toUint8Array } from "../../common/method/transform.mjs";
import { fromDenoModern } from "./translate.mjs";

import { env } from "../env/index.mjs";
import { deepUnwrap } from "../../vergilius/restrict.mjs";

import NodeChildProcess from "node:child_process";
import NodeFs from "node:fs";
import NodeProcess from "node:process";
import NodeStream from "node:stream";
import NodeStreamConsumers from "node:stream/consumers";

/** @template {import("../../index/index.d.mts").LeafCommandOptions} T */
export const LeafChildProcess = class LeafChildProcess {
	/** @type {NodeChildProcess.ChildProcess} */
	#child;
	/** @type {import("../../index/index.d.mts").LeafCommandOutput<"spawn", T>?} */
	#output;
	/** @type {import("../../index/index/conventions.d.mts").ExtendedReadableByteStream} */
	#se;
	/** @type {WritableStream<Uint8Array>?} */
	#si;
	/** @type {import("../../index/index/conventions.d.mts").ExtendedReadableByteStream} */
	#so;
	/** @type {number} */
	pid;
	/** @type {Promise<import("../../index/index.d.mts").LeafChildRunStatusModern>} */
	status;
	get stderr() {
		if (this.#se == null) {
			throw(new TypeError("Cannot get 'stderr': 'stderr' is not piped"));
		} else {
			return this.#se;
		};
	};
	get stdin() {
		if (this.#si == null) {
			throw(new TypeError("Cannot get 'stdin': 'stdin' is not piped"));
		} else {
			return this.#si;
		};
	};
	get stdout() {
		if (this.#so == null) {
			throw(new TypeError("Cannot get 'stdout': 'stdout' is not piped"));
		} else {
			return this.#so;
		};
	};
	/** @param {string|URL} command
	* @param {string[]?} args
	* @param {T} options */
	constructor(command, args, options) {
		const upThis = this;
		const translatedOptions = fromDenoModern(options, false);
		if (!options?.clearEnv) {
			_leaf_copyTo_(translatedOptions.env, env.toObject());
		};
		let childDone;
		upThis.status = new Promise((resolve) => {
			childDone = resolve;
		});
		/** @type {NodeChildProcess.ChildProcess} */
		//console.debug(command, args, translatedOptions);
		const child = NodeChildProcess.spawn(command, deepUnwrap(args), translatedOptions);
		upThis.pid = child.pid;
		upThis.#child = child;
		child.once("close", (code, signal) => {
			childDone(new LeafChildRunStatusModern(
				code ?? child.exitCode,
				signal ?? child.signalCode
			));
		});
		if (Symbol.asyncDispose) {
			upThis[Symbol.asyncDispose] = () => {
				if (typeof child.exitCode === "number") return;
				upThis.kill();
			};
		};
		if (child.stdin != null) {
			upThis.#si = NodeStream.Writable.toWeb(child.stdin);
		};
		if (child.stdout != null) {
			upThis.#so = toExtendedReadable(NodeStream.Readable.toWeb(child.stdout));
		};
		if (child.stderr != null) {
			upThis.#se = toExtendedReadable(NodeStream.Readable.toWeb(child.stderr));
		};
	};
	/** @param {import("../../index/index.d.mts").LeafSystemSignal} signal */
	kill(signal = "SIGTERM") {
		if (allSystemSignals.has(signal) || typeof signal === "number") {
			this.#child.kill(signal);
		} else {
			throw(new TypeError(`Invalid signal: ${signal}`));
		};
	};
	async output() {
		const upThis = this;
		if (upThis.#output) return upThis.#output;
		await upThis.status;
		const result = new LeafCommandOutput(
			upThis.#child.exitCode,
			upThis.#child.signalCode,
			upThis.#so ? await upThis.#so.bytes() : undefined,
			upThis.#se ? await upThis.#se.bytes() : undefined,
		);
		upThis.#output = result;
		return result;
	};
	ref() {
		this.#child.ref();
	};
	unref() {
		this.#child.unref();
	};
};
export const ChildProcess = LeafChildProcess;

/** @template {import("../../index/index.d.mts").LeafCommandOptions} T */
export const LeafCommand = class LeafCommand {
	/** @type {string|URL} */
	#command;
	/** @type {T} */
	#options;
	constructor(command, options) {
		this.#command = command;
		this.#options = options;
	};
	//output() {};
	//outputSync() {};
	spawn() {
		return new LeafChildProcess(
			this.#command,
			this.#options?.args,
			this.#options
		);
	};
	output() {
		const options = this.#options;
		if (options.stdin === "piped") {
			throw(new TypeError("Piped stdin is not supported for this function, use 'Deno.Command.spawn()' instead"));
		};
		const translatedOptions = fromDenoModern(options, true);
		const args = deepUnwrap(this.#options?.args) ?? [];
		if (!options?.clearEnv) {
			_leaf_copyTo_(translatedOptions.env, env.toObject());
		};
		/** @type {NodeChildProcess.ChildProcess} */
		const result = NodeChildProcess.spawn(this.#command, args, translatedOptions);
		return new Promise((resolve, reject) => {
			let stdoutBuffer, stderrBuffer;
			(async () => {
				stdoutBuffer = toUint8Array(await NodeStreamConsumers.buffer(result.stdout));
			})();
			(async () => {
				stderrBuffer = toUint8Array(await NodeStreamConsumers.buffer(result.stderr));
			})();
			const answer = async (code, signal) => {
				result.off("close", answer);
				resolve(new LeafCommandOutput(
					code ?? result.exitCode,
					answer ?? result.signalCode,
					result.stdout ? stdoutBuffer : undefined,
					result.stderr ? stderrBuffer : undefined
				));
			};
			result.once("error", (err) => {
				if (
					err &&
					typeof err.signal === "undefined" &&
					typeof err.killed === "undefined"
				) {
					try {
						child.kill("SIGKILL");
					} catch (err) {};
					result.off("close", answer);
					reject(err);
				};
			});
			result.on("close", answer);
		});
	};
	outputSync() {
		const options = this.#options;
		if (options.stdin === "piped") {
			throw(new TypeError("Piped stdin is not supported for this function, use 'Deno.Command.spawn()' instead"));
		};
		const translatedOptions = fromDenoModern(options, true);
		const args = deepUnwrap(this.#options?.args) ?? [];
		if (!options?.clearEnv) {
			_leaf_copyTo_(translatedOptions.env, env.toObject());
		};
		const result = NodeChildProcess.spawnSync(this.#command, args, translatedOptions);
		if (
			result?.error &&
			typeof result.error.signal === "undefined" &&
			typeof result.error.killed === "undefined"
		) throw(result.error);
		return new LeafCommandOutput(
			result?.status,
			result?.signal,
			result?.stdout && toUint8Array(result.stdout),
			result?.stderr && toUint8Array(result.stderr)
		);
	};
};
export const Command = LeafCommand;

const outputIsPiped = (value) => {
	if (value == null || value == "piped") return true;
	return false;
};

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
* @param {import("../../index/index.d.mts").LeafCommandOptions} options */
export function spawn(command, optionOrArgs, options) {
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
	return new LeafChildProcess(command, args, options);
};

/** @param {string|URL} command
* @param {import("../../index/index.d.mts").LeafCommandOptions} options
* @returns {Promise<import("../../index/index.d.mts").LeafCommandOutput>} */
export function spawnAndWait(command, optionOrArgs, options) {
	/** @type {string[]?} */
	let args;
	if (optionOrArgs instanceof Array) {
		args = optionOrArgs ?? [];
		options = options ?? {};
	} else if (options == null) {
		options = optionOrArgs ?? {};
		optionOrArgs = undefined;
		args = options.args ?? [];
	};
	const translatedOptions = fromDenoModern(options, true);
	if (!options?.clearEnv) {
		_leaf_copyTo_(translatedOptions.env, env.toObject());
	};
	return new Promise((resolve, reject) => {
		const child = NodeChildProcess.execFile(command, deepUnwrap(args), translatedOptions, (err, stdout, stderr) => {
			if (
				err &&
				typeof err.signal === "undefined" &&
				typeof err.killed === "undefined"
			) {
				try {
					child.kill("SIGKILL");
				} catch (err) {};
				reject(err);
			};
			resolve(new LeafCommandOutput(
				child.exitCode,
				child.signalCode,
				outputIsPiped(options.stdout) ? toUint8Array(stdout) : undefined,
				outputIsPiped(options.stderr) ? toUint8Array(stderr) : undefined
			));
		});
		(async () => {
			if (options.stdout !== "inherit") return;
			if (NodeProcess.stdout.closed) return;
			for await (const buffer of child.stdout) {
				if (NodeProcess.stdout.closed) break;
				NodeFs.writeSync(NodeProcess.stdout.fd, buffer);
			};
		})();
		(async () => {
			if (options.stderr !== "inherit") return;
			if (NodeProcess.stderr.closed) return;
			for await (const chunk of child.stdout) {
				if (NodeProcess.stderr.closed) break;
				NodeFs.writeSync(NodeProcess.stderr.fd, buffer);
			};
		})();
	});
};

/** @param {string|URL} command
* @param {import("../../index/index.d.mts").LeafCommandOptions} options */
export function spawnAndWaitSync(command, optionOrArgs, options) {
	/** @type {string[]?} */
	let args;
	if (optionOrArgs instanceof Array) {
		args = optionOrArgs ?? [];
		options = options ?? {};
	} else if (options == null) {
		options = optionOrArgs ?? {};
		optionOrArgs = undefined;
		args = options.args ?? [];
	};
	const translatedOptions = fromDenoModern(options, true);
	if (!options?.clearEnv) {
		_leaf_copyTo_(translatedOptions.env, env.toObject());
	};
	const result = NodeChildProcess.spawnSync(command, deepUnwrap(args), translatedOptions);
	if (
		result?.error &&
		typeof result.error.signal === "undefined" &&
		typeof result.error.killed === "undefined"
	) throw(result.error);
	return new LeafCommandOutput(
		result?.status,
		result?.signal,
		result?.stdout && toUint8Array(result.stdout),
		result?.stderr && toUint8Array(result.stderr)
	);
};