"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {RootDisplay, ccToPos} from "../basic/index.mjs";
import {MxFont40, MxBmDef} from "../basic/mxReader.js";

import {
	bgGreen,
	bgOrange,
	bgWhite,
	bgRed,
	lcdPixel,
	lcdCache
} from "./colour.js";

let Ns5rDisplay = class extends RootDisplay {
	#omdb = new Uint8Array(5760); // Full display
	#nmdb = new Uint8Array(5760); // Full display, but on commit
	#dmdb = new Uint8Array(5760); // Full display, but it's actually drawn
	#dumpData;
	#dumpExpire = 0;
	#mode = "?";
	#ch = 0;
	#backlight;
	#pixelLit = 255;
	#pixelOff = 0;
	#refreshed = true;
	#lastTrue = false;
	useBlur = false; // Pixel blur will only activate if this is enabled
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	trueFont = new MxFont40("./data/bitmaps/korg/font.tsv", "./data/bitmaps/xg/font.tsv");
	element = new MxBmDef("./data/bitmaps/korg/element.tsv");
	constructor(conf = {}) {
		super(new OctaviaDevice(), 0.1, 0.9);
		let upThis = this;
		upThis.#backlight = bgWhite;
		upThis.addEventListener("mode", (ev) => {
			upThis.#backlight = {
				"gs": bgOrange,
				"sc": bgOrange,
				"mt32": bgOrange,
				"xg": bgGreen,
				"ns5r": bgGreen,
				"x5d": bgGreen,
				"ag10": bgRed,
				"05rw": bgGreen,
				"k11": bgGreen,
				"gmlx": bgGreen,
				"sg01": bgRed,
				"sd": bgOrange,
				"s90es": bgGreen,
				"motif": bgGreen,
				"doc": bgGreen,
				"qy10": bgGreen,
				"qy20": bgGreen
			}[ev.data] || bgWhite;
			upThis.#mode = ev.data;
			upThis.#refreshed = true;
		});
		upThis.addEventListener("screen", (ev) => {
			console.debug(ev);
			if (ev.data.type == "ns5r") {
				upThis.#dumpData = ev.data.data;
				upThis.#dumpExpire = Date.now() + 1600;
			};
		});
		upThis.useBlur = !!conf?.useBlur;
		upThis.addEventListener("channelactive", (ev) => {
			upThis.#ch = ev.data;
		});
	};
	setCh(ch) {
		this.#ch = ch;
	};
	getCh() {
		return this.#ch;
	};
	#renderParamBox(startX, value) {
		// Draw the lever rest
		for (let p = 0; p < 180; p ++) {
			let pX = p % 12, pY = Math.floor(p / 12);
			if (
				(pY == 0 && pX < 11) ||
				(pY == 14 && pX > 0) ||
				(pY == 13)
			) {
				this.#nmdb[pY * 144 + pX + startX] = this.#pixelLit;
			} else if (pY > 0 && pY < 13) {
				if (
					pX == 0 || pX > 9 ||
					(pX == 5 && pY > 1 && pY < 12)
				) {
					this.#nmdb[pY * 144 + pX + startX] = this.#pixelLit;
				};
			};
		};
		let convertedValue = value >> 4;
		// Draw the lever
		for (let c = 0; c < 21; c ++) {
			let pX = c % 7, pY = Math.floor(c / 7),
			pcY = pY + (9 - convertedValue);
			if (pY != 1 || pX == 0 || pX == 6) {
				this.#nmdb[pcY * 144 + pX + startX + 2] = this.#pixelLit;
			} else {
				this.#nmdb[pcY * 144 + pX + startX + 2] = this.#pixelOff;
			};
		};
	};
	#renderLine(srcX, srcY, diffX, diffY) {
		//console.debug(diffX, diffY);
		srcX = (srcX < 0 ? Math.ceil : Math.floor)(srcX);
		srcY = (srcY < 0 ? Math.ceil : Math.floor)(srcY);
		diffX = Math.round(diffX);
		diffY = Math.round(diffY);
		if (Math.abs(diffX) < Math.abs(diffY)) {
			let theta = diffX / diffY;
			if (diffY < 0) {
				for (let p = 0; p >= diffY; p --) {
					this.#nmdb[Math.round(theta * p + srcX) + (srcY + p) * 144] = this.#pixelLit;
				};
			} else {
				for (let p = 0; p <= diffY; p ++) {
					this.#nmdb[Math.round(theta * p + srcX) + (srcY + p) * 144] = this.#pixelLit;
				};
			};
		} else {
			let theta = diffY / diffX;
			if (diffX < 0) {
				for (let p = 0; p >= diffX; p --) {
					this.#nmdb[Math.round(theta * p + srcY) * 144 + srcX + p] = this.#pixelLit;
				};
			} else {
				for (let p = 0; p <= diffX; p ++) {
					this.#nmdb[Math.round(theta * p + srcY) * 144 + srcX + p] = this.#pixelLit;
				};
			};
		};
	};
	#renderCompass(startX, startY, value) {
		let radius = 7, circleStep = 40;
		for (let c = 0; c < circleStep; c ++) {
			let angle = Math.PI * c * 2 / circleStep;
			let intX = radius * Math.sin(angle),
			drawX = Math.sign(intX) * Math.round(Math.abs(intX));
			let intY = radius * Math.cos(angle),
			drawY = Math.sign(intY) * Math.round(Math.abs(intY));
			this.#nmdb[(drawY + startY) * 144 + drawX + startX] = this.#pixelLit;
		};
		if (value < 128) {
			let normAngle = Math.floor(value / 9.85) * 22.5;
			//let normAngle = Math.floor(value * 2.126);
			let lineStep = 5, angle = Math.PI * (315 - normAngle) / 180;
			let deltaX = Math.sin(angle), deltaY = Math.cos(angle);
			/* for (let c = 0; c <= lineStep; c ++) {
				let drawX = Math.round(c * deltaX),
				drawY = Math.round(c * deltaY);
				this.#nmdb[(drawY + startY) * 144 + drawX + startX] = this.#pixelLit;
			}; */
			this.#renderLine(startX, startY, deltaX * lineStep, deltaY * lineStep);
		} else {
			this.#nmdb[(startY) * 144 + startX] = this.#pixelLit;
		};
	};
	render(time, ctx, trueMode) {
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
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
		if (this.#ch > maxCh) {
			this.#ch = minCh + this.#ch & 15;
		};
		if (this.#ch < minCh) {
			this.#ch = maxCh - 15 + (this.#ch & 15);
		};
		let chOff = this.#ch * ccToPos.length;
		if (timeNow < this.#dumpExpire) {
			this.#dumpData?.forEach((e, i) => {
				this.#nmdb[i] = e ? this.#pixelLit : this.#pixelOff;
			});
		} else {
			// Clear out the current working display buffer.
			this.#nmdb.forEach((e, i, a) => {a[i] = this.#pixelOff});
			// Screen buffer write begin.
			// Determine the used font
			let targetFont = trueMode ? this.trueFont : this.xgFont;
			// Show current channel
			targetFont.getStr(`${"ABCDEFGH"[this.#ch >> 4]}${((this.#ch & 15) + 1).toString().padStart(2, "0")}`).forEach((e0, i0) => {
				let secX = i0 * 6 + 1;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5);
					this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
				});
			});
			// Show current pitch shift
			let cPit = this.device.getPitchShift(this.#ch);
			targetFont.getStr(`${"+-"[+(cPit < 0)]}${Math.round(Math.abs(cPit)).toString().padStart(2, "0")}`).forEach((e0, i0) => {
				let secX = i0 * 6 + 1;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 8;
					this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
				});
			});
			// Render bank background
			let bankFetched = upThis.getChVoice(this.#ch), bankInfo = bankFetched.sect;
			for (let bankSect = 0; bankSect < 225; bankSect ++) {
				let pixX = bankSect % 25, pixY = Math.floor(bankSect / 25) + 15;
				this.#nmdb[pixY * 144 + pixX] = this.#pixelLit;
			};
			targetFont.getStr(bankInfo).forEach((e0, i0) => {
				let secX = i0 * 6 + 1;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 16;
					if (e1) {
						this.#nmdb[charY * 144 + secX + charX] = this.#pixelOff;
					};
				});
			});
			// Render program info
			let bankName = (upThis.getMapped(bankFetched.name)).slice(0, 12).padEnd(10, " ");
			targetFont.getStr(`:${(sum.chProgr[this.#ch] + 1).toString().padStart(3, "0")}`).forEach((e0, i0) => {
				let secX = i0 * 6 + 25;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 16;
					this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
				});
			});
			targetFont.getStr(bankName).forEach((e0, i0) => {
				let secX = i0 * 6 + 53;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 16;
					this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
				});
			})
			// Render current channel
			targetFont.getStr(`${this.#ch + 1}`.padStart(2, "0")).forEach((e0, i0) => {
				let secX = i0 * 6;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 32;
					this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
				});
			});
			// Render channel strength
			let showReduction = 22;
			if (maxCh > 63) {
				showReduction = 43;
			};
			for (let i = sum.strength.length - 1; i >= 0; i --) {
				let e = sum.strength[i];
				if (maxCh < 32 && i > 31) {
					continue;
				};
				if (maxCh < 64 && i > 63) {
					continue;
				};
				for (let c = Math.floor(e / showReduction); c >= 0; c --) {
					let pixX = (i % 32) * 4 + 12 + ((i >> 5) & 1) + 1, pixY = 39 - (((i >> 5) & 1) << 1) - c - ((i >> 6) << 3);
					this.#nmdb[pixY * 144 + pixX] = this.#pixelLit;
					this.#nmdb[pixY * 144 + pixX + 1] = this.#pixelLit;
					this.#nmdb[pixY * 144 + pixX + 2] = this.#pixelLit;
				};
			};
			// Render effect types
			let efxShow = this.device.aiEfxName.slice(0, 7 + +trueMode) || "Rev/Cho";
			targetFont.getStr(trueMode ? `Fx A:001${efxShow}` : `FxA:001${efxShow}`).forEach((e0, i0) => {
				let lineChars = trueMode ? 8 : 7;
				let secX = (i0 % lineChars) * 6 + (trueMode ? 95 : 102),
				secY = Math.floor(i0 / lineChars) * 8;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + secY;
					this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
				});
			});
			// Render letter displays
			if (timeNow < sum.letter.expire) {
				let xShift = 19 + (+trueMode) * 3;
				// White bounding box
				for (let i = 0; i < 2000; i ++) {
					let x = i % 100, y = Math.floor(i / 100);
					// Top and bottom borders
					if (
						(y == 0 && x < 99) ||
						(y == 18) ||
						(y == 19 && x > 0)
					) {
						this.#nmdb[y * 144 + x + xShift] = this.#pixelLit;
					};
					if (y > 0 && y < 18) {
						this.#nmdb[y * 144 + x + xShift] = +(x < 1 || x > 97) ? this.#pixelLit : this.#pixelOff;
					};
				};
				// Actual text
				targetFont.getStr(sum.letter.text).forEach((e0, i0) => {
					let secX = (i0 % 16) * 6 + xShift + 2,
					secY = Math.floor(i0 / 16) * 8 + 2;
					e0.forEach((e1, i1) => {
						let charX = i1 % 5,
						charY = Math.floor(i1 / 5) + secY;
						this.#nmdb[charY * 144 + secX + charX] = e1 ? this.#pixelLit : this.#pixelOff;
					});
				});
			} else {
				// Render params only when it's not covered
				let xShift = trueMode ? 2 : 0;
				this.#renderParamBox(20 + xShift, sum.chContr[chOff + ccToPos[7]]);
				this.#renderParamBox(33 + xShift, sum.chContr[chOff + ccToPos[11]]);
				if (trueMode) {
					if (sum.chContr[chOff + ccToPos[10]] < 128) {
						this.element.getBm(`Pan_${Math.floor(sum.chContr[chOff + ccToPos[10]] / 9.85)}`)?.render((e, x, y) => {
							this.#nmdb[y * 144 + x + 48] = e ? this.#pixelLit : this.#pixelOff;
						});
					} else {
						this.element.getBm("PanRndm")?.render((e, x, y) => {
							this.#nmdb[y * 144 + x + 48] = e ? this.#pixelLit : this.#pixelOff;
						});
					};
				} else {
					this.#renderCompass(53, 7, sum.chContr[chOff + ccToPos[10]]);
				};
				this.#renderParamBox(62 + 2 * (+trueMode) + xShift - (+trueMode), sum.chContr[chOff + ccToPos[91]]);
				this.#renderParamBox(75 + 2 * (+trueMode) + xShift - (+trueMode), sum.chContr[chOff + ccToPos[93]]);
				if (!trueMode) {
					this.#renderParamBox(88, sum.chContr[chOff + ccToPos[74]]);
				};
			};
			// Render bitmap displays
			if (timeNow < sum.bitmap.expire) {
				// White bounding box
				for (let i = 0; i < 777; i ++) {
					let x = i % 37, y = Math.floor(i / 37);
					let realX = x + 78, realY = y + 19;
					// Top and bottom borders
					if (
						(y == 0 && x < 36) ||
						(y == 19) ||
						(y == 20 && x > 0)
					) {
						this.#nmdb[realY * 144 + realX] = this.#pixelLit;
					};
					if (y > 0 && y < 19) {
						this.#nmdb[realY * 144 + realX] = +(x < 1 || x > 34) ? this.#pixelLit : this.#pixelOff;
					};
				};
				// Actual bitmap
				let colUnit = (sum.bitmap.bitmap.length == 512) ? 1 : 2;
				for (let i = 0; i < 512; i += colUnit) {
					let x = i & 31, y = i >> 5;
					let realX = x + 80, realY = y + 21;
					this.#nmdb[realY * 144 + realX] = sum.bitmap.bitmap[i / colUnit] ? this.#pixelLit : this.#pixelOff;
					if (colUnit == 2) {
						this.#nmdb[realY * 144 + realX + 1] = sum.bitmap.bitmap[i / colUnit] ? this.#pixelLit : this.#pixelOff;
					};
				};
			};
		};
		// Screen buffer write finish.
		// Determine if full render is required.
		let drawPixMode = false;
		if (this.#lastTrue != trueMode) {
			this.#refreshed = true;
		};
		if (this.#refreshed) {
			// Full render required.
			// Clear all pixels.
			ctx.fillStyle = this.#backlight.replace("64", "");
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.textAlign = "center";
			ctx.font = '11px "Arial Web"';
			ctx.fillStyle = "#000e";
			ctx.fillText("MIDI. CH", 58, 10);
			ctx.fillText("VOL", 153.5 + (+trueMode * 12), 10);
			ctx.fillText("EXP", 231.5 + (+trueMode * 12), 10);
			ctx.fillText("PAN", 322.5 + (+trueMode * 12), 10);
			ctx.fillText("REV", 405 + (+trueMode * 18), 10);
			ctx.fillText("CHO", 484 + (+trueMode * 18), 10);
			!trueMode && ctx.fillText("BRT", 561.5, 10);
			ctx.fillText("EFFECT TYPE", 738 - (+trueMode * 18), 10);
			ctx.fillText("PART", 34, 262);
			let circle = 2 * Math.PI;
			for (let c = 1; c < 33; c ++) {
				if (c == 1 || c == 32 || c % 5 == 0) {
					ctx.fillText(`${c}`, 24 * c + 64, 262);
				} else {
					ctx.beginPath();
					ctx.ellipse(
						24 * c + 64,
						258,
						2, 2,
						0, 0, circle
					);
					ctx.fill();
				};
			};
			drawPixMode = true;
			this.#refreshed = false;
		};
		// Transitional
		this.#nmdb.forEach((e, i) => {
			if (this.useBlur) {
				let diff = e - this.#dmdb[i],
				cap = 48;
				if (Math.abs(diff) > cap) {
					this.#dmdb[i] += Math.sign(diff) * cap;
				} else if (diff != 0) {
					this.#dmdb[i] = e;
				};
			} else {
				if (this.#dmdb[i] != e) {
					this.#dmdb[i] = e;
				};
			};
		});
		// Commit to display accordingly.
		this.#dmdb.forEach((e, i) => {
			let pixX = i % 144, pixY = Math.floor(i / 144);
			let hasDifference = this.#omdb[i] != e;
			if (!drawPixMode && hasDifference) {
				ctx.fillStyle = this.#backlight.slice(0, 7);
				ctx.fillRect(6 * pixX + 1, 12 + 6 * pixY, 6, 6);
			};
			if (drawPixMode || hasDifference) {
				if (e >= this.#pixelLit) {
					ctx.fillStyle = lcdCache.black[4];
				} else if (e <= this.#pixelOff) {
					ctx.fillStyle = lcdCache.black[3];
				} else {
					ctx.fillStyle = `${lcdPixel.black}${(Math.ceil(e * lcdPixel.range / 255) + lcdPixel.inactive).toString(16)}`;
				};
				if (drawPixMode) {
					ctx.fillStyle = ctx.fillStyle.slice(0, 7);
				};
				ctx.fillRect(6 * pixX + 1, 12 + 6 * pixY, 5.5, 5.5);
			};
		});
		// Commit to old display buffer.
		this.#dmdb.forEach((e, i) => {
			if (this.#omdb[i] != e) {
				this.#omdb[i] = e;
			};
		});
		this.#lastTrue = trueMode;
	};
};

export default Ns5rDisplay;
