"use strict";

import {textedPanning, textedPitchBend} from "./texted.js";
import {RootDisplay, ccToPos} from "../basic/index.mjs";

import {
	noteNames,
	noteRegion,
	map,
	waveMap
} from "./common.js";

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
		fields[2] = "Ch:VoiceNme#St VEM RCDBPSAR PiBd Pan : Note";
		let line = 3, maxCh = 0;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				maxCh = i;
				let chOffset = i * ccToPos.length;
				if (line < fields.length - 5 && i >= (self.minCh || 0)) {
					let voiceName = upThis.getChVoice(i);
					fields[line] = `${(i + 1).toString().padStart(2, "0")}:${voiceName.name.slice(0, 8).padEnd(8, " ")}${voiceName.ending}${voiceName.standard} ${map[sum.chContr[chOffset + ccToPos[7]] >> 1]}${map[sum.chContr[chOffset + ccToPos[11]] >> 1]}${waveMap[sum.chContr[chOffset + ccToPos[1]] >> 5]} ${map[sum.chContr[chOffset + ccToPos[91]] >> 1]}${map[sum.chContr[chOffset + ccToPos[93]] >> 1]}${map[sum.chContr[chOffset + ccToPos[94]] >> 1]}${map[sum.chContr[chOffset + ccToPos[74]] >> 1]}${(sum.chContr[chOffset + ccToPos[65]] >> 6) ? map[sum.chContr[chOffset + ccToPos[5]] >> 1] : " "}${"XO"[sum.chContr[chOffset + ccToPos[66]] >> 6]}${map[sum.chContr[chOffset + ccToPos[73]] >> 1]}${map[sum.chContr[chOffset + ccToPos[72]] >> 1]} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(sum.chContr[chOffset + ccToPos[10]])}:`;
					sum.chKeyPr[i].forEach(function (e1, i1) {
						if (e1.v > 0) {
							fields[line] += ` <span style="opacity:${Math.round(e1.v / 1.27) / 100}" class="${{4: "state-hold"}[e1.s] || ""}">${noteNames[i1 % 12]}${noteRegion[Math.floor(i1 / 12)]}</span>`;
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

export default TuiDisplay;
