// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

/** @type {import("../index/index.d.mts").LeafEnv} */
let denoEnvApi;
const requestDeno = function () {
	denoEnvApi = denoEnvApi ?? globalThis.Deno?.env;
};

export function getSkipCheck() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_SKIP_CHECK")?.length > 0 ?? false;
};
export function getPrintTrace() {
	requestDeno();
	const traceConfig = denoEnvApi?.get("VERGILIUS_PRINT_TRACE");
	if (traceConfig?.length > 0) {
		switch (traceConfig.toLowerCase()) {
			case "common":
			case "medium":
			case "middle":
			case "normal": {
				return 2;
			};
			case "debug":
			case "deep":
			case "high":
			case "verbose": {
				return 3;
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
export function getPrintInternal() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_PRINT_STACK")?.length > 0 ?? false;
};
export function getPrisonWarden() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_WARDEN")?.length > 0 ?? false;
};