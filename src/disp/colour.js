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
	purple: "#48009a"
};

// Generate caches for easier implementation
let lcdCache = {}, lcdCacheTransparency = "06,68,2a,16,aa,3b".split(",");
for (let colour in lcdPixel) {
	lcdCache[colour] = [];
	lcdCacheTransparency.forEach((e) => {
		lcdCache[colour].push(`${lcdPixel[colour]}${e}`);
	});
};

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
	lcdCache
};
