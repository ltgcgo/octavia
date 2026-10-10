"use strict";

// node --import utils/denode/removal.mjs

delete globalThis.Buffer;
delete globalThis.global;
delete globalThis.process;
const realImport = globalThis.import;
globalThis.import = function (specifier) {
	// Likely doesn't work if the runtime proritises the real one.
	if (/^(node|npm):/mi.test(specifier)) {
		return import(`rejected.node:${specifier}`);
	};
	if (!/^\x2E+\x2F[A-Za-z0-9_\x2D\x2F]+\x2E(m)?js/mi.test(specifier)) {
		return import(`rejected.sloppy:${specifier}`);
	};
	if (!/^\x2E+\x2F/mi.test(specifier)) {
		specifier = "./" + specifier;
	};
	return import(specifier);
};
console.debug(globalThis.import === realImport);