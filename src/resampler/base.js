// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

const DEFAULT_SAMPLE_RATIO = 1;
const DEFAULT_STEP = 2;

const EnsembleResamplerEntry = class EnsembleResamplerEntry {
	get;
	sampleRatio = DEFAULT_SAMPLE_RATIO;
	setSampleRatio;
	step = DEFAULT_STEP;
	setStep;
};
const EnsembleResampler = class EnsembleResampler {
	#recursionGuard = 8;
	#recursionDepth = 0;
	#id;
	#sampleRatioSetter;
	#stepSetter;
	sampleRatio = DEFAULT_SAMPLE_RATIO;
	step = DEFAULT_STEP;
	get id() {
		return this.#id;
	};
	setSampleRatio(x) {
		this.sampleRatio = x;
		if (typeof this.#sampleRatioSetter === "function") {
			this.#recursionDepth ++;
			if (this.#recursionDepth > this.#recursionGuard) {
				throw(new RangeError(`Maximum call stack size ${this.#recursionGuard} reached.`));
			};
			try {
				this.#sampleRatioSetter(x);
			} catch (err) {
				console.error(err);
			};
			this.#recursionDepth --;
		};
	};
	setStep(x) {
		this.step = x;
		if (typeof this.#stepSetter === "function") {
			this.#recursionDepth ++;
			if (this.#recursionDepth > this.#recursionGuard) {
				throw(new RangeError(`Maximum call stack size ${this.#recursionGuard} reached.`));
			};
			try {
				this.#stepSetter(x);
			} catch (err) {
				console.error(err);
			};
			this.#recursionDepth --;
		};
	};
	get;
	constructor(id, entry) {
		let upThis = this;
		upThis.#id = id;
		upThis.#sampleRatioSetter = entry.setSampleRatio?.bind(this);
		upThis.#stepSetter = entry.setStep?.bind(this);
		upThis.get = entry.get;
		upThis.setStep(entry.step ?? DEFAULT_STEP);
		upThis.setSampleRatio(entry.sampleRatio ?? DEFAULT_SAMPLE_RATIO);
	};
};

export {
	EnsembleResamplerEntry,
	EnsembleResampler
};
