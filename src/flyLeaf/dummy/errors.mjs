"use strict";

/** @param {Function} func */
const displayError = function (func) {
	try {
		func();
	} catch (err) {
		console.error(err);
	};
};

displayError(function () {
	console.debug(Deno.consoleSize()); // How the hell can I detach TTY?
});