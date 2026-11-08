// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

// Load this script after the Deno global has been made available.
// This script is used to supply polyfills utilising the Deno global.

export function close() {
	Deno.exit();
};