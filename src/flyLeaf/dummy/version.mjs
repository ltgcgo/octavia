"use strict";

{
	// Oh hey, Deno autocomplete without Deno!
	/** @type {import("../index/index.d.mts")} */
	const Deno = self.Deno;
	console.debug(Deno.version.deno);
	console.debug(Deno.version.backend);
	console.debug(Deno.version.engine);
};