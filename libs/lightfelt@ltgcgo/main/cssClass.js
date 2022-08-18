"use strict";

DOMTokenList.prototype.on = function (classNme) {
	!this.contains(classNme) && this.toggle(classNme);
};
DOMTokenList.prototype.off = function (classNme) {
	this.contains(classNme) && this.toggle(classNme);
};
