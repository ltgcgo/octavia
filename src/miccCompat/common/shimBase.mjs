// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

import { BinaryString } from "../../../libs/rochelle@ltgcgo/binaryString.mjs";

/** Shared properties for all parser shims. */
export default class UnifiedShimBase {
	static debug = false;
	/** @type {Iterable<TextDecoder>?} */
	static decoders = BinaryString.getDecoders(["utf-8", "l9", "sjis"]);
	static extended = true;
};