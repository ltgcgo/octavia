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
contrastValues = [
	[6, 26],
	[7, 35], [8, 44], [9, 53], [10, 62],
	[11, 71], [12, 80], [13, 89], [14, 98],
	[15, 107], [16, 116], [17, 125], [18, 134],
	[19, 143], [20, 152], [21, 161], [22, 170]
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
for (let contrast of contrastValues) {
	contrastCache.push([`${lcdPixel.black}${contrast[0].toString(16).padStart(2, "0")}`, `${lcdPixel.black}${contrast[1].toString(16).padStart(2, "0")}`]);
	contrast.push(contrast[1] - contrast[0]);
};
//console.debug(contrastCache);

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
	contrastValues,
	contrastCache
};
