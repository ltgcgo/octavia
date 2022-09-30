"use strict";

import {textedPanning, textedPitchBend} from "./texted.js";
import {RootDisplay} from "../basic/index.mjs";
import {MxFont40, MxBm256} from "../basic/mxReader.js";

const noteNames = [
	"C~", "C#", "D~", "Eb",
	"E~", "F~", "F#", "G~",
	"Ab", "A~", "Bb", "B~"
], noteRegion = "!0123456789",
hexMap = "0123456789ABCDEF",
map = "0123456789_aAbBcCdDeEfFgGhHiIjJ-kKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
waveMap = ["-", "~", "+", "|"];

const modeNames = {
	"?": "UnkwnStd",
	"gm": "GnrlMIDI",
	"g2": "GrlMIDI2",
	"xg": "YamahaXG",
	"gs": "RolandGS",
	"mt32": "RlndMT32",
	"ag10": "KorgAG10",
	"x5d": "Korg X5D",
	"05rw": "Korg05RW",
	"ns5r": "KorgNS5R"
};

// Velocity to brightness
let velToLuma = function (velo) {
	let newVel = velo * 2 + 1;
	return `${hexMap[newVel >> 4]}${hexMap[newVel & 15]}`;
};

let TuiDisplay = class extends RootDisplay {
	constructor() {
		super();
	};
	render(time, ctx) {
		let fields = new Array(24);
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		let cramTempo = Math.round(sum.tempo * 100) / 100;
		fields[0] = `${sum.eventCount.toString().padStart(3, "0")} Poly:${(sum.curPoly+sum.extraPoly).toString().padStart(3, "0")}/256 TSig:${sum.tSig[0]}/${sum.tSig[1]} Bar:${(sum.noteBar + 1).toString().padStart(3, "0")}/${sum.noteBeat + 1} Tempo:${Math.floor(cramTempo)}.${Math.floor(cramTempo % 1 * 100).toString().padStart(2, "0")} Vol:${Math.floor(sum.master.volume)}.${Math.round(sum.master.volume % 1 * 100).toString().padStart(2, "0")}%`;
		fields[1] = `Mode:${modeNames[sum.mode]} Title:${sum.title || "N/A"}`;
		fields[2] = "Ch:VoiceNme#St VEM RCDB PP PiBd Pan : Note";
		let line = 3, maxCh = 0;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				maxCh = i;
				let chOffset = i * 128;
				if (line < fields.length - 5 && i >= (self.minCh || 0)) {
					let voiceName = upThis.voices.get(sum.chContr[chOffset + 0], sum.chProgr[i], sum.chContr[chOffset + 32], sum.mode);
					if (sum.names[i]) {
						voiceName.name = sum.names[i];
						voiceName.ending = "~";
					};
					fields[line] = `${(i + 1).toString().padStart(2, "0")}:${voiceName.name.slice(0, 8).padEnd(8, " ")}${voiceName.ending}${voiceName.standard} ${map[sum.chContr[chOffset + 7] >> 1]}${map[sum.chContr[chOffset + 11] >> 1]}${waveMap[sum.chContr[chOffset + 1] >> 5]} ${map[sum.chContr[chOffset + 91] >> 1]}${map[sum.chContr[chOffset + 93] >> 1]}${map[sum.chContr[chOffset + 94] >> 1]}${map[sum.chContr[chOffset + 74] >> 1]} ${sum.chContr[chOffset + 65] > 63 ? "O" : "X"}${map[sum.chContr[chOffset + 5] >> 1]} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(sum.chContr[chOffset + 10])}:`;
					sum.chKeyPr[i].forEach(function (e1, i1) {
						if (e1 > 0) {
							fields[line] += ` <span style="opacity:${Math.round(e1 / 1.27) / 100}">${noteNames[i1 % 12]}${noteRegion[Math.floor(i1 / 12)]}</span>`;
						};
					});
					line ++;
				};
			};
		});
		if (sum.texts.length > 0) {
			let metaLine = 0,
			st = fields.length - 1;
			while (st >= line) {
				if (sum.texts[metaLine]?.length) {
					fields[st] = (sum.texts[metaLine] || "").padEnd(100, " ");
				};
				if (sum.texts[metaLine]?.length > 0 || sum.texts[metaLine]?.length == undefined) {
					st --;
				};
				metaLine ++;
			};
		};
		if (timeNow <= sum.letter.expire) {
			let letterDisp = sum.letter.text.padEnd(32, " ");
			let startLn = fields.length - 2;
			for (let st = 0; st < 2; st ++) {
				fields[st + startLn] = `${(fields[st + startLn] || "").slice(0, 82).padEnd(81)} <span class="letter"> ${letterDisp.slice(st * 16, st * 16 + 16).padEnd(" ", 16)} </span>`;
			};
		};
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		if (ctx) {
			ctx.fillStyle = "#202020";
			let renderer;
			if (timeNow <= sum.bitmap.expire) {
				renderer = sum.bitmap.bitmap;
			} else {
				renderer = new Array(256);
				if (maxCh < 16) {
					sum.strength.forEach(function (e, i) {
						if (i < 16) {
							let strength = e >> 4;
							for (let dot = 0; dot <= strength; dot ++) {
								renderer[i + (15 - dot) * 16] = 1;
							};
						};
					});
				} else {
					sum.strength.forEach(function (e, i) {
						if (i < 32) {
							let strength = e >> 5;
							for (let dot = 0; dot <= strength; dot ++) {
								renderer[i + ((i > 15 ? 6 : 15) - dot) * 16] = 1;
							};
						};
					});
				};
			};
			renderer.forEach(function (e, i) {
				if (e) {
					ctx.fillRect((i & 15) * 12, (i >> 4) * 6, 11, 5);
				};
			});
			// Create a dividing line
			/* for (let c = 0; c < 15; c ++) {
				ctx.clearRect(c * 12 + 5, 0, 1, ctx.canvas.height);
			}; */
		};
		return fields.join("<br/>");
	};
};


