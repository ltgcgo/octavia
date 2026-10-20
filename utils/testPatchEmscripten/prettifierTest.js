"use strict";

// Serious use require a patched ESM version. This has to suffice for now.
import "https://unpkg.com/js-beautify@2.0.3/js/lib/beautifier.min.js";
import prettifierConf from "./prettifierConf.json" with {"type": "json"};

//console.debug(prettifierConf);
if (!Deno.args?.length > 0) Deno.exit(1);
if (!Deno.args[0]?.length > 0) Deno.exit(1);
const targetSource = `./${Deno.args[0]}`;
const targetDest = `./${Deno.args[0]}.txt`;
{
	/** @type {import("./beautify.d.mts").Beautifier} */
	const beautifier = self.beautifier;
	await Deno.writeTextFile(
		targetDest,
		beautifier.js(
			await Deno.readTextFile(targetSource),
			prettifierConf
		)
	);
};