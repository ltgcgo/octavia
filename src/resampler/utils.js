// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

export default class EnsembleUtilMethods {
	static stepSample(i, samples, oldSamples) {
		if (i >= samples.length) {
			return samples[samples.length - 1];
		} else if (i >= 0) {
			return samples[i];
		} else if (oldSamples?.length > 0) {
			let idx = oldSamples.length + i;
			if (idx < 0) {
				idx = 0;
			};
			return oldSamples[idx];
		};
		return samples[0];
	};
	static cutoffFactor(sampleRatio = 1) {
		if (sampleRatio <= 0 || !Number.isFinite(sampleRatio)) {
			throw(new RangeError("The sample ratio must be a finite float above 0."));
		};
		return sampleRatio < 1 ? 0.5 * sampleRatio : 0.5;
	};
	static sincThreshold = 1E-12;
	static sinc(x) {
		if (Math.abs(x) < this.sincThreshold) {
			return 1;
		};
		let xPi = x * Math.PI;
		return Math.sin(xPi) / xPi;
	};
	static modifiedBessel(x, isFast = true) {
		if (isFast) {
			// Milton Abramowitz and Irene Stegun: Handbook of Mathematical Functions - 9.8
			let xAbs = Math.abs(x);
			if (xAbs === 3.75) {
				return 9.118945897;
			} else if (xAbs === 0) {
				return 1;
			} else if (xAbs < 3.75) {
				let a = xAbs * 0.2666666667;
				let aSqr = a * a;
				return 1 + aSqr * (3.5156229 + aSqr * (3.0899424 + aSqr * (1.2067492 + aSqr * (0.2659732 + aSqr * (0.0360768 + aSqr * 0.0045813)))));
			};
			let a = 3.75 / xAbs;
			return (Math.exp(xAbs) / Math.sqrt(xAbs)) * (0.39894228 + a * (0.01328592 + a * (0.00225319 + a * (-0.00157565 + a * (0.00916281 + a * (-0.02057706 + a * (0.02635537 + a * (-0.01647633 + a * (0.00392377)))))))));
		} else {
			if (x === 0) {
				return 1;
			};
			let sum = 1;
			let a = 1;
			let b = x * x * 0.25;
			for (let k = 1; k <= 24; k ++) {
				a *= b / (k * k);
				sum += a;
				if (a < Number.EPSILON * sum) {
					break;
				};
			};
			return sum;
		};
	};
	static kaiserWindow(x, b, preB) {
		let xAbs = Math.abs(x);
		if (xAbs > 1) return 0;
		if (typeof preB !== "number") {
			preB = this.modifiedBessel(b);
		};
		return this.modifiedBessel(b * Math.sqrt(1 - xAbs * xAbs)) / preB;
	};
};
