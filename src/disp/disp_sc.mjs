"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {RootDisplay, ccToPos} from "../basic/index.mjs";
import {MxFont40} from "../basic/mxReader.js";

import {
	bgOrange,
	inactivePixel,
	activePixel,
	lcdPixel,
	lcdCache
} from "./colour.js";

let cmpWidth = 7,
mspWidth = 6,
cmpHeightX = 31,
cmpHeightY = 12,
mspHeightX = 29,
mspHeightY = 10,
pdsX = cmpWidth * (17 + 2),
pdsY = cmpWidth * (7 + 3) + 1;
let ScDisplay = class extends RootDisplay {
	// Opportunistic updates
	// 0 ~ 664: Text display
	// 665 ~ 1399: Param display
	// 1400 ~ 1656: Bitmap display
	#pixelLit = 255;
	#pixelOff = 0;
	#nmdb = new Uint8Array(1656);
	#dmdb = new Uint8Array(1656);
	#omdb = new Uint8Array(1656);
	#tmdb = new Uint8Array(665); // Text display
	#pmdb = new Uint8Array(735); // Param display
	#bmdb = new Uint8Array(256); // Bitmap display
	#linger = new Uint8Array(64);
	#ch = 0;
	#lastBg = 0;
	#countBg = 0;
	useBlur = false;
	xgFont = new MxFont40("./data/bitmaps/korg/font.tsv", "./data/bitmaps/xg/font.tsv");
	constructor(conf) {
		super(new OctaviaDevice(), 0, 0.875);
		this.useBlur = !!conf?.useBlur;
	};
	setCh(ch) {
		this.#ch = ch;
	};
	getCh() {
		return this.#ch;
	};
	render(time, ctx) {
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		let fullRefresh = false;
		upThis.#nmdb.fill(0);
		// Fill with orange
		if (upThis.#countBg < 4 && timeNow - upThis.#lastBg >= 4000) {
			ctx.fillStyle = bgOrange.slice(0, 7);
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			upThis.#lastBg = timeNow;
			// Show text
			ctx.fillStyle = "#000";
			ctx.textAlign = "left";
			ctx.font = '16px "Arial Web"';
			ctx.fillText("PART", 21, 20);
			ctx.fillText("INSTRUMENT", 154, 20);
			ctx.fillText("LEVEL", 21, 91);
			ctx.fillText("PAN", 154, 91);
			ctx.fillText("REVERB", 21, 162);
			ctx.fillText("CHORUS", 154, 162);
			ctx.fillText("KEY SHIFT", 21, 233);
			ctx.fillText("MIDI CH", 154, 233);
			ctx.textAlign = "center";
			for (let c = 1; c <= 16; c ++) {
				ctx.fillText(`${c}`.padStart(2, "0"), 308 + cmpHeightX * c, 300);
			};
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000";
			let circle = 2 * Math.PI;
			for (let c = 0; c < 16; c ++) {
				let d = c % 8;
				ctx.beginPath();
				if (!d) {
					ctx.ellipse(
						316,
						(15 - c) * 12 + 100,
						4, 4,
						0, 0, circle
					);
					ctx.fill();
				} else if (d == 4) {
					ctx.ellipse(
						316,
						(15 - c) * 12 + 100,
						3, 3,
						0, 0, circle
					);
					ctx.fill();
				} else {
					ctx.ellipse(
						316,
						(15 - c) * 12 + 100,
						2, 2,
						0, 0, circle
					);
					ctx.stroke();
				};
			};
			fullRefresh = true;
			upThis.#countBg ++;
		};
		// Universal offset
		let pdaX = 22,
		pdaY = 24;
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
		// Text matrix display
		let infoTxt, isTextNull = sum.letter.text.trim();
		while (isTextNull.indexOf("  ") > -1) {
			isTextNull = isTextNull.replaceAll("  ", " ");
		};
		if (timeNow <= sum.letter.expire) {
			infoTxt = isTextNull;
			let original = sum.letter.text,
			leftTrim = original.length - original.trimLeft().length,
			rightTrim = original.length - original.trimRight().length;
			if (original.length > 16 && original.length > infoTxt.length && infoTxt.length < 16) {
				if (leftTrim > 0) {
					while(infoTxt.length < 15) {
						infoTxt = ` ${infoTxt} `;
					};
					if (infoTxt.length < 16) {
						if (leftTrim < rightTrim) {
							infoTxt = ` ${infoTxt}`;
						} else {
							infoTxt = `${infoTxt} `;
						};
					};
				};
			} else if (original.length <= 16) {
				infoTxt = original;
			};
			let xShift = 0;
			if (infoTxt.length > 16) {
				xShift = Math.floor((sum.letter.expire - timeNow) / 33) - 96;
				let maxShift = (infoTxt.length - 16) * -6;
				if (xShift < maxShift) {
					xShift = maxShift;
				} else if (xShift > 0) {
					xShift = 0;
				};
			};
			console.debug(`"${infoTxt}"`);
			this.xgFont.getStr(infoTxt).forEach(function (e0, i0) {
				e0.forEach(function (e1, i1) {
					let pX = i0 * 6 + i1 % 5 + xShift,
					pY = Math.floor(i1 / 5);
					if (pX >= 0 && pX < 95) {
						upThis.#nmdb[pY * 95 + pX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
					};
				});
			});
		} else {
			infoTxt = `${sum.chProgr[upThis.#ch] + 1}`.padStart(3, "0");
			switch (sum.chContr[chOff + ccToPos[0]]) {
				case 0: {
					switch (sum.chContr[chOff + ccToPos[32]]) {
						case 0:
						case 125:
						case 126:
						case 127: {
							infoTxt += " ";
							break;
						};
						default: {
							infoTxt += upThis.device.getMode() == "gs" ? " " : "+";
						};
					};
					break;
				};
				case 56:
				case 61:
				case 62:
				case 120:
				case 122:
				case 126:
				case 127: {
					infoTxt += " ";
					break;
				};
				default: {
					infoTxt += "+";
				};
			};
			infoTxt += upThis.getMapped(upThis.getChVoice(this.#ch).name).slice(0, 12).padEnd(12, " ");
			this.xgFont.getStr(infoTxt).forEach(function (e0, i0) {
				e0.forEach(function (e1, i1) {
					let pX = i0 * 6 + i1 % 5,
					pY = Math.floor(i1 / 5);
					upThis.#nmdb[pY * 95 + pX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				});
			});
		};
		// Assemble text
		let paramText = "";
		paramText += `${"ABCDEFGH"[upThis.#ch >> 4]}${(upThis.#ch % 16 + 1).toString().padStart(2, "0")}`;
		paramText += sum.chContr[chOff + ccToPos[7]].toString().padStart(3, " ");
		paramText += sum.chContr[chOff + ccToPos[91]].toString().padStart(3, " ");
		let cPit = upThis.device.getPitchShift(upThis.#ch);
		if (cPit < 0) {
			paramText += "-";
		} else {
			paramText += "+";
		};
		paramText += Math.round(cPit < 0 ? Math.abs(cPit) : cPit).toString().padStart(2, "0");
		let cPan = sum.chContr[chOff + ccToPos[10]];
		if (cPan == 64) {
			paramText += "C  ";
		} else if (cPan == 128) {
			paramText += "RND";
		} else {
			if (cPan > 64) {
				paramText += "R";
			} else {
				paramText += "L";
			};
			paramText += Math.abs(cPan - 64).toString().padStart(2, " ");
		};
		paramText += sum.chContr[chOff + ccToPos[93]].toString().padStart(3, " ");
		paramText += (upThis.device.getChSource()[upThis.#ch] + 1).toString().padStart(3, "0");
		// Render fonts
		upThis.xgFont.getStr(paramText).forEach(function (e0, i0) {
			e0.forEach(function (e1, i1) {
				let pX = Math.floor(i0 / 3) * 90 + i0 * 5 + i1 % 5,
				pY = Math.floor(i1 / 5);
				if (pY < 7) {
					upThis.#nmdb[pY * 15 + pX + 665] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				};
			});
		});
		// Bitmap display
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4),
		rendPos = 0;
		// Strength calculation
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
		let useBm = upThis.#nmdb.subarray(1400, 1656);
		if (timeNow <= sum.bitmap.expire) {
			sum.bitmap.bitmap.forEach((e, i) => {
				if (e) {
					useBm[i] = upThis.#pixelLit;
				};
			});
		} else {
			let rendPos = 0;
			for (let c = minCh; c <= maxCh; c ++) {
				let rendPart = rendPos >> 4;
				let strSmooth = sum.strength[c] >> (4 + rendMode),
				lingered = this.#linger[c] >> (4 + rendMode);
				if (rendMode == 2) {
					let offY = 4 * (3 - rendPart);
					for (let d = 3 - strSmooth; d < 4; d ++) {
						useBm[rendPos % 16 + (d + offY) * 16] = upThis.#pixelLit;
					};
				} else if (rendMode == 1) {
					let offY = 8 * (1 - rendPart);
					for (let d = 7 - strSmooth; d < 8; d ++) {
						useBm[rendPos % 16 + (d + offY) * 16] = upThis.#pixelLit;
					};
					useBm[rendPos % 16 + (7 - lingered + offY) * 16] = upThis.#pixelLit;
				} else {
					for (let d = 15 - strSmooth; d < 16; d ++) {
						useBm[rendPos % 16 + d * 16] = upThis.#pixelLit;
					};
					useBm[rendPos + (15 - lingered) * 16] = upThis.#pixelLit;
				};
				rendPos ++;
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
		upThis.#dmdb.forEach((e, oi) => {
			if (fullRefresh || upThis.#omdb[oi] != e) {
				let startX, startY, width = mspWidth, height = mspWidth;
				// Position the pixels
				if (oi < 665) {
					// Generic text display
					let i = oi;
					let pixelX = i % 95,
					pixelY = Math.floor(i / 95);
					startX = pdaX + 133 + pixelX * cmpWidth,
					startY = pdaY + pixelY * cmpWidth;
				} else if (oi < 1400) {
					// Param display
					let i = oi - 665;
					let regionX = i > 419 ? 1 : 0,
					regionY = 0,
					pixelX = i % 15 + Math.floor(i % 15 / 5),
					pixelY = Math.floor((i % 105) / 15);
					if (!regionX) {
						regionY = Math.floor(i / 105);
					} else {
						regionY = Math.floor((i - 315) / 105);
					};
					startX = pdaX + pdsX * regionX + pixelX * cmpWidth;
					startY = pdaY + pdsY * regionY + pixelY * cmpWidth;
				} else {
					// Bitmap display
					let i = oi - 1400;
					let pixelX = i % 16,
					pixelY = Math.floor(i / 16);
					startX = pdaX + 302 + pixelX * cmpHeightX;
					startY = pdaY + 71 + pixelY * cmpHeightY;
					width = mspHeightX;
					height = mspHeightY;
				};
				// Clear the updated pixels
				ctx.fillStyle = bgOrange.slice(0, 7);
				ctx.fillRect(startX, startY, width, height);
				// Paint the updated pixels
				if (e <= upThis.#pixelOff) {
					ctx.fillStyle = lcdCache.black[3];
				} else if (e >= upThis.#pixelLit) {
					ctx.fillStyle = lcdCache.black[4];
				} else {
					let colour = `${lcdPixel.black}${(Math.ceil(e * lcdPixel.range / 255) + lcdPixel.inactive).toString(16)}`;
					ctx.fillStyle = colour;
				};
				ctx.fillRect(startX, startY, width, height);
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

export default ScDisplay;
