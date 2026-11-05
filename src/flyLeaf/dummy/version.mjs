"use strict";

{
	// Oh hey, Deno autocomplete without Deno!
	/** @type {import("../index/index.d.mts")} */
	const Deno = self.Deno;
	console.debug(`--- Deno version ---`);
	console.debug(`API version: ${Deno?.version?.deno ?? "Not supplied"}`);
	console.debug(`Fly Leaf: ${Deno?.version?.flyLeaf ?? "Not loaded"}`);
	console.debug(`Backend: ${Deno?.version?.backend ?? "Not supplied"}`);
	console.debug(`Engine: ${Deno?.version?.engine ?? "Not supplied"}`);
	console.debug(`--- Build version ---`);
	console.debug(`CPU arch: ${Deno?.build?.arch ?? "Not supplied"} (${Deno?.build?.archNormal ?? "not supplied"})`);
	console.debug(`OS: ${Deno?.build?.os ?? "Not supplied"}`);
	console.debug(`Vendor: ${Deno?.build?.vendor ?? "Not supplied"}`);
	console.debug(`LLVM target: ${Deno?.build?.target ?? "Not supplied"}`);
	console.debug(`--- Execution context ---`);
	console.debug(`Has colour: ${Deno.noColor ? "No" : "Yes"}`);
	console.debug(`Arguments: ${Deno.args.length > 0 ? "\"" + Deno?.args?.join("\" \"") + "\"" : "Not supplied"}`);
	console.debug(`Script location: ${Deno?.mainModule ?? "Not supplied"}`);
};