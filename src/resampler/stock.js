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
	// 0: Window size on either side of the time step.
	// 1: The weight of the outermost sample.
	if (x >= 1) {
		let preDivisor = 1;
		this.precomputed[0] = 1;
		this.precomputed[1] = 1;
	} else {
		let preDivisor = 1 / x;
		this.precomputed[0] = Math.ceil(preDivisor);
		this.precomputed[1] = preDivisor - Math.floor(preDivisor);
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
		// Calculate weighted linear, reused from another function. WIP!
	};
};

export {
	ResampleNearestNeighbour,
	ResampleLinear
};