//let inactivePixel = "#000a",
//activePixel = "#0002";
let inactivePixel = "#0000000b",
activePixel = "#00000068";

let mprWidth = 8,
mpaWidth = 7,
mprHeight = 4,
mpaHeight = 3;
let normParamPaint = function (sup, offsetX, ctx) {
	let paramW = mprWidth * 4 - 1;
	let paramH = mprHeight * 1.5 - 1;
	let sub = sup >> 4;
	for (let i = 0; i < 8; i ++) {
		if (sub >= 0) {
			ctx.fillStyle = activePixel;
		} else {
			ctx.fillStyle = inactivePixel;
		};
		sub --;
		let invI = 7 - i;
		ctx.fillRect(offsetX, 181 + invI * mprWidth, paramW, paramH);
	};
};
let startA = Math.PI * 255 / 180;
let endA = Math.PI * 285 / 180;
let efxParamPaint = function (sup, offsetX, ctx) {
	let paramW = mprWidth * 4 - 1;
	let paramH = mprHeight * 1.5 - 1;
	let sub = sup >> 4;
	for (let i = 0; i < 8; i ++) {
		if (sub >= 0) {
			ctx.strokeStyle = activePixel;
		} else {
			ctx.strokeStyle = inactivePixel;
		};
		sub --;
		let invI = 7 - i;
		ctx.beginPath();
		ctx.arc(offsetX, 256, (9 - invI) * mprWidth, startA, endA);
		ctx.lineWidth = paramH;
		ctx.stroke();
	};
};

CanvasRenderingContext2D.prototype.radial = function (centreX, centreY, angle, startR, stopR) {
	let adjAngle = angle - 1.5707963267948966;
	let vSin = Math.sin(adjAngle);
	let vCos = Math.cos(adjAngle);
	this.beginPath();
	this.moveTo(centreX + (vSin * startR), centreY + (vCos * startR));
	this.lineTo(centreX + (vSin * stopR), centreY + (vCos * stopR));
	this.stroke();
};

