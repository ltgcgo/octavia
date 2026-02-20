"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {RootDisplay} from "../basic/index.mjs";
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
	#bootFrame = 0;
	#booted = 0;
	#refreshFrame = 0;
	bootBm = new MxBmDef();
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
			if (ev.data.type === "ns5r") {
				upThis.#dumpData = ev.data.data;
				upThis.#dumpExpire = upThis.clockSource.now() + 1600;
			};
		});
		upThis.useBlur = !!conf?.useBlur;
		upThis.addEventListener("channelactive", (ev) => {
			upThis.#ch = ev.data;
		});
		upThis.bootBm.load("RsrcName\tBitmap\nboot_0\t0052001aff0ff07ff83fff81fc0fffc3fc7fff8ffff07f83fff0ff1fffe3fffc1fe0fffc3fcffffcffff87f83fff0ff3ffff3fdfe1ff0fffc3fcffffcfe3f87fc3fff0ff3fc7f3f8fe1ff0fffc3fcfe0fcfe3f87fe3fff0ff3f83f3f8fe1ff8fffc3fcfe0fcff7f07fe3ffffff3f83f3fffc1fbcffffffcfe0fcfffe07ef3ffffff3f83f3ffe01fbcffffffcfe0fcfffe07e7bffffff3f83f3fffe1f9effffffcfe0fcfe7f87e7bfff0ff3f83f3f9fe1f8ffffc3fcfe0fcfe7f87e3ffff0ff3f83f3f9fe1f8ffffc3fcff1fcfe7fc7e1ffff0ff3ffff3f8ff1f87fffc3fcffffcfe3fc7e1ffff0ff3ffff3f8ff1f83fffc3fc7fff8fe3fe7e0ffff0ff1fffe3f8ff9f83fffc3fc1ffe0fe1fe7e07f\nboot_1\t005f001a07c00f803fe001fff81fffe01fc01f01fff003fff07ffff03f803e07fff007ffe0fffff07f807c1ffff00fff81ffffe0ff01f83f8ff03fff03f00fe1fe03f0fc07e07c0007c00fc7fe07c1f807c0f8001f801f8ffc0f83f00f83f0003f003f1ff81f07f00007ff007e007e3ef87e0ff8000fff80f801fc7df0fc0ffc001fff81f01ff1fbf1f00ffe007fff07ffffe3f3e3e00fff00fc7f0fffff87c7c7c00fff01f07e1ffffe0f8fdf8007ff0000fc3ffff01f0fbe0003fe0000f87c3f807e1ffc0001fe0003f1f81f00fc1ff80000fc0007e3f03f01f03ff0fc01f8f80fc7e03f03e07fe1f803f1f81f0f807e07c07f83f00fc3f07e3f007e1f80ff03f83f83f3f87e00fc3f00fe07fffe07ffe0fc01f87c01fc07fff807ffc1f801f8f803f807ffe007fe03e003f1f003e003ff0007f00fc003f0\nbs_0\t000700073880000000000\nbs_1\t000700073888081020000\nbs_2\t0007000738080810288e0\nbs_3\t00070007388a0c18288e0\nbs_4\t00070007000a0c18288e0\nbs_5\t0007000700020408088e0\nbs_6\t000700070002040808000\nbs_7\t000700070000000000000");
		(async () => {
			await Promise.all([upThis.xgFont.loaded.wait(), upThis.trueFont.loaded.wait(), upThis.element.loaded.wait()]);
			upThis.#booted = 1;
		})();
	};
	setCh(ch) {
		this.#ch = ch;
	};
	getCh() {
		return this.#ch;
	};
	#renderParamBox(startX, value) {
		let upThis = this;
		// Draw the lever rest
		for (let p = 0; p < 180; p ++) {
			let pX = p % 12, pY = Math.floor(p / 12);
			if (
				(pY === 0 && pX < 11) ||
				(pY === 14 && pX > 0) ||
				(pY === 13)
			) {
				upThis.#nmdb[pY * 144 + pX + startX] = upThis.#pixelLit;
			} else if (pY > 0 && pY < 13) {
				if (
					pX === 0 || pX > 9 ||
					(pX === 5 && pY > 1 && pY < 12)
				) {
					upThis.#nmdb[pY * 144 + pX + startX] = upThis.#pixelLit;
				};
			};
		};
		let convertedValue = value >> 4;
		// Draw the lever
		for (let c = 0; c < 21; c ++) {
			let pX = c % 7, pY = Math.floor(c / 7),
			pcY = pY + (9 - convertedValue);
			if (pY !== 1 || pX === 0 || pX === 6) {
				upThis.#nmdb[pcY * 144 + pX + startX + 2] = upThis.#pixelLit;
			} else {
				upThis.#nmdb[pcY * 144 + pX + startX + 2] = upThis.#pixelOff;
			};
		};
	};
	#renderLine(srcX, srcY, diffX, diffY) {
		let upThis = this;
		//console.debug(diffX, diffY);
		srcX = (srcX < 0 ? Math.ceil : Math.floor)(srcX);
		srcY = (srcY < 0 ? Math.ceil : Math.floor)(srcY);
		diffX = Math.round(diffX);
		diffY = Math.round(diffY);
		if (Math.abs(diffX) < Math.abs(diffY)) {
			let theta = diffX / diffY;
			if (diffY < 0) {
				for (let p = 0; p >= diffY; p --) {
					upThis.#nmdb[Math.round(theta * p + srcX) + (srcY + p) * 144] = upThis.#pixelLit;
				};
			} else {
				for (let p = 0; p <= diffY; p ++) {
					upThis.#nmdb[Math.round(theta * p + srcX) + (srcY + p) * 144] = upThis.#pixelLit;
				};
			};
		} else {
			let theta = diffY / diffX;
			if (diffX < 0) {
				for (let p = 0; p >= diffX; p --) {
					upThis.#nmdb[Math.round(theta * p + srcY) * 144 + srcX + p] = upThis.#pixelLit;
				};
			} else {
				for (let p = 0; p <= diffX; p ++) {
					upThis.#nmdb[Math.round(theta * p + srcY) * 144 + srcX + p] = upThis.#pixelLit;
				};
			};
		};
	};
	#renderCompass(startX, startY, value) {
		let upThis = this;
		let radius = 7, circleStep = 40;
		for (let c = 0; c < circleStep; c ++) {
			let angle = Math.PI * c * 2 / circleStep;
			let intX = radius * Math.sin(angle),
			drawX = Math.sign(intX) * Math.round(Math.abs(intX));
			let intY = radius * Math.cos(angle),
			drawY = Math.sign(intY) * Math.round(Math.abs(intY));
			upThis.#nmdb[(drawY + startY) * 144 + drawX + startX] = upThis.#pixelLit;
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
			upThis.#renderLine(startX, startY, deltaX * lineStep, deltaY * lineStep);
		} else {
			upThis.#nmdb[(startY) * 144 + startX] = upThis.#pixelLit;
		};
	};
	render(time, ctx, trueMode) {
		let sum = super.render(time);
		let upThis = this;
		let timeNow = upThis.clockSource.now();
		let letterDisp = upThis.device?.getLetter(),
		bitmapDisp = upThis.device?.getBitmap();
		if (upThis.#refreshFrame < 500) {
			if (upThis.#refreshFrame % 50 === 0) {
				upThis.#refreshed = true;
			};
			upThis.#refreshFrame ++;
		};
		// Channel test
		let alreadyMin = false;
		let minCh = 0, maxCh = 0;
		upThis.device?.getActive().forEach(function (e, i) {
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
		if (timeNow < upThis.#dumpExpire) {
			upThis.#dumpData?.forEach((e, i) => {
				upThis.#nmdb[i] = e ? upThis.#pixelLit : upThis.#pixelOff;
			});
		} else if (upThis.#bootFrame < 250 || upThis.#booted < 1) {
			let frame = upThis.#bootFrame > 150 ? 1 : 0;
			let data = upThis.bootBm.getBm(`boot_${frame}`);
			if (data) {
				if (upThis.#bootFrame < 50) {} else if (upThis.#bootFrame < 250) {
					data.render((e, x, y) => {
						let innerFrame = upThis.#bootFrame - 50;
						innerFrame -= frame * 100;
						if (frame) {
							if ((Math.abs(y - 13) << 2) < innerFrame) {
								upThis.#nmdb[x + 25 + (y + 6) * 144] = e ? 255 : 0;
							};
						} else {
							if (innerFrame) {} else {
								upThis.#nmdb[x + 31 + (y + 6) * 144] = e ? 255 : 0;
							};
						};
					});
				} else {
					upThis.bootBm.getBm(`bs_${((upThis.#bootFrame - 200) >> 3) & 7}`)?.render((e, x, y) => {
						upThis.#nmdb[x + 136 + (y + 16) * 144] = e ? 255 : 0;
					});
				};
				upThis.#bootFrame ++;
			};
		} else {
			// Clear out the current working display buffer.
			upThis.#nmdb.forEach((e, i, a) => {a[i] = upThis.#pixelOff});
			// Screen buffer write begin.
			// Determine the used font
			let targetFont = trueMode ? upThis.trueFont : upThis.xgFont;
			// Show current channel
			targetFont.getStr(`${"ABCDEFGH"[upThis.#ch >> 4]}${((upThis.#ch & 15) + 1).toString().padStart(2, "0")}`).forEach((e0, i0) => {
				let secX = i0 * 6 + 1;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5);
					upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				});
			});
			// Show current pitch shift
			let cPit = upThis.device.getPitchShift(upThis.#ch);
			targetFont.getStr(`${"+-"[+(cPit < 0)]}${Math.round(Math.abs(cPit)).toString().padStart(2, "0")}`).forEach((e0, i0) => {
				let secX = i0 * 6 + 1;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 8;
					upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				});
			});
			// Render bank background
			let bankFetched = upThis.getChVoice(upThis.#ch), bankInfo = bankFetched.sect;
			for (let bankSect = 0; bankSect < 225; bankSect ++) {
				let pixX = bankSect % 25, pixY = Math.floor(bankSect / 25) + 15;
				upThis.#nmdb[pixY * 144 + pixX] = upThis.#pixelLit;
			};
			targetFont.getStr(bankInfo).forEach((e0, i0) => {
				let secX = i0 * 6 + 1;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 16;
					if (e1) {
						upThis.#nmdb[charY * 144 + secX + charX] = upThis.#pixelOff;
					};
				});
			});
			// Render program info
			let bankName = (upThis.getMapped(bankFetched.name)).slice(0, 12).padEnd(10, " ");
			targetFont.getStr(`:${(upThis.device?.getChPrimitive(upThis.#ch, 0, true)).toString().padStart(3, "0")}`).forEach((e0, i0) => {
				let secX = i0 * 6 + 25;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 16;
					upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				});
			});
			targetFont.getStr(bankName).forEach((e0, i0) => {
				let secX = i0 * 6 + 53;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 16;
					upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				});
			})
			// Render current channel
			targetFont.getStr(`${upThis.#ch + 1}`.padStart(2, "0")).forEach((e0, i0) => {
				let secX = i0 * 6;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + 32;
					upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
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
					upThis.#nmdb[pixY * 144 + pixX] = upThis.#pixelLit;
					upThis.#nmdb[pixY * 144 + pixX + 1] = upThis.#pixelLit;
					upThis.#nmdb[pixY * 144 + pixX + 2] = upThis.#pixelLit;
				};
			};
			// Render effect types
			let efxShow = upThis.device.aiEfxName.slice(0, 7 + +trueMode) || "Rev/Cho";
			targetFont.getStr(trueMode ? `Fx A:001${efxShow}` : `FxA:001${efxShow}`).forEach((e0, i0) => {
				let lineChars = trueMode ? 8 : 7;
				let secX = (i0 % lineChars) * 6 + (trueMode ? 95 : 102),
				secY = Math.floor(i0 / lineChars) * 8;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + secY;
					upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
				});
			});
			// Render letter displays
			if (timeNow < letterDisp.expire) {
				let xShift = 19 + (+trueMode) * 3;
				// White bounding box
				for (let i = 0; i < 2000; i ++) {
					let x = i % 100, y = Math.floor(i / 100);
					// Top and bottom borders
					if (
						(y === 0 && x < 99) ||
						(y === 18) ||
						(y === 19 && x > 0)
					) {
						upThis.#nmdb[y * 144 + x + xShift] = upThis.#pixelLit;
					};
					if (y > 0 && y < 18) {
						upThis.#nmdb[y * 144 + x + xShift] = +(x < 1 || x > 97) ? upThis.#pixelLit : upThis.#pixelOff;
					};
				};
				// Actual text
				targetFont.getStr(letterDisp.text).forEach((e0, i0) => {
					let secX = (i0 % 16) * 6 + xShift + 2,
					secY = Math.floor(i0 / 16) * 8 + 2;
					e0.forEach((e1, i1) => {
						let charX = i1 % 5,
						charY = Math.floor(i1 / 5) + secY;
						upThis.#nmdb[charY * 144 + secX + charX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
					});
				});
			} else {
				// Render params only when it's not covered
				let xShift = trueMode ? 2 : 0;
				upThis.#renderParamBox(20 + xShift, upThis.device?.getChCc(upThis.#ch, 7));
				upThis.#renderParamBox(33 + xShift, upThis.device?.getChCc(upThis.#ch, 11));
				if (trueMode) {
					if (upThis.device?.getChCc(upThis.#ch, 10) < 128) {
						upThis.element.getBm(`Pan_${Math.floor(upThis.device?.getChCc(upThis.#ch, 10) / 9.85)}`)?.render((e, x, y) => {
							upThis.#nmdb[y * 144 + x + 48] = e ? upThis.#pixelLit : upThis.#pixelOff;
						});
					} else {
						upThis.element.getBm("PanRndm")?.render((e, x, y) => {
							upThis.#nmdb[y * 144 + x + 48] = e ? upThis.#pixelLit : upThis.#pixelOff;
						});
					};
				} else {
					upThis.#renderCompass(53, 7, upThis.device?.getChCc(upThis.#ch, 10));
				};
				upThis.#renderParamBox(62 + 2 * (+trueMode) + xShift - (+trueMode), upThis.device?.getChCc(upThis.#ch, 91));
				upThis.#renderParamBox(75 + 2 * (+trueMode) + xShift - (+trueMode), upThis.device?.getChCc(upThis.#ch, 93));
				if (!trueMode) {
					upThis.#renderParamBox(88, upThis.device?.getChCc(upThis.#ch, 74));
				};
			};
			// Render bitmap displays
			if (timeNow < bitmapDisp.expire) {
				// White bounding box
				for (let i = 0; i < 777; i ++) {
					let x = i % 37, y = Math.floor(i / 37);
					let realX = x + 78, realY = y + 19;
					// Top and bottom borders
					if (
						(y === 0 && x < 36) ||
						(y === 19) ||
						(y === 20 && x > 0)
					) {
						upThis.#nmdb[realY * 144 + realX] = upThis.#pixelLit;
					};
					if (y > 0 && y < 19) {
						upThis.#nmdb[realY * 144 + realX] = +(x < 1 || x > 34) ? upThis.#pixelLit : upThis.#pixelOff;
					};
				};
				// Actual bitmap
				let colUnit = (bitmapDisp.bitmap.length > 256) ? 1 : 2;
				for (let i = 0; i < 512; i += colUnit) {
					let x = i & 31, y = i >> 5;
					let realX = x + 80, realY = y + 21;
					let bit = bitmapDisp.bitmap[i >> (colUnit - 1)] ? upThis.#pixelLit : upThis.#pixelOff;
					upThis.#nmdb[realY * 144 + realX] = bit;
					if (colUnit === 2) {
						upThis.#nmdb[realY * 144 + realX + 1] = bit;
					};
				};
			};
		};
		// Screen buffer write finish.
		// Determine if full render is required.
		let drawPixMode = false;
		if (upThis.#lastTrue !== trueMode) {
			upThis.#refreshed = true;
		};
		if (upThis.#refreshed) {
			// Full render required.
			// Clear all pixels.
			ctx.fillStyle = upThis.#backlight.replace("64", "");
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.textAlign = "center";
			ctx.font = '12px "Jost"';
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
				if (c === 1 || c === 32 || c % 5 === 0) {
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
			upThis.#refreshed = false;
		};
		// Transitional
		upThis.#nmdb.forEach((e, i) => {
			if (upThis.useBlur) {
				let diff = e - upThis.#dmdb[i],
				cap = 48;
				if (Math.abs(diff) > cap) {
					upThis.#dmdb[i] += Math.sign(diff) * cap;
				} else if (diff !== 0) {
					upThis.#dmdb[i] = e;
				};
			} else {
				if (upThis.#dmdb[i] !== e) {
					upThis.#dmdb[i] = e;
				};
			};
		});
		// Commit to display accordingly.
		upThis.#dmdb.forEach((e, i) => {
			let pixX = i % 144, pixY = Math.floor(i / 144);
			let hasDifference = upThis.#omdb[i] !== e;
			if (!drawPixMode && hasDifference) {
				ctx.fillStyle = upThis.#backlight.slice(0, 7);
				ctx.fillRect(6 * pixX + 1, 12 + 6 * pixY, 6, 6);
			};
			if (drawPixMode || hasDifference) {
				if (e >= upThis.#pixelLit) {
					ctx.fillStyle = lcdCache.black[4];
				} else if (e <= upThis.#pixelOff) {
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
		upThis.#dmdb.forEach((e, i) => {
			if (upThis.#omdb[i] !== e) {
				upThis.#omdb[i] = e;
			};
		});
		upThis.#lastTrue = trueMode;
	};
};

export default Ns5rDisplay;
