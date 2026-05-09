// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import {
	EnsembleResamplerEntry
} from "./base.js";
import EnsembleUtilMethods from "./utils.js";

// Nearest neighbour
let ResampleNearestNeighbour = new EnsembleResamplerEntry();
ResampleNearestNeighbour.get = function (timeStep, samples, oldSamples) {
	return EnsembleUtilMethods.stepSample(Math.round(timeStep), samples, oldSamples);
};

// Linear
let ResampleLinear = new EnsembleResamplerEntry();
ResampleLinear.pcaSize = 2;
ResampleLinear.setSampleRatio = function (x) {
	// 0: Pre-computed divisor-equivalent factor for the sum.
	// 1: Window size on either side of the time step.
	// 2: The weight of the outermost sample.
	if (x >= 1) {
		this.precomputed[0] = 0.5;
		// This looks just like the cutoff factor... Nevermind!
		this.precomputed[1] = 1;
		this.precomputed[2] = 1;
	} else {
		let preDivisor = 1 / x;
		if (preDivisor > 48) {
			preDivisor = 48;
		};
		this.precomputed[1] = Math.ceil(preDivisor);
		this.precomputed[2] = preDivisor - Math.floor(preDivisor);
		if (this.precomputed[2] === 0) {
			this.precomputed[2] = 1; // Why didn't I think of this edge case before?
		};
		this.precomputed[0] = EnsembleUtilMethods.cutoffFactor(x);
	};
};
ResampleLinear.get = function (timeStep, samples, oldSamples) {
	let slenm1 = samples.length - 1;
	if (this.sampleRatio >= 1) {
		// Just a simple linear operation.
		if (timeStep <= 0) {
			return samples[0];
		} else if (timeStep >= slenm1) {
			return samples[slenm1];
		} else if (Number.isInteger(timeStep)) {
			return samples[timeStep];
		} else {
			let leftIndex = Math.floor(timeStep);
			let rightFactor = timeStep - leftIndex;
			return samples[leftIndex] * (1 - rightFactor) + samples[leftIndex + 1] * rightFactor;
		};
	} else {
		// This is weighted linear with a box filter.
		let leftCentreStep = Math.floor(timeStep),
		edgeK = this.precomputed[1] - 1,
		sum = 0;
		for (let k = 0; k < this.precomputed[1]; k ++) {
			let leaves = EnsembleUtilMethods.stepSample(leftCentreStep - k, samples, oldSamples) + EnsembleUtilMethods.stepSample(leftCentreStep + 1 + k, samples, oldSamples);
			if (k === edgeK && this.precomputed[2] !== 1) {
				sum += this.precomputed[2] * leaves;
			} else {
				sum += leaves;
			};
		};
		return sum * this.precomputed[0];
	};
};

export {
	ResampleNearestNeighbour,
	ResampleLinear
};
