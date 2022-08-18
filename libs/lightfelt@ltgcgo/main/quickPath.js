"use strict";

let $e = function (selector, source = document) {
	return source?.querySelector(selector);
};
let $a = function (selector, source = document) {
	return Array.from(source?.querySelectorAll(selector));
};

export {
	$e,
	$a
};
