"use strict";

let gsRevType = [
	"room 1",
	"room 2",
	"room 3",
	"hall 1",
	"hall 2",
	"plate",
	"delay",
	"panning delay"
];
let gsChoType = [
	"chorus 1",
	"chorus 2",
	"chorus 3",
	"chorus 4",
	"feedback",
	"flanger",
	"short delay",
	"short delay feedback"
];
let gsDelType = [
	"delay 1",
	"delay 2",
	"delay 3",
	"delay 4",
	"pan delay 1",
	"pan delay 2",
	"pan delay 3",
	"pan delay 4",
	"delay to reverb",
	"pan repeat"
];
let gsParts = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15];

let gsEfx = {
	0x0000: "thru",
	0x0100: "stereo EQ",
	0x0101: "spectrum",
	0x0102: "enhancer",
	0x0103: "humanizer",
	0x0110: "overdrive",
	0x0111: "distortion",
	0x0120: "phaser",
	0x0121: "auto wah",
	0x0122: "rotary",
	0x0123: "stereo flanger",
	0x0124: "step flanger",
	0x0125: "tremelo",
	0x0126: "auto pan",
	0x0130: "compressor",
	0x0131: "limiter",
	0x0140: "hexa chorus",
	0x0141: "tremelo chorus",
	0x0142: "stereo chorus",
	0x0143: "space D",
	0x0144: "3D chorus",
	0x0150: "stereo delay",
	0x0151: "modulated delay",
	0x0152: "3-tap delay",
	0x0153: "4-tap delay",
	0x0154: "tremelo control delay",
	0x0155: "reverb",
	0x0156: "gate reverb",
	0x0157: "3D delay",
	0x0160: "2-pitch shifter",
	0x0161: "feedback pitch shifter",
	0x0170: "3D auto",
	0x0171: "3D manual",
	0x0172: "Lo-Fi 1",
	0x0173: "Lo-Fi 2",
	0x0200: "overdrive - chorus",
	0x0201: "overdrive - flanger",
	0x0202: "overdrive - delay",
	0x0203: "distortion - chorus",
	0x0204: "distortion - flanger",
	0x0205: "distortion - delay",
	0x0206: "enhancer - chorus",
	0x0207: "enhancer - flanger",
	0x0208: "enhancer - delay",
	0x0209: "chorus - delay",
	0x020a: "flanger - delay",
	0x020b: "chorus - flanger",
	0x020c: "rotary multi",
	0x0400: "guitar multi 1",
	0x0401: "guitar multi 2",
	0x0402: "guitar multi 3",
	0x0403: "clean guitar multi 1",
	0x0404: "clean guitar multi 2",
	0x0405: "bass multi",
	0x0406: "rhodes multi",
	0x0500: "keyboard multi",
	0x1100: "chorus / delay",
	0x1101: "flanger / delay",
	0x1102: "chorus / flanger",
	0x1103: "overdrive / distortion",
	0x1104: "overdrive / rotary",
	0x1105: "overdrive / phaser",
	0x1106: "overdrive / auto wah",
	0x1107: "phaser / rotary",
	0x1108: "phaser / auto wah"
},
gsEfxDesc = {
	0x010303: ["drive"],
	0x010305: ["vowel", (e) => {
		return "aiueo"[e];
	}],
	0x017203: ["pre-filter"],
	0x017204: ["Lo-Fi type"],
	0x017205: ["post-filter"],
	0x017303: ["Lo-Fi type"],
	0x017304: ["fill type", (e) => {
		return ["off", "LPF", "HPF"][e];
	}],
	0x017308: ["noise type", (e) => {
		return ["white", "pink"][e];
	}],
	0x01730b: ["disc type", (e) => {
		return ["LP", "SP", "EP", "RND"];
	}],
	0x01730e: ["hum type", (e) => {
		return `${e + 5}0Hz`;
	}],
	0x017311: ["M/S", (e) => {
		return ["mono", "stereo"][e];
	}]
},
getGsEfx = function (arr) {
	return gsEfx[(arr[0] << 8) + arr[1]] || `0x${arr[0].toString(16).padStart(2, "0")}${arr[1].toString(16).padStart(2, "0")}`;
},
getGsEfxDesc = function (arr, param, value) {
	let id = (arr[0] << 16) + (arr[1] << 8) + param,
	target = gsEfxDesc[id] || {},
	desc = target[0];
	if (desc?.length) {
		desc += `: ${(target[1] || function () {})(value) || value}`;
		return desc;
	};
};

export {
	gsRevType,
	gsChoType,
	gsDelType,
	gsParts,
	getGsEfx,
	getGsEfxDesc
};
