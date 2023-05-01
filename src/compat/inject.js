"use strict";

import {} from "../../libs/snowy@ltgcgo/bc.js";

// Compatibility for Windows XP (FF 52 ESR, GC 59)
{
	// Direct blob reads
	let fileReadAs = function (blob, target) {
		let reader = new FileReader();
		return new Promise((success, failure) => {
			reader.addEventListener("abort", () => {
				failure(new Error("Blob read aborted"));
			});
			reader.addEventListener("error", (ev) => {
				failure(reader.error || ev.data || new Error("Blob read error"));
			});
			reader.addEventListener("load", () => {
				success(reader.result);
			});
			switch (target.toLowerCase()) {
				case "arraybuffer":
				case "buffer": {
					reader.readAsArrayBuffer(blob);
					break;
				};
				case "string":
				case "text": {
					reader.readAsText(blob);
					break;
				};
				default: {
					failure(new Error(`Unknown target ${target}`));
				};
			};
		});
	};
	Blob.prototype.arrayBuffer = Blob.prototype.arrayBuffer || function () {
		return fileReadAs(this, "buffer");
	};
	Blob.prototype.text = Blob.prototype.text || function () {
		return fileReadAs(this, "text");
	};
};
{
	// A working replaceAll implementation
	String.prototype.replaceAll = String.prototype.replaceAll || function (source, target) {
		let antiLoop = 0, maxSafe = 16;
		let indexFinder = this, indexes = [];
		while (antiLoop < maxSafe && indexFinder.lastIndexOf(source) > -1) {
			let index = indexFinder.lastIndexOf(source);
			indexes.unshift(indexFinder.slice(index + source.length));
			indexFinder = indexFinder.slice(0, index);
			if (index == 0) {
				indexes.unshift("");
			};
			antiLoop ++;
		};
		if (indexFinder.length) {
			indexes.unshift(indexFinder);
		};
		return indexes.join(target) || "";
	};
	String.prototype.padStart = String.prototype.padStart || function (length, filler) {
		if (filler) {
			let result = this;
			while (result.length < length) {
				result = `${filler}${result}`;
			};
			return result;
		};
	};
	String.prototype.padEnd = String.prototype.padEnd || function (length, filler) {
		if (filler) {
			let result = this;
			while (result.length < length) {
				result += filler;
			};
			return result;
		};
	};
};
