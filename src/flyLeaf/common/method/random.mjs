// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

const b64Pool = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";
const dummyU8 = new Uint8Array(16);
const dummyU8B64 = dummyU8.subarray(0, (dummyU8.length * 3) >>> 2);

export const getRandom16 = typeof Uint8Array.toBase64 === "function" ? function () {
	crypto.getRandomValues(dummyU8B64);
	return dummyU8B64.toBase64({"alphabet": "base64url"});
}: function () {
	crypto.getRandomValues(dummyU8);
	let result = "";
	for (let i = 0; i < dummyU8.length; i ++) {
		result += b64Pool[dummyU8[i] & 63];
	};
	return result;
};