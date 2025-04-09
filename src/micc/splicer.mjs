// Copyright 2024-2025 (C) Lightingale Community
// Licensed under GNU LGPL 3.0

// This is a part of Rochelle stream splicer. Currently placed here for the ease of development, however this should not be considered as if this component belongs here.

const StreamQueue = class StreamQueue {
	#controller;
	#pullPromise;
	#closedResolve;
	closed = false;
	closure;
	cancelled;
	readable;
	constructor(underlyingSource = {}, queuingStrategy) {
		let upThis = this;
		let enqueueResolve, enqueueReject, cancelledResolve;
		upThis.cancelled = new Promise((p) => {
			cancelledResolve = p;
		});
		upThis.closure = new Promise((p) => {
			upThis.#closedResolve = p;
		})
		upThis.readable = new ReadableStream({
			"type": underlyingSource.type,
			"autoAllocateChunkSize": underlyingSource.autoAllocateChunkSize,
			"cancel": async (reason) => {
				enqueueReject(reason);
				cancelledResolve(reason);
				upThis.#closedResolve();
				upThis.closed = true;
				underlyingSource.cancelled?.call(upThis, reason);
			},
			"start": async (controller) => {
				upThis.#controller = controller;
				console.debug(`Stream start.`);
				underlyingSource.start?.call(upThis, new Proxy(controller, {
					"get": (target, key) => {
						switch (key) {
							case "enqueue":
							case "error":
							case "close": {
								return upThis[key];
								break;
							};
							default: {
								return target[key];
							};
						};
					}
				}));
				console.debug(`Source start called.`);
				upThis.#pullPromise = new Promise((p, r) => {
					enqueueResolve = p;
					enqueueReject = r;
				});
			},
			"pull": async (controller) => {
				enqueueResolve();
				upThis.#pullPromise = new Promise((p, r) => {
					enqueueResolve = p;
					enqueueReject = r;
				});
				console.debug(`Stream pull.`);
			}
		}, queuingStrategy);
	};
	enqueue(chunk) {
		this.#controller.enqueue(chunk);
		return this.#pullPromise;
	};
	close() {
		let upThis = this;
		upThis.#controller.close();
		upThis.#closedResolve();
		upThis.closed = true;
	};
	error(err) {
		let upThis = this;
		upThis.#controller.error(err);
		upThis.#closedResolve();
		upThis.closed = true;
	};
	pipeFrom(source) {
		(async () => {
			for await (let chunk of source) {
				await this.enqueue(chunk);
			};
		})();
	};
};
const StreamServe = class StreamServe {};
const ChokerStream = class ChokerStream {};

export {
	StreamQueue,
	StreamServe,
	ChokerStream
}
