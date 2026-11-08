// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	LeafEnvSnapshot
} from "../../common/class/systemInfo.mjs";

import NodeProcess from "node:process";
import { assertString } from "../../common/util/typeGuard.mjs";

const LeafEnv = class LeafEnv {
	delete(key) {
		assertString(key);
		delete NodeProcess.env[key];
	};
	get(key) {
		assertString(key);
		const value = NodeProcess.env[key];
		return typeof value === "string" ? value : undefined;
	};
	has(key) {
		assertString(key);
		return key in NodeProcess.env ? typeof NodeProcess.env[key] === "string" : false;
	};
	set(key, value) {
		assertString(key);
		assertString(value);
		NodeProcess.env[key] = value;
	};
	toObject() {
		return new LeafEnvSnapshot(NodeProcess.env);
	};
};

export const env = new LeafEnv();