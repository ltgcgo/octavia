"use strict";

export default class FailRecord {
	/** @type {Error} */
	error;
	/** @type {string} */
	fileName;
	/** @type {number} */
	offset;
	/** @param {string} fileName 
	* @param {number} offset 
	* @param {Error} error  */
	constructor(fileName, offset, error) {
		this.fileName = fileName;
		this.offset = offset;
		this.error = error;
	};
};