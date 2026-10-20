"use strict";

// Serious use require a patched ESM version. This has to suffice for now, just a test anyway.
import "https://unpkg.com/js-beautify@2.0.3/js/lib/beautifier.min.js";
import prettifierConf from "./prettifierConf.json" with {"type": "json"};
import esbuildConf from "./esbuildConf.json" with {"type": "json"};
import {
	stop,
	transform
} from "../../deno/artifact/esbuild.js";

const obfuscationTableFilter = /function \w+\(\w+\)\{([0-9A-Za-z_]+=(Module\["[0-9A-Za-z_]+"\]=|wasmMemory=|wasmTable=)?wasmExports\["[0-9A-Za-z_$]+"\];?)+\}/m;
const obfuscationEntryFilter = /[0-9A-Za-z_]+=(Module\["[0-9A-Za-z_]+"\]=|wasmMemory=|wasmTable=)?wasmExports\["[0-9A-Za-z_$]+"\];?/gm;
const getDeObfsSymbolTable = (input = "") => {
	const rawPos = input.search(obfuscationTableFilter);
	if (!(rawPos > -1)) {
		console.debug(`No de-obfuscation table found.`);
		return {};
	};
	const rawObfsAssigns = input.match(obfuscationTableFilter)[0];
	if (!rawObfsAssigns?.length > 0) {
		console.debug(`No de-obfuscation content found.`);
		return {};
	};
	const mapStoreD = new Map(), mapKeysD = [];
	const mapStoreO = new Map(), mapKeysO = [];
	for (let entry of rawObfsAssigns.match(obfuscationEntryFilter)) {
		if (entry[entry.length - 1] === ";") {
			entry = entry.substring(0, entry.length - 1);
		};
		const splitEntry = entry.split("=");
		const nameDeobfs = splitEntry[0];
		let nameObfs = splitEntry[splitEntry.length - 1];
		if (nameObfs.indexOf("wasmExports") < 0) {
			console.debug(new Error(`Unknown export line:\n${entry}`));
			continue;
		};
		nameObfs = nameObfs.substring(13);
		nameObfs = nameObfs.substring(0, nameObfs.length - 2);
		if (nameObfs === nameDeobfs) continue;
		mapStoreD.set(nameObfs, nameDeobfs);
		mapStoreO.set(nameDeobfs, nameObfs);
		mapKeysD.push(nameObfs);
		mapKeysO.push(nameDeobfs);
	};
	const resultD = {}, resultO = {};
	for (const key of mapKeysD.sort()) {
		resultD[key] = mapStoreD.get(key);
	};
	for (const key of mapKeysO.sort()) {
		resultO[key] = mapStoreO.get(key);
	};
	return [resultD, resultO];
};

const patchGluePass1 = (input = "") => {
	let patched = input;
	// If the source doesn't use classes, light patching like these can't either.
	patched = patched.replace(/var Module=typeof [A-Za-z0-9_$]+!="undefined"\?[A-Za-z0-9_$]+:\{\};/m, "var Module=new (class GluedEmscriptenModule{})();var testUrl=/^(file|https?|ftps?|sftp):\\/\\//;var safeFetch=async (url,opt)=>{if(testUrl.test(url)){return await fetch(url, opt)}else{if(self.Deno?.open){try{return new Response((await(Deno.open(url))).readable,{headers:{'Content-Type':'application/wasm'}})}catch(err){return new Response('',{status:404,statusText:err.message})}}else{return await fetch(url,opt)}}};");
	// Instantly breaks Node.js.
	patched = patched.replaceAll(/\bglobalThis\b/gm, "self");
	// Gets rid of Node.js test.
	patched = patched.replace(/var ENVIRONMENT_IS_NODE=[A-Za-z!&.=?'"]+;/m, "");
	// Lets bundlers get rid of dead Node.js code.
	patched = patched.replaceAll(/\bENVIRONMENT_IS_NODE\b/gm, "false");
	// Use safe fetches.
	patched = patched.replaceAll(/await fetch\(/gm, "await safeFetch(");
	patched = patched.replaceAll(/=fetch\(/gm, "=safeFetch(");
	// It's 2026 now, use top-level awaits!
	// Not sure if this will be kept if customisable loading is added, will need to find ways to allow supplying custom WASM instances or streams.
	patched = patched.replace("createWasm().then(()=>run());", "await createWasm();run();export default Module;");
	return patched;
};
const patchGlueFinal = async (input = "") => {
	// Minification is needed, because apparently ESBuild includes a prettifier by default?
	return (await transform(input, esbuildConf)).code;
};

//console.debug(prettifierConf);
if (!Deno.args?.length > 0) Deno.exit(1);
if (!Deno.args[0]?.length > 0) Deno.exit(1);
const targetSource = `./${Deno.args[0]}`;
const sourceText = await Deno.readTextFile(targetSource);

{
	/** @type {import("./beautify.d.mts").Beautifier} */
	const beautifier = self.beautifier;
	await Deno.writeTextFile(
		`${targetSource.replace(/\.js$/m, ".obfs.json")}`,
		JSON.stringify(getDeObfsSymbolTable(sourceText), null, "\t")
	)
	const patchedText = patchGluePass1(sourceText);
	await Deno.writeTextFile(
		`${targetSource.replace(/\.js$/m, ".patch.js")}`,
		patchedText
	)
	await Deno.writeTextFile(
		`${targetSource.replace(/\.js$/m, ".yield.js")}`,
		beautifier.js(
			patchedText,
			prettifierConf
		)
	);
	const patchedFinal = await patchGlueFinal(patchedText);
	await Deno.writeTextFile(
		`${targetSource.replace(/\.js$/m, ".final.js")}`,
		patchedFinal
	);
	stop();
};