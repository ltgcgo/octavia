// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { LeafTeletypeDimensions } from "../../common/class/io.mjs";
import {
	LeafStandardSink,
	LeafStandardTeleTypeInput
} from "./stdio.mjs";

import NodeProcess from "node:process";
import NodeUtil from "node:util";

export function consoleSize() {
	if (NodeProcess.stdout?.columns > 0 && NodeProcess.stdout?.rows > 0) {
		return new LeafTeletypeDimensions(
			NodeProcess.stdout.rows,
			NodeProcess.stdout.columns
		);
	} else if (NodeProcess.stderr?.columns > 0 && NodeProcess.stderr?.rows > 0) {
		return new LeafTeletypeDimensions(
			NodeProcess.stderr.rows,
			NodeProcess.stderr.columns
		);
	};
	throw(new Error("Could not get console size: stdin, stdout, and stderr are not connected to a terminal"));
};
/** @param {import("../../index/index.d.mts").LeafInspectOptions} options  */
export function inspect(value, options) {
	const {
		breakLength,
		colors,
		compact,
		depth,
		//escapeSequences, // Unused!
		getters,
		iterableLimit,
		showHidden,
		showProxy,
		sorted,
		strAbbreviateSize,
		//trailingComma
	} = options ?? {};
	return NodeUtil.inspect(value, {
		breakLength: breakLength ?? 80,
		colors: colors ?? false,
		compact: compact ?? true,
		customInspect: false, // Nope!
		depth: depth ?? 4,
		getters: getters ?? false,
		maxArrayLength: iterableLimit ?? 100,
		maxStringLength: strAbbreviateSize,
		numericSeparator: false,
		showHidden: showHidden ?? false,
		showProxy: showProxy ?? false,
		sorted: sorted ?? false
	});
};

export const stderr = new LeafStandardSink(NodeProcess.stderr);
export const stdin = new LeafStandardTeleTypeInput(NodeProcess.stdin);
export const stdout = new LeafStandardSink(NodeProcess.stdout);