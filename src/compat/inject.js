"use strict";

{
	// Compatibility for Windows XP (FF 52 ESR, GC 59)
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
