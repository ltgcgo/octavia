"use strict";

let BlobDecoder = class {
	#collection = {};
	context;
	set(format, decoder) {
		this.#collection[format] = decoder;
	};
	has(format) {
		return !!this.#collection[format];
	};
	async read(format, blob) {
		if (!this.has(format)) {
			throw(new Error(`No decoder registered for "${format}"`));
		};
		return await this.#collection[format].call(this.context || this, blob);
	};
};

export {
	BlobDecoder
};
