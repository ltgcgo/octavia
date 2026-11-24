"use strict";

/** @param {Function} func */
const displayError = function (func) {
	try {
		func();
	} catch (err) {
		console.error(`${err.name}: ${err.message}`);
	};
};

displayError(function () {
	console.debug(Deno.consoleSize()); // How the hell can I detach TTY?
});
displayError(function () {
	console.debug(Deno.kill(11451419, "SIGHORNYDEER"));
});