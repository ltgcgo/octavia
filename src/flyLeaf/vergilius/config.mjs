// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { IsDenoRepl } from "../common/class/matchers.mjs";

/** @type {import("../index/index.d.mts").default} */
let denoApi;
/** @type {import("../index/index.d.mts").LeafEnv} */
let denoEnvApi;
const requestDeno = function () {
	denoApi = denoApi ?? globalThis.Deno;
	denoEnvApi = denoEnvApi ?? denoApi?.env;
};

export function getAllowOldWeb() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_ALLOW_OLD_WEB")?.length > 0 ?? false;
};
export function getSkipCheck() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_SKIP_CHECK")?.length > 0 ?? false;
};
export function getIsReplSession() {
	requestDeno();
	return IsDenoRepl.test(denoApi?.mainModule);
};
export function getPrintInternal() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_PRINT_STACK")?.length > 0 ?? false;
};
export function getPrintProxy() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_PRINT_PROXY")?.length > 0 ?? false;
};
export function getPrintTrace() {
	requestDeno();
	const traceConfig = denoEnvApi?.get("VERGILIUS_PRINT_TRACE");
	if (traceConfig?.length > 0) {
		switch (traceConfig.toLowerCase()) {
			case "light":
			case "lite":
			case "superficial": {
				return 1;
			};
			case "common":
			case "medium":
			case "middle":
			case "normal": {
				return 2;
			};
			case "debug":
			case "deep":
			case "extra":
			case "high":
			case "premium":
			case "pro":
			case "super":
			case "verbose": {
				return 3;
			};
			case "horni":
			case "iceberg":
			case "insane":
			case "unhinged": {
				return 4;
			};
			default: {
				const parseResult = parseInt(traceConfig);
				if (Number.isSafeInteger(parseResult)) {
					return parseResult
				} else {
					return 0;
				};
			};
		};
	} else {
		return 0;
	};
};
export function getPrisonWarden() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_WARDEN")?.length > 0 ?? false;
};