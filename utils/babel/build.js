// Helper to build bundled scripts for Windows XP with Deno
"use strict";

import Babel from "../../libs/babel/standalone.js";
console.debug(Babel);

if (!Deno.args[0]) {
	throw(`No build target was provided!`);
};

let code = await Deno.readTextFile(Deno.args[0]),
legacy;
let opt = JSON.parse(await Deno.readTextFile(`../../conf/babel.json`));
await Babel.transform(code, opt, (err, result) => {
	if (err) {
		console.error(`The Babel transpiler has encountered an error.`);
		console.error(err);
	} else {
		legacy = result.code;
	};
});
await Deno.writeTextFile(Deno.args[0], legacy);
