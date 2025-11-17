"use strict";

let backlight = {
	red: "#ff7986",
	orange: "#fca022",
	grYellow: "#c9e10a",
	green: "#c1ff0a",
	white: "#b7e5e3",
	blue: "#2280ff"
},
lcdPixel = {
	black: "#000000",
	blue: "#0516bb",
	purple: "#48009a",
	inactive: 0x16,
	medium: 0x3b,
	active: 0xaa,
	range: 0x94
},
contrastsActive = [
	26,
	35, 44, 53, 62,
	71, 80, 89, 98,
	107, 116, 125, 134,
	143, 152, 161, 170
],
contrastsInactive = [
	6,
	7, 8, 9, 10,
	11, 12, 13, 14,
	15, 16, 17, 18,
	19, 20, 21, 22
];

// Generate caches for easier implementation
let lcdCache = {}, lcdCacheTransparency = "06,68,2a,16,aa,3b".split(",");
for (let colour in lcdPixel) {
	lcdCache[colour] = [];
	lcdCacheTransparency.forEach((e) => {
		lcdCache[colour].push(`${lcdPixel[colour]}${e}`);
	});
};
let contrastCache = [];
for (let i = 0; i < contrastsActive.length; i ++) {
	contrastCache.push([`${lcdPixel.black}${contrastsInactive[i].toString(16).padStart(2, "0")}`, `${lcdPixel.black}${contrastsActive[i].toString(16).padStart(2, "0")}`]);
};
console.debug(contrastCache);

// For backwards compatibility
let bgOrange = `${backlight.orange}64`,
bgGreen = `${backlight.green}64`,
bgWhite = `${backlight.white}64`,
bgRed = `${backlight.red}64`;
let inactivePixel = lcdCache.black[0],
mediumPixel = lcdCache.black[2],
activePixel = lcdCache.black[1];

export {
	bgOrange,
	bgGreen,
	bgWhite,
	bgRed,
	inactivePixel,
	mediumPixel,
	activePixel,
	backlight,
	lcdPixel,
	lcdCache,
	contrastCache
};
