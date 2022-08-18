"use strict";

let CustomEventSource = class {
	#eventListeners = {};
	addEventListener(type, callback) {
		if (!this.#eventListeners[type]) {
			this.#eventListeners[type] = [];
		};
		this.#eventListeners[type].unshift(callback);
	};
	removeEventListener(type, callback) {
		if (this.#eventListeners[type]) {
			let index = this.#eventListeners[type].indexOf(callback);
			if (index > -1) {
				this.#eventListeners[type].splice(index, 1);
			};
			if (this.#eventListeners[type].length < 1) {
				delete this.#eventListeners[type];
			};
		};
	};
	dispatchEvent(type) {
		// Can add a proxy to allow stopping propagation
		let eventObj = new Event(type),
		upThis = this;
		if (this.#eventListeners[type]?.length > 0) {
			this.#eventListeners[type].forEach(function (e) {
				e?.call(upThis, eventObj);
			});
		};
		if (this[`on${type}`]) {
			this[`on${type}`](eventObj);
		};
	};
};

export {
	CustomEventSource
};
