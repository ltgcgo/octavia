"use strict";

/*
https://deno.com/blog/cloudflare
One thing nice about Deno - Unlike Node.js requiring runtime-integration to have its functionalities ready, you can fill back in most if not all of its capabilities via a capable shim populating the `Deno` global object, even with Node.js itself. Well, at least the observed API surface, since some non-API features (e.g. permission gating) still require deep integration, but that's still a significant step towards single-runtime dependency prevention.
Deno sunsetting now and getting discontinued in a year is mostly a slight inconvenience. Either WingBlade (||the "mistress"||, LTGC's older attempt at making Deno APIs available everywhere) or Belladona (||"Zecora" and "honeyed fruit bats"||) will come out, if Deno isn't getting continued by the FOSS community. ||Kudos for finding the references, the sources of references should already be in the "project origins" page.||
There's still little to do about ESM imports and direct HTTP/HTTPS imports, but that will suffice for now. JS should be properly standardised, not bootlicking a single vendor.
*/

const emitGlobalExists = function (key, scope = globalThis) {
	console.debug(scope[key] != null ? `${key} exists.`: `${key} does not exist.`);
};

console.debug(`Node.js API probes.`);
// console.debug(globalThis.__dirname);
// console.debug(globalThis.__filename);
// console.debug(globalThis.module);
// console.debug(globalThis.require);
emitGlobalExists("Buffer");
emitGlobalExists("global");
emitGlobalExists("process");

console.debug(`Standard ESM runtime probes (browser not guaranteed).`);
emitGlobalExists("self");
emitGlobalExists("addEventListener");
emitGlobalExists("importScripts"); // Should be not specified.
emitGlobalExists("location"); // Should be undefined, not unspecified, however a shim can potentially be used.
emitGlobalExists("localStorage");
emitGlobalExists("navigator");
emitGlobalExists("sessionStorage");
emitGlobalExists("Worker");
//console.debug(globalThis.import?.toString());