"use strict";

/** @param selector {string}
* @param source {Document}
* @returns {HTMLElement} */
const $e = function $e (selector, source = document) {
	return source?.querySelector(selector);
};
/** @param selector {string}
* @param source {Document}
* @returns {HTMLElement} */
const $a = function $a (selector, source = document) {
	return Array.from(source?.querySelectorAll(selector));
};
/** @param selector {string}
* @returns {HTMLElement} */
HTMLElement.prototype.$e = function $e (selector) {
	return this.querySelector(selector);
};
/** @param selector {string}
* @returns {HTMLElement} */
HTMLElement.prototype.$a = function $a (selector) {
	return this.querySelectorAll(selector);
};

export {
	$e,
	$a
};
