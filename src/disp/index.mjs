"use strict";

import {textedPanning, textedPitchBend} from "./texted.js";
import {RootDisplay} from "../basic/index.mjs";

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
				if (line < fields.length - 5 && i >= (self.minCh || 0)) {
					let voiceName = upThis.voices.get(sum.chContr[chOffset + 0], sum.chProgr[i], sum.chContr[chOffset + 32], sum.mode);
					if (sum.names[i]) {
						voiceName.name = sum.names[i];
						voiceName.ending = "~";
					};
					let chOffset = i * 128;
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
			let metaLine = 0;
			for (let st = fields.length - 1; st >= line; st --) {
				fields[st] = (sum.texts[metaLine] || "").padEnd(100, " ");
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
						if (i < 16 && sum.chContr[i]?.length > 0) {
							let strength = e >> 4;
							for (let dot = 0; dot <= strength; dot ++) {
								renderer[i + (15 - dot) * 16] = 1;
							};
						};
					});
				} else {
					sum.strength.forEach(function (e, i) {
						if (i < 32 && sum.chContr[i]?.length > 0) {
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


let inactivePixel = "#0002",
activePixel = "#000a";
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

let MuDisplay = class extends RootDisplay {
	#mmdb = new Uint8Array(1360);
	#pmdb = new Uint8Array(200);
	#bmdb = new Uint8Array(256);
	#ch = 0;
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
		ctx.fillStyle = "#af2";
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
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4),
		rendPos = 0;
		if (timeNow <= sum.letter.expire && sum.letter.text.trim().length > 0) {
			// Show display text
		} else {
			// Show strength metre
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
				};
				rendPos ++;
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
		// Commit to bitmap screen
		let useBm;
		if (timeNow <= sum.bitmap.expire) {
			// Use provided bitmap
			useBm = sum.bitmap.bitmap;
		} else {
			// Use stored pic
			useBm = this.#bmdb;
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
		// Show volume
		let chOff = this.#ch * 128;
		normParamPaint(sum.chContr[chOff + 7], 404, ctx);
		normParamPaint(sum.chContr[chOff + 11], 452, ctx);
		normParamPaint(sum.chContr[chOff + 74], 500, ctx);
		efxParamPaint(sum.chContr[chOff + 91], 660, ctx);
		efxParamPaint(sum.chContr[chOff + 93], 708, ctx);
		efxParamPaint(sum.chContr[chOff + 70], 756, ctx);
	};
};

export {
	TuiDisplay,
	MuDisplay
};
