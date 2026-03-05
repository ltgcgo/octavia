// WTFPL
// Requires Deno for now

"use strict";

import TextReader from "https://jsr.io/@ltgc/rochelle/0.2.8/dist/textRead.mjs";
import DSVParser from "https://jsr.io/@ltgc/rochelle/0.2.8/dist/dsvParse.mjs";
import * as esbuild from "https://deno.land/x/esbuild@v0.27.3/mod.js";
import {
	denoPlugins
} from "jsr:@luca/esbuild-deno-loader@^0.11.1";

for await (let entry of DSVParser.parseObjects(0, TextReader.line((await Deno.open(Deno.args[0] ?? "./deno/bundle/targets.tsv")).readable))) {
	console.debug(entry);
};

/* await esbuild.build({
	"plugins": [...denoPlugins()],
	"outfile": `./deno/artifact/${Deno.args[0]}.js`,
	"bundle": true,
	"format": "esm",
	"entryPoints": [Deno.args[1]]
});

esbuild.stop(); */