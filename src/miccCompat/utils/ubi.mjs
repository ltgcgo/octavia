// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

"use strict";

/** @typedef {string|ArrayBuffer|Uint8Array|Uint8ClampedArray|HTMLInputElement|Blob|File|ReadableStream<Uint8Array>|AsyncIterable<Uint8Array>} UnifiedBinaryIntake */

/** @param {UnifiedBinaryIntake} intake
* @returns {ReadableStream<Uint8Array>|AsyncIterable<Uint8Array>} */
export default function toByteStream(intake) {};