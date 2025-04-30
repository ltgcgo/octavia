"use strict";

import {OctaviaDevice, allocated} from "../state/index.mjs";
import {RootDisplay, ccToPos} from "../basic/index.mjs";
import {MxFont40, MxBmDef} from "../basic/mxReader.js";

import {
	bgOrange,
	inactivePixel,
	activePixel,
	lcdPixel,
	lcdCache
} from "./colour.js";

const textMultiTable = [0, 95, 190, 285, 380, 475, 570];

//let tmpMelodicBypassCat = Uint8Array.from([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

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
	#sysMsg;
	#sysTime = 0;
	#pixelLit = 255;
	#pixelOff = 0;
	#nmdb = new Uint8Array(1656);
	#dmdb = new Uint8Array(1656);
	#omdb = new Uint8Array(1656);
	#tmdb; // Text display
	#pmdb; // Param display
	#bmdb; // Bitmap display
	#velo = new Uint8Array(allocated.ch);
	#rawStrength = new Uint8Array(allocated.ch);
	#linger = new Uint16Array(allocated.ch);
	#lingerExtra = new Uint16Array(allocated.ch);
	#lingerPress = new Uint16Array(allocated.ch);
	#noteOn = new Uint8Array(allocated.ch);
	#ch = 0;
	#lastBg = 0;
	#countBg = 0;
	useBlur = false;
	#bootFrame = 0;
	#booted = 0;
	bootBm = new MxBmDef();
	xgFont = new MxFont40("./data/bitmaps/korg/font.tsv", "./data/bitmaps/xg/font.tsv");
	constructor(conf) {
		super(new OctaviaDevice(), 0, 0.4);
		let upThis = this;
		upThis.useBlur = !!conf?.useBlur;
		upThis.#tmdb = upThis.#nmdb.subarray(0, 665);
		upThis.#pmdb = upThis.#nmdb.subarray(665, 1400);
		upThis.#bmdb = upThis.#nmdb.subarray(1400, 1656);
		upThis.addEventListener("mode", function (ev) {
			switch (ev.data) {
				case "?": {
					return;
					break;
				};
				case "sc": {
					upThis.#sysMsg = `    Mode 1`;
					break;
				};
				case "gm": {
					upThis.#sysMsg = `GM System On`;
					break;
				};
				case "g2": {
					upThis.#sysMsg = `GM2 System On`;
					break;
				};
				case "gs": {
					upThis.#sysMsg = `GS Reset`;
					break;
				};
				case "xg": {
					upThis.#sysMsg = `XG System On`;
					break;
				};
				default: {
					upThis.#sysMsg = `Sys:${{"?":"Init","g2":"GM2","mt32":"MT-32","ag10":"AG-10","05rw":"05R/W","k11":"GMega","krs":"KROSS 2","s90es":"S90 ES","motif":"Motif ES"}[ev.data]||ev.data.toUpperCase()}`;
				};
			};
			upThis.#sysTime = Date.now() + 800;
			//this.device.setLetterDisplay(textArr);
		});
		upThis.addEventListener("channelactive", (ev) => {
			upThis.#ch = ev.data;
		});
		upThis.addEventListener("note", ({data}) => {
			if (data.state === 3) {
				upThis.#noteOn[data.part] = 10;
				if (data.state === 3 && data.velo) {
					upThis.#lingerPress[data.part] = 1;
				};
			};
		});
		upThis.bootBm.load("RsrcName\tBitmap\nboot\t002a000c71c0e38f003ef87df3e008a211448802080451220082011448803c8338e3ea67a0df7cf3bc28045120c90a0114482262884512089fbe1f7c823dc7038e2086\nmask\t0008001080804040202010100808040402020101\ntext\t005f001f000000880080008000000000000001b00100030000000000000002a71a70020000000000000005514d10040000000000000008a28be008000000000000001145140010000000000000002271e700700000000000000000000000000000000071c8bc8befbc01e88089ce1d145b45111044041131b1121208aa8a222088082262a222241155e44479e00e5405444448228a0888828002a98888889145141111048005531111211c72281c23e880f140227387000000000000000000000000c1c880f00780600000f00001911101101000400c01100000423202202070801802271cb1045407803911000007910594089808800be200600a3e7a1311101100140430c01241140672203c03c71c60002271e8000000000000000000000000f0001020000001e89efbe881100020000f30041140441b02271ce18b2260082280882a079144811944000e28e11e5408a2890222798002202220881145124444130004404441103c71c31c89c000f08f08fa200");
		upThis.xgFont.loaded.wait().then(() => {
			upThis.#booted = 1;
		});
	};
	async handleProp(entry) {
		entry.scSqr = parseInt(entry.scSqr);
		entry.scScale = Math.ceil(parseFloat(entry.scScale) * 256);
		//console.debug(entry);
	};
	reset() {
		super.reset();
		this.#lingerExtra.fill(0);
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
		let scConf = upThis.device.modelEx.sc;
		upThis.#nmdb.fill(0);
		// Fill with orange
		if (upThis.#countBg < 10 && timeNow - upThis.#lastBg >= 1000) {
			ctx.fillStyle = bgOrange.slice(0, 7);
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			upThis.#lastBg = timeNow;
			// Show text
			ctx.fillStyle = "#000";
			ctx.textAlign = "left";
			ctx.font = '420 23px "Work Sans"';
			ctx.textRendering = "geometricPrecision";
			ctx.scale(1, 0.8);
			ctx.letterSpacing = "-1px";
			ctx.fillText("PART", 23, 25);
			ctx.fillText("INSTRUMENT", 156, 25);
			ctx.fillText("LEVEL", 23, 113.75);
			ctx.fillText("PAN", 156, 113.75);
			ctx.fillText("REVERB", 23, 202.5);
			ctx.fillText("CHORUS", 156, 202.5);
			ctx.fillText("KEY SHIFT", 23, 291.25);
			ctx.fillText("MIDI CH", 156, 291.25);
			ctx.resetTransform();
			ctx.scale(1, 0.85);
			ctx.textAlign = "center";
			ctx.textRendering = "auto";
			ctx.fontStretch = "extra-expanded";
			for (let c = 1; c <= 16; c ++) {
				ctx.fillText(`${c}`, 308 + cmpHeightX * c, 352.94);
			};
			ctx.resetTransform();
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
				} else if (d === 4) {
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
		if (upThis.#bootFrame < 50) {
			upThis.#bootFrame ++;
		} else if (upThis.#bootFrame < 250 || upThis.#booted < 1) {
			let data = upThis.bootBm.getBm("boot");
			let mask = upThis.bootBm.getBm("mask");
			if (data) {
				let sX = (upThis.#bootFrame - 68) >> 2;
				sX = Math.max(-6, Math.min(27, sX));
				let sX1 = (upThis.#bootFrame - 178) >> 1;
				//console.debug(sX);
				for (let i = 0; i < 224; i ++) {
					let pX = i & 15, pY = i >> 4;
					let dX = pX + sX;
					if (dX >= 0 && dX < data.width) {
						let value = data[dX + pY * data.width];
						if (mask && sX1 >= 0) {
							if (sX1 >> 6) {
								sX1 = sX1 & 63;
							};
							let sX2 = 7 - sX1, dX2 = pX + sX2;
							if (dX2 >= 0 && dX2 < 8 && mask[((pY + 2) << 3) + dX2] > 0) {
								value = 0;
							};
						};
						upThis.#bmdb[pX + ((pY + 2) << 4)] = value ? 255 : 0;
					};
				};
				let textData = upThis.bootBm.getBm("text"), textY = Math.min(3, (upThis.#bootFrame - 50)  >> 5) << 3;
				for (let pX = 0; pX < 95; pX ++) {
					for (let pY = 0; pY < 7; pY ++) {
						upThis.#tmdb[pX + textMultiTable[pY]] = textData[pX + (pY + textY) * 95] ? 255 : 0;
					};
				};
				upThis.#bootFrame ++;
			};
		} else {
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
				upThis.#ch = minCh + (upThis.#ch & 15);
			};
			if (upThis.#ch < minCh) {
				upThis.#ch = maxCh - 15 + (upThis.#ch & 15);
			};
			let chOff = upThis.#ch * ccToPos.length;
			// Text matrix display
			let infoTxt, isTextNull = sum.letter.text.trim();
			while (isTextNull.indexOf("  ") > -1) {
				isTextNull = isTextNull.replaceAll("  ", " ");
			};
			let voiceObject = upThis.getChVoice(upThis.#ch);
			if (timeNow <= upThis.#sysTime) {
				upThis.xgFont.getStr(upThis.#sysMsg || "No system text!").forEach(function (e0, i0) {
					e0.forEach(function (e1, i1) {
						let pX = i0 * 6 + i1 % 5,
						pY = Math.floor(i1 / 5);
						upThis.#nmdb[textMultiTable[pY] + pX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
					});
				});
			} else if (timeNow <= sum.letter.expire && ((sum.mode !== "gs" && sum.mode !== "sc") || sum.letter.text?.length <= 16)) {
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
				//console.debug(`"${infoTxt}"`);
				upThis.xgFont.getStr(infoTxt).forEach(function (e0, i0) {
					e0.forEach(function (e1, i1) {
						let pX = i0 * 6 + i1 % 5 + xShift,
						pY = Math.floor(i1 / 5);
						if (pX >= 0 && pX < 95) {
							upThis.#nmdb[textMultiTable[pY] + pX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
						};
					});
				});
			} else {
				let deviceMode = upThis.device?.getChMode(upThis.#ch);
				infoTxt = `${sum.chProgr[upThis.#ch] + 1}`.padStart(3, "0");
				let primBuf = upThis.device.getChPrimitives(upThis.#ch);
				switch (primBuf[0]) {
					case 0: {
						switch (primBuf[2]) {
							case 0: {
								switch (deviceMode) {
									case "gm": {
										infoTxt += "_";
										break;
									};
									default: {
										infoTxt += " ";
									};
								};
								break;
							};
							case 125: {
								infoTxt += " ";
								break;
							};
							case 126:
							case 127: {
								switch (deviceMode) {
									case "gs":
									case "sc": {
										infoTxt += "#";
										break;
									};
									default: {
										infoTxt += " ";
									};
								};
								break;
							};
							default: {
								switch (deviceMode) {
									case "gs":
									case "sc": {
										infoTxt += " ";
										break;
									};
									default: {
										infoTxt += (voiceObject.eid[2] === voiceObject.iid[2] || voiceObject.ending === " ") ? "+" : "!";
									};
								};
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
					case 127:
					case 128: {
						infoTxt += " ";
						break;
					};
					default: {
						infoTxt += (voiceObject.eid[2] === voiceObject.iid[2] || voiceObject.ending === " ") ? "+" : "!";
					};
				};
				infoTxt += upThis.getMapped(voiceObject.name).slice(0, 12).padEnd(12, " ");
				let timeOff = 0;
				if (sum.mode === "gs" || sum.mode === "sc") {
					if (sum.letter.text.length > 16 && timeNow < sum.letter.set + 15000) { // 50 * 300ms
						let critTxt = `${infoTxt}<${sum.letter.text}<${infoTxt}`;
						let critOff = sum.letter.set + (critTxt.length - 16) * 300;
						if (timeNow < critOff) {
							infoTxt = critTxt;
							timeOff = critOff - timeNow;
						};
					};
				};
				if (timeOff) {
					let textWindow = infoTxt.length - Math.floor(timeOff / 300);
					infoTxt = infoTxt.slice(Math.max(0, textWindow - 16), Math.max(16, textWindow));
				};
				upThis.xgFont.getStr(infoTxt).forEach(function (e0, i0) {
					e0.forEach(function (e1, i1) {
						let pX = i0 * 6 + i1 % 5,
						pY = Math.floor(i1 / 5);
						upThis.#nmdb[textMultiTable[pY] + pX] = e1 ? upThis.#pixelLit : upThis.#pixelOff;
					});
				});
			};
			// Assemble text
			let paramText = "";
			paramText += `${"ABCDEFGH"[upThis.#ch >> 4]}${((upThis.#ch & 15) + 1).toString().padStart(2, "0")}`;
			paramText += sum.chContr[chOff + ccToPos[7]].toString().padStart(3, " ");
			paramText += sum.chContr[chOff + ccToPos[91]].toString().padStart(3, " ");
			let cPit = upThis.device.getPitchShift(upThis.#ch);
			if (cPit < 0) {
				paramText += "-";
			} else if (cPit === 0) {
				paramText += "±";
			} else {
				paramText += "+";
			};
			paramText += Math.round(cPit < 0 ? Math.abs(cPit) : cPit).toString().padStart(2, " ");
			let cPan = sum.chContr[chOff + ccToPos[10]];
			if (cPan === 64) {
				paramText += "C 0";
			} else if (cPan === 128) {
				paramText += "RND";
			} else if (cPan < 1) {
				paramText += "L63";
			} else {
				if (cPan > 64) {
					paramText += "R";
				} else {
					paramText += "L";
				};
				paramText += Math.abs(cPan - 64).toString().padStart(2, " ");
			};
			paramText += sum.chContr[chOff + ccToPos[93]].toString().padStart(3, " ");
			let chSource = upThis.device.getChSource()[upThis.#ch];
			if (chSource < 128) {
				paramText += "ABCDEFGH"[chSource >> 4];
				paramText += ((chSource & 15) + 1).toString().padStart(2, "0");
			} else {
				paramText += `${"ABCDEFGH"[upThis.#ch >> 4]}--`;
			};
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
			let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4);
			// Strength calculation
			let rawStrength = upThis.device?.getRawStrength();
			for (let i = 0; i < allocated.ch; i ++) {
				if (upThis.#lingerPress[i] > 0 && rawStrength[i] > 0) {
					upThis.#rawStrength[i] = rawStrength[i];
				};
				let e = sum.strength[i];
				//i === 9 && console.debug(upThis.#velo[i], e);
				//let isMelodic = upThis.device?.getChType(i) === 0 && tmpMelodicBypassCat[upThis.getChPrimitive(i, 0, true) >> 3] === 0;
				// This is for when the scaling factors are not available
				// upThis.#velo[i] = isMelodic ? (e * e) >> 8 : e;
				// When the scaling factors are available, use the code below instead
				let voiceObj = upThis.getChVoice(i);
				let props = upThis.getProps(voiceObj);
				let scalingFactor = props?.scScale ?? 256;
				upThis.#velo[i] = e * scalingFactor >> 8;
				switch (props?.scSqr) {
					case 16: {
						upThis.#velo[i] = (((upThis.#velo[i] * scalingFactor) >> 8) * upThis.#rawStrength[i]) >> 7;
						break;
					};
					case 4:
					case 3:
					case 2:
					case 1: {
						for (let i1 = 0; i1 < props?.scSqr; i1 ++) {
							upThis.#velo[i] = (upThis.#velo[i] * upThis.#rawStrength[i]) >> 7;
							/*if (props?.scSqr !== 16 && i === 0) {
								console.debug(i1, upThis.#velo[i], upThis.#rawStrength[i], sum.strength[i]);
							};*/
						};
						break;
					};
					default: {
						//
					};
				};
				// upThis.#velo[i] = isMelodic ? (e * rawStrength[i]) >> 7 : e;
			};
			//console.debug(upThis.#velo[0], rawStrength[0], sum.strength[0]);
			for (let i = 0; i < allocated.ch; i ++) {
				let realVelo = upThis.#velo[i];
				if (scConf.peakHold === 3 && upThis.#lingerPress[i]) {
					upThis.#lingerPress[i] --;
					upThis.#lingerExtra[i] = 40;
					if (realVelo !== upThis.#linger[i]) {
						upThis.#linger[i] = realVelo << 8;
					};
				};
				if ((realVelo >> 4) << 4 > upThis.#linger[i] >> 8) {
					if (scConf.peakHold !== 3 && upThis.#lingerPress[i]) {
						upThis.#linger[i] = realVelo << 8;
						upThis.#lingerExtra[i] = 40;
					};
				} else {
					let shouldKeep = upThis.#lingerExtra[i] >> 4;
					if (shouldKeep) {
						if (upThis.#lingerExtra[i] > 1) {
							upThis.#lingerExtra[i] -= 1;
						} else {
							upThis.#lingerExtra[i] = 0;
						};
					} else {
						let val;
						switch (scConf.peakHold) {
							case 3: {
								//console.debug("FLOAT?");
								if (upThis.#linger[i] === 0) {
									break;
								};
								//console.debug("FLOAT!");
								val = upThis.#linger[i] + (384 << rendMode);
								if (val > 65535) {
									val = 0;
								};
								break;
							};
							case 2: {
								val = 0;
								break;
							};
							case 1:
							case 0: {
								val = upThis.#linger[i] - (384 << rendMode);
								//console.debug("SINK!");
								if (val < 0) {
									val = 0;
								};
								break;
							};
						};
						upThis.#linger[i] = val;
					};
				};
			};
			//console.debug(upThis.#linger.join(", "));
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
					let realVelo = upThis.#velo[c];
					let strSmooth = realVelo >> (4 + rendMode),
					lingered = upThis.#linger[c] >> (12 + rendMode);
					switch (rendMode) {
						case 2: {
							let offY = 4 * (3 - rendPart);
							if (scConf.invBar) {
								if (scConf.showBar) {
									for (let d = strSmooth; d >= 0; d --) {
										useBm[(rendPos & 15) + ((d + offY) << 4)] = upThis.#pixelLit;
									};
								} else {
									useBm[(rendPos & 15) + ((strSmooth + offY) << 4)] = upThis.#pixelLit;
								};
							} else {
								if (scConf.showBar) {
									for (let d = 3 - strSmooth; d < 4; d ++) {
										useBm[(rendPos & 15) + ((d + offY) << 4)] = upThis.#pixelLit;
									};
								} else {
									useBm[(rendPos & 15) + ((3 - strSmooth + offY) << 4)] = upThis.#pixelLit;
								};
							};
							break;
						};
						case 1: {
							let offY = 8 * (1 - rendPart);
							if (scConf.invBar) {
								if (scConf.showBar) {
									for (let d = strSmooth; d >= 0; d --) {
										useBm[(rendPos & 15) + ((d + offY) << 4)] = upThis.#pixelLit;
									};
								} else {
									useBm[(rendPos & 15) + (offY << 4)] = upThis.#pixelLit;
									if (strSmooth) {
										useBm[(rendPos & 15) + ((strSmooth + offY) << 4)] = upThis.#pixelLit;
									};
								};
								if (scConf.peakHold && lingered) {
									useBm[(rendPos & 15) + ((lingered + offY) << 4)] = upThis.#pixelLit;
								};
							} else {
								if (scConf.showBar) {
									for (let d = 7 - strSmooth; d < 8; d ++) {
										useBm[(rendPos & 15) + ((d + offY) << 4)] = upThis.#pixelLit;
									};
								} else {
									useBm[(rendPos & 15) + ((7 + offY) << 4)] = upThis.#pixelLit;
									if (strSmooth) {
										useBm[(rendPos & 15) + ((7 - strSmooth + offY) << 4)] = upThis.#pixelLit;
									};
								};
								if (scConf.peakHold && lingered) {
									useBm[(rendPos & 15) + ((7 - lingered + offY) << 4)] = upThis.#pixelLit;
								};
							};
							break;
						};
						case 0: {
							if (scConf.invBar) {
								if (scConf.showBar) {
									for (let d = strSmooth; d >= 0; d --) {
										useBm[(rendPos & 15) + (d << 4)] = upThis.#pixelLit;
									};
								} else {
									useBm[(rendPos & 15)] = upThis.#pixelLit;
									if (strSmooth) {
										useBm[(rendPos & 15) + (strSmooth << 4)] = upThis.#pixelLit;
									};
								};
								if (scConf.peakHold && lingered) {
									useBm[rendPos + (lingered << 4)] = upThis.#pixelLit;
								};
							} else {
								if (scConf.showBar) {
									for (let d = 15 - strSmooth; d < 16; d ++) {
										useBm[(rendPos & 15) + (d << 4)] = upThis.#pixelLit;
									};
								} else {
									useBm[(rendPos & 15) + 240] = upThis.#pixelLit;
									if (strSmooth) {
										useBm[(rendPos & 15) + ((15 - strSmooth) << 4)] = upThis.#pixelLit;
									};
								};
								if (scConf.peakHold && lingered) {
									useBm[rendPos + ((15 - lingered) << 4)] = upThis.#pixelLit;
								};
							};
							break;
						};
					};
					rendPos ++;
				};
				if (scConf.invDisp) {
					for (let i = 0; i < useBm.length; i ++) {
						useBm[i] = upThis.#pixelLit - useBm[i];
					};
				};
			};
		};
		// Guide the drawn matrix
		upThis.#nmdb.forEach((e, i) => {
			if (upThis.#dmdb[i] !== e) {
				if (upThis.useBlur) {
					let diff = e - upThis.#dmdb[i],
					cap = 80;
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
			if (fullRefresh || upThis.#omdb[oi] !== e) {
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
					let pixelX = i & 15,
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
			if (upThis.#omdb[i] !== e) {
				upThis.#omdb[i] = e;
			};
		});
	};
};

export default ScDisplay;
