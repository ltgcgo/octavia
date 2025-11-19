"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {textedPanning, textedPitchBend} from "./texted.js";
import {RootDisplay} from "../basic/index.mjs";

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
	"sc": "RolandGS",
	"mt32": "RlndMT32",
	"sd": "RolandSD",
	"ag10": "KorgAG10",
	"x5d": "Korg X5D",
	"05rw": "Korg05RW",
	"ns5r": "KorgNS5R",
	"k11": "KawaiK11",
	"sg": "AkaiPrSG",
	"doc": "YamahDOC",
	"qy10": "Ymh.QY10",
	"qy20": "Ymh.QY20",
	"krs": "KorgKros",
	"s90es": "YmhS90ES",
	"motif": "YmhMotif"
};

// HTML escape function to prevent XSS attacks
let escapeHtml = function (text) {
	if (typeof text !== 'string') {
		return text;
	}
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
};

// Velocity to brightness
let velToLuma = function (velo) {
	let newVel = velo * 2 + 1;
	return `${hexMap[newVel >> 4]}${hexMap[newVel & 15]}`;
};

let TuiDisplay = class extends RootDisplay {
	#maxPoly = 0;
	constructor() {
		super(new OctaviaDevice);
		let upThis = this;
		upThis.addEventListener("reset", () => {
			upThis.#maxPoly = 0;
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
		fields[2] = "Ch:VoiceNme#St T VEM RCDBRP12 PiBd Pan : Note";
		let line = 3, maxCh = 0;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				maxCh = i;
				if (line < fields.length - 5 && i >= (self.minCh || 0)) {
					let voiceName = upThis.getChVoice(i);
					let partName = (i + 1).toString().padStart(2, "0");
					if (sum.efxSink[i]) {
						partName = `<u>${partName}</u>`;
					};
					fields[line] = `${partName}:${escapeHtml(voiceName.name.slice(0, 8).padEnd(8, " "))}${escapeHtml(voiceName.ending)}${escapeHtml(voiceName.standard)} ${sum.chType[i]} ${map[upThis.device?.getChCc(i, 7) >> 1]}${map[upThis.device?.getChCc(i, 7) >> 1]}${waveMap[upThis.device?.getChCc(i, 1) >> 5]} ${map[upThis.device?.getChCc(i, 91) >> 1]}${map[upThis.device?.getChCc(i, 93)]}${map[upThis.device?.getChCc(i, 94)]}${map[upThis.device?.getChCc(i, 74)]}${map[upThis.device?.getChCc(i, 71)]}${(upThis.device?.getChCc(i, 65) >> 6) ? map[upThis.device?.getChCc(i, 5) >> 1] : " "}${sum.ace[0] ? map[upThis.device.getChAce(i, 0) >> 1] : " "}${sum.ace[1] ? map[upThis.device.getChAce(i, 1) >> 1] : " "} ${textedPitchBend(sum.chPitch[i])} ${textedPanning(upThis.device?.getChCc(i, 10))}:`;
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
				if (sum.texts[metaLine]?.data.length) {
					fields[st] = `${sum.texts[metaLine].mask ? "        " : escapeHtml(sum.texts[metaLine].type).padStart(8, " ")}: ${escapeHtml(sum.texts[metaLine].data || "")}`.padEnd(100, " ");
				};
				if (sum.texts[metaLine]?.data.length > 0 || sum.texts[metaLine]?.data.length === undefined) {
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
