"use strict";

import {OctaviaDevice, allocated} from "../state/index.mjs";
import {allowedStandards} from "../state/bankReader.js";
import {RootDisplay} from "../basic/index.mjs";
import {MxFont40, MxBm256} from "../basic/mxReader.js";

import {
	backlight,
	inactivePixel,
	activePixel
} from "./colour.js";

import {getDebugState} from "../state/utils.js";

const mprWidth = 8,
mpaWidth = 7,
mprHeight = 4,
mpaHeight = 3;

const exBlinkSpeed = 200,
exDuration = exBlinkSpeed * 5,
exExhaust = exBlinkSpeed << 1,
blinkSpeedMode = 400;

const blank256Buffer = new Uint8Array(256);

const modeGroup = {
	"?": 0,
	"gm": 0,
	"gs": 1,
	"sc": 1,
	"xg": 0,
	"sd": 1,
	"g2": 0,
	"mt32": 2,
	"ns5r": 3,
	"k11": 0,
	"05rw": 3,
	"sg": 1,
	"x5d": 3,
	"s90es": 0,
	"krs": 3,
	"motif": 0
};
const number7Seg = [
	0b1011111,
	0b0000011,
	0b1110101,
	0b1110011,
	0b0101011,
	0b1111010,
	0b1111110,
	0b0010011,
	0b1111111,
	0b1111011,
	0
];

let getBit = (number, bit) => {
	return (number >> bit) & 1;
};
let getLcd = (boolean) => {
	return boolean ? activePixel : inactivePixel;
};

