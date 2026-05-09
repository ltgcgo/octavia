// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/**
* One-dimensional audio-oriented interpolation. This is a reference JavaScript implementation that's likely later ported to other languagues in the Ensemble framework.
* @license LGPL-3.0-only
* @module
*/

/** The basic structure for other structures. */
export class EnsembleResampler {
	/** Specifier of the interpolation algorithm. Valid values below.
	* - `nearest`: Neareset neighbour.
	* - `linear`: Linear. Any sample ratio below 1 causes it to switch to a weighted linear instead for aliasing mitigation.
	* - `hermite`: Catmull-Rom Hermite cubic. Any sample ratio below `0.8165` (`sqrt(2/3)`) causes it to switch to a weighted linear instead for aliasing mitigation. Default for feedback resampling.
	* - `lanczos`: Lanczos-3 `sinc` with aliasing mitigation. Default for direct output resampling (e.g. PCM resampling).
	* - `kaiser`: Anchored integer Kaiser 8-tap `sinc` with aliasing mitigation.
	* - `kaiserFrac`: Fractional Kaiser 8-tap `sinc` with aliasing mitigation.
	*/
	id: string;
	/** The ratio between the target sample rate and the original sample rate. Must be a positive real number. A value in the `(0, 1)` range indicates a downsample, `1` a no-op, and `(1, ∞)` an upsample. Defaults to `1`.
	*
	* For performance, setting this value can cause some internal values to be pre-calculated, useful in settings where pitch bends do not happen on every interpolated sample. It's recommended to re-use the same created object per-oscillator.
	*/
	sampleRatio: number;
	/** Retrieve an interpolated sample.
	* @param timeStep The target sample. A float in the range of `[0, samples.length - 1]`.
	* @param samples The samples to be interpolated.
	* @param oldSamples When provided, interpolated samples will use the last few samples from it instead for better consistency.
	*/
	get(timeStep: number, samples: Float32Array | Float64Array, oldSamples?: Float32Array | Float64Array): number;
}
/** The registry of different interpolation algorithms. */
export class EnsembleSamplerRegistry {
	/** Retrieve an interpolation algorithm from a specifier. */
	get(id: string): EnsembleResampler;
}
