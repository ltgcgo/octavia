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
	return denoEnvApi?.get("VERGILIUS_PRINT_TRACE")?.length > 0 ?? false;
};
export function getPrintInternal() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_PRINT_STACK")?.length > 0 ?? false;
};
export function getPrisonWarden() {
	requestDeno();
	return denoEnvApi?.get("VERGILIUS_WARDEN")?.length > 0 ?? false;
};