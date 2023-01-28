"use strict";

import {textedPanning, textedPitchBend} from "./texted.js";
import {RootDisplay, ccToPos} from "../basic/index.mjs";
import {MxFont40, MxBm256, MxBmDef} from "../basic/mxReader.js";

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
	"ns5r": "KorgNS5R",
	"krs": "KorgKros",
	"k11": "KawaiK11",
	"sg": "AkaiPrSG"
};

const bgOrange = "#ffaa2264",
bgGreen = "#aaff2264",
bgWhite = "#b3d8de64",
bgRed = "#ff798664";

// Velocity to brightness
let velToLuma = function (velo) {
	let newVel = velo * 2 + 1;
	return `${hexMap[newVel >> 4]}${hexMap[newVel & 15]}`;
};

let TuiDisplay = class extends RootDisplay {
	#maxPoly = 0;
	constructor() {
		super();
		this.addEventListener("reset", () => {
			this.#maxPoly = 0;
		});
	};
	render(time, ctx) {
		let fields = new Array(24);
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		let cramTempo = Math.round(sum.tempo * 100) / 100;
		let curPoly = sum.curPoly + sum.extraPoly;
		if (this.#maxPoly < curPoly) {
			this.#maxPoly = curPoly;
		};
		fields[0] = `${sum.eventCount.toString().padStart(3, "0")} ${curPoly.toString().padStart(3, "0")}:${this.#maxPoly.toString().padStart(3, "0")}/512 TSig:${sum.tSig[0]}/${sum.tSig[1]} Bar:${(sum.noteBar + 1).toString().padStart(3, "0")}/${Math.floor(sum.noteBeat) + 1} Tempo:${Math.floor(cramTempo)}.${Math.floor(cramTempo % 1 * 100).toString().padStart(2, "0")} Vol:${Math.floor(sum.master.volume)}.${Math.round(sum.master.volume % 1 * 100).toString().padStart(2, "0")}%`;
		fields[1] = `Mode:${modeNames[sum.mode]} Title:${sum.title || "N/A"}`;
		fields[2] = "Ch:VoiceNme#St VEM RCDB PP PiBd Pan : Note";
		let line = 3, maxCh = 0;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				maxCh = i;
				let chOffset = i * ccToPos.length;
				if (line < fields.length - 5 && i >= (self.minCh || 0)) {
					let voiceName = upThis.getChVoice(i);
					fields[line] = `${(i + 1).toString().padStart(2, "0")}:${voiceName.name.slice(0, 8).padEnd(8, " ")}${voiceName.ending}${voiceName.standard} ${map[sum.chContr[chOffset + ccToPos[7]] >> 1]}${map[sum.chContr[chOffset + ccToPos[11]] >> 1]}${waveMap[sum.chContr[chOffset + ccToPos[1]] >> 5]} ${map[sum.chContr[chOffset + ccToPos[91]] >> 1]}${map[sum.chContr[chOffset + ccToPos[93]] >> 1]}${map[sum.chContr[chOffset + ccToPos[94]] >> 1]}${map[sum.chContr[chOffset + ccToPos[74]] >> 1]} ${sum.chContr[chOffset + ccToPos[65]] > 63 ? "O" : "X"}${map[sum.chContr[chOffset + ccToPos[5]] >> 1]} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(sum.chContr[chOffset + ccToPos[10]])}:`;
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
				fields[st + startLn] = `${(fields[st + startLn] || "").slice(0, 82).padEnd(81, " ")} <span class="letter"> ${letterDisp.slice(st * 16, st * 16 + 16).padEnd(" ", 16)} </span>`;
			};
		};
		if (ctx) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
					if ([80, 81, 82, 83, 96, 97, 98, 99].indexOf(sum.chContr[chOff + ccToPos[0]]) > -1) {
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
	xgFont = new MxFont40("./data/bitmaps/korg/font.tsv");
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
		// Fill with orange
		//ctx.fillStyle = "#af2";
		ctx.fillStyle = bgOrange;
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
			this.#ch = minCh + this.#ch & 15;
		};
		if (this.#ch < minCh) {
			this.#ch = maxCh - 15 + (this.#ch & 15);
		};
		let chOff = this.#ch * ccToPos.length;
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
			infoTxt += (upThis.getChVoice(this.#ch).name).slice(0, 12).padEnd(12, " ");
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
		paramText += `${"ABCDEFGH"[this.#ch >> 4]}${(this.#ch % 16 + 1).toString().padStart(2, "0")}`;
		paramText += sum.chContr[chOff + ccToPos[7]].toString().padStart(3, " ");
		paramText += sum.chContr[chOff + ccToPos[91]].toString().padStart(3, " ");
		let cPit = (sum.chPitch[this.#ch] / 8192 * sum.rpn[this.#ch * 6] + (sum.rpn[this.#ch * 6 + 3] - 64));
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
		paramText += (sum.chContr[chOff + ccToPos[0]] || sum.chContr[chOff + ccToPos[32]]).toString().padStart(3, "0");
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
		if (sum.chContr[chOff + ccToPos[0]]) {
			ctx.fillStyle = activePixel;
		} else {
			ctx.fillStyle = inactivePixel;
		};
		ctx.fillText("M", 236, 233);
		if (sum.chContr[chOff + ccToPos[0]]) {
			ctx.fillStyle = inactivePixel;
		} else {
			ctx.fillStyle = activePixel;
		};
		ctx.fillText("L", 248, 233);
	};
};

let Ns5rDisplay = class extends RootDisplay {
	#omdb = new Uint8Array(5760); // Full display
	#nmdb = new Uint8Array(5760); // Full display, but on commit
	#mode = "?";
	#strength = new Uint8Array(64);
	#ch = 0;
	#backlight;
	#refreshed = true;
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	trueFont = new MxFont40("./data/bitmaps/korg/font.tsv");
	constructor() {
		super();
		this.#backlight = bgWhite;
		this.addEventListener("mode", (ev) => {
			this.#backlight = {
				"gs": bgOrange,
				"mt32": bgOrange,
				"xg": bgGreen,
				"ns5r": bgGreen,
				"x5d": bgGreen,
				"ag10": bgRed,
				"05rw": bgGreen,
				"k11": bgGreen,
				"gmlx": bgGreen,
				"sg01": bgRed
			}[ev.data] || bgWhite;
			this.#mode = ev.data;
			this.#refreshed = true;
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
				this.#nmdb[pY * 144 + pX + startX] = 1;
			} else if (pY > 0 && pY < 13) {
				if (
					pX == 0 || pX > 9 ||
					(pX == 5 && pY > 1 && pY < 12)
				) {
					this.#nmdb[pY * 144 + pX + startX] = 1;
				};
			};
		};
		let convertedValue = value >> 4;
		// Draw the lever
		for (let c = 0; c < 21; c ++) {
			let pX = c % 7, pY = Math.floor(c / 7),
			pcY = pY + (9 - convertedValue);
			if (pY != 1 || pX == 0 || pX == 6) {
				this.#nmdb[pcY * 144 + pX + startX + 2] = 1;
			} else {
				this.#nmdb[pcY * 144 + pX + startX + 2] = 0;
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
			this.#nmdb[(drawY + startY) * 144 + drawX + startX] = 1;
		};
		if (value < 128) {
			let normAngle = Math.floor(value / 9.85) * 22.5;
			//let normAngle = Math.floor(value * 2.126);
			let lineStep = 5, angle = Math.PI * (315 - normAngle) / 180;
			let deltaX = Math.sin(angle), deltaY = Math.cos(angle);
			for (let c = 0; c <= lineStep; c ++) {
				let drawX = Math.round(c * deltaX),
				drawY = Math.round(c * deltaY);
				this.#nmdb[(drawY + startY) * 144 + drawX + startX] = 1;
			};
		} else {
			this.#nmdb[(startY) * 144 + startX] = 1;
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
		// Clear out the current working display buffer.
		this.#nmdb.forEach((e, i, a) => {a[i] = 0});
		// Screen buffer write begin.
		// Determine the used font
		let targetFont = trueMode ? this.trueFont : this.xgFont;
		// Show current channel
		targetFont.getStr(`${"ABCDEFGH"[this.#ch >> 4]}${((this.#ch & 15) + 1).toString().padStart(2, "0")}`).forEach((e0, i0) => {
			let secX = i0 * 6 + 1;
			e0.forEach((e1, i1) => {
				let charX = i1 % 5,
				charY = Math.floor(i1 / 5);
				this.#nmdb[charY * 144 + secX + charX] = e1;
			});
		});
		// Show current pitch shift
		let cPit = (sum.chPitch[this.#ch] / 8192 * sum.rpn[this.#ch * 6] + (sum.rpn[this.#ch * 6 + 3] - 64));
		targetFont.getStr(`${"+-"[+(cPit < 0)]}${Math.round(Math.abs(cPit)).toString().padStart(2, "0")}`).forEach((e0, i0) => {
			let secX = i0 * 6 + 1;
			e0.forEach((e1, i1) => {
				let charX = i1 % 5,
				charY = Math.floor(i1 / 5) + 8;
				this.#nmdb[charY * 144 + secX + charX] = e1;
			});
		});
		// Render bank background
		let bankFetched = upThis.getChVoice(this.#ch), bankInfo = bankFetched.sect;
		for (let bankSect = 0; bankSect < 225; bankSect ++) {
			let pixX = bankSect % 25, pixY = Math.floor(bankSect / 25) + 15;
			this.#nmdb[pixY * 144 + pixX] = 1;
		};
		targetFont.getStr(bankInfo).forEach((e0, i0) => {
			let secX = i0 * 6 + 1;
			e0.forEach((e1, i1) => {
				let charX = i1 % 5,
				charY = Math.floor(i1 / 5) + 16;
				if (e1) {
					this.#nmdb[charY * 144 + secX + charX] = 0;
				};
			});
		});
		// Render program info
		let bankName = (bankFetched.name).slice(0, 10).padEnd(10, " ");
		targetFont.getStr(`:${(sum.chProgr[this.#ch] + 1).toString().padStart(3, "0")} ${bankName}`).forEach((e0, i0) => {
			let secX = i0 * 6 + 25;
			e0.forEach((e1, i1) => {
				let charX = i1 % 5,
				charY = Math.floor(i1 / 5) + 16;
				this.#nmdb[charY * 144 + secX + charX] = e1;
			});
		});
		// Render current channel
		targetFont.getStr(`${this.#ch + 1}`.padStart(2, "0")).forEach((e0, i0) => {
			let secX = i0 * 6;
			e0.forEach((e1, i1) => {
				let charX = i1 % 5,
				charY = Math.floor(i1 / 5) + 32;
				this.#nmdb[charY * 144 + secX + charX] = e1;
			});
		});
		// Strength calculation
		sum.velo.forEach((e, i) => {
			if (e >= this.#strength[i]) {
				let diff = e - this.#strength[i];
				this.#strength[i] += Math.ceil(diff * 0.8);
			} else {
				let diff = this.#strength[i] - e;
				this.#strength[i] -= Math.ceil(diff / 10);
			};
		});
		// Render channel strength
		let showReduction = 22;
		if (maxCh > 31) {
			showReduction = 43;
		};
		this.#strength.forEach((e, i) => {
			if (maxCh < 32 && i > 31) {
				return;
			};
			for (let c = Math.floor(e / showReduction); c >= 0; c --) {
				let pixX = (i % 32) * 4 + 12,
				pixY = (i > 31 ? 32 : 39) - c;
				this.#nmdb[pixY * 144 + pixX] = 1;
				this.#nmdb[pixY * 144 + pixX + 1] = 1;
				this.#nmdb[pixY * 144 + pixX + 2] = 1;
			};
		});
		// Render effect types
		targetFont.getStr(trueMode ? "Fx A:001Rev/Cho" : "FxA:001Rev/Cho").forEach((e0, i0) => {
			let lineChars = trueMode ? 8 : 7;
			let secX = (i0 % lineChars) * 6 + (trueMode ? 95 : 102),
			secY = Math.floor(i0 / lineChars) * 8;
			e0.forEach((e1, i1) => {
				let charX = i1 % 5,
				charY = Math.floor(i1 / 5) + secY;
				this.#nmdb[charY * 144 + secX + charX] = e1;
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
					this.#nmdb[y * 144 + x + xShift] = 1;
				};
				if (y > 0 && y < 18) {
					this.#nmdb[y * 144 + x + xShift] = +(x < 1 || x > 97);
				};
			};
			// Actual text
			targetFont.getStr(sum.letter.text).forEach((e0, i0) => {
				let secX = (i0 % 16) * 6 + xShift + 2,
				secY = Math.floor(i0 / 16) * 8 + 2;
				e0.forEach((e1, i1) => {
					let charX = i1 % 5,
					charY = Math.floor(i1 / 5) + secY;
					this.#nmdb[charY * 144 + secX + charX] = e1;
				});
			});
		} else {
			// Render params only when it's not covered
			let xShift = trueMode ? 2 : 0;
			this.#renderParamBox(20 + xShift, sum.chContr[chOff + ccToPos[7]]);
			this.#renderParamBox(33 + xShift, sum.chContr[chOff + ccToPos[11]]);
			this.#renderCompass(53 + (+trueMode) + xShift, 7, sum.chContr[chOff + ccToPos[10]]);
			this.#renderParamBox(62 + 2 * (+trueMode) + xShift, sum.chContr[chOff + ccToPos[91]]);
			this.#renderParamBox(75 + 2 * (+trueMode) + xShift, sum.chContr[chOff + ccToPos[93]]);
			if (!trueMode) {
				this.#renderParamBox(88, sum.chContr[chOff + ccToPos[74]]);
			};
		};
		// Render bitmap displays
		if (timeNow < sum.bitmap.expire) {
			// White bounding box
			for (let i = 0; i < 777; i ++) {
				let x = i % 37, y = Math.floor(i / 37);
				let realX = x + 77 + (+trueMode), realY = y + 19;
				// Top and bottom borders
				if (
					(y == 0 && x < 36) ||
					(y == 19) ||
					(y == 20 && x > 0)
				) {
					this.#nmdb[realY * 144 + realX] = 1;
				};
				if (y > 0 && y < 19) {
					this.#nmdb[realY * 144 + realX] = +(x < 1 || x > 34);
				};
			};
			// Actual bitmap
			let colUnit = (sum.bitmap.bitmap.length == 512) ? 1 : 2;
			for (let i = 0; i < 512; i += colUnit) {
				let x = i & 31, y = i >> 5;
				let realX = x + 79 + (+trueMode), realY = y + 21;
				this.#nmdb[realY * 144 + realX] = sum.bitmap.bitmap[i / colUnit];
				if (colUnit == 2) {
					this.#nmdb[realY * 144 + realX + 1] = sum.bitmap.bitmap[i / colUnit];
				};
			};
		};
		// Screen buffer write finish.
		// Determine if full render is required.
		let drawPixMode = false;
		if (this.#refreshed) {
			// Full render required.
			// Clear all pixels.
			ctx.fillStyle = this.#backlight.replace("64", "");
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.textAlign = "center";
			ctx.font = '11px "Arial Web"';
			ctx.fillStyle = "#000e";
			ctx.fillText("MIDI. CH", 58, 10);
			ctx.fillText("VOL", 153.5, 10);
			ctx.fillText("EXP", 231.5, 10);
			ctx.fillText("PAN", 322.5, 10);
			ctx.fillText("REV", 405, 10);
			ctx.fillText("CHO", 484, 10);
			ctx.fillText("BRT", 561.5, 10);
			ctx.fillText("EFFECT TYPE", 738, 10);
			ctx.fillText("PART", 34, 262);
			let circle = 2 * Math.PI;
			for (let c = 1; c < 33; c ++) {
				if (c == 1 || c == 32 || c % 5 == 0) {
					ctx.fillText(`${c}`, 24 * c + 58, 262);
				} else {
					ctx.beginPath();
					ctx.ellipse(
						24 * c + 58,
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
		// Commit to display accordingly.
		this.#nmdb.forEach((e, i) => {
			let pixX = i % 144, pixY = Math.floor(i / 144);
			let hasDifference = this.#omdb[i] != e;
			if (!drawPixMode && hasDifference) {
				ctx.fillStyle = this.#backlight.slice(0, 7);
				ctx.fillRect(6 * pixX + 1, 12 + 6 * pixY, 6, 6);
			};
			if (drawPixMode || hasDifference) {
				ctx.fillStyle = ["#0000001a", "#0000009f"][e];
				if (drawPixMode) {
					ctx.fillStyle = ctx.fillStyle.slice(0, 7);
				};
				ctx.fillRect(6 * pixX + 1, 12 + 6 * pixY, 5.5, 5.5);
			};
		});
		// Commit to old display buffer.
		this.#nmdb.forEach((e, i) => {
			if (this.#omdb[i] != e) {
				this.#omdb[i] = e;
			};
		});
	};
};

let QyDisplay = class extends RootDisplay {
	#omdb = new Uint8Array(8192); // Full display
	#nmdb = new Uint8Array(8192); // Full display, but on commit
	#mode = "?";
	#strength = new Uint8Array(64);
	#ch = 0;
	#refreshed = true;
	#backlight = bgWhite;
	#bmst = 0;
	#bmex = 0;
	#bmdb = new Uint8Array(256);
	songTitle = "";
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	sqrFont = new MxFont40("./data/bitmaps/xg/qySqr.tsv");
	qy35Font = new MxFont40("./data/bitmaps/xg/qyCh35.tsv");
	qy55Font = new MxFont40("./data/bitmaps/xg/qyCh55.tsv");
	qyRsrc = new MxBmDef("./data/bitmaps/xg/qyRsrc.tsv");
	sysBm = new MxBm256("./data/bitmaps/xg/system.tsv");
	voxBm = new MxBm256("./data/bitmaps/xg/voices.tsv");
	constructor() {
		super(0, 0.95);
		let upThis = this;
		this.addEventListener("mode", function (ev) {
			(upThis.sysBm.getBm(`st_${({"gm":"gm1","g2":"gm2","?":"gm1","ns5r":"korg","ag10":"korg","x5d":"korg","05rw":"korg","krs":"korg","sg":"gm1","k11":"gm1"})[ev.data] || ev.data}`) || []).forEach(function (e, i) {
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
	#renderBox(sx, sy, width, height) {
		let length = width * height;
		let offset = sx + sy * 128;
		for (let i = 0; i < length; i ++) {
			let x = i % width, y = Math.floor(i / width);
			if (
				x == 0 && y < height - 1 ||
				y == 0 && x < width - 1 ||
				x == width - 1 && y > 0 ||
				y == height - 1 && x > 0 ||
				x == width - 2
			) {
				this.#nmdb[offset + x + y * 128] = 1;
			};
		};
	};
	#renderFill(sx, sy, width, height, target = 1) {
		let length = width * height;
		let offset = sx + sy * 128;
		for (let i = 0; i < length; i ++) {
			let x = i % width, y = Math.floor(i / width);
			this.#nmdb[offset + x + y * 128] = target;
		};
	};
	#renderMosaic(sx, sy, width, height, start = 1) {
		let curBit = !start;
		let offset = sx + sy * 128,
		length = width * height;
		for (let i = 0; i < length; i ++) {
			let x = i % width, y = Math.floor(i / width);
			if (x == 0 && y > 0 && width % 2 == 0) {} else {
				curBit = !curBit;
			};
			this.#nmdb[offset + x + y * 128] = +curBit;
		};
	};
	#getCat(channel, msb, prg) {
		let voiceInfo = this.getChVoice(channel);
		let category;
		if (["GM", "AG", "XG", "GS", "G2"].indexOf(voiceInfo.standard) > -1) {
			switch(msb) {
				case 64: {
					category = "sfx";
					break;
				};
				case 120:
				case 122:
				case 126:
				case 127: {
					category = "dr";
					break;
				};
				default: {
					category = (prg >> 3).toString(16);
				};
			};
		} else {
			category = voiceInfo.standard;
			category = `${category[0]}${category[1].toLowerCase()}`;
		};
		return category;
	};
	render(time, ctx, mixerView, id = 0) {
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
		// Clear out the current working display buffer.
		this.#nmdb.forEach((e, i, a) => {a[i] = 0});
		// Start rendering
		if (mixerView) {
			// Mixer view
			// Render the upperleft
			upThis.qyRsrc.getBm("MixPill")?.render((e, x, y) => {
				if (e) {
					upThis.#nmdb[x + y * 128] = 1;
				};
			});
			upThis.qyRsrc.getBm("MixIcon")?.render((e, x, y) => {
				if (e) {
					upThis.#nmdb[10 + x + y * 128] = 1;
				};
			});
			// Info labels
			upThis.qyRsrc.getBm("MsVoice")?.render((e, x, y) => {
				upThis.#nmdb[2176 + x + y * 128] = e;
			});
			upThis.qyRsrc.getBm("ElPan")?.render((e, x, y) => {
				upThis.#nmdb[4096 + x + y * 128] = e;
			});
			upThis.qyRsrc.getBm("ElVol")?.render((e, x, y) => {
				upThis.#nmdb[4864 + x + y * 128] = e;
			});
			upThis.qyRsrc.getBm("ElMsPa")?.render((e, x, y) => {
				upThis.#nmdb[5634 + x + y * 128] = e;
			});
			// Global mosaic
			upThis.#renderMosaic(0, 50, 5, 14, 1);
			upThis.#renderFill(5, 50, 1, 14);
			upThis.#renderMosaic(7, 50, 10, 14, 0);
			upThis.#renderFill(10, 52, 1, 10);
			upThis.#renderFill(11, 52, 1, 10, 0);
			upThis.#renderFill(17, 50, 1, 14);
			upThis.#renderMosaic(19, 50, 10, 14, 0);
			upThis.#renderFill(22, 52, 1, 10);
			upThis.#renderFill(23, 52, 1, 10, 0);
			let masterVol = 9 - Math.floor(sum.master.volume / 10.1);
			upThis.qyRsrc.getBm("VolSlid")?.render((e, x, y) => {
				upThis.#nmdb[7 + x + (50 + masterVol + y) * 128] = e;
			});
			upThis.#renderFill(8, 53 + masterVol, 8, 1);
			upThis.qyRsrc.getBm("VolSlid")?.render((e, x, y) => {
				upThis.#nmdb[6419 + x + y * 128] = e;
			});
			upThis.#renderFill(20, 53, 8, 1);
			upThis.#renderFill(29, 24, 1, 40);
			// Bank info
			let voiceInfo = upThis.getChVoice(this.#ch);
			upThis.xgFont.getStr(`${(sum.chProgr[this.#ch] + 1).toString().padStart(3, "0")}${"+ "[+((["GM", "MT", "AG"].indexOf(voiceInfo.standard) > -1) || sum.chContr[chOff] >= 120)]}${voiceInfo.name.slice(0, 8)}`).forEach((e, i) => {
				e.render((e, x, y) => {
						upThis.#nmdb[55 + x + i * 6 + y * 128] = e;
				});
			});
			let curCat = upThis.#getCat(this.#ch, sum.chContr[this.#ch * ccToPos.length], sum.chProgr[this.#ch]),
			curCatBm = upThis.qyRsrc.getBm(`Vox_${curCat}`);
			if (curCatBm) {
				curCatBm.render((e, x, y) => {
					upThis.#nmdb[37 + x + y * 128] = e;
				});
			} else {
				upThis.xgFont.getStr(curCat).forEach((e, i) => {
					e.render((e, x, y) => {
						upThis.#nmdb[37 + x + i * 6 + y * 128] = e;
					});
				});
			};
		} else {
			// Normal view
			// Render the pill
			upThis.qyRsrc.getBm("NorPill")?.render((e, x, y) => {
				if (e) {
					upThis.#nmdb[x + y * 128] = 1;
				};
			});
			// Carve out the text on that pill
			upThis.xgFont.getStr("SONG").forEach((e, i) => {
				e.render((e, x, y) => {
					if (e) {
						upThis.#nmdb[5 + x + i * 6 + y * 128] = 0;
					};
				});
			});
			// Prepare info boxes
			// Song info box
			upThis.#renderBox(34, 6, 65, 11);
			upThis.#renderFill(35, 7, 13, 9);
			upThis.#renderBox(100, 6, 28, 11); // Bar box
			if (sum.letter.expire < timeNow) {
				upThis.xgFont.getStr(`${id + 1}`.padStart(2, "0")).forEach((e, i) => {
					e.render((e, x, y) => {
						if (e) {
							upThis.#nmdb[1060 + x + i * 6 + y * 128] = 0;
						};
					});
				});
				if (upThis.songTitle.length < 9) {
					upThis.xgFont.getStr(upThis.songTitle || "Unknown").forEach((e, i) => {
						e.render((e, x, y) => {
							upThis.#nmdb[1073 + x + i * 6 + y * 128] = e;
						});
					});
				} else {
					let sngTtl = upThis.songTitle;
					while (sngTtl.indexOf("  ") > -1) {
						sngTtl = sngTtl.replaceAll("  ", " ");
					};
					let rollX = Math.floor(time * 25) % (6 * (10 + sngTtl.length)) - 47;
					upThis.xgFont.getStr(`${sngTtl}  ${sngTtl.slice(0, 8)}`).forEach((e, i) => {
						e.render((e, x, y) => {
							let area = x + i * 6;
							let tX = rollX;
							if (rollX < 0) {
								tX = rollX >= -48 ? 0 : rollX + 48;
							};
							if (area >= tX && area < tX + 47) {
								upThis.#nmdb[1073 - tX + area + y * 128] = e;
							};
						});
					});
				};
				// Bar info box
				{
					let blinker = sum.noteBeat % 1;
					upThis.sqrFont.getStr(`${"$%"[+(blinker > 0 && blinker <= 0.25)]}${(sum.noteBar + 1).toString().padStart(3, "0")}`).forEach((e, i) => {
						e.render((e, x, y) => {
							upThis.#nmdb[1126 + x + i * 6 + y * 128] = e;
						});
					});
				};
			};
			// Tempo render
			upThis.sqrFont.getStr(`&=${Math.round(sum.tempo).toString().padStart(3, "0")}`).forEach((e, i) => {
				e.render((e, x, y) => {
					upThis.#nmdb[2048 + x + i * 6 + y * 128] = e;
				});
			});
			// tSig render
			upThis.xgFont.getStr(`${sum.tSig[0].toString().padStart(2, " ")}/${sum.tSig[1].toString().padEnd(2, " ")}`).forEach((e, i) => {
				e.render((e, x, y) => {
					upThis.#nmdb[3072 + x + i * 6 + y * 128] = e;
				});
			});
			// Placeholder
			upThis.qyRsrc.getBm("Vtfj")?.render((e, x, y) => {
				upThis.#nmdb[2338 + x + y * 128] = e;
			});
			// Transpose render
			{
				let tPit = (sum.chPitch[this.#ch] / 8192 * sum.rpn[this.#ch * 6] + (sum.rpn[this.#ch * 6 + 3] - 64));
				let tStr = tPit < 0 ? "-" : "+";
				tStr += `${Math.round(Math.abs(tPit))}`.padStart(2, "0");
				upThis.xgFont.getStr(tStr).forEach((e, i) => {
					e.render((e, x, y) => {
						upThis.#nmdb[3127 + x + i * 6 + y * 128] = e;
					});
				});
			};
			// Jump render
			upThis.xgFont.getStr("001").forEach((e, i) => {
				e.render((e, x, y) => {
					upThis.#nmdb[3181 + x + i * 6 + y * 128] = e;
				});
			});
			// Split line
			upThis.#renderFill(71, 48, 1, 16);
			upThis.qyRsrc.getBm("Mod_Usr")?.render((e, x, y) => {
				upThis.#nmdb[6253 + x + y * 128] = e;
			});
			// Bank info
			{
				let voiceName = upThis.getChVoice(this.#ch);
				upThis.xgFont.getStr(`${sum.chContr[chOff + ccToPos[0]].toString().padStart(3, "0")} ${sum.chProgr[this.#ch].toString().padStart(3, "0")} ${sum.chContr[chOff + ccToPos[32]].toString().padStart(3, "0")}`).forEach((e, i) => {
					e.render((e, x, y) => {
						upThis.#nmdb[6145 + 6 * i + x + y * 128] = e;
					});
				});;
				upThis.xgFont.getStr(`${voiceName.standard}:${voiceName.name.slice(0, 8)}`).forEach((e, i) => {
					e.render((e, x, y) => {
						upThis.#nmdb[7169 + 6 * i + x + y * 128] = e;
					});
				});
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
			useBm.width = useBm.length / 16;
			useBm?.render((e, x, y) => {
				if (useBm.width < 32) {
					upThis.#nmdb[6217 + 2 * x + y * 128] = e;
					upThis.#nmdb[6218 + 2 * x + y * 128] = e;
				} else {
					upThis.#nmdb[6217 + x + y * 128] = e;
				};
			});
		};
		{
			// Channel tabs
			let curSeg = this.#ch >> 3;
			let preCal = mixerView ? 1310 : 4254,
			preCalY = mixerView ? 10 : 33;
			// Channel info box
			if (mixerView) {
				upThis.#renderFill(28, preCalY - 1, 99, 15);
				upThis.#renderFill(29, preCalY, 97, 13, 0);
			} else {
				upThis.#renderBox(0, preCalY - 1, 128, 15);
			};
			// Arrows
			if (curSeg < (maxCh >> 3)) {
				upThis.qyRsrc.getBm(`ArrowR${+mixerView + 1}`)?.render((e, x, y) => {
					upThis.#nmdb[preCal + 735 + x + y * 128] = e;
				});
			};
			if (curSeg > (minCh >> 3)) {
				upThis.qyRsrc.getBm(`ArrowL${+mixerView + 1}`)?.render((e, x, y) => {
					upThis.#nmdb[preCal + 610 + (+mixerView * 27) + x + y * 128] = e;
				});
			};
			if (!mixerView) {
				// PtCdTm
				upThis.qyRsrc.getBm("PtCdTm")?.render((e, x, y) => {
					upThis.#nmdb[4227 + x + y * 128] = e;
				});
				// The tempo pill
				if (sum.tempo != 120) {
					upThis.qyRsrc.getBm("ActPill")?.render((e, x, y) => {
						upThis.#nmdb[5141 + x + y * 128] = e;
					});
				};
			};
			for (let tch = 0; tch < 8; tch ++) { // target channel
				let rch = curSeg * 8 + tch,
				textTarget = 1;
				upThis.qyRsrc.getBm("CTabOff")?.render((e, x, y) => {
					upThis.#nmdb[preCal + 12 * tch + x + y * 128] = e;
				});
				let cVelo = Math.floor(sum.strength[rch] / 51);
				upThis.#renderFill(31 + 12 * tch, preCalY + 11 - cVelo, 9, cVelo + 1);
				if (this.#ch == rch) {
					textTarget = 0;
					upThis.#renderFill(31 + 12 * tch, preCalY, 9, 5);
					if (mixerView) {
						upThis.#renderFill(30 + 12 * tch, preCalY + 14, 13, 8);
					};
				};
				if (rch < 19) {
					upThis.qy55Font.getStr(String.fromCharCode(48 + rch))[0].render((e, x, y) => {
						if (e) {
							upThis.#nmdb[preCal + 3 + 12 * tch + x + y * 128] = textTarget;
						};
					});
				} else {
					upThis.qy35Font.getStr((rch + 1).toString()).forEach((e, i) => {
						e.render((e, x, y) => {
							if (e) {
								upThis.#nmdb[preCal + 2 + 4 * i + 12 * tch + x + y * 128] = textTarget;
							};
						});
					});
				};
				if (mixerView) {
					upThis.#renderMosaic(31 + tch * 12, 32, 10, 32, 0);
					upThis.#renderFill(41 + tch * 12, 32, 1, 32);
					upThis.#renderFill(34 + tch * 12, 43, 1, 18);
					upThis.#renderFill(35 + tch * 12, 45, 1, 16, 0);
					upThis.#renderFill(31 + tch * 12, 63, 10, 1);
					upThis.qyRsrc.getBm("PanIcon")?.render((e, x, y) => {
						upThis.#nmdb[4255 + tch * 12 + x + y * 128] = e;
					});
					let volSlid = 15 - (sum.chContr[rch * ccToPos.length + ccToPos[7]] >> 3);
					upThis.qyRsrc.getBm("VolSlid")?.render((e, x, y) => {
						upThis.#nmdb[5535 + tch * 12 + x + (volSlid + y) * 128] = e;
					});
					upThis.#renderFill(32 + tch * 12, 46 + volSlid, 8, 1);
					// Category render
					let curCat = upThis.#getCat(rch, sum.chContr[rch * ccToPos.length], sum.chProgr[rch]),
					curCatBm = upThis.qyRsrc.getBm(`Vox_${curCat}`);
					if (curCatBm) {
						curCatBm.render((e, x, y) => {
							if (e) {
								upThis.#nmdb[3103 + tch * 12 + x + y * 128] = textTarget;
							};
						});
					} else {
						upThis.xgFont.getStr(curCat).forEach((e, i) => {
							e.render((e, x, y) => {
								if (e) {
									upThis.#nmdb[3103 + tch * 12 + x + i * 6 + y * 128] = textTarget;
								};
							});
						});
					};
				};
			};
		};
		if (timeNow <= sum.letter.expire) {
			//upThis.#renderFill(12, 9, 109, 31);
			upThis.qyRsrc.getBm("TxtDisp")?.render((e, x, y) => {
				upThis.#nmdb[(mixerView ? 655 : 1036) + x + y * 128] = e;
			});
			upThis.xgFont.getStr(sum.letter.text).forEach((e, i) => {
				let ri = (i % 16) * 6, ry = i >> 4;
				e.render((e, x, y) => {
					upThis.#nmdb[(mixerView ? 1686 : 2067) + ri + x + (y + ry * 8) * 128] = e;
				});
			});
		};
		// Screen buffer write finish.
		// Determine if full render is required.
		let drawPixMode = false;
		if (this.#refreshed) {
			// Full render required.
			// Clear all pixels.
			ctx.fillStyle = this.#backlight.replace("64", "");
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			drawPixMode = true;
			this.#refreshed = false;
		};
		// Commit to display accordingly.
		this.#nmdb.forEach((e, i) => {
			let pixX = i % 128, pixY = Math.floor(i / 128);
			let hasDifference = this.#omdb[i] != e;
			if (!drawPixMode && hasDifference) {
				ctx.fillStyle = this.#backlight.slice(0, 7);
				ctx.fillRect(6 * pixX + 7, 7 + 8 * pixY, 6, 8);
			};
			if (drawPixMode || hasDifference) {
				ctx.fillStyle = ["#0000001a", "#0000009f"][e];
				if (drawPixMode) {
					ctx.fillStyle = ctx.fillStyle.slice(0, 7);
				};
				ctx.fillRect(6 * pixX + 7, 7 + 8 * pixY, 5.5, 7.5);
			};
		});
		// Commit to old display buffer.
		this.#nmdb.forEach((e, i) => {
			if (this.#omdb[i] != e) {
				this.#omdb[i] = e;
			};
		});
	};
};

let PsrDisplay = class extends RootDisplay {
	// #okdb = new Uint8Array(61);
	#nkdb = new Uint8Array(61);
	// #osdb = new Uint8Array(22);
	#nsdb = new Uint8Array(22);
	#nadb = new Uint8Array(15);
	#bmdb = new Uint8Array(256);
	#bmst = 0;
	#bmex = 0;
	#ch = 0;
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	trueFont = new MxFont40("./data/bitmaps/korg/font.tsv");
	sysBm = new MxBm256("./data/bitmaps/xg/system.tsv");
	voxBm = new MxBm256("./data/bitmaps/xg/voices.tsv");
	aniBm = new MxBm256("./data/bitmaps/xg/animation.tsv");
	clefs = new Path2D("M110 163.5c0 -3.9 3.2 -7.1 7.1 -7.1s7.1 3.2 7.1 7.1s-3.2 7.1 -7.1 7.1s-7.1 -3.2 -7.1 -7.1zM110 128.5c0 -3.9 3.2 -7.1 7.1 -7.1s7.1 3.2 7.1 7.1s-3.2 7.1 -7.1 7.1s-7.1 -3.2 -7.1 -7.1zM64.5 109.2c24.1 0 41 12.3 41 35.1c0 36.8 -36.8 58 -72.2 72.9c-0.4 0.4 -0.8 0.6 -1.3 0.6c-1 0 -1.8 -0.8 -1.8 -1.8c0 -0.4 0.1 -0.8 0.6 -1.3c28.3 -16.5 57.7 -37.1 57.7 -69c0 -16.8 -8.8 -32.9 -23.9 -32.9c-10.4 0 -18.1 7.6 -21.6 17.6c1.5 -0.7 3.1 -1.1 4.8 -1.1c7.7 0 14 6.3 14 14c0 8.1 -6.2 14.8 -14 14.8c-8.4 0 -15.7 -6.6 -15.7 -14.8c0 -18.6 14.3 -34.2 32.5 -34.2z M408.6 181.3c0.6 0 1.3 -0.1 1.8 -0.1c21.7 0 35.8 17.9 35.8 36.5c0 10.6 -4.6 21.6 -15 29.4c-3.1 2.4 -6.6 3.9 -10.2 5c0.4 4.9 0.7 9.8 0.7 14.7c0 2.7 -0.1 5.5 -0.3 8.1c-1 16.8 -12.6 31.9 -29.1 31.9c-15.1 0 -27.3 -12.3 -27.3 -27.6c0 -8.1 7.4 -14.4 15.7 -14.4c7.6 0 13.3 6.6 13.3 14.4c0 7.3 -6 13.3 -13.3 13.3 c-1.5 0 -2.9 -0.3 -4.3 -0.8c3.6 5.5 9.5 9.1 16.4 9.1c13.4 0 22 -12.9 22.8 -26.7c0.1 -2.5 0.3 -5.2 0.3 -7.7c0 -4.3 -0.1 -8.5 -0.6 -12.9c-4.1 0.7 -8.1 1.1 -12.5 1.1c-26.3 0 -46.6 -24.1 -46.6 -52.4c0 -24.8 18.3 -42.8 34.7 -61.7c-2.7 -8.7 -5.2 -17.5 -6.3 -26.6c-0.8 -7.3 -1 -14.6 -1 -21.8c0 -16.1 7.7 -31.4 20.9 -40.9c0.4 -0.3 1 -0.4 1.4 -0.4c0.6 0 1 0 1.4 0.4 c9.9 11.8 18.6 34.3 18.6 50.1c0 20 -12 35.7 -25.2 51c2.9 9.5 5.5 19.3 7.8 29zM420.5 246.4c9.5 -3.4 15.8 -13.3 15.8 -23c0 -12.6 -9.2 -25.1 -24.2 -26.6c3.4 16.2 6.4 32.3 8.4 49.6zM366.4 214.1c0 18.9 18.1 34.6 37 34.6c3.9 0 7.7 -0.3 11.5 -0.8c-2 -17.8 -5.2 -34.3 -8.8 -51c-11.1 1.1 -17.4 8.5 -17.4 16.7 c0 6.2 3.5 12.7 11.3 17.2c0.7 0.7 1 1.4 1 2.1c0 1.5 -1.4 3.1 -3.1 3.1c-0.4 0 -0.8 -0.1 -1.3 -0.3c-11.2 -6 -16.4 -16.1 -16.4 -25.9c0 -12.3 8.1 -24.4 22.4 -27.6c-2 -8.1 -4.1 -16.4 -6.4 -24.5c-15 16.9 -29.8 34 -29.8 56.4zM413.1 71.7c-13.9 6.7 -22.7 20.9 -22.7 36.3c0 10.4 2.5 18.6 5 27.2 c11.2 -13.6 20.4 -27.7 20.4 -45.4c0 -7.7 -0.6 -11.1 -2.8 -18.1z");
	keyboard = new Path2D("M224 318 L380 318 L380 380 L224 380 Z M246 350 L246 380 M268 350 L268 380 M291 318 L291 380 M313 350 L313 380 M335 350 L335 380 M358 350 L358 380 M235 318 L235 350 L254 350 L254 318 M260 318 L260 350 L279 350 L279 318 M301 318 L301 350 L320 350 L320 318 M326 318 L326 350 L345 350 L345 318 M350 318 L350 350 L370 350 L370 318 M387 318 L543 318 L543 380 L387 380 Z M409 350 L409 380 M431 350 L431 380 M454 318 L454 380 M476 350 L476 380 M498 350 L498 380 M521 350 L521 380 M398 318 L398 350 L417 350 L417 318 M423 318 L423 350 L442 350 L442 318 M464 318 L464 350 L483 350 L483 318 M489 318 L489 350 L508 350 L508 318 M513 318 L513 350 L533 350 L533 318 M550 318 L706 318 L706 380 L550 380 Z M572 350 L572 380 M594 350 L594 380 M617 318 L617 380 M639 350 L639 380 M661 350 L661 380 M684 350 L684 380 M561 318 L561 350 L580 350 L580 318 M586 318 L586 350 L605 350 L605 318 M627 318 L627 350 L646 350 L646 318 M652 318 L652 350 L671 350 L671 318 M676 318 L676 350 L696 350 L696 318 M713 318 L869 318 L869 380 L713 380 Z M735 350 L735 380 M757 350 L757 380 M780 318 L780 380 M802 350 L802 380 M824 350 L824 380 M847 350 L847 380 M724 318 L724 350 L743 350 L743 318 M749 318 L749 350 L768 350 L768 318 M790 318 L790 350 L809 350 L809 318 M815 318 L815 350 L834 350 L834 318 M839 318 L839 350 L859 350 L859 318 M876 318 L1032 318 L1032 380 L876 380 Z M898 350 L898 380 M920 350 L920 380 M943 318 L943 380 M965 350 L965 380 M987 350 L987 380 M1010 350 L1010 380 M887 318 L887 350 L906 350 L906 318 M912 318 L912 350 L931 350 L931 318 M953 318 L953 350 L972 350 L972 318 M978 318 L978 350 L997 350 L997 318 M1002 318 L1002 350 L1022 350 L1022 318 M1032 318 L1055 318 L1055 380 L1032 380");
	bracket = new Path2D("M83 23 L49 23 L49 86 L83 86 M264 23 L297 23 L297 86 L264 86");
	staffLines = new Path2D("M30 110 L344 110 M356 110 L1074 110 M30 146 L344 146 M356 146 L1074 146 M30 182 L344 182 M356 182 L1074 182 M30 218 L344 218 M356 218 L1074 218 M30 254 L344 254 M356 254 L775 254 M894 254 L1074 254");
	downbeatStar = new Path2D("m 160.263,824.43605 c 0.939,1.039 1.482,2.434 1.482,3.833 0,1.402 -0.543,2.796 -1.482,3.834 1.038,-0.944 2.43,-1.483 3.837,-1.483 1.398,0 2.791,0.539 3.828,1.483 -0.948,-1.038 -1.482,-2.432 -1.482,-3.834 0,-1.399 0.534,-2.794 1.482,-3.833 -1.037,0.945 -2.43,1.483 -3.828,1.483 -1.407,0 -2.799,-0.538 -3.837,-1.483");
	downbeatHand = new Path2D("m 166.418,820.55105 c 0.13,0 0.253,-0.054 0.351,-0.143 0.089,-0.094 0.143,-0.223 0.143,-0.351 v -1.969 l 1.847,-6.897 c 0.706,-2.627 0.966,-5.371 0.78,-8.09 l -0.184,-2.644 1.188,-2.055 h -5.175 l -1.268,3.499 -1.278,-3.499 h -5.171 l 1.185,2.055 -0.185,2.644 c -0.185,2.719 0.076,5.463 0.782,8.09 l 1.847,6.897 v 1.969 c 0,0.128 0.054,0.257 0.145,0.351 0.089,0.089 0.218,0.143 0.348,0.143 h 0.214 c 0.423,0 0.841,-0.11 1.213,-0.321 0.364,-0.204 0.68,-0.509 0.9,-0.871 0.213,0.362 0.527,0.667 0.89,0.871 0.373,0.211 0.79,0.321 1.208,0.321 h 0.22 m -0.22,-1.304 c 0,0.111 -0.034,0.217 -0.095,0.303 -0.069,0.085 -0.164,0.147 -0.268,0.178 -0.103,0.024 -0.22,0.016 -0.317,-0.027 -0.315,-0.132 -0.588,-0.357 -0.78,-0.645 -0.185,-0.283 -0.289,-0.626 -0.289,-0.968 v -6.306 c 0.262,0.159 0.562,0.23 0.865,0.213 0.308,-0.023 0.595,-0.138 0.836,-0.329 0.233,-0.192 0.406,-0.454 0.488,-0.748 l 0.007,-0.017 c 0.379,-1.35 0.631,-2.734 0.747,-4.134 0.496,-0.497 0.797,-1.176 0.839,-1.876 0.046,-0.701 -0.172,-1.411 -0.591,-1.967 l -0.625,0.356 c 0.371,0.453 0.556,1.058 0.501,1.64 -0.054,0.584 -0.349,1.143 -0.801,1.517 -0.112,1.448 -0.365,2.889 -0.756,4.288 -0.055,0.178 -0.165,0.336 -0.323,0.436 -0.15,0.099 -0.343,0.145 -0.522,0.119 -0.184,-0.026 -0.356,-0.115 -0.472,-0.257 -0.124,-0.136 -0.193,-0.319 -0.193,-0.503 v -7.524 l 1.413,-3.887 h 3.453 l -0.687,1.18 0.199,2.865 c 0.186,2.636 -0.068,5.301 -0.756,7.853 l -1.873,6.989 z m -4.143,-1.251 -1.873,-6.989 c -0.681,-2.552 -0.94,-5.217 -0.755,-7.853 l 0.198,-2.865 -0.68,-1.18 h 3.446 l 1.412,3.887 v 7.524 c 0,0.184 -0.066,0.367 -0.185,0.503 -0.124,0.142 -0.295,0.231 -0.472,0.257 -0.185,0.026 -0.372,-0.02 -0.529,-0.119 -0.151,-0.1 -0.267,-0.258 -0.315,-0.436 -0.4,-1.399 -0.652,-2.84 -0.756,-4.288 -0.453,-0.374 -0.747,-0.933 -0.803,-1.517 -0.059,-0.582 0.125,-1.187 0.495,-1.64 l -0.618,-0.356 c -0.424,0.556 -0.637,1.266 -0.597,1.967 0.049,0.7 0.349,1.379 0.838,1.876 0.122,1.4 0.371,2.784 0.753,4.134 v 0.017 c 0.084,0.294 0.262,0.556 0.497,0.748 0.233,0.191 0.527,0.306 0.83,0.329 0.299,0.017 0.608,-0.054 0.862,-0.213 v 6.306 c 0,0.342 -0.095,0.685 -0.288,0.968 -0.184,0.288 -0.459,0.513 -0.774,0.645 -0.103,0.043 -0.212,0.051 -0.316,0.027 -0.104,-0.031 -0.199,-0.093 -0.268,-0.178 -0.069,-0.086 -0.102,-0.192 -0.102,-0.303 v -1.251");
	upbeatHand = new Path2D("m 143.496,764.85205 -1.915,5.26 c -0.152,0.404 -0.158,0.856 -0.029,1.267 0.13,0.408 0.406,0.767 0.756,1.01 0.356,0.244 0.795,0.362 1.221,0.338 l -1.483,4.067 c -0.15,0.417 -0.136,0.885 0.035,1.291 0.163,0.409 0.494,0.744 0.893,0.926 0.403,0.186 0.87,0.209 1.288,0.075 -0.06,0.409 0.02,0.841 0.234,1.199 0.213,0.357 0.557,0.63 0.949,0.765 0.397,0.133 0.835,0.123 1.219,-0.032 0.384,-0.155 0.714,-0.445 0.913,-0.813 0.22,0.315 0.563,0.543 0.941,0.628 0.369,0.084 0.781,0.03 1.118,-0.151 0.336,-0.183 0.603,-0.496 0.733,-0.858 l 0.885,-2.412 c 0.222,0.306 0.565,0.529 0.94,0.611 0.371,0.083 0.776,0.029 1.112,-0.158 0.338,-0.186 0.596,-0.494 0.726,-0.851 l 2.074,-5.687 c 0.988,-2.715 0.803,-5.834 -0.493,-8.414 v -0.005 l -7.014,-2.549 c -1.152,0.262 -2.237,0.812 -3.128,1.595 -0.886,0.779 -1.577,1.784 -1.975,2.898 m 9.357,8.148 -0.665,-0.24 -2.484,6.824 c -0.076,0.217 -0.247,0.402 -0.453,0.497 -0.212,0.099 -0.459,0.11 -0.679,0.031 -0.218,-0.079 -0.406,-0.246 -0.501,-0.455 -0.096,-0.213 -0.109,-0.46 -0.026,-0.68 l 2.482,-6.823 -0.666,-0.241 -2.845,7.822 c -0.098,0.261 -0.303,0.48 -0.551,0.6 -0.253,0.118 -0.556,0.13 -0.815,0.036 -0.261,-0.097 -0.482,-0.3 -0.597,-0.55 -0.118,-0.253 -0.13,-0.551 -0.041,-0.813 l 2.846,-7.826 -0.666,-0.24 -2.483,6.823 c -0.095,0.262 -0.294,0.482 -0.548,0.602 -0.256,0.117 -0.549,0.129 -0.809,0.033 -0.262,-0.095 -0.488,-0.298 -0.606,-0.548 -0.115,-0.253 -0.13,-0.552 -0.035,-0.814 l 1.662,-4.569 c 0.398,-0.227 0.706,-0.597 0.865,-1.023 l 1.091,-3.001 c 0.83,-0.093 1.625,-0.392 2.304,-0.868 0.674,-0.477 1.236,-1.124 1.6,-1.866 l -0.672,-0.248 c -0.351,0.683 -0.893,1.269 -1.545,1.671 -0.658,0.404 -1.421,0.625 -2.196,0.631 l -1.25,3.438 c -0.108,0.306 -0.341,0.563 -0.635,0.7 -0.295,0.136 -0.647,0.151 -0.955,0.04 -0.303,-0.11 -0.557,-0.345 -0.693,-0.637 -0.137,-0.294 -0.158,-0.646 -0.049,-0.955 l 1.923,-5.259 c 0.35,-0.967 0.94,-1.847 1.702,-2.542 0.767,-0.687 1.7,-1.193 2.695,-1.452 l 6.539,2.38 c 1.103,2.359 1.236,5.158 0.343,7.605 l -2.073,5.685 c -0.076,0.22 -0.246,0.404 -0.459,0.499 -0.205,0.101 -0.453,0.109 -0.671,0.033 -0.22,-0.08 -0.406,-0.248 -0.503,-0.457 -0.094,-0.212 -0.109,-0.461 -0.026,-0.68 l 1.145,-3.163 M 184.684,764.85205 c -0.405,-1.114 -1.093,-2.119 -1.985,-2.898 -0.883,-0.783 -1.974,-1.333 -3.128,-1.595 l -7.004,2.549 v 0.005 c -1.303,2.58 -1.49,5.699 -0.501,8.414 l 2.072,5.687 c 0.13,0.357 0.397,0.665 0.732,0.851 0.332,0.187 0.736,0.241 1.113,0.158 0.37,-0.082 0.712,-0.305 0.94,-0.611 l 0.88,2.412 c 0.13,0.362 0.397,0.675 0.739,0.858 0.336,0.181 0.741,0.235 1.12,0.151 0.368,-0.085 0.712,-0.313 0.94,-0.628 0.19,0.368 0.52,0.658 0.905,0.813 0.383,0.155 0.83,0.165 1.219,0.032 0.393,-0.135 0.735,-0.408 0.955,-0.765 0.213,-0.358 0.296,-0.79 0.227,-1.199 0.418,0.134 0.891,0.111 1.289,-0.075 0.398,-0.182 0.729,-0.517 0.9,-0.926 0.173,-0.406 0.179,-0.874 0.028,-1.291 l -1.481,-4.067 c 0.429,0.024 0.862,-0.094 1.219,-0.338 0.358,-0.243 0.625,-0.602 0.755,-1.01 0.138,-0.411 0.123,-0.863 -0.02,-1.267 l -1.914,-5.26 m -8.213,11.311 c 0.074,0.219 0.068,0.468 -0.035,0.68 -0.095,0.209 -0.282,0.377 -0.501,0.457 -0.211,0.076 -0.467,0.068 -0.673,-0.033 -0.212,-0.095 -0.377,-0.279 -0.459,-0.499 l -2.071,-5.685 c -0.886,-2.447 -0.762,-5.246 0.342,-7.605 l 6.539,-2.38 c 1,0.259 1.935,0.765 2.695,1.452 0.762,0.695 1.352,1.575 1.71,2.542 l 1.914,5.259 c 0.109,0.309 0.094,0.661 -0.041,0.955 -0.138,0.292 -0.398,0.527 -0.7,0.637 -0.309,0.111 -0.66,0.096 -0.948,-0.04 -0.294,-0.137 -0.534,-0.394 -0.643,-0.7 l -1.248,-3.438 c -0.771,-0.006 -1.539,-0.227 -2.192,-0.631 -0.657,-0.402 -1.192,-0.988 -1.55,-1.671 l -0.671,0.248 c 0.371,0.742 0.926,1.389 1.605,1.866 0.68,0.476 1.476,0.775 2.298,0.868 l 1.092,3.001 c 0.159,0.426 0.467,0.796 0.865,1.023 l 1.66,4.569 c 0.096,0.262 0.081,0.561 -0.035,0.814 -0.118,0.25 -0.336,0.453 -0.596,0.548 -0.261,0.096 -0.563,0.084 -0.816,-0.033 -0.248,-0.12 -0.454,-0.34 -0.551,-0.602 l -2.482,-6.823 -0.666,0.24 2.845,7.826 c 0.099,0.262 0.084,0.56 -0.032,0.813 -0.124,0.25 -0.343,0.453 -0.604,0.55 -0.261,0.094 -0.556,0.082 -0.811,-0.036 -0.253,-0.12 -0.451,-0.339 -0.548,-0.6 l -2.847,-7.822 -0.666,0.241 2.484,6.823 c 0.076,0.22 0.069,0.467 -0.033,0.68 -0.097,0.209 -0.282,0.376 -0.494,0.455 -0.221,0.079 -0.467,0.068 -0.68,-0.031 -0.214,-0.095 -0.379,-0.28 -0.459,-0.497 l -2.485,-6.824 -0.665,0.24 1.153,3.163");
	// noteHead = new Path2D("M220 138c56 0 109 -29 109 -91c0 -72 -56 -121 -103 -149c-36 -21 -76 -36 -117 -36c-56 0 -109 29 -109 91c0 72 56 121 103 149c36 21 76 36 117 36z");
	noteHead = new Path2D("M19.8 -12.4c5 0 9.8 2.6 9.8 8.2c0 6.5 -5 10.9 -9.3 13.4c-3.2 1.9 -6.8 3.2 -10.5 3.2c-5 0 -9.8 -2.6 -9.8 -8.2c0 -6.5 5 -10.9 9.3 -13.4c3.2 -1.9 6.8 -3.2 10.5 -3.2 z");
	sideIndicator1 = new Path2D("m 379.0355,823.51955 h -2.213 c -0.229,0 -0.436,-0.096 -0.587,-0.243 -0.162,-0.163 -0.243,-0.377 -0.243,-0.591 v -8.298 c 0,-0.229 0.092,-0.439 0.243,-0.586 0.162,-0.163 0.376,-0.244 0.587,-0.244 h 2.213 v -2.767 h -3.597 c -0.354,0 -0.708,0.136 -0.978,0.406 -0.251,0.251 -0.402,0.594 -0.402,0.977 v 12.726 c 0,0.356 0.133,0.709 0.402,0.98 0.251,0.251 0.598,0.406 0.978,0.406 h 3.597 v -2.766");
	sideIndicator2 = new Path2D("m 379.0085,813.83755 h -2.21 c -0.144,0 -0.285,0.054 -0.391,0.159 -0.1,0.105 -0.163,0.242 -0.159,0.395 0,0 0,8.281 -0.004,8.281 0,0.142 0.055,0.284 0.163,0.39 0.103,0.103 0.239,0.162 0.391,0.162 h 2.21 v -9.387");
	sharpSign = new Path2D("M216 -312c0 -10 -8 -19 -18 -19s-19 9 -19 19v145l-83 -31v-158c0 -10 -9 -19 -19 -19s-18 9 -18 19v145l-32 -12c-2 -1 -5 -1 -7 -1c-11 0 -20 9 -20 20v60c0 8 5 16 13 19l46 16v160l-32 -11c-2 -1 -5 -1 -7 -1c-11 0 -20 9 -20 20v60c0 8 5 15 13 18l46 17v158 c0 10 8 19 18 19s19 -9 19 -19v-145l83 31v158c0 10 9 19 19 19s18 -9 18 -19v-145l32 12c2 1 5 1 7 1c11 0 20 -9 20 -20v-60c0 -8 -5 -16 -13 -19l-46 -16v-160l32 11c2 1 5 1 7 1c11 0 20 -9 20 -20v-60c0 -8 -5 -15 -13 -18l-46 -17v-158zM96 65v-160l83 30v160z");
	flatSign = new Path2D("M27 41l-1 -66v-11c0 -22 1 -44 4 -66c45 38 93 80 93 139c0 33 -14 67 -43 67c-31 0 -52 -30 -53 -63zM-15 -138l-12 595c8 5 18 8 27 8s19 -3 27 -8l-7 -345c25 21 58 34 91 34c52 0 89 -48 89 -102c0 -80 -86 -117 -147 -169c-15 -13 -24 -38 -45 -38 c-13 0 -23 11 -23 25z");
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
	};
	setCh(ch) {
		this.#ch = ch;
	};
	getCh() {
		return this.#ch;
	};
	reset() {
		super.reset();
		if (this.demoInfo) {
			delete this.demoInfo;
		};
	};
	#render7seg(str, ctx, offsetX, offsetY, scaleX = 1, scaleY = 1, skew = -0.15) {
		let path = [
			new Path2D(),
			new Path2D("M36 160 L48 148 L144 148 L156 160 L144 172 L48 172 Z"),
			new Path2D("M32 156 L20 144 L20 48 L32 36 L44 48 L44 144 Z"),
			new Path2D("M32 284 L20 272 L20 176 L32 164 L44 176 L44 272 Z"),
			new Path2D("M156 288 L144 300 L48 300 L36 288 L48 276 L144 276 Z"),
			new Path2D("M160 164 L172 176 L172 272 L160 284 L148 272 L148 176 Z"),
			new Path2D("M160 36 L172 48 L172 144 L160 156 L148 144 L148 48 Z"),
			new Path2D("M36 32 L48 20 L144 20 L156 32 L144 44 L48 44 Z")
		];
		let sevenSegFont = {
			0: new Uint8Array([0, 0, 1, 1, 1, 1, 1, 1]),
			1: new Uint8Array([0, 0, 0, 0, 0, 1, 1, 0]),
			2: new Uint8Array([0, 1, 0, 1, 1, 0, 1, 1]),
			3: new Uint8Array([0, 1, 0, 0, 1, 1, 1, 1]),
			4: new Uint8Array([0, 1, 1, 0, 0, 1, 1, 0]),
			5: new Uint8Array([0, 1, 1, 0, 1, 1, 0, 1]),
			6: new Uint8Array([0, 1, 1, 1, 1, 1, 0, 1]),
			7: new Uint8Array([0, 0, 1, 0, 0, 1, 1, 1]),
			8: new Uint8Array([0, 1, 1, 1, 1, 1, 1, 1]),
			9: new Uint8Array([0, 1, 1, 0, 1, 1, 1, 1]),
			" ": new Uint8Array(8),
			A: new Uint8Array([0, 1, 1, 1, 0, 1, 1, 1]),
			B: new Uint8Array([0, 1, 1, 1, 1, 1, 0, 0]),
			C: new Uint8Array([0, 0, 1, 1, 1, 0, 0, 1]),
			D: new Uint8Array([0, 1, 0, 1, 1, 1, 1, 0]),
			"-": new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0])
		};
		Array.from(str).forEach((e, i) => {
			ctx.setTransform(scaleX, 0, skew * scaleY, scaleY, 190 * scaleX * i + offsetX, offsetY);
			for (let i = 0; i < 8; i++) {
				ctx.fillStyle = sevenSegFont[e][i] ? activePixel : inactivePixel;
				ctx.fill(path[i]);
			}
		});
		ctx.resetTransform();
	};
	#renderDotMatrix(str, ctx, trueMode = false, offsetX, offsetY, scaleX = 8, scaleY = 8, skew = -0.15) {
		let upThis = this;
		let timeNow = Date.now();
		ctx.setTransform(1, 0, skew, 1, 0, 0);
		// Determine the used font
		let targetFont = trueMode ? upThis.trueFont : upThis.xgFont;
		let rollX = 0;
		if (str.length > 8) {
			rollX = Math.floor(timeNow / 125) % (2 + str.length);
			// rollX = 0;
			str = `${str}  ${str.slice(0, 8)}`
			str = str.slice(rollX, rollX + 8);
		};
		str = str.padEnd(8, " ");
		targetFont.getStr(str).forEach((e, i) => {
			e.render((e, x, y) => {
				ctx.fillStyle = e ? activePixel : inactivePixel;
				ctx.fillRect(offsetX + (x + 6 * i) * scaleX, offsetY + y * scaleY, scaleX - 1, scaleY - 1);
			});
		});
		ctx.resetTransform();
	}
	render(time, ctx, backlightColor = "#b7bfaf64", mixerView, tempoView, id = 0, trueMode = false) {
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
		// Clear out the current working display buffer.
		this.#nkdb.forEach((e, i, a) => {a[i] = 0});
		this.#nsdb.forEach((e, i, a) => {a[i] = 0});
		this.#nadb.forEach((e, i, a) => {a[i] = 0});
		// Fill with white
		ctx.fillStyle = backlightColor;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// Show text
		ctx.fillStyle = "#000c";
		ctx.textAlign = "left";
		ctx.font = '22px "Arial Web"';
		ctx.fillText("C4", 548, 399);
		ctx.strokeStyle = "#000c";
		ctx.stroke(upThis.bracket);
		ctx.stroke(upThis.staffLines);
		ctx.fill(upThis.clefs);
		ctx.stroke(upThis.keyboard);
		// Beat indicator
		if (sum.noteBeat & 1) {
			ctx.fillStyle = activePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2733);
			ctx.fill(upThis.upbeatHand);
			ctx.fillStyle = inactivePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2855);
			ctx.fill(upThis.downbeatHand);
		}
		else {
			ctx.fillStyle = inactivePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2733);
			ctx.fill(upThis.upbeatHand);
			ctx.fillStyle = activePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2855);
			ctx.fill(upThis.downbeatHand);
		}
		ctx.fillStyle = (sum.noteBeat < 1) ? activePixel : inactivePixel;
		ctx.setTransform(3.2, 0, 0, -3.2, 455, 2855);
		ctx.fill(upThis.downbeatStar);
		ctx.resetTransform();
		// Keyboard display
		// Reset the arrows
		let arrowLeft = new Path2D("M199 349 L214 329 L214 369 Z"),
		arrowRight = new Path2D("M1080 349 L1065 369 L1065 329 Z"),
		arrowLeftFlag = false,
		arrowRightFlag = false;
		let note;
		// Main range
		for (let i = 36; i < 97; i++) {
			this.#nkdb[i - 36] = sum.chKeyPr[this.#ch]?.has(i);
		}
		// Lower octaves
		for (let i = 0; i < 36; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				arrowLeftFlag = true;
				note = i % 12;
				this.#nkdb[i] = 1;
			}
		}
		// Higher octaves
		for (let i = 97; i < 128; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				arrowRightFlag = true;
				note = i % 12;
				if (note == 0) note = 12;
				this.#nkdb[i + 48] = 1;
			}
		}
		// Render the arrows
		ctx.fillStyle = arrowLeftFlag ? activePixel : inactivePixel;
		ctx.fill(arrowLeft);
		ctx.fillStyle = arrowRightFlag ? activePixel : inactivePixel;
		ctx.fill(arrowRight);
		// Staff display
		let noteHeadPos = new Uint8Array([0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7]);
		let isBlackKey = new Uint8Array([0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 2, 0]);
		let nadbIndex = new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 2, 0]);
		let bottomOctaveFlag1 = false,
		bottomOctaveFlag2 = false,
		topOctaveFlag1 = false,
		topOctaveFlag2 = false;
		// Main range
		for (let i = 48; i < 85; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				this.#nsdb[(Math.floor(i / 12) - 4) * 7 + noteHeadPos[i % 12]] = 1;
				if (isBlackKey[i % 12]) {
					if (isBlackKey[i % 12] == 1) {
						this.#nadb[(Math.floor(i / 12) - 4) * 2 + nadbIndex[i % 12]] = 1;
					}
					else {
						this.#nadb[(Math.floor(i / 12) - 4) * 3 + nadbIndex[i % 12] + 6] = 1;
					}
				}
			}
		}
		// Lower octaves
		for (let i = 0; i < 48; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				this.#nsdb[noteHeadPos[i % 12]] = 1;
				if (Math.floor(i / 12) == 3) {
					bottomOctaveFlag1 = true;
				}
				else {
					bottomOctaveFlag2 = true;
				}
				if (isBlackKey[i % 12]) {
					if (isBlackKey[i % 12] == 1) {
						this.#nadb[nadbIndex[i % 12]] = 1;
					}
					else {
						this.#nadb[nadbIndex[i % 12] + 6] = 1;
					}
				}
			}
		}
		// Higher octaves
		for (let i = 85; i < 128; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				this.#nsdb[14 + noteHeadPos[(i - 1) % 12 + 1]] = 1;
				if (Math.floor((i - 1) / 12) == 7) {
					topOctaveFlag1 = true;
				}
				else {
					topOctaveFlag2 = true;
				}
				if (isBlackKey[i % 12]) {
					if (isBlackKey[i % 12] == 1) {
						this.#nadb[4 + nadbIndex[i % 12]] = 1;
					}
					else {
						this.#nadb[12 + nadbIndex[i % 12]] = 1;
					}
				}
			}
		}
		// Octave marks
		ctx.font = '24px "Arial Web"';
		ctx.fillStyle = bottomOctaveFlag1 ? activePixel : inactivePixel;
		ctx.fillText("8va", 280, 208);
		ctx.fillStyle = topOctaveFlag1 ? activePixel : inactivePixel;
		ctx.fillText("8va", 876, 70);
		ctx.fillStyle = bottomOctaveFlag2 ? activePixel : inactivePixel;
		ctx.fillText("15va+", 253, 244);
		ctx.fillStyle = topOctaveFlag2 ? activePixel : inactivePixel;
		ctx.fillText("15va+", 874, 40);
		// Temporary channel number display
		this.#render7seg(`${"ABCDEFGH"[this.#ch >> 4]}${((this.#ch & 15) + 1).toString().padStart(2, "0")}`, ctx, 32, 315, 0.24, 0.24);
		// Measure / tempo view
		ctx.font = '23px "Arial Web"';
		ctx.fillStyle = tempoView ? inactivePixel : activePixel;
		ctx.fillText("MEASURE", 664, 296);
		ctx.fillStyle = tempoView ? activePixel : inactivePixel;
		ctx.fillText("TEMPO", 795, 242);
		if (tempoView) {
			this.#render7seg(Math.round(sum.tempo).toString().padStart(3, "0"), ctx, 791, 245, 0.17, 0.17);
		}
		else {
			this.#render7seg((sum.noteBar + 1).toString().padStart(3, "0"), ctx, 791, 245, 0.17, 0.17);
		}
		if (timeNow <= sum.letter.expire) {
			let letterDisp = sum.letter.text.trim();
			this.#renderDotMatrix(letterDisp, ctx, trueMode, 454, 32);
			if (mixerView) {
				this.#render7seg(`${sum.chProgr[this.#ch] + 1}`.padStart(3, "0"), ctx, 112, 15, 0.24, 0.24);
			}
			else {
				this.#render7seg(`${id + 1}`.padStart(3, "0"), ctx, 112, 15, 0.24, 0.24);
			}
		}
		else {
			if (mixerView) {
				this.#render7seg(`${sum.chProgr[this.#ch] + 1}`.padStart(3, "0"), ctx, 112, 15, 0.24, 0.24);
				this.#renderDotMatrix(upThis.getChVoice(this.#ch).name, ctx, trueMode, 454, 32);
			}
			else {
				this.#render7seg(`${id + 1}`.padStart(3, "0"), ctx, 112, 15, 0.24, 0.24);
				let sngTtl = upThis.songTitle;
				while (sngTtl.indexOf("  ") > -1) {
					sngTtl = sngTtl.replaceAll("  ", " ");
				};
				this.#renderDotMatrix(sngTtl || "Unknown", ctx, trueMode, 454, 32);
			}
		}
		// Side indicator
		ctx.fillStyle = activePixel;
		ctx.setTransform(4.5, 0, 0, 4.5, -605, -3642);
		ctx.fill(upThis.sideIndicator1);
		ctx.fillStyle = mixerView ? inactivePixel : activePixel;
		ctx.fill(upThis.sideIndicator2);
		ctx.setTransform(4.5, 0, 0, 4.5, -605, -3484);
		ctx.fillStyle = mixerView ? activePixel : inactivePixel;
		ctx.fill(upThis.sideIndicator2);
		ctx.resetTransform();
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
		}
		useBm.width = useBm.length / 16;
		useBm?.render((e, x, y) => {
			ctx.fillStyle = e ? activePixel : inactivePixel;
			ctx.fillRect(224 + x * 6, 261 + y * 3, 5, 2);
		});
		ctx.fillStyle = inactivePixel;
		ctx.font = '18px "Arial Web"';
		ctx.fillText("ACMP", 430, 275);
		ctx.fillText("ON", 430, 295);
		ctx.fill(new Path2D("M482 296 L482 312 L462 304 Z"));
		// Commit to display accordingly.
		let keyboardData = new Uint16Array([228, 238.5, 250.3, 263.5, 272.6, 295, 304.5, 317.3, 330, 339.5, 354, 361.8]);
		this.#nkdb.forEach((e, i) => {
			ctx.fillStyle = [inactivePixel, activePixel][e];
			let octave = Math.floor(i / 12), note = i % 12;
			if (i != 60) {
				isBlackKey[note] ? ctx.fillRect(keyboardData[note] + 163 * octave, 321, 12, 26) : ctx.fillRect(keyboardData[note] + 163 * octave, 355, 14, 21);
			}
			else {
				ctx.fillRect(1036, 355, 14, 21);
			}
		});
		this.#nsdb.forEach((e, i) => {
			if (i < 7) {
				ctx.setTransform(1, 0, 0, 1, 100 + 36 * i, 200 - 18 * i);
			}
			else {
				ctx.setTransform(1, 0, 0, 1, 538 + 36 * (i - 7), 290 - 18 * (i - 7));
			}
			ctx.fillStyle = [inactivePixel, activePixel][e];
			ctx.fill(upThis.noteHead);
			ctx.resetTransform();
		});
		// Accidentals
		let sharpPosX = new Uint16Array([82, 158, 488, 596, 740, 848]);
		let sharpPosY = new Uint16Array([200, 146, 290, 236, 164, 110]);
		let flatPosX = new Uint16Array([130, 230, 306, 560, 668, 704, 812, 920, 956]);
		let flatPosY = new Uint16Array([164, 110, 92, 254, 200, 182, 128, 74, 56]);
		this.#nadb.forEach((e, i) => {
			if (i < 6) {
				ctx.setTransform(0.03, 0, 0, -0.03, sharpPosX[i], sharpPosY[i]);
				ctx.fillStyle = [inactivePixel, activePixel][e];
				ctx.fill(upThis.sharpSign);
				ctx.resetTransform();
			}
			else {
				ctx.setTransform(0.03, 0, 0, -0.03, flatPosX[i - 6], flatPosY[i - 6]);
				ctx.fillStyle = [inactivePixel, activePixel][e];
				ctx.fill(upThis.flatSign);
				ctx.resetTransform();
			}
		});
		// Commit to old display buffer.
		/*
		this.#nkdb.forEach((e, i) => {
			if (this.#okdb[i] != e) {
				this.#okdb[i] = e;
			};
		});
		this.#nsdb.forEach((e, i) => {
			if (this.#osdb[i] != e) {
				this.#osdb[i] = e;
			};
		});
		*/
	}
}

export {
	TuiDisplay,
	MuDisplay,
	ScDisplay,
	Ns5rDisplay,
	QyDisplay,
	PsrDisplay
};
