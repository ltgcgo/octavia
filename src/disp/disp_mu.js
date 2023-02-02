"use strict";

import {RootDisplay, ccToPos} from "../basic/index.mjs";
import {MxFont40, MxBm256} from "../basic/mxReader.js";

import {
	bgGreen,
	inactivePixel,
	activePixel
} from "./colour.js";

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
	#minCh = 0;
	#maxCh = 0;
	#panStrokes = new Uint8Array(7);
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	sysBm = new MxBm256("./data/bitmaps/xg/system.tsv");
	voxBm = new MxBm256("./data/bitmaps/xg/voices.tsv");
	aniBm = new MxBm256("./data/bitmaps/xg/animation.tsv");
	constructor() {
		super();
		let upThis = this;
		this.addEventListener("mode", function (ev) {
			(upThis.sysBm.getBm(`st_${({"gm":"gm1","g2":"gm2","?":"gm1","ns5r":"korg","ag10":"korg","x5d":"korg","05rw":"korg","krs":"korg","sg":"gm1","k11":"gm1"})[ev.data] || ev.data}`) || []).forEach(function (e, i) {
				upThis.#bmdb[i] = e;
			});
			upThis.#bmst = 2;
			upThis.#bmex = Date.now() + 1600;
		});
		this.addEventListener("channelactive", (ev) => {
			this.#ch = ev.data;
		});
		this.addEventListener("channelmin", (ev) => {
			if (ev.data >= 0) {
				this.#minCh = ev.data + 1;
			};
		});
		this.addEventListener("channelmax", (ev) => {
			if (ev.data > this.#minCh - 1) {
				this.#maxCh = ev.data + 1;
			} else {
				this.#minCh = 0;
				this.#maxCh = 0;
			};
		});
		this.addEventListener("channelreset", () => {
			this.#minCh = 0;
			this.#maxCh = 0;
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
		this.#minCh = 0;
		this.#maxCh = 0;
		if (this.demoInfo) {
			delete this.demoInfo;
		};
	};
	render(time, ctx) {
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		// Fill with green
		//ctx.fillStyle = "#af2";
		ctx.fillStyle = bgGreen;
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
			this.#ch = minCh + this.#ch & 15;
		};
		if (this.#ch < minCh) {
			this.#ch = maxCh - 15 + (this.#ch & 15);
		};
		if (this.#minCh && this.#minCh > 0) {
			minCh = this.#minCh - 1;
		};
		if (this.#maxCh && this.#maxCh <= 128) {
			maxCh = this.#maxCh - 1;
		};
		let chOff = this.#ch * ccToPos.length;
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4),
		rendPos = 0;
		let showLsb = !sum.chContr[chOff + ccToPos[0]];
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
				let voiceName = (upThis.getChVoice(this.#ch).name).slice(0, 8).padEnd(8, " ");
				let bnkSel = (sum.chContr[chOff + ccToPos[0]] == 64 ? "SFX" : sum.chContr[chOff + ccToPos[0]] || sum.chContr[chOff + ccToPos[32]] || 0).toString().padStart(3, "0");
				if (upThis.getMode() == "xg") {
					if ([80, 81, 82, 83, 84, 96, 97, 98, 99, 100].indexOf(sum.chContr[chOff + ccToPos[0]]) > -1) {
						bnkSel = `${sum.chContr[chOff + ccToPos[32]] || 0}`.padStart(3, "0");
						showLsb = true;
					};
				};
				let bnkInfo = `\u0080${bnkSel}\u0081${((sum.chProgr[this.#ch] || 0) + 1).toString().padStart(3, "0")}`;
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
				if (c + minCh == this.#ch) {
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
		ctx.fillText("REV", 648, 254);
		ctx.fillText("CHO", 696.5, 254);
		ctx.fillText("VAR", 745, 254);
		ctx.fillText("KEY", 801, 254);
		ctx.fillText("PAN", 583, 254);
		// Show parts
		upThis.xgFont.getStr(`${(this.#ch + 1).toString().padStart(2, "0")}${"ABCDEFGH"[this.#ch >> 4]}${(this.#ch % 16 + 1).toString().padStart(2, "0")}`).forEach(function (e0, i0) {
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
		} else if (this.demoInfo && time > 0) {
			let sequence = this.demoInfo.class || "boot";
			let stepTime = this.demoInfo.fps || 2;
			let stepSize = this.demoInfo.size || 4;
			let stepId = `${sequence}_${Math.floor(time * stepTime % stepSize)}`;
			useBm = this.aniBm?.getBm(stepId) || this.sysBm?.getBm(stepId) || this.sysBm?.getBm("no_abm");
			if (!useBm) {
				useBm = this.#bmdb.slice();
			};
		} else {
			// Use stored pic
			useBm = this.#bmdb.slice();
			if (timeNow >= this.#bmex) {
				this.#bmst = 0;
				let standard = upThis.getChVoice(this.#ch).standard.toLowerCase();
				useBm = this.voxBm.getBm(upThis.getChVoice(this.#ch).name) || this.voxBm.getBm(upThis.getVoice(sum.chContr[chOff] + ccToPos[0], sum.chProgr[this.#ch], 0, sum.mode).name);
				if (["an", "ap", "dr", "dx", "pc", "pf", "sg", "vl"].indexOf(standard) > -1) {
					useBm = this.sysBm.getBm(`ext_${standard}`);
				};
				if (!useBm && (sum.chContr[chOff + ccToPos[0]] < 48 || sum.chContr[chOff + ccToPos[0]] == 56)) {
					useBm = this.voxBm.getBm(upThis.getVoice(0, sum.chProgr[this.#ch], 0, sum.mode).name)
				};
				if (!useBm && (sum.chContr[chOff] + ccToPos[0]) == 126) {
					useBm = this.sysBm.getBm("cat_smpl");
				};
				if (!useBm && (sum.chContr[chOff] + ccToPos[0]) == 64) {
					useBm = this.sysBm.getBm("cat_sfx");
				};
				if (!useBm) {
					useBm = this.sysBm.getBm("no_abm");
				};
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
		normParamPaint(sum.chContr[chOff + ccToPos[7]], 404, ctx); // vol
		normParamPaint(sum.chContr[chOff + ccToPos[11]], 452, ctx); // exp
		normParamPaint(sum.chContr[chOff + ccToPos[74]], 500, ctx); // bri
		efxParamPaint(sum.chContr[chOff + ccToPos[91]], 648, ctx); // rev
		efxParamPaint(sum.chContr[chOff + ccToPos[93]], 696, ctx); // cho
		efxParamPaint(sum.chContr[chOff + ccToPos[94]], 744, ctx); // var
		// Show pan
		ctx.beginPath();
		ctx.arc(582, 216, 34, 2.356194490192345, 7.068583470577034);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000f";
		ctx.stroke();
		let pan = sum.chContr[chOff + ccToPos[10]];
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
			ctx.radial(582, 216, [
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

export default MuDisplay;
