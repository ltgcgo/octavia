// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

/** Shared properties for all parser shims. */
export default class UnifiedShimBase {
	static debug = false;
	/** @type {Iterable<TextDecoder>?} */
	static decoders = BinaryString.getDecoders(["utf-8", "sjis"]);
	static extended = true;
};