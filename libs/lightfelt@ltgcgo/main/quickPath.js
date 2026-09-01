"use strict";

const $e = function $e (selector, source = document) {
	return source?.querySelector(selector);
};
const $a = function $a (selector, source = document) {
	return Array.from(source?.querySelectorAll(selector));
};
HTMLElement.prototype.$e = function $e (selector) {
	return this.querySelector(selector);
};
HTMLElement.prototype.$a = function $a (selector) {
	return this.querySelectorAll(selector);
};

export {
	$e,
	$a
};
