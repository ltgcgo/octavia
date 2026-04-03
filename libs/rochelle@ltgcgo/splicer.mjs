// 2024-2026 © Lightingale Community
// Licensed under GNU LGPL 3.0

"use strict";

const StreamQueue = class StreamQueue {
	#controller;
	#pullPromise;
	#closedResolve;
	#isBusy = false;
	debugMode = false;
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
			"type": underlyingSource?.type,
			"autoAllocateChunkSize": underlyingSource?.autoAllocateChunkSize,
			"cancel": async (reason) => {
				enqueueReject(reason);
				cancelledResolve(reason);
				upThis.#closedResolve();
				upThis.closed = true;
				underlyingSource?.cancelled?.call(upThis, reason);
				upThis.debugMode && console.debug(`Stream cancel.`);
			},
			"start": async (controller) => {
				upThis.#controller = controller;
				upThis.debugMode && console.debug(`Stream start.`);
				underlyingSource?.start?.call(upThis, new Proxy(controller, {
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
				upThis.debugMode && console.debug(`Source start called.`);
				upThis.#pullPromise = new Promise((p, r) => {
					enqueueResolve = p;
					enqueueReject = r;
				});
			},
			"pull": async (controller) => {
				upThis.#isBusy = false;
				enqueueResolve();
				upThis.#pullPromise = new Promise((p, r) => {
					enqueueResolve = p;
					enqueueReject = r;
				});
				upThis.debugMode && console.debug(`Stream pull.`);
			}
		}, queuingStrategy);
	};
	enqueue(chunk) {
		if (this.#isBusy) {
			throw(new Error("Tried to enqueue data without backpressure relief."));
		};
		this.#controller.enqueue(chunk);
		this.#isBusy = true;
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
};
