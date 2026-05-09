// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/**
* One-dimensional audio-oriented interpolation. This is a reference JavaScript implementation that's likely later ported to other languagues in the Ensemble framework.
* @license LGPL-3.0-only
* @module
*/

/** Reusable helper functions. */
export class EnsembleUtilMethods {
	/** Return the stepped sample. When `oldSamples` is not provided, values below 0 and above the last index of the `samples` array will be clamped, otherwise values below 0 will use `oldSamples` before getting clamped.
	* @param i An integer array index.
	*/
	static readonly stepSample(i: number, samples: Float32Array | Float64Array | number[], oldSamples?: Float32Array | Float64Array | number[]): number;
	/** Calculate the effective low-pass cutoff in cycles of the original signal. Values above 1 are treated the same as 1. */
	static readonly cutoffFactor(sampleRatio: number): number;
	/** The epsilon threshold. Values below it cause the `sinc` method to return `1` directly. */
	static readonly sincThreshold: number;
	/** The `sinc` function. */
	static readonly sinc(x: number): number;
	/** The modified Bessel function I₀. */
	static readonly modifiedBessel(x: number): number;
	/** Build a Kaiser window.
	* @param x The `x` value. Expected to be in the range of [-1, 1].
	* @param b The beta value. Higher beta values widens main lobe and attenuates ringing more.
	* @param preB The pre-computed value of beta against the modified Bessel function.
	*/
	static readonly kaiserWindow(x: number, b: number, preB?: number): number;
}
/** The basic structure for other structures. */
export class EnsembleResampler {
	/** Specifier of the interpolation algorithm. Valid values below.
	* - `nearest`: Neareset neighbour.
	* - `linear`: Linear. Any sample ratio below 1 causes it to switch to a weighted linear instead for aliasing mitigation.
	* - `hermite`: Catmull-Rom Hermite cubic. Any sample ratio below `0.8165` (`sqrt(2/3)`) causes it to switch to a weighted linear instead for aliasing mitigation. Default for feedback resampling.
	* - `lanczos`: Lanczos `sinc` with aliasing mitigation. Default for direct output resampling (e.g. PCM resampling).
	* - `kaiser`: Anchored integer Kaiser `sinc` with aliasing mitigation.
	* - `kaiserFrac`: Fractional Kaiser 8-tap `sinc` with aliasing mitigation.
	*/
	readonly id: string;
	/** The ratio between the target sample rate and the original sample rate. Must be a positive real number. A value in the `(0, 1)` range indicates a downsample, `1` a no-op, and `(1, ∞)` an upsample. Defaults provided by the registry entry.
	*
	* For performance, setting this value can cause some internal values to be pre-calculated, useful in settings where pitch bends do not happen on every interpolated sample. It's recommended to re-use the same created object per-oscillator.
	*/
	readonly sampleRatio: number;
	/** Writes the sample ratio. */
	readonly setSampleRatio(x: number): void;
	/** The step value, usually consistent per-oscillator. Defaults provided by the registry entry. Ignored by algorithms by default.
	* - `3`: Recommended default for Lanczos-3 (6-tap).
	* - `8`: Recommended default for Kaiser 8-tap.
	*
	* For performance, setting this value can cause some internal values to be pre-calculated, useful in settings where pitch bends do not happen on every interpolated sample. It's recommended to re-use the same created object per-oscillator.
	*/
	readonly step: number;
	/** Writes the step. */
	readonly setStep(x: number): void;
	/** The array storing the pre-computed results. Length was defined by registry entries. In AOT implementations, this could be split to `f32` and `f64` variants. */
	precomputed?: Float64Array;
	/** Retrieve an interpolated sample.
	* @param timeStep The target sample. A float in the range of `[0, samples.length - 1]`.
	* @param samples The samples to be interpolated.
	* @param oldSamples When provided, interpolated samples will use the last few samples from it instead for better consistency.
	*/
	readonly get(timeStep: number, samples: Float32Array | Float64Array | number[], oldSamples?: Float32Array | Float64Array | number[]): number;
}
/** The actual registry entry. */
export class EnsembleResamplerEntry {
	/** Same as `EnsembleResampler.get`. Must use a normal function instead of a lambda/arrow function to obtain the correct `this` value. */
	get(timeStep: number, samples: Float32Array | Float64Array | number[], oldSamples?: Float32Array | Float64Array | number[]): number;
	/** The default sample ratio of the resampler. Defaults to `1`. */
	sampleRatio?: number;
	/** The function executed on writes to `sampleRatio`, enabling pre-calculation. Must use a normal function instead of a lambda/arrow function to obtain the correct `this` value. Do NOT write to either `sampleRatio` or `step` in this method. */
	setSampleRatio?(x: number): void;
	/** The default step of the resampler. Defaults to `2`. */
	step?: number;
	/** The function executed on writes to `step`, enabling pre-calculation. Must use a normal function instead of a lambda/arrow function to obtain the correct `this` value. Do NOT write to either `sampleRatio` or `step` in this method. */
	setStep?(x: number): void;
	/** Size of the pre-compute array. Defaults to `0`, which skips array creation altogether. */
	pcaSize?: number;
}
/** The registry of different interpolation algorithms. */
export class EnsembleResamplerRegistry {
	/** Retrieve an interpolation algorithm from a specifier. */
	static readonly get(id: string): EnsembleResampler;
	/** Register an interpolation algorithm with a specifier. */
	static readonly register(id: string, entry: EnsembleResamplerEntry): void;
	/** Returns `true` if the specifier has already been registered. */
	static readonly has(id: string): boolean;
	/** Returns the specifiers of existing entries. */
	static readonly keys(): Iterable<string>;
}