let normParamPaint = function (sup, offsetX, ctx) {
	let paramW = mprWidth * 4 - 1;
	let paramH = mprHeight * 1.5 - 1;
	let sub = sup >> 4;
	for (let i = 0; i < 8; i ++) {
		if (sup > 0 && sub >= 0) {
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
let efxParamPaint = function (sup, offsetX, ctx, useWB, wbArr) {
	let paramW = mprWidth * 4 - 1;
	let paramH = mprHeight * 1.5 - 1;
	let sub = sup >> 4;
	for (let i = 0; i < 8; i ++) {
		if (useWB) {
			if (wbArr[i]) {
				ctx.strokeStyle = activePixel;
			} else {
				ctx.strokeStyle = inactivePixel;
			};
		} else {
			if (sup > 0 && sub >= 0) {
				ctx.strokeStyle = activePixel;
			} else {
				ctx.strokeStyle = inactivePixel;
			};
			sub --;
		};
		let invI = 7 - i;
		ctx.beginPath();
		ctx.arc(offsetX, 256, (9 - invI) * mprWidth, startA, endA);
		ctx.lineWidth = paramH;
		ctx.stroke();
	};
};

// Triangle painting
let paintTriDown = function (ctx, offsetX, offsetY, active = false) {
	ctx.beginPath();
	ctx.moveTo(offsetX - mpaWidth, offsetY);
	ctx.lineTo(offsetX, offsetY + mpaWidth);
	ctx.lineTo(offsetX + mpaWidth, offsetY);
	ctx.closePath();
	let fillStyle = ctx.fillStyle;
	ctx.fillStyle = active ? activePixel : inactivePixel;
	ctx.fill();
	ctx.fillStyle = fillStyle;
};
let paintTriRight = function (ctx, offsetX, offsetY, active = false) {
	ctx.beginPath();
	ctx.moveTo(offsetX, offsetY);
	ctx.lineTo(offsetX + 8, offsetY + 5);
	ctx.lineTo(offsetX, offsetY + 10);
	ctx.closePath();
	ctx.fillStyle = active ? activePixel : inactivePixel;
	ctx.fill();
};
let paintSevenSeg = function (ctx, offsetX, offsetY, bitMask) {
	let width = 0, height = 0, x = 0, y = 0;
	for (let i = 0; i < 7; i ++) {
		ctx.fillStyle = getLcd(getBit(bitMask, i));
		width = (i >> 2) ? 11 : 3;
		height = (i >> 2) ? 3 : 13;
		x = (i >> 1) ? ((i >> 2) ? 4 : 0) : 16;
		y = [4, 22, 22, 4, 0, 18, 36][i];
		ctx.fillRect(offsetX + x, offsetY + y, width, height);
	};
};

Math.sum = function (...args) {
	let sum = 0;
	args.forEach((e) => {
		sum += e;
	});
	return sum;
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
	#range = 0;
	#start = 255; // start port
	#minCh = 0;
	#maxCh = 0;
	#scheduledEx = 0;
	#unresolvedEx = 0;
	//#awaitEx = 0;
	#promptEx = 0;
	inWB = false;
	#waveBuffer = new Uint8Array(8);
	#panStrokes = new Uint8Array(7);
	#booted = 0;
	#bootFrame = 0;
	trueFont = new MxFont40("./data/bitmaps/korg/font.tsv", "./data/bitmaps/xg/font.tsv");
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	sysBm = new MxBm256("./data/bitmaps/xg/system.tsv");
	voxBm = new MxBm256("./data/bitmaps/xg/voices.tsv");
	aniBm = new MxBm256("./data/bitmaps/xg/animation.tsv");
	isMetreAffectedByPan = false;
	clockSource;
	constructor() {
		super(new OctaviaDevice());
		let upThis = this;
		upThis.addEventListener("mode", function (ev) {
			(upThis.sysBm.getBm(`st_${({"gm":"gm1","g2":"gm2","?":"gm1","ns5r":"korg","ag10":"korg","x5d":"korg","05rw":"korg","krs":"korg","sg":"gm1","k11":"gm1","sd":"gm2","sc":"gs"})[ev.data] || ev.data}`) || []).forEach(function (e, i) {
				upThis.#bmdb[i] = e;
			});
			upThis.#bmst = 2;
			upThis.#bmex = Date.now() + blinkSpeedMode * 4;
		});
		upThis.addEventListener("channelactive", (ev) => {
			upThis.#ch = ev.data;
		});
		upThis.addEventListener("channelmin", (ev) => {
			if (ev.data >= 0) {
				upThis.#minCh = ev.data + 1;
			};
		});
		upThis.addEventListener("channelmax", (ev) => {
			if (ev.data > upThis.#minCh - 1) {
				upThis.#maxCh = ev.data + 1;
			} else {
				upThis.#minCh = 0;
				upThis.#maxCh = 0;
			};
		});
		upThis.addEventListener("channelreset", () => {
			upThis.#minCh = 0;
			upThis.#maxCh = 0;
			upThis.#waveBuffer.fill(0);
			upThis.demoInfo = false;
		});
		upThis.addEventListener("portrange", (ev) => {
			if (ev && ev.data !== 1 << Math.log2(ev.data)) {
				console.debug(`MU display rejected port range value ${ev.data}.`);
			};
			upThis.#range = ev.data;
		});
		upThis.addEventListener("portstart", (ev) => {
			if (ev !== 255 && ev >= allocated.port) {
				console.debug(`MU display rejected port range value ${ev.data}.`);
			};
			upThis.#start = ev.data;
		});
		upThis.device.addEventListener("mupromptex", ({data}) => {
			upThis.#scheduledEx = data;
			getDebugState() && console.debug(`Scheduled a SysEx prompt.`);
		});
		upThis.clockSource = upThis.clockSource || {
			now: () => {
				return Date.now() / 1000;
			}
		};
		(async () => {
			await Promise.all([upThis.trueFont.loaded.wait(), upThis.xgFont.loaded.wait(), upThis.sysBm.loaded.wait(), upThis.aniBm.loaded.wait()]);
			upThis.#booted = 1;
		})();
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
		this.#range = 0;
		this.#start = 255;
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
		ctx.fillStyle = `${backlight.grYellow}64`;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// Main matrix display
		upThis.#mmdb.fill(0);
		// Part display
		upThis.#pmdb.fill(0);
		if (upThis.#scheduledEx > 0) {
			let durationPer10Ms = (upThis.#scheduledEx * 85 + 4095) >> 12;
			if (timeNow - upThis.#promptEx > exBlinkSpeed) {
				upThis.#unresolvedEx += (durationPer10Ms * 204 + 4095) >> 12; // Devides by 20
				getDebugState() && console.debug(`SysEx prompt submitted: ${upThis.#unresolvedEx}.`);
			} else {
				// MIDI transmits at 4.8 KB/s or 38400 bps
				if ((((timeNow - upThis.#promptEx) * 41) >> 12 & 1) && upThis.#unresolvedEx < 8) {
					upThis.#unresolvedEx == 8;
				};
				upThis.#unresolvedEx += (durationPer10Ms + 1) >> 1;
				getDebugState() && console.debug(`SysEx prompt too busy: ${upThis.#unresolvedEx}.`);
			};
			upThis.#scheduledEx = 0;
			//upThis.#awaitEx = timeNow;
		};
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
		let port = minCh >> 4;
		minCh = port << 4;
		maxCh = ((maxCh >> 4) << 4) + 15;
		if (upThis.#ch > maxCh) {
			upThis.#ch = minCh + upThis.#ch & 15;
		};
		if (upThis.#ch < minCh) {
			upThis.#ch = maxCh - 15 + (upThis.#ch & 15);
		};
		if (upThis.#minCh && upThis.#minCh > 0) {
			minCh = upThis.#minCh - 1;
		};
		if (upThis.#maxCh && upThis.#maxCh <= 128) {
			maxCh = upThis.#maxCh - 1;
		};
		if (upThis.#range) {
			if (upThis.#start === 255) {
				minCh = (Math.floor((upThis.#ch >> 4) / upThis.#range) * upThis.#range) << 4;
			} else {
				minCh = upThis.#start << 4;
			};
			maxCh = minCh + upThis.#range * 16 - 1;
		};
		let rendMode = Math.ceil(Math.log2(maxCh - minCh + 1) - 4),
		rendPos = 0;
		let showLsb = upThis.getChPrimitive(upThis.#ch, 1) === 0;
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
				let curStrn = sum.strength[ch],
				curStrnL = curStrn,
				curStrnR = curStrn;
				let chPan = upThis.device.getChCc(ch, 10);
				if (chPan === 64 || chPan >> 7 === 1 || !upThis.isMetreAffectedByPan) {
					// Nothing will happen
				} else if (chPan < 64) {
					curStrnR = Math.round(curStrnR * chPan >> 6);
				} else if (chPan > 64) {
					curStrnL = Math.round(curStrnR * (128 - chPan) >> 6);
				};
				if (rendMode) {
					curStrnL >>= 5;
					curStrnR >>= 5;
				} else {
					curStrnL >>= 4;
					curStrnR >>= 4;
				};
				if (rendMode === 0 || rendMode === 1) {
					// 16 channel
					for (let pI = 0; pI <= curStrn; pI ++) {
						let pR = 5 + rendPos * 3 + (15 - pI) * 85 - (rendPos >> 1);
						pI <= curStrnL && (upThis.#mmdb[pR] = 1);
						pI <= curStrnR && (upThis.#mmdb[pR + 1] = 1);
					};
				} else {
					// 64 channel
					for (let pI = 0; pI <= curStrn; pI ++) {
						let pR = 5 + rendPos * 3 + (15 - pI) * 85 - (rendPos >> 1);
						if (rendPos > 31) {
							pR -= 760;
						};
						pI <= curStrnL && (upThis.#mmdb[pR] = 1);
						pI <= curStrnR && (upThis.#mmdb[pR + 1] = 1);
					};
				};
				rendPos ++;
			};
			// Render fonts
			if (rendMode < 2) {
				let voiceObj = upThis.getChVoice(upThis.#ch),
				voiceName = (voiceObj.name).slice(0, 8).padEnd(8, " "),
				primBuf = upThis.getChPrimitives(upThis.#ch);
				let bnkSel = (primBuf[0] || primBuf[2] || 0).toString().padStart(3, "0");
				switch (primBuf[0]) {
					case 64:
					case 67: {
						if (upThis.device.getChMode(0) === "xg") {
							bnkSel = "SFX";
						};
						break;
					};
				};
				if ([63].indexOf(primBuf[0]) > -1) {
					bnkSel = `${primBuf[2] || 0}`.padStart(3, "0");
					showLsb = true;
				};
				if (upThis.getMode() === "xg") {
					if ([32, 33, 34, 35, 36, 48, 79, 80, 81, 82, 83, 84, 95, 96, 97, 98, 99, 100].indexOf(primBuf[0]) > -1) {
						bnkSel = `${primBuf[2] || 0}`.padStart(3, "0");
						showLsb = true;
					};
				};
				let bnkInfo = `\u0080${bnkSel}\u0081${((sum.chProgr[upThis.#ch] || 0) + 1).toString().padStart(3, "0")}`;
				let bitSeq = upThis.xgFont.getStr(bnkInfo + voiceName);
				bitSeq.forEach(function (e0, i0) {
					let regionX = 0, regionY = 0;
					if (rendMode === 1) {
						regionX = i0 * 5;
					} else if (!rendMode) {
						regionX = (i0 % 8) * 5 + 45,
						regionY = 8 - Math.floor(i0 / 8) * 8;
					};
					e0.forEach(function (e1, i1) {
						let partX = i1 % 5,
						partY = Math.floor(i1 / 5);
						if (rendMode === 1 && i0 > 7) {
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
		ctx.font = '400 12px "Public Sans"';
		ctx.textRendering = "geometricPrecision";
		// Display parts under strengths
		{
			let initOff = 71.5;
			for (let c = -2; c < 32; c ++) {
				ctx.fillStyle = activePixel;
				if (c + minCh === upThis.#ch) {
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
		ctx.fillStyle = activePixel;
		ctx.fillText("CHANNEL     SEC     PART", 118, 254);
		ctx.fillText("VOL", 420, 254);
		ctx.fillText("EXP", 468, 254);
		ctx.fillText("BRT", 516, 254);
		ctx.fillText("REV", 643, 254);
		ctx.fillText("CHO", 692.5, 254);
		ctx.fillText("VAR", 741, 254);
		ctx.fillText("KEY", 799, 254);
		ctx.fillText("PAN", 583, 254);
		// Show bank
		ctx.fillStyle = !showLsb && !rendMode ? activePixel : inactivePixel;
		ctx.fillText("MSB", 515, 162.5);
		ctx.fillStyle = showLsb && !rendMode ? activePixel : inactivePixel;
		ctx.fillText("LSB", 564, 162.5);
		ctx.fillStyle = !rendMode ? activePixel : inactivePixel;
		ctx.fillText("BANK", 467.5, 162.5);
		ctx.fillText("PGM#", 660, 162.5);
		ctx.fillStyle = !showLsb && rendMode ? activePixel : inactivePixel;
		ctx.fillText("MSB", 131, 162.5);
		ctx.fillStyle = showLsb && rendMode ? activePixel : inactivePixel;
		ctx.fillText("LSB", 180, 162.5);
		ctx.fillStyle = rendMode ? activePixel : inactivePixel;
		ctx.fillText("BANK", 83.5, 162.5);
		ctx.fillText("PGM#", 276, 162.5);
		// Show parts
		upThis.xgFont.getStr(`${(upThis.#ch + 1).toString().padStart(2, "0")}${"ABCDEFGH"[upThis.#ch >> 4]}${(upThis.#ch % 16 + 1).toString().padStart(2, "0")}`).forEach(function (e0, i0) {
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
			if (upThis.#unresolvedEx) {
				upThis.#unresolvedEx = 0;
				getDebugState() && console.debug(`SysEx prompt cancelled.`);
			};
			useBm = sum.bitmap.bitmap;
		} else if (upThis.demoInfo && time > 0) {
			if (upThis.#unresolvedEx) {
				upThis.#unresolvedEx = 0;
				getDebugState() && console.debug(`SysEx prompt cancelled.`);
			};
			let sequence = upThis.demoInfo.class || "boot";
			let stepTime = upThis.demoInfo.fps || 2;
			let stepSize = upThis.demoInfo.size || 4;
			let stepOffset = upThis.demoInfo.offset || 0;
			let stepFrame = Math.floor((time * stepTime + stepOffset) % stepSize);
			let stepId = `${sequence}_${stepFrame}`;
			//console.debug(stepId);
			useBm = upThis.aniBm?.getBm(stepId) || upThis.sysBm?.getBm(stepId) || upThis.sysBm?.getBm("no_abm");
			if (!useBm) {
				useBm = upThis.#bmdb.slice();
			};
		} else {
			// Use stored pic
			useBm = upThis.#bmdb.slice();
			if (timeNow >= upThis.#bmex) {
				if (upThis.#unresolvedEx > 0 && timeNow - upThis.#promptEx >= exExhaust) {
					upThis.#unresolvedEx -= 16;
					upThis.#promptEx = timeNow;
					getDebugState() && console.debug(`SysEx prompt resolved: ${upThis.#unresolvedEx}.`);
				} else if (upThis.#unresolvedEx < 0) {
					upThis.#unresolvedEx = 0;
					//getDebugState() && console.debug(`SysEx prompt reset.`);
				};
				upThis.#bmst = 0;
				let chVox = upThis.getChVoice(upThis.#ch),
				standard = chVox.standard.toLowerCase();
				useBm = upThis.voxBm.getBm(chVox.name) || upThis.voxBm.getBm(upThis.getVoice(upThis.getChPrimitive(upThis.#ch, 1), upThis.getChPrimitive(upThis.#ch, 0), 0, sum.mode).name);
				if (standard !== upThis.device?.getChMode(upThis.#ch) && allowedStandards.xg.has(standard)) {
					switch ((upThis.getChPrimitive(upThis.#ch, 1)) >> 4) {
						case 2: {
							// Internal
							useBm = upThis.sysBm.getBm(`ext_${standard}I`);
							break;
						};
						case 6: {
							// XG-proxy (XG-B)
							useBm = upThis.sysBm.getBm(`ext_${standard}P`);
							break;
						};
						default: {
							// Should be XG Non-proxy (XG-A)
							useBm = upThis.sysBm.getBm(`ext_${standard}`);
							break;
						};
					};
				} else if (sum.chType[upThis.#ch]) {
					useBm = upThis.sysBm.getBm(`cat_drm`);
				} else if (["mu", "es"]. indexOf(standard) > -1) {
					useBm = upThis.sysBm.getBm(`boot_3`);
				} else if (standard === "kr") {
					useBm = upThis.sysBm.getBm(`st_korg`);
				};
				//if (!useBm) {
					switch (upThis.getChPrimitive(upThis.#ch, 1)) {
						case 56:
						case 121: {
							useBm = upThis.voxBm.getBm(upThis.getVoice(0, sum.chProgr[upThis.#ch], 0, sum.mode).name);
							break;
						};
						case 126: {
							if (upThis.getChPrimitive(upThis.#ch, 0) >> 4 === 7) {
								useBm = upThis.sysBm.getBm("cat_smpl");
							};
							break;
						};
						case 64: {
							switch (chVox.ending) {
								case " ":
								case "^": {
									useBm = upThis.sysBm.getBm("cat_sfx");
									break;
								};
								default: {
									useBm = upThis.sysBm.getBm("no_vox");
								};
							};
							break;
						};
						default: {
							if (chVox.ending === "?") {
								useBm = upThis.sysBm.getBm("no_vox");
							} else if (upThis.getChPrimitive(upThis.#ch, 1) < 48) {
								switch (upThis.getChPrimitive(upThis.#ch, 1)) {
									case 16:
									case 32:
									case 33:
									case 34:
									case 35:
									case 36: {
										break;
									};
									default: {
										useBm = upThis.voxBm.getBm(upThis.getVoice(0, sum.chProgr[upThis.#ch], 0, sum.mode).name);
									};
								};
							};
						};
					};
				//};
				if (!useBm) {
					useBm = upThis.sysBm.getBm("no_abm");
				};
				useBm = useBm?.slice() || blank256Buffer;
				let exBlink = timeNow - upThis.#promptEx;
				if (exBlink <= exDuration) {
					upThis.sysBm.getBm("sysex_m").forEach((e, i) => {
						if (e) {
							useBm[i] = 0;
						};
					});
					upThis.sysBm.getBm(`sysex_${Math.floor(exBlink / exDuration * 5) & 1}`).forEach((e, i) => {
						if (e) {
							useBm[i] = 1;
						};
					});
				};
			} else {
				if (upThis.#bmst === 2) {
					if (upThis.#unresolvedEx) {
						upThis.#unresolvedEx = 0;
						getDebugState() &&  console.debug(`SysEx prompt cancelled.`);
					};
					useBm.forEach((e, i, a) => {
						let crit = Math.floor((upThis.#bmex - timeNow) / blinkSpeedMode);
						a[i] = (crit & 1) === e;
					});
				};
			};
		};
		for (let i = 0; i < 256; i ++) {
			let pX = i % 16;
			let pY = Math.floor(i / 16);
			ctx.fillStyle = inactivePixel;
			if (useBm && useBm[i]) {
				ctx.fillStyle = activePixel;
			};
			ctx.fillRect(260 + pX * mprWidth, 180 + pY * mprHeight, mpaWidth, mpaHeight);
		};
		// Move waveBuffer
		let useWB = time && upThis.demoInfo;
		if (useWB && Math.floor(time * 50)) {
			for (let i = 6; i >= 0; i --) {
				upThis.#waveBuffer[i + 1] = upThis.#waveBuffer[i];
			};
			upThis.#waveBuffer[0] = +(sum.velo[upThis.#ch] > 159);
		};
		// Show param
		normParamPaint(upThis.device.getChCc(upThis.#ch, 7), 404, ctx); // vol
		normParamPaint(upThis.device.getChCc(upThis.#ch, 11), 452, ctx); // exp
		normParamPaint(upThis.device.getChCc(upThis.#ch, 74), 500, ctx); // brt
		efxParamPaint(upThis.device.getChCc(upThis.#ch, 91), 644, ctx, useWB, upThis.#waveBuffer); // rev
		efxParamPaint(upThis.device.getChCc(upThis.#ch, 93), 692, ctx, useWB, upThis.#waveBuffer); // cho
		efxParamPaint(upThis.device.getChCc(upThis.#ch, 94), 740, ctx, useWB, upThis.#waveBuffer); // var
		// Show pan
		ctx.beginPath();
		ctx.arc(582, 216, 34, 2.356194490192345, 7.068583470577034);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000f";
		ctx.stroke();
		let pan = upThis.device.getChCc(upThis.#ch, 10);
		upThis.#panStrokes.fill(0);
		if (pan === 0) {
			upThis.#panStrokes[0] = 1;
		} else if (pan === 64) {
			upThis.#panStrokes[3] = 1;
		} else if (pan === 128) {
			// Real MU doesn't show anything for random panning
		} else if (pan < 64) {
			upThis.#panStrokes[Math.floor(pan / 21)] = 1;
		} else {
			upThis.#panStrokes[4 + Math.floor((pan - 65) / 21)] = 1;
		};
		ctx.lineWidth = mprHeight;
		for (let i = 0; i < 7; i ++) {
			ctx.strokeStyle = inactivePixel;
			if (upThis.#panStrokes[i]) {
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
		// Paint down triangles
		paintTriDown(ctx, 180, 170, false);
		paintTriDown(ctx, 292, 170, false);
		paintTriDown(ctx, 356, 170, !(upThis.demoInfo && time) && (Math.floor((time || upThis.clockSource.now()) * 20) % 8)); // Ignore when under demo
		paintTriDown(ctx, 420, 170, false);
		paintTriDown(ctx, 468, 170, false);
		paintTriDown(ctx, 516, 170, false);
		paintTriDown(ctx, 582, 170, false);
		paintTriDown(ctx, 644, 170, false);
		paintTriDown(ctx, 692, 170, false);
		paintTriDown(ctx, 740, 170, false);
		paintTriDown(ctx, 800, 170, false);
		// Paint right triangles
		let modeSel = modeGroup[sum.mode];
		if (modeSel?.constructor !== Number) {
			modeSel = -1;
		};
		paintTriRight(ctx, 826, 170, modeSel === 0);
		paintTriRight(ctx, 826, 188, modeSel === 1);
		paintTriRight(ctx, 826, 206, modeSel === 2);
		paintTriRight(ctx, 826, 224, modeSel === 3);
		// MIC & LIVE
		ctx.fillStyle = getLcd(!(upThis.demoInfo && time));
		ctx.fillRect(15, 153, 42, 11);
		ctx.fillStyle = inactivePixel;
		ctx.fillRect(15, 166, 42, 11);
		ctx.fillStyle = backlight.grYellow;
		ctx.fillText("MIC", 36, 162.5);
		ctx.fillText("LINE", 36, 175.5);
		// Pitch shift
		let pitch = upThis.device.getPitchShift(upThis.#ch),
		isPositivePitch = pitch >= 0;
		pitch = Math.round(Math.abs(pitch));
		ctx.fillStyle = activePixel;
		ctx.fillRect(757, 218, 18, 3);
		ctx.fillStyle = getLcd(isPositivePitch);
		ctx.fillRect(765, 207, 3, 10);
		ctx.fillRect(765, 222, 3, 10);
		paintSevenSeg(ctx, 779, 200, number7Seg[Math.floor(pitch / 10) || 10]);
		paintSevenSeg(ctx, 801, 200, number7Seg[pitch % 10]);
	};
};

export default MuDisplay;
