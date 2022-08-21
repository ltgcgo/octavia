"use strict";

let xgEffType = [
	"off",
	"hall",
	"room",
	"stage",
	"plate",
	"delay LCR",
	"delay LR",
	"echo",
	"cross delay",
	"early reflections",
	"gate reverb",
	"reverse gate"
];
xgEffType[16] = "white room";
xgEffType[17] = "tunnel";
xgEffType[19] = "basement";
xgEffType[20] = "karaoke";
xgEffType[64] = "pass through";
xgEffType[65] = "chorus";
xgEffType[66] = "celeste";
xgEffType[67] = "flanger";
xgEffType[68] = "symphonic";
xgEffType[69] = "rotary speaker";
xgEffType[70] = "tremelo";
xgEffType[71] = "auto pan";
xgEffType[72] = "phaser";
xgEffType[73] = "distortion";
xgEffType[74] = "overdrive";
xgEffType[75] = "amplifier";
xgEffType[76] = "3-band EQ";
xgEffType[77] = "2-band EQ";
xgEffType[78] = "auto wah";
let xgPartMode = [
	"melodic",
	"drum",
	"drum set 1",
	"drum set 2"
];
let xgDelOffset = [
	17.1, 18.6, 20.2, 21.8, 23.3,
	24.9, 26.5, 28, 29.6, 31.2,
	32.8, 34.3, 35.9, 37.5, 39,
	40.6, 42.2, 43.7, 45.3, 46.9,
	48.4, 50
];
let xgNormFreq = [
	20, 22, 25, 28, 32, 36, 40, 45,
	50, 56, 63, 70, 80, 90, 100, 110,
	125, 140, 160, 180, 200, 225, 250, 280,
	315, 355, 400, 450, 500, 560, 630, 700,
	800, 900, 1E3, 1100, 1200, 1400, 1600, 1800,
	2E3, 2200, 2500, 2800, 3200, 3600, 4E3, 4500,
	5E3, 5600, 6300, 7E3, 8E3, 9E3, 1E4, 11E3,
	12E3, 14E3, 16E3, 18E3, 2E4
];
let xgLfoFreq = [
	0, 0.04, 0.08, 0.13, 0.17, 0.21, 0.25, 0.29,
	0.34, 0.38, 0.42, 0.46, 0.51, 0.55, 0.59, 0.63,
	0.67, 0.72, 0.76, 0.8, 0.84, 0.88, 0.93, 0.97,
	1.01, 1.05, 1.09, 1.14, 1.18, 1.22, 1.26, 1.3,
	1.35, 1.39, 1.43, 1.47, 1.51, 1.56, 1.6, 1.64,
	1.68, 1.72, 1.77, 1.81, 1.85, 1.89, 1.94, 1.98,
	2.02, 2.06, 2.10, 2.15, 2.19, 2.23, 2.27, 2.31,
	2.36, 2.4, 2.44, 2.48, 2.52, 2.57, 2.61, 2.65,
	2.69, 2.78, 2.86, 2.94, 3.03, 3.11, 3.2, 3.28,
	3.37, 3.45, 3.53, 3.62, 3.7, 3.87, 4.04, 4.21,
	4,37, 4.54, 4.71, 4.88, 5.05, 5.22, 5.38, 5.55,
	5.72, 6.06, 6.39, 6.73, 7.07, 7.4, 7.74, 8.08,
	8.41, 8.75, 9.08, 9.42, 9.76, 10.1, 10.8, 11.4,
	12.1, 12.8, 13.5, 14.1, 14.8, 15.5, 16.2, 16.8,
	17.5, 18.2, 19.5, 20.9, 22.2, 23.6, 24.9, 26.2,
	27.6, 28.9, 30.3, 31.6, 33.0, 34.3, 37.0, 39.7
];
let getXgRevTime = function (data) {
	let a = 0.1, b = -0.3;
	if (data > 66) {
		a = 5, b = 315;
	} else if (data > 56) {
		a = 1, b = 47;
	} else if (data > 46) {
		a = 0.5, b = 18.5;
	};
	return a * data - b;
};
let getXgDelayOffset = function (data) {
	if (data > 105) {
		return xgDelOffset[data - 106];
	} else if (data > 100) {
		return data * 1.1 - 100;
	} else {
		return data / 10;
	};
};

export {
	xgEffType,
	xgPartMode,
	xgDelOffset,
	xgNormFreq,
	xgLfoFreq,
	getXgRevTime,
	getXgDelayOffset
};
