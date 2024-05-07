"use strict";

import {OctaviaDevice, allocated} from "../state/index.mjs";
import {RootDisplay, ccToPos} from "../basic/index.mjs";
import {MxFont40} from "../basic/mxReader.js";

import {
	backlight,
	inactivePixel,
	activePixel,
	lcdPixel,
	lcdCache
} from "./colour.js";

let totalWidth = 160, totalHeight = 64, totalPixelCount = totalWidth * totalHeight;

let flipBitsInBuffer = (buf, bWidth, startX, startY, width, height) => {
	let endX = startX + width, endY = startY + height;
	for (let pY = startY; pY < endY; pY ++) {
		let lineOff = pY * bWidth;
		for (let pX = startX; pX < endX; pX ++) {
			buf[lineOff + pX] = buf[lineOff + pX] ? 0 : 255;
		};
	};
};

let Sc8850Display = class extends RootDisplay {
	#pixelLit = 255;
	#pixelOff = 0;
	#lastBg = 0;
	#nmdb = new Uint8Array(totalPixelCount);
	#dmdb = new Uint8Array(totalPixelCount);
	#omdb = new Uint8Array(totalPixelCount);
	#linger = new Uint8Array(128);
	#ch = 0;
	#range = 0;
	#start = 255; // start port
	useBlur = false;
	font55 = new MxFont40("./data/bitmaps/sc/libre55.tsv");
	font56 = new MxFont40("./data/bitmaps/sc/libre56.tsv");
	constructor(conf) {
		super(new OctaviaDevice(), 0.25, 0.75);
		let upThis = this;
		upThis.useBlur = !!conf?.useBlur;
		upThis.addEventListener("channelactive", (ev) => {
			upThis.#ch = ev.data;
		});
		upThis.addEventListener("portrange", (ev) => {
			if (ev && ev.data != 1 << Math.log2(ev.data)) {
				console.debug(`MU display rejected port range value ${ev.data}.`);
			};
			upThis.#range = ev.data;
		});
		upThis.addEventListener("portstart", (ev) => {
			if (ev != 255 && ev >= allocated.port) {
				console.debug(`MU display rejected port range value ${ev.data}.`);
			};
			upThis.#start = ev.data;
		});
	};
	setCh(ch) {
		this.#ch = ch;
	};
	getCh() {
		return this.#ch;
	};
	reset() {
		super.reset();
		this.#range = 0;
		this.#start = 255;
	};
	render(time, ctx) {
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		let fullRefresh = false;
		upThis.#nmdb.fill(0);
		// Prepare the canvas
		if (timeNow - upThis.#lastBg >= 15000) {
			ctx.fillStyle = backlight.orange;
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			upThis.#lastBg = timeNow;
			fullRefresh = true;
		};
		// Channel test
		let alreadyMin = false;
		let minCh = 0, maxCh = 0;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				if (!alreadyMin) {
					alreadyMin = true;
					minCh = i;
				};
				maxCh = i;
			};
		});
		let part = minCh >> 4;
		minCh = part << 4;
		maxCh = ((maxCh >> 4) << 4) + 15;
		if (upThis.#ch > maxCh) {
			upThis.#ch = minCh + upThis.#ch & 15;
		};
		if (upThis.#ch < minCh) {
			upThis.#ch = maxCh - 15 + (upThis.#ch & 15);
		};
		if (upThis.#range) {
			if (upThis.#start == 255) {
				minCh = (Math.floor((upThis.#ch >> 4) / upThis.#range) * upThis.#range) << 4;
			} else {
				minCh = upThis.#start << 4;
			};
			maxCh = minCh + upThis.#range * 16 - 1;
		};
		let chOff = upThis.#ch * ccToPos.length;
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4);
		//console.debug(minCh, maxCh, rendMode);
		// Render current channel
		upThis.font56.getStr(`${"ABCDEFGH"[upThis.#ch >> 4]}${`${(upThis.#ch & 15) + 1}`.padStart(2, "0")}`).forEach((e0, i0) => {
			let offsetX = i0 * 6;
			e0.forEach((e1, i1) => {
				let pX = (i1 % 5) + offsetX, pY = Math.floor(i1 / 5) + 2;
				if (e1) {
					upThis.#nmdb[pY * totalWidth + pX] = 255;
				};
			});
		});
		// Render bank info
		let showLsb = !sum.chContr[chOff + ccToPos[0]];
		if (upThis.getMode() == "xg") {
			if ([32, 33, 34, 35, 36, 48, 79, 80, 81, 82, 83, 84, 95, 96, 97, 98, 99, 100].indexOf(sum.chContr[chOff + ccToPos[0]]) > -1) {
				showLsb = true;
			};
		};
		upThis.font56.getStr(`${`${showLsb ? sum.chContr[chOff + ccToPos[32]] : sum.chContr[chOff + ccToPos[0]]}`.padStart(3, "0")} ${`${sum.chProgr[this.#ch] + 1}`.padStart(3, "0")}`).forEach((e0, i0) => {
			let offsetX = i0 * 6;
			e0.forEach((e1, i1) => {
				let pX = (i1 % 5) + offsetX + 20, pY = Math.floor(i1 / 5) + 2;
				if (e1) {
					upThis.#nmdb[pY * totalWidth + pX] = 255;
				};
			});
		});
		flipBitsInBuffer(upThis.#nmdb, totalWidth, 43, 1, 19, 8);
		// Render port selection
		switch (rendMode) {
			case 0: {
				let portStart = (upThis.#ch >> 6) << 2, portNow = upThis.#ch >> 4;
				let shiftX = (portStart >> 6) & 1;
				for (let i = 0; i < 4; i ++) {
					let portWork = portStart + i;
					let portOffX = i * 40 + 2 + shiftX, portOffY = (portWork == portNow) ? 59 : 58;
					upThis.font55.getStr(`PART-${"ABCDEFGH"[portWork]}`).forEach((e0, i0) => {
						let offsetX = i0 * 6;
						e0.forEach((e1, i1) => {
							let pX = (i1 % 5) + offsetX + portOffX, pY = Math.floor(i1 / 5) + portOffY;
							if (e1) {
								upThis.#nmdb[pY * totalWidth + pX] = 255;
							};
						});
					});
				};
				break;
			};
			case 1:
			case 2: {
				let portNow = upThis.#ch >> 4;
				for (let i = 0; i < 3; i ++) {
					let portOffX = i * 40 + 2, portOffY = (rendMode == i) ? 59 : 58;
					upThis.font55.getStr(`${16 << i}CH-${"ABCDEFGH"[minCh >> 4]}`).forEach((e0, i0) => {
						let offsetX = i0 * 6;
						e0.forEach((e1, i1) => {
							let pX = (i1 % 5) + offsetX + portOffX, pY = Math.floor(i1 / 5) + portOffY;
							if (e1) {
								upThis.#nmdb[pY * totalWidth + pX] = 255;
							};
						});
					});
				};
				break;
			};
		};
		upThis.font56.getStr("123456789\x80\x81\x82\x83\x84\x85\x86").forEach((e0, i0) => {
			let offsetX = i0 * 6;
			e0.forEach((e1, i1) => {
				let pX = (i1 % 5) + offsetX + 49, pY = Math.floor(i1 / 5) + 49;
				if (e1) {
					upThis.#nmdb[pY * totalWidth + pX] = 255;
				};
			});
		});
		//flipBitsInBuffer(upThis.#nmdb, totalWidth, 49, 13, 5, 35);
		// Strength calculation
		let renderRange = 1 << rendMode,
		strengthDivider = (256 - renderRange + 1) / (35 - renderRange + 1);
		sum.velo.forEach(function (e, i) {
			if (e >= upThis.#linger[i]) {
				upThis.#linger[i] = ((e >> 4) << 4) + 15;
			} else {
				let val = upThis.#linger[i] - 2;
				if (val < 0) {
					val = 0;
				};
				upThis.#linger[i] = val;
			};
		});
		// Render meters
		for (let i0 = 0; i0 < renderRange; i0 ++) {
			let chStart = minCh + (i0 << 4);
			for (let i1 = 0; i1 < 16; i1 ++) {
				let ch = chStart + i1;
				let strength = Math.floor(sum.strength[ch] / strengthDivider) + 1;
				flipBitsInBuffer(upThis.#nmdb, totalWidth, 49 + 6 * i1, 48 - i0 * strengthDivider - strength, 5, strength);
			};
		};
		// Guide the drawn matrix
		upThis.#nmdb.forEach((e, i) => {
			if (upThis.#dmdb[i] != e) {
				if (upThis.useBlur) {
					let diff = e - upThis.#dmdb[i],
					cap = 48;
					if (Math.abs(diff) > cap) {
						upThis.#dmdb[i] += Math.sign(diff) * cap;
					} else {
						upThis.#dmdb[i] = e;
					};
				} else {
					upThis.#dmdb[i] = e;
				};
			};
		});
		// Do the actual drawing
		upThis.#dmdb.forEach((e, i) => {
			let pX = i % totalWidth, pY = Math.floor(i / totalWidth);
			if (fullRefresh || upThis.#omdb[i] != e) {
				let posX = 2 + 5 * pX, posY = 2 + 5 * pY;
				ctx.clearRect(posX, posY, 5, 5);
				ctx.fillStyle = backlight.orange;
				ctx.fillRect(posX, posY, 5, 5);
				if (e <= upThis.#pixelOff) {
					ctx.fillStyle = lcdCache.black[3];
				} else if (e >= upThis.#pixelLit) {
					ctx.fillStyle = lcdCache.black[4];
				} else {
					ctx.fillStyle = `${lcdPixel.black}${(Math.ceil(e * lcdPixel.range / 255) + lcdPixel.inactive).toString(16)}`
				};
				ctx.fillRect(posX, posY, 4.5, 4.5);
				self.pixelUpdates = (self.pixelUpdates || 0) + 1;
			};
		});
		// Store the historical draws
		upThis.#dmdb.forEach((e, i) => {
			if (upThis.#omdb[i] != e) {
				upThis.#omdb[i] = e;
			};
		});
	};
};

export default Sc8850Display;
