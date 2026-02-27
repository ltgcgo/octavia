"use strict";

import TextReader from "../../libs/rochelle@ltgcgo/textRead.mjs";
import DSVParser from "../../libs/rochelle@ltgcgo/dsvParse.mjs";

export default class StylePool {
	#models = new Map();
	setStyle(dev = 0, id = 0, short, full) {
		let upThis = this;
		if (!upThis.#models.has(dev)) {
			upThis.#models.set(dev, new Map());
		};
		return upThis.#models.get(dev).set(id, {
			short,
			full
		});
	};
	removeStyle(dev, id) {
		if (this.#models.has(dev)) {
			let model = this.#models.get(dev);
			return model.delete(id);
		};
		return false;
	};
	getStyle(dev, id) {
		if (this.#models.has(dev)) {
			return this.#models.get(dev).get(id);
		};
	};
	async load(stream) {
		//let objStream = TextReader.line(stream);
		//let objStream = DSVParser.parse(0, TextReader.line(stream));
		let objStream = DSVParser.parseObjects(0, TextReader.line(stream));
		//console.debug(objStream);
		for await (let {model, id, shortName, fullName} of objStream) {
			this.setStyle(parseInt(model, 16), parseInt(id, 16), shortName, fullName);
		};
	};
};
