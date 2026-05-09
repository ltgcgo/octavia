// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import EnsembleUtilMethods from "./utils.js";
import {
	EnsembleResamplerEntry,
	EnsembleResampler
} from "./base.js";
import {
	ResampleNearestNeighbour,
	ResampleLinear
} from "./stock.js";

const EnsembleResamplerRegistry = class EnsembleResamplerRegistry {
	static #registry = new Map();
	static has = this.#registry.has.bind(this.#registry);
	static keys = this.#registry.keys.bind(this.#registry);
	static get(id) {
		let reg = this.#registry;
		if (!reg.has(id)) {
			throw(new Error(`The resampler "${id}" isn't registered.`));
		};
		return new EnsembleResampler(id, reg.get(id));
	};
	static register(id, entry) {
		if (typeof id !== "string") {
			throw(new TypeError(`The identifier must be a string.`));
		};
		let reg = this.#registry;
		if (reg.has(id)) {
			throw(new Error(`The identifier "${id}" has already been registered.`))
		};
		if (entry === null || entry === undefined) {
			throw(new TypeError(`The registered entry must be defined.`));
		};
		if (typeof entry.get !== "function") {
			throw(new TypeError(`The get method must be a function.`));
		};
		if (entry.setStep != null && typeof entry.setStep !== "function") {
			throw(new TypeError(`The step setter must be null or a function.`));
		};
		if (entry.setSampleRatio != null && typeof entry.setSampleRatio !== "function") {
			throw(new TypeError(`The sample ratio setter must be null or a function.`));
		};
		reg.set(id, entry);
	};
};

EnsembleResamplerRegistry.register("nearest", ResampleNearestNeighbour);
EnsembleResamplerRegistry.register("linear", ResampleLinear);

export {
	EnsembleUtilMethods,
	EnsembleResamplerEntry,
	EnsembleResampler,
	EnsembleResamplerRegistry
};