let MuDisplay = class extends RootDisplay {
	#mmdb = new Uint8Array(1360);
	#pmdb = new Uint8Array(200);
	#bmdb = new Uint8Array(256);
	#bmst = 0; // 0 for voice bank, 2 for standard, 1 for sysex
	#bmex = 0; // state expiration
	#ch = 0;
	#panStrokes = new Uint8Array(7);
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	sysBm = new MxBm256("./data/bitmaps/xg/system.tsv");
	voxBm = new MxBm256("./data/bitmaps/xg/voices.tsv");
	constructor() {
		super();
		let upThis = this;
		this.addEventListener("mode", function (ev) {
			(upThis.sysBm.getBm(`st_${({"gm":"gm1","g2":"gm2","?":"gm1","ns5r":"korg","ag10":"korg","x5d":"korg","05rw":"korg"})[ev.data] || ev.data}`) || []).forEach(function (e, i) {
				upThis.#bmdb[i] = e;
			});
			upThis.#bmst = 2;
			upThis.#bmex = Date.now() + 1600;
		});
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
		// Fill with green
		//ctx.fillStyle = "#af2";
		ctx.fillStyle = "#aaff2264";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// Main matrix display
		this.#mmdb.forEach((e, i, a) => {a[i] = 0});
		// Part display
		this.#pmdb.forEach((e, i, a) => {a[i] = 0});
		// Strength
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
			this.#ch = minCh;
		};
		if (this.#ch < minCh) {
			this.#ch = maxCh;
		};
		let chOff = this.#ch * 128;
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4),
		rendPos = 0;
		if (timeNow <= sum.letter.expire && sum.letter.text.length > 0) {
			// Show display text
			upThis.xgFont.getStr(sum.letter.text.padEnd(32, " ")).forEach(function (e0, i0) {
				let regionX = (i0 % 16) * 5 + 5,
				regionY = Math.floor(i0 / 16) * 8;
				e0.forEach(function (e1, i1) {
					let partX = i1 % 5,
					partY = Math.floor(i1 / 5);
					upThis.#mmdb[(regionY + partY) * 85 + regionX + partX] = e1;
				});
			});
		} else {
			// Show strength metre
			upThis.#mmdb[1275] = 1;
			upThis.#mmdb[1276] = 1;
			upThis.#mmdb[1278] = 1;
			upThis.#mmdb[1279] = 1;
			for (let ch = minCh; ch <= maxCh; ch ++) {
				let curStrn = sum.strength[ch];
				if (rendMode) {
					curStrn = curStrn >> 5;
				} else {
					curStrn = curStrn >> 4;
				};
				if (rendMode == 0 || rendMode == 1) {
					// 16 channel
					for (let pI = 0; pI <= curStrn; pI ++) {
						let pR = 5 + rendPos * 3 + (15 - pI) * 85 - Math.floor(rendPos / 2);
						upThis.#mmdb[pR] = 1;
						upThis.#mmdb[pR + 1] = 1;
					};
				} else {
					// 64 channel
					for (let pI = 0; pI <= curStrn; pI ++) {
						let pR = 5 + rendPos * 3 + (15 - pI) * 85 - Math.floor(rendPos / 2);
						if (rendPos > 31) {
							pR -= 760;
						};
						upThis.#mmdb[pR] = 1;
						upThis.#mmdb[pR + 1] = 1;
					};
				};
				rendPos ++;
			};
			// Render fonts
			if (rendMode < 2) {
				let voiceName = (sum.names[this.#ch] || upThis.voices.get(sum.chContr[chOff + 0], sum.chProgr[this.#ch], sum.chContr[chOff + 32], sum.mode).name).slice(0, 8).padEnd(8, " ");
				let bnkInfo = `\u0080${(sum.chContr[chOff + 0] == 64 ? "SFX" : sum.chContr[chOff + 0] || sum.chContr[chOff + 32] || 0).toString().padStart(3, "0")}\u0081${((sum.chProgr[this.#ch] || 0) + 1).toString().padStart(3, "0")}`;
				let bitSeq = upThis.xgFont.getStr(bnkInfo + voiceName);
				bitSeq.forEach(function (e0, i0) {
					let regionX = 0, regionY = 0;
					if (rendMode == 1) {
						regionX = i0 * 5;
					} else if (!rendMode) {
						regionX = (i0 % 8) * 5 + 45,
						regionY = 8 - Math.floor(i0 / 8) * 8;
					};
					e0.forEach(function (e1, i1) {
						let partX = i1 % 5,
						partY = Math.floor(i1 / 5);
						if (rendMode == 1 && i0 > 7) {
							partX = partX + 5;
						};
						upThis.#mmdb[(regionY + partY) * 85 + regionX + partX] = e1;
					});
				});
			};
		};
		// Commit to main screen
		for (let i = 0; i < 1360; i ++) {
			let pX = i % 85;
			let pY = Math.floor(i / 85);
			ctx.fillStyle = inactivePixel;
			if (upThis.#mmdb[i]) {
				ctx.fillStyle = activePixel;
			};
			ctx.fillRect(16 + (pX + Math.floor(pX / 5)) * mprWidth, 12 + pY * mprWidth, mpaWidth, mpaWidth);
		};
		ctx.textAlign = "center";
		ctx.font = '12px "Arial Web"';
		// Display parts under strengths
		{
			let initOff = 71.5;
			for (let c = -2; c < 32; c ++) {
				ctx.fillStyle = activePixel;
				if (c == this.#ch) {
					ctx.fillStyle = inactivePixel;
				};
				let filler = "";
				if (c >= 0) {
					filler = (c + 1).toString().padStart(2, "0");
				} else {
					filler = `A${c + 3}`;
				};
				ctx.fillText(filler, initOff + 24 * c, 150);
			};
		};
		// Show bottom caps
		let showLsb = !sum.chContr[chOff + 0];
		ctx.fillStyle = showLsb ? inactivePixel : activePixel;
		ctx.fillText("MSB", 515, 164);
		ctx.fillStyle = showLsb ? activePixel : inactivePixel;
		ctx.fillText("LSB", 564, 164);
		ctx.fillStyle = activePixel;
		ctx.fillText("BANK", 467.5, 164);
		ctx.fillText("PRG#", 660, 164);
		ctx.fillText("CHANNEL     SEC     PART", 118, 254);
		ctx.fillText("VOL", 420, 254);
		ctx.fillText("EXP", 468, 254);
		ctx.fillText("BRT", 516, 254);
		ctx.fillText("REV", 660, 254);
		ctx.fillText("CHO", 708.5, 254);
		ctx.fillText("VAR", 757, 254);
		ctx.fillText("KEY", 807, 254);
		ctx.fillText("PAN", 589, 254);
		// Show parts
		upThis.xgFont.getStr(`${(this.#ch + 1).toString().padStart(2, "0")}${"ABCD"[this.#ch >> 4]}${(this.#ch % 16 + 1).toString().padStart(2, "0")}`).forEach(function (e0, i0) {
			let regionX = i0 * 5;
			e0.forEach(function (e1, i1) {
				let partX = i1 % 5,
				partY = Math.floor(i1 / 5);
				upThis.#pmdb[partY * 25 + regionX + partX] = e1;
			});
		});
		// Commit to part screen
		for (let i = 0; i < 200; i ++) {
			let pX = i % 25;
			let pY = Math.floor(i / 25);
			ctx.fillStyle = inactivePixel;
			if (upThis.#pmdb[i]) {
				ctx.fillStyle = activePixel;
			};
			ctx.fillRect(16 + (pX + Math.floor(pX / 5)) * mprWidth, 180 + pY * mprWidth, mpaWidth, mpaWidth);
		};
		// Fetch voice bitmap
		// Commit to bitmap screen
		let useBm;
		if (timeNow <= sum.bitmap.expire) {
			// Use provided bitmap
			useBm = sum.bitmap.bitmap;
		} else {
			// Use stored pic
			useBm = this.#bmdb.slice();
			if (timeNow >= this.#bmex) {
				this.#bmst = 0;
				useBm = this.voxBm.getBm(upThis.voices.get(sum.chContr[chOff + 0], sum.chProgr[this.#ch], sum.chContr[chOff + 32], sum.mode).name) || this.voxBm.getBm(upThis.voices.get(sum.chContr[chOff + 0], sum.chProgr[this.#ch], 0, sum.mode).name) || this.sysBm.getBm("no_abm");
			} else {
				if (this.#bmst == 2) {
					useBm.forEach((e, i, a) => {
						let crit = Math.floor((this.#bmex - timeNow) / 400);
						a[i] = crit % 2 == e;
					});
				};
			};
		};
		for (let i = 0; i < 256; i ++) {
			let pX = i % 16;
			let pY = Math.floor(i / 16);
			ctx.fillStyle = inactivePixel;
			if (useBm[i]) {
				ctx.fillStyle = activePixel;
			};
			ctx.fillRect(260 + pX * mprWidth, 180 + pY * mprHeight, mpaWidth, mpaHeight);
		};
		// Show param
		normParamPaint(sum.chContr[chOff + 7], 404, ctx); // vol
		normParamPaint(sum.chContr[chOff + 11], 452, ctx); // exp
		normParamPaint(sum.chContr[chOff + 74], 500, ctx); // bri
		efxParamPaint(sum.chContr[chOff + 91], 660, ctx); // rev
		efxParamPaint(sum.chContr[chOff + 93], 708, ctx); // cho
		efxParamPaint(sum.chContr[chOff + 70], 756, ctx); // var
		// Show pan
		ctx.beginPath();
		ctx.arc(588, 216, 34, 2.356194490192345, 7.068583470577034);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000f";
		ctx.stroke();
		let pan = sum.chContr[chOff + 10];
		this.#panStrokes.forEach((e, i, a) => {a[i] = 0});
		if (pan == 0) {
			this.#panStrokes[0] = 1;
		} else if (pan == 64) {
			this.#panStrokes[3] = 1;
		} else if (pan == 128) {
			this.#panStrokes[1] = 1;
			this.#panStrokes[5] = 1;
		} else if (pan < 64) {
			this.#panStrokes[Math.floor(pan / 21)] = 1;
		} else {
			this.#panStrokes[4 + Math.floor((pan - 65) / 21)] = 1;
		};
		ctx.lineWidth = mprHeight;
		for (let i = 0; i < 7; i ++) {
			ctx.strokeStyle = inactivePixel;
			if (this.#panStrokes[i]) {
				ctx.strokeStyle = activePixel;
			};
			ctx.radial(588, 216, [
				7.068583470577034,
				6.283185307179586,
				5.497787143782138,
				4.71238898038469,
				3.9269908169872414,
				3.141592653589793,
				2.356194490192345
			][i], 8, 26)
		};
	};
};

let cmpWidth = 7,
mspWidth = 6,
cmpHeightX = 31,
cmpHeightY = 12,
mspHeightX = 29,
mspHeightY = 10,
pdsX = cmpWidth * (17 + 2),
pdsY = cmpWidth * (7 + 3) + 1;
let ScDisplay = class extends RootDisplay {
	#tmdb = new Uint8Array(665); // Text display
	#pmdb = new Uint8Array(735); // Param display
	#bmdb = new Uint8Array(256); // Bitmap display
	#strength = new Uint8Array(64);
	#linger = new Uint8Array(64);
	#ch = 0;
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	constructor() {
		super();
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
		// Fill with green
		//ctx.fillStyle = "#af2";
		ctx.fillStyle = "#ffaa2264";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
			this.#ch = minCh;
		};
		if (this.#ch < minCh) {
			this.#ch = maxCh;
		};
		let chOff = this.#ch * 128;
		// Text matrix display
		this.#tmdb.forEach((e, i, a) => {a[i] = 0});
		let infoTxt, isTextNull = sum.letter.text.trim();
		while (isTextNull.indexOf("  ") > -1) {
			isTextNull = isTextNull.replaceAll("  ", " ");
		};
		if (timeNow <= sum.letter.expire) {
			infoTxt = isTextNull;
			let original = sum.letter.text,
			leftTrim = original.length - original.trimLeft().length,
			rightTrim = original.length - original.trimRight().length;
			if (original.length > infoTxt.length && infoTxt.length < 16) {
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
			this.xgFont.getStr(infoTxt).forEach(function (e0, i0) {
				e0.forEach(function (e1, i1) {
					let pX = i0 * 6 + i1 % 5 + xShift,
					pY = Math.floor(i1 / 5);
					if (pX >= 0 && pX < 95) {
						upThis.#tmdb[pY * 95 + pX] = e1;
					};
				});
			});
		} else {
			infoTxt = `${sum.chProgr[this.#ch] + 1}`.padStart(3, "0");
			infoTxt += " ";
			infoTxt += (sum.names[this.#ch] || upThis.voices.get(sum.chContr[chOff + 0], sum.chProgr[this.#ch], sum.chContr[chOff + 32], sum.mode).name).slice(0, 12).padEnd(12, " ");
			this.xgFont.getStr(infoTxt).forEach(function (e0, i0) {
				e0.forEach(function (e1, i1) {
					let pX = i0 * 6 + i1 % 5,
					pY = Math.floor(i1 / 5);
					upThis.#tmdb[pY * 95 + pX] = e1;
				});
			});
		};
		// Commit to text matrix display
		this.#tmdb.forEach(function (e, i) {
			ctx.fillStyle = inactivePixel;
			if (e) {
				ctx.fillStyle = activePixel;
			};
			let pixelX = i % 95,
			pixelY = Math.floor(i / 95);
			ctx.fillRect(
				pdaX + 133 + pixelX * cmpWidth,
				pdaY + pixelY * cmpWidth,
				mspWidth,
				mspWidth
			);
		});
		// Param display
		this.#pmdb.forEach((e, i, a) => {a[i] = 0});
		// Assemble text
		let paramText = "";
		paramText += `${"ABCD"[this.#ch >> 4]}${(this.#ch % 16 + 1).toString().padStart(2, "0")}`;
		paramText += sum.chContr[chOff + 7].toString().padStart(3, " ");
		paramText += sum.chContr[chOff + 91].toString().padStart(3, " ");
		let cPit = (sum.chPitch[this.#ch] / 8192 * sum.rpn[this.#ch * 4]);
		if (cPit < 0) {
			paramText += "-";
		} else {
			paramText += "+";
		};
		paramText += Math.round(cPit < 0 ? Math.abs(cPit) : cPit).toString().padStart(2, "0");
		let cPan = sum.chContr[chOff + 10];
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
		paramText += sum.chContr[chOff + 93].toString().padStart(3, " ");
		paramText += (sum.chContr[chOff] || sum.chContr[chOff + 32]).toString().padStart(3, "0");
		// Render fonts
		this.xgFont.getStr(paramText).forEach(function (e0, i0) {
			e0.forEach(function (e1, i1) {
				let pX = Math.floor(i0 / 3) * 90 + i0 * 5 + i1 % 5,
				pY = Math.floor(i1 / 5);
				if (pY < 7) {
					upThis.#pmdb[pY * 15 + pX] = e1;
				};
			});
		});
		// Commit to param display
		this.#pmdb.forEach(function (e, i) {
			ctx.fillStyle = inactivePixel;
			if (e) {
				ctx.fillStyle = activePixel;
			};
			let regionX = i > 419 ? 1 : 0,
			regionY = 0,
			pixelX = i % 15 + Math.floor(i % 15 / 5),
			pixelY = Math.floor((i % 105) / 15);
			if (!regionX) {
				regionY = Math.floor(i / 105);
			} else {
				regionY = Math.floor((i - 315) / 105);
			};
			ctx.fillRect(
				pdaX + pdsX * regionX + pixelX * cmpWidth,
				pdaY + pdsY * regionY + pixelY * cmpWidth,
				mspWidth,
				mspWidth
			);
		});
		// Bitmap display
		this.#bmdb.forEach((e, i, a) => {a[i] = 0});
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4),
		rendPos = 0;
		// Strength calculation
		sum.velo.forEach(function (e, i) {
			if (e >= upThis.#strength[i]) {
				upThis.#strength[i] = e;
			} else {
				let diff = upThis.#strength[i] - e;
				upThis.#strength[i] -= diff / 8;
			};
			if (e >= upThis.#linger[i]) {
				upThis.#linger[i] = e;
			} else {
				let val = upThis.#linger[i] - 2;
				if (val < 0) {
					val = 0;
				};
				upThis.#linger[i] = val;
			};
		});
		let useBm = this.#bmdb;
		if (timeNow <= sum.bitmap.expire) {
			useBm = sum.bitmap.bitmap;
		} else {
			let rendPos = 0;
			for (let c = minCh; c <= maxCh; c ++) {
				let rendPart = rendPos >> 4;
				let strSmooth = this.#strength[c] >> (4 + rendMode),
				lingered = this.#linger[c] >> (4 + rendMode);
				if (rendMode == 2) {
					let offY = 4 * (3 - rendPart);
					for (let d = 3 - strSmooth; d < 4; d ++) {
						this.#bmdb[rendPos % 16 + (d + offY) * 16] = 1;
					};
				} else if (rendMode == 1) {
					let offY = 8 * (1 - rendPart);
					for (let d = 7 - strSmooth; d < 8; d ++) {
						this.#bmdb[rendPos % 16 + (d + offY) * 16] = 1;
					};
					this.#bmdb[rendPos % 16 + (7 - lingered + offY) * 16] = 1;
				} else {
					for (let d = 15 - strSmooth; d < 16; d ++) {
						this.#bmdb[rendPos % 16 + d * 16] = 1;
					};
					this.#bmdb[rendPos + (15 - lingered) * 16] = 1;
				};
				rendPos ++;
			};
		};
		// Commit to bitmap display
		useBm.forEach(function (e, i) {
			ctx.fillStyle = inactivePixel;
			if (e) {
				ctx.fillStyle = activePixel;
			};
			let pixelX = i % 16,
			pixelY = Math.floor(i / 16);
			ctx.fillRect(
				pdaX + 302 + pixelX * cmpHeightX,
				pdaY + 71 + pixelY * cmpHeightY,
				mspHeightX,
				mspHeightY
			);
		});
		// Show text
		ctx.fillStyle = "#000c";
		ctx.textAlign = "left";
		ctx.font = '16px "Arial Web"';
		ctx.fillText("PART", 21, 20);
		ctx.fillText("INSTRUMENT", 154, 20);
		ctx.fillText("LEVEL", 21, 91);
		ctx.fillText("PAN", 154, 91);
		ctx.fillText("REVERB", 21, 162);
		ctx.fillText("CHORUS", 154, 162);
		ctx.fillText("KEY SHIFT", 21, 233);
		ctx.fillText("BANK", 154, 233);
		ctx.textAlign = "right";
		ctx.fillText("SB", 274, 233);
		ctx.textAlign = "center";
		for (let c = 1; c <= 16; c ++) {
			ctx.fillText(`${c}`.padStart(2, "0"), 308 + cmpHeightX * c, 300);
		};
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#000c";
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
		if (sum.chContr[chOff]) {
			ctx.fillStyle = activePixel;
		} else {
			ctx.fillStyle = inactivePixel;
		};
		ctx.fillText("M", 236, 233);
		if (sum.chContr[chOff]) {
			ctx.fillStyle = inactivePixel;
		} else {
			ctx.fillStyle = activePixel;
		};
		ctx.fillText("L", 248, 233);
	};
};

export {
	TuiDisplay,
	MuDisplay,
	ScDisplay
};
