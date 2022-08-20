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
		let line = 3;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				let voiceName = upThis.voices.get(sum.chContr[i][0], sum.chProgr[i], sum.chContr[i][32]);
				if (sum.names[i]) {
					voiceName.name = sum.names[i];
					voiceName.ending = "~";
				};
				fields[line] = `${(i + 1).toString().padStart(2, "0")}:${voiceName.name.slice(0, 8).padEnd(8, " ")}${voiceName.ending}${voiceName.standard} ${map[sum.chContr[i][7] >> 1]}${map[sum.chContr[i][11] >> 1]}${waveMap[sum.chContr[i][1] >> 5]} ${map[sum.chContr[i][91] >> 1]}${map[sum.chContr[i][93] >> 1]}${map[sum.chContr[i][94] >> 1]}${map[sum.chContr[i][74] >> 1]} ${sum.chContr[i][65] > 63 ? "O" : "X"}${map[sum.chContr[i][5] >> 1]} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(sum.chContr[i][10])}:`;
				sum.chKeyPr[i].forEach(function (e1, i1) {
					if (e1 > 0) {
						fields[line] += ` <span style="opacity:${Math.round(e1 / 1.27) / 100}">${noteNames[i1 % 12]}${noteRegion[Math.floor(i1 / 12)]}</span>`;
					};
				});
				line ++;
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
				sum.strength.forEach(function (e, i) {
					if (i < 16 && sum.chContr[i]?.length > 0) {
						let strength = e >> 4;
						for (let dot = 0; dot <= strength; dot ++) {
							renderer[i + (15 - dot) * 16] = 1;
						};
					};
				});
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

export {
	TuiDisplay
};
