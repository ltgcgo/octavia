"use strict";

import {OctaviaDevice, allocated, ccToPos} from "../state/index.mjs";
import {RootDisplay} from "../basic/index.mjs";

const targetRatio = 16 / 9;
const chTypes = "Vx,Dr,D1,D2,D3,D4,D5,D6,D7,D8".split(",");
const modeNames = {
	"?": "Unset",
	"gm": "General MIDI",
	"g2": "General MIDI 2",
	"xg": "Yamaha XG",
	"gs": "Roland GS",
	"mt32": "Roland MT-32",
	"sd": "Roland SD",
	"x5d": "Korg X5D",
	"05rw": "Korg 05R/W",
	"ns5r": "Korg NS5R",
	"k11": "Kawai K11",
	"sg": "Akai SG",
	"krs": "Korg KROSS 2",
	"s90es": "Yamaha S90 ES",
	"motif": "Yamaha Motif ES"
};
const metaNames = {
	"Copyrite": "Copyright",
	"Cmn.Text": "Text",
	"C.Lyrics": "Lyrics",
	"C.Marker": "Marker",
	"CuePoint": "Cue Point",
	"Instrmnt": "Instrument",
	"Kar.Info": "Kar Info",
	"Kar.Mode": "Karaoke",
	"Kar.Lang": "Language",
	"KarTitle": "Kar Title",
	"KarLyric": "Kar Lyrics",
	"Kar.Ver.": "Kar Version",
	"SGLyrics": "SG Lyrics",
	"TrkTitle": "Title",
	"XfSngDte": "XF Date",
	"XfSngRgn": "XF Region",
	"XfSngCat": "XF Category",
	"XfSongBt": "XF Beat",
	"XfSngIns": "XF Instr.",
	"XfSngVoc": "XF Vocalist",
	"XfSngCmp": "XF Composer",
	"XfSngLrc": "XF Lyricist",
	"XfSngArr": "XF Arranger",
	"XfSngPer": "XF Perform.",
	"XfSngPrg": "XF Program.",
	"XfSngTag": "XF Tags",
	"XfKarLng": "XF Lang.",
	"XfKarNme": "XF Name",
	"XfKarCmp": "XK Composer",
	"XfKarLrc": "XK Lyricist",
	"XfKarArr": "XK Arranger",
	"XfKarPer": "XK Perform.",
	"XfKarPrg": "XK Program."
}, metaBlocklist = [
	"XfSongBt",
	"XfSngIns"
];
const portPos = [{l: 0, t: 0}, {l: 0, t: 416}, {l: 960, t: 0}, {l: 960, t: 416}];

let createElement = function (tag, classes, details = {}) {
	let target = document.createElement(tag);
	classes?.forEach((e) => {
		target.classList.add(e);
	});
	let {t, l, w, h, i, a} = details;
	t?.constructor && (target.style.top = t?.length ? t : `${t}px`);
	l?.constructor && (target.style.left = l?.length ? l :`${l}px`);
	w?.constructor && (target.style.width = w?.length ? w :`${w}px`);
	h?.constructor && (target.style.height = h?.length ? h :`${h}px`);
	i?.constructor && (target.appendChild(document.createTextNode(i)));
	a?.constructor && (target.style.textAlign = a);
	return target;
};
let createSVG = function (tag, details) {
	let target = document.createElementNS("http://www.w3.org/2000/svg", tag);
	for (let key in details) {
		target.setAttribute(key, details[key]);
	};
	return target;
};
let mountElement = function (root, children) {
	children?.forEach((e) => {
		root.appendChild(e);
	});
};
let classOff = function (target, classes) {
	classes.forEach((e) => {
		if (target.classList.contains(e)) {
			target.classList.remove(e);
		};
	});
};
let classOn = function (target, classes) {
	classes.forEach((e) => {
		if (!target.classList.contains(e)) {
			target.classList.add(e);
		};
	});
};

let heightCache = new Array(128).fill(0);
heightCache.forEach((e, i, a) => {
	a[i] = Math.floor(24 * i / 12.7) / 10;
});
let widthCache = new Array(128).fill(0);
widthCache.forEach((e, i, a) => {
	a[i] = Math.abs(Math.round(48 * (i - 64) / 12.7) / 10);
});
let leftCache = new Array(11).fill(null);
leftCache.forEach((e, i, a) => {
	a[i] = `${Math.round(i * 12 / 0.0128) / 100}%`;
});
let setCcSvg = function (svg, value) {
	let hV = heightCache[value];
	svg.setAttribute("height", hV);
	svg.setAttribute("y", 24 - hV);
};

let setCanvasText = function (context, text) {
	context.innerText = text;
	context.rNew = true;
	//context.rOffset = 0;
	let measured = context.measureText(text);
	context.rWidth = measured.width;
};

let Cambiare = class extends RootDisplay {
	#metaMaxLine = 128;
	#metaAmend = false;
	#metaType = "";
	#metaLastLine;
	#metaLastWheel = 0;
	#metaMoveX = 0;
	#metaMoveY = 0;
	#maxPoly = 0;
	#renderRange = 1;
	#renderPort = 0;
	#clockSource;
	#visualizer;
	#container;
	#canvas;
	#sectInfo = {};
	#sectMark = {};
	#sectPart = [];
	#sectMeta = {};
	#scrollMeta(resetTime) {
		let upThis = this;
		if (Date.now() - upThis.#metaLastWheel > 4000) {
			upThis.#metaMoveX = 0;
			upThis.#metaMoveY = 142 - upThis.#sectMeta.view.clientHeight;
			if ((upThis.#metaLastLine?.clientWidth || 0) > 840) {
				upThis.#metaMoveX = 840 - upThis.#metaLastLine.clientWidth;
			};
			upThis.#sectMeta.view.style.transform = `translateX(${upThis.#metaMoveX}px) translateY(${upThis.#metaMoveY}px)`;
			if (resetTime) {
				upThis.#metaLastWheel = 0;
			};
		};
	};
	#resizerSrc() {
		let aspectRatio = self.innerWidth / self.innerHeight;
		let targetZoom = 1;
		let targetWidth = self.innerWidth,
		targetHeight = self.innerHeight;
		if (aspectRatio >= targetRatio) {
			targetZoom = Math.round(self.innerHeight / 1080 * 10000) / 10000;
			targetWidth = Math.ceil(self.innerHeight * targetRatio);
		} else if (aspectRatio < targetRatio) {
			targetZoom = Math.round(self.innerWidth / 1920 * 10000) / 10000;
			targetHeight = Math.ceil(self.innerWidth / targetRatio);
		};
		//console.debug(targetZoom);
		this.#container.style.width = `${targetWidth}px`;
		this.#container.style.height = `${targetHeight}px`;
		this.#canvas.style.transform = `scale(${targetZoom})`;
	};
	#resizer;
	#rendererSrc() {
		let upThis = this,
		clock = upThis.#clockSource?.currentTime || 0,
		sum = upThis.render(clock);
		let curPoly = sum.curPoly + sum.extraPoly;
		if (upThis.#maxPoly < curPoly) {
			upThis.#maxPoly = curPoly;
		};
		upThis.#sectInfo.events.innerText = `${sum.eventCount}`.padStart(3, "0");
		upThis.#sectInfo.curPoly.innerText = `${curPoly}`.padStart(3, "0");
		upThis.#sectInfo.maxPoly.innerText = `${upThis.#maxPoly}`.padStart(3, "0");
		upThis.#sectInfo.barCount.innerText = sum.noteBar + 1;
		upThis.#sectInfo.barNote.innerText = Math.floor(sum.noteBeat) + 1;
		upThis.#scrollMeta(true);
		let renderPortMax = upThis.#renderPort + upThis.#renderRange;
		for (let part = 0; part < allocated.ch; part ++) {
			let port = part >> 4,
			chOff = part * allocated.cc,
			e = upThis.#sectPart[port][part & 15];
			if (sum.chInUse[part] && port >= upThis.#renderPort && port < renderPortMax) {
				setCcSvg(e.vol, sum.chContr[chOff + ccToPos[7]]);
				setCcSvg(e.exp, sum.chContr[chOff + ccToPos[11]]);
				setCcSvg(e.mod, sum.chContr[chOff + ccToPos[1]]);
				setCcSvg(e.rev, sum.chContr[chOff + ccToPos[91]]);
				setCcSvg(e.cho, sum.chContr[chOff + ccToPos[93]]);
				setCcSvg(e.var, sum.chContr[chOff + ccToPos[94]]);
				setCcSvg(e.brt, sum.chContr[chOff + ccToPos[74]]);
				setCcSvg(e.por, sum.chContr[chOff + ccToPos[5]]);
				setCcSvg(e.cea, sum.ace[0] ? sum.chContr[chOff + ccToPos[sum.ace[0]]] : 0);
				setCcSvg(e.ceb, sum.ace[1] ? sum.chContr[chOff + ccToPos[sum.ace[1]]] : 0);
				e.metre.clearRect(0, 0, 121, 25);
				e.metre.globalCompositeOperation = "source-over";
				if (e.metre.rWidth > e.metre.canvas.width) {
					if (e.metre.rNew) {
						e.metre.rNew = false;
						e.metre.rOffset = clock;
					};
					let runCourse = clock - (e.metre.rOffset || 0),
					runPadding = 32,
					runBoundary = e.metre.rWidth - e.metre.canvas.width + runPadding,
					offsetX = (runCourse * -32) % (e.metre.rWidth + runPadding + 48) + 48;
					if (offsetX > 0) {
						offsetX = 0;
					};
					e.metre.fillText(e.metre.innerText, offsetX, 3);
					if (Math.abs(offsetX) > runBoundary) {
						e.metre.fillText(e.metre.innerText, offsetX + e.metre.rWidth + runPadding, 3);
					};
				} else {
					e.metre.fillText(e.metre.innerText, 0, 3);
				};
				e.metre.globalCompositeOperation = "xor";
				e.metre.fillRect(0, 0, sum.strength[part] * 121 / 255, 25);
				let pan = sum.chContr[chOff + ccToPos[10]];
				e.pan.setAttribute("width", `${widthCache[pan] || 0}`);
				if (pan < 64) {
					e.pan.setAttribute("x", `${84 - widthCache[pan]}`);
				} else if (pan > 127) {
					e.pan.setAttribute("x", `60`);
					e.pan.setAttribute("width", `48`);
				} else {
					e.pan.setAttribute("x", `84`);
				};
			};
		};
	};
	#renderer;
	#renderThread;
	setClockSource(clockSource) {
		this.#clockSource = clockSource;
	};
	setMode(mode) {
		let upThis = this;
		classOff(upThis.#canvas, [`cambiare-mode-gm`, `cambiare-mode-xg`, `cambiare-mode-gs`, `cambiare-mode-ns5r`, `cambiare-mode-05rw`, `cambiare-mode-x5d`, `cambiare-mode-k11`, `cambiare-mode-sg`, `cambiare-mode-g2`, `cambiare-mode-mt32`, `cambiare-mode-sd`, `cambiare-mode-krs`, `cambiare-mode-s90es`, `cambiare-mode-motif`]);
		if (mode != "?") {
			classOn(upThis.#canvas, [`cambiare-mode-${mode}`]);
		};
	};
	#setPortView() {
		let upThis = this;
		let range = upThis.#renderRange, port = upThis.#renderPort;
		upThis.#sectPart.forEach((e, i) => {
			if (i >= port && i < (port + range)) {
				classOn(e.root, [`port-active`]);
				let index = i - port;
				let {l, t} = portPos[index * (4 / range)];
				e.root.style.top = `${t}px`;
				e.root.style.left = `${l}px`;
				e.forEach((e, i) => {
					e.root.style.top = `${i * (range > 2 ? 26 : 52)}px`;
				});
			} else {
				classOff(e.root, [`port-active`]);
				e.root.style.top = "";
				e.root.style.left = "";
				e.forEach((e, i) => {
					e.root.style.top = "";
				});
			};
		});
	};
	setPort(port) {
		let upThis = this;
		classOff(upThis.#canvas, [`cambiare-start0`, `cambiare-start1`, `cambiare-start2`, `cambiare-start3`, `cambiare-start4`, `cambiare-start5`, `cambiare-start6`, `cambiare-start7`]);
		classOn(upThis.#canvas, [`cambiare-start${port}`]);
		upThis.#renderPort = port;
		upThis.#setPortView();
	};
	setRange(mode) {
		let upThis = this;
		classOff(upThis.#canvas, [`cambiare-port1`, `cambiare-port2`, `cambiare-port4`, `cambiare-compact`]);
		classOn(upThis.#canvas, [`cambiare-${mode}`]);
		upThis.#renderRange = parseInt(mode.slice(4)) || 1;
		upThis.#setPortView();
	};
	attach(attachElement) {
		let upThis = this;
		upThis.#visualizer = attachElement;
		// Insert a container
		let containerElement = createElement("div", ["cambiare-container"]);
		attachElement.appendChild(containerElement);
		upThis.#container = containerElement;
		// Insert the canvas
		let canvasElement = createElement("div", ["cambiare-canvas", "cambiare-port1", "cambiare-start0"]);
		containerElement.appendChild(canvasElement);
		upThis.#canvas = canvasElement;
		// Start the resizer
		self.addEventListener("resize", upThis.#resizer);
		upThis.#resizer();
		upThis.#renderThread = setInterval(upThis.#renderer, 20);
		// Begin inserting the info section
		upThis.#sectInfo.root = createElement("div", ["sect-info"]);
		upThis.#sectInfo.events = createElement("span", ["field"], {t: 1, l: 0, w: 35, h: 33});
		upThis.#sectInfo.curPoly = createElement("span", ["field"], {t: 1, l: 52, w: 35, h: 33});
		upThis.#sectInfo.maxPoly = createElement("span", ["field"], {t: 1, l: 98, w: 35, h: 33});
		upThis.#sectInfo.sigN = createElement("span", ["field"], {t: 1, l: 194, w: 23, h: 33, a: "right"});
		upThis.#sectInfo.sigD = createElement("span", ["field"], {t: 1, l: 232, w: 23, h: 33});
		upThis.#sectInfo.barCount = createElement("span", ["field"], {t: 1, l: 304, w: 35, h: 33, a: "right"});
		upThis.#sectInfo.barNote = createElement("span", ["field"], {t: 1, l: 354, w: 23, h: 33});
		upThis.#sectInfo.tempo = createElement("span", ["field"], {t: 1, l: 454, w: 64, h: 33, a: "right"});
		upThis.#sectInfo.volume = createElement("span", ["field"], {t: 1, l: 562, w: 63, h: 33, a: "right"});
		upThis.#sectInfo.mode = createElement("span", ["field"], {t: 1, l: 708, w: 152, h: 33});
		upThis.#sectInfo.reverb = createElement("span", ["field"], {t: 1, l: 1000, w: 190, h: 33});
		upThis.#sectInfo.chorus = createElement("span", ["field"], {t: 1, l: 1240, w: 190, h: 33});
		upThis.#sectInfo.delay = createElement("span", ["field"], {t: 1, l: 1475, w: 190, h: 33});
		upThis.#sectInfo.insert = createElement("span", ["field"], {t: 1, l: 1706, w: 190, h: 33});
		upThis.#sectInfo.title = createElement("span", ["field"], {t: 35, l: 50, w: 810, h: 33})
		canvasElement.appendChild(upThis.#sectInfo.root);
		mountElement(upThis.#sectInfo.root, [
			upThis.#sectInfo.events,
			upThis.#sectInfo.curPoly,
			createElement("span", ["field", "field-label"], {t: 1, l: 89, w: 5, h: 33, i: ":"}),
			upThis.#sectInfo.maxPoly,
			createElement("span", ["field", "field-key"], {t: 1, l: 148, w: 41, h: 33, i: "TSig"}),
			upThis.#sectInfo.sigN,
			createElement("span", ["field", "field-label"], {t: 0, l: 221, w: 8, h: 33, i: "/"}),
			upThis.#sectInfo.sigD,
			createElement("span", ["field", "field-key"], {t: 1, l: 268, w: 30, h: 33, i: "Bar"}),
			upThis.#sectInfo.barCount,
			createElement("span", ["field", "field-label"], {t: 0, l: 343, w: 8, h: 33, i: "/"}),
			upThis.#sectInfo.barNote,
			createElement("span", ["field", "field-key"], {t: 1, l: 390, w: 61, h: 33, i: "Tempo", a: "right"}),
			upThis.#sectInfo.tempo,
			createElement("span", ["field", "field-key"], {t: 1, l: 528, w: 29, h: 33, i: "Vol"}),
			upThis.#sectInfo.volume,
			createElement("span", ["field", "field-label"], {t: 1, l: 626, w: 17, h: 33, i: "%"}),
			createElement("span", ["field", "field-key"], {t: 1, l: 652, w: 52, h: 33, i: "Mode"}),
			upThis.#sectInfo.mode,
			createElement("span", ["field", "field-key"], {t: 1, l: 960, w: 34, h: 33, i: "Rev"}),
			upThis.#sectInfo.reverb,
			createElement("span", ["field", "field-key"], {t: 1, l: 1198, w: 36, h: 33, i: "Cho"}),
			upThis.#sectInfo.chorus,
			createElement("span", ["field", "field-key"], {t: 1, l: 1438, w: 31, h: 33, i: "Var"}),
			upThis.#sectInfo.delay,
			createElement("span", ["field", "field-key"], {t: 1, l: 1673, w: 27, h: 33, i: "Ins"}),
			upThis.#sectInfo.insert,
			createElement("span", ["field", "field-key"], {t: 35, l: 0, w: 44, h: 33, i: "Title"}),
			upThis.#sectInfo.title
		]);
		// Begin inserting the marker section
		upThis.#sectMark.root = createElement("div", ["sect-mark"]);
		upThis.#sectMark.left = createElement("div", ["sect-mark-left", "boundary"], {t: 0, l: 0});
		upThis.#sectMark.right = createElement("div", ["sect-mark-right", "boundary"], {t: 0, l: 960});
		canvasElement.appendChild(upThis.#sectMark.root);
		mountElement(upThis.#sectMark.root, [
			upThis.#sectMark.left,
			upThis.#sectMark.right
		]);
		mountElement(upThis.#sectMark.left, [
			createElement("span", ["field", "field-key"], {t: 0, l: 0, w: 26, h: 33, i: "CH"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 30, w: 49, h: 33, i: "Voice"}),
			createElement("span", ["field", "field-key", "mark-send-title"], {t: 2, l: 164, w: 25, h: 18, i: "Send"}),
			createElement("span", ["field", "field-label", "mark-send-param"], {t: 16, l: 146, w: 58, h: 16, i: "VEMRCDBP12", a: "center"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 212, w: 35, h: 33, i: "Pan"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 256, w: 45, h: 33, i: "Note"})
		]);
		mountElement(upThis.#sectMark.right, [
			createElement("span", ["field", "field-key"], {t: 0, l: 0, w: 26, h: 33, i: "CH"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 30, w: 49, h: 33, i: "Voice"}),
			createElement("span", ["field", "field-key", "mark-send-title"], {t: 2, l: 164, w: 25, h: 18, i: "Send"}),
			createElement("span", ["field", "field-label", "mark-send-param"], {t: 16, l: 146, w: 58, h: 16, i: "VEMRCDBP12", a: "center"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 212, w: 35, h: 33, i: "Pan"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 256, w: 45, h: 33, i: "Note"})
		]);
		// Begin inserting the channel section
		upThis.#sectPart.root = createElement("div", ["sect-part"]);
		for (let port = 0; port < (allocated.ch >> 4); port ++) {
			let startCh = port << 4;
			upThis.#sectPart[port] = [];
			upThis.#sectPart[port].root = createElement("div", [`boundary`, `part-port-${port}`]);
			for (let part = 0; part < 16; part ++) {
				let dispPart = (startCh | part) + 1;
				if (dispPart >= 100) {
					dispPart = `${Math.floor(dispPart / 10).toString(16)}${dispPart % 10}`;
				} else {
					dispPart = `${dispPart}`.padStart(2, "0");
				};
				upThis.#sectPart[port][part] = {
					"root": createElement("div", [`boundary`, `part-channel`]),
					"major": createElement("div", [`boundary`, `part-info-major`]),
					"minor": createElement("div", [`boundary`, `part-info-minor`], {t: 26}),
					"keys": createElement("div", [`boundary`, `part-keys`]),
					"notes": createElement("div", [`boundary`, `part-keyboard`]),
					"number": createElement("span", [`field`, `field-label`], {t: 1, w: 18, h: 25, i: dispPart}),
					"voice": createElement("span", [`field`], {l: 22, t: 1, w: 121, h: 25}),
					"metre": createElement("canvas", [`field`]).getContext("2d"),
					"type": createElement("span", [`field`, `field-label`], {t: 1, w: 18, h: 25}),
					"std": createElement("span", [`field`], {l: 22, t: 1, w: 20, h: 25, a: "center"}),
					"msb": createElement("span", [`field`], {l: 48, t: 1, w: 27, h: 25}),
					"prg": createElement("span", [`field`], {l: 81, t: 1, w: 27, h: 25}),
					"lsb": createElement("span", [`field`], {l: 114, t: 1, w: 27, h: 25}),
					"cc": createSVG("svg", {viewBox: "0 0 108 24", width: 108, style: `left: 146px; top: 1px; position: absolute;`}),
					"vol": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 0}),
					"exp": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 6}),
					"mod": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 12}),
					"rev": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 18}),
					"cho": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 24}),
					"var": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 30}),
					"brt": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 36}),
					"por": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 42}),
					"cea": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 48}),
					"ceb": createSVG("rect", {fill: `var(--accent-color)`, width: 4, height: 24, x: 54}),
					"pan": createSVG("rect", {fill: `var(--accent-color)`, width: 0, height: 24, x: 84})
				};
				let e = upThis.#sectPart[port][part];
				leftCache.forEach((e0) => {
					e.notes.appendChild(createElement("span", [`field`, `part-csplit`], {l: e0}));
				});
				e.metre.canvas.width = 121;
				e.metre.canvas.height = 25;
				e.metre.fillStyle = "#fff";
				e.metre.textBaseline = "top";
				e.metre.font = "20px 'PT Sans Narrow'";
				mountElement(e.keys, [
					e.notes
				]);
				mountElement(e.voice, [
					e.metre.canvas
				]);
				mountElement(e.cc, [
					e.vol,
					e.exp,
					e.mod,
					e.rev,
					e.cho,
					e.var,
					e.brt,
					e.por,
					e.cea,
					e.ceb,
					e.pan,
					createSVG("rect", {x: 83, y: 0, width: 1, height: 24, fill: `var(--foreground-color)`})
				]);
				mountElement(e.major, [
					e.number,
					e.voice,
					e.cc
				]);
				mountElement(e.minor, [
					e.type,
					e.std,
					e.msb,
					e.prg,
					e.lsb
				]);
				mountElement(e.root, [
					e.major,
					e.minor,
					e.keys
				]);
				mountElement(upThis.#sectPart[port].root, [
					e.root
				]);
			};
			upThis.#sectPart.root.appendChild(upThis.#sectPart[port].root);
		};
		canvasElement.appendChild(upThis.#sectPart.root);
		// Begin inserting the meta section
		upThis.#sectMeta.root = createElement("div", ["sect-meta"]);
		upThis.#sectMeta.view = createElement("div", ["boundary"]);
		canvasElement.appendChild(upThis.#sectMeta.root);
		upThis.#sectMeta.root.appendChild(upThis.#sectMeta.view);
		// Opportunistic value refreshing
		upThis.addEventListener("mode", (ev) => {
			upThis.#sectInfo.mode.innerText = `${modeNames[ev.data]}`;
			upThis.setMode(ev.data);
		});
		upThis.addEventListener("mastervolume", (ev) => {
			let cramVolume = Math.round(ev.data * 100) / 100;
			upThis.#sectInfo.volume.innerText = `${Math.floor(cramVolume)}.${`${Math.floor((cramVolume % 1) * 100)}`.padStart(2, "0")}`;
		});
		upThis.addEventListener("tempo", (ev) => {
			let cramTempo = Math.round(ev.data * 100);
			upThis.#sectInfo.tempo.innerText = `${Math.floor(cramTempo / 100)}.${`${Math.floor(cramTempo % 100)}`.padStart(2, "0")}`;
		});
		upThis.addEventListener("tsig", (ev) => {
			[upThis.#sectInfo.sigN.innerText, upThis.#sectInfo.sigD.innerText] = ev.data;
		});
		upThis.addEventListener("title", (ev) => {
			upThis.#sectInfo.title.innerText = ev.data || `No Title`;
		});
		upThis.addEventListener("voice", ({data}) => {
			let voice = upThis.getChVoice(data.part),
			target = upThis.#sectPart[data.part >> 4][data.part & 15];
			setCanvasText(target.metre, upThis.getMapped(voice.name));
			target.type.innerText = chTypes[upThis.device.getChType()[data.part]];
			target.std.innerText = voice.standard;
			target.msb.innerText = `${voice.sid[0]}`.padStart(3, "0");
			target.prg.innerText = `${voice.sid[1]}`.padStart(3, "0");
			target.lsb.innerText = `${voice.sid[2]}`.padStart(3, "0");
		});
		upThis.addEventListener("pitch", (ev) => {
			let {part, pitch} = ev.data;
			upThis.#sectPart[part >> 4][part & 15].notes.style.transform = `translateX(${pitch / 1.28}%)`;
		});
		upThis.addEventListener("efxreverb", (ev) => {
			upThis.#sectInfo.reverb.innerText = upThis.getEfx(ev.data);
		});
		upThis.addEventListener("efxchorus", (ev) => {
			upThis.#sectInfo.chorus.innerText = upThis.getEfx(ev.data);
		});
		upThis.addEventListener("efxdelay", (ev) => {
			upThis.#sectInfo.delay.innerText = upThis.getEfx(ev.data);
		});
		upThis.addEventListener("efxinsert0", (ev) => {
			upThis.#sectInfo.insert.innerText = upThis.getEfx(ev.data);
		});
		upThis.addEventListener("partefxtoggle", (ev) => {
			let {part, active} = ev.data;
			([classOff, classOn][active])(upThis.#sectPart[part >> 4][part & 15].number, [
				`part-efx`
			]);
		});
		upThis.addEventListener("channeltoggle", (ev) => {
			let {part, active} = ev.data;
			([classOff, classOn][active])(upThis.#sectPart[part >> 4][part & 15].root, [
				`part-active`
			]);
		});
		upThis.addEventListener("metacommit", (ev) => {
			let meta = ev.data;
			//console.debug(meta);
			if (upThis.#metaAmend && meta.type == upThis.#metaType && upThis.#metaLastLine) {
				// Amend the last line
				switch (meta.type) {
					case "C.Lyrics":
					case "KarLyric":
					case "SGLyrics": {
						mountElement(upThis.#metaLastLine, [
							createElement("span", ["meta-slice"], {i: meta.data})
						]);
						break;
					};
					default: {
						upThis.#metaLastLine.childNodes[0].data += meta.data;
					};
				};
			} else if (meta.data?.length && metaBlocklist.indexOf(meta.type) == -1) {
				// Commit a new line
				let metaLineRoot = createElement("div", ["meta-line"]),
				metaLineType = createElement("span", ["field", "field-key", "meta-type"], {i: metaNames[meta.type] || meta.type});
				if (meta.mask) {
					metaLineType.style.display = "none";
				};
				switch (meta.type) {
					case "C.Lyrics":
					case "KarLyric":
					case "SGLyrics": {
						upThis.#metaLastLine = createElement("span", ["field", "meta-data"]);
						mountElement(upThis.#metaLastLine, [
							createElement("span", ["meta-slice"], {i: meta.data})
						]);
						break;
					};
					default: {
						upThis.#metaLastLine = createElement("span", ["field", "meta-data"], {i: meta.data});
					};
				};
				upThis.#sectMeta.view.appendChild(metaLineRoot);
				mountElement(metaLineRoot, [
					metaLineType,
					upThis.#metaLastLine
				]);
				while (upThis.#sectMeta.view.children.length > upThis.#metaMaxLine) {
					upThis.#sectMeta.view.children[0].remove();
				};
			};
			upThis.#metaAmend = meta.amend || false;
			upThis.#metaType = meta.type || "";
			upThis.#scrollMeta();
		});
		upThis.#sectMeta.view.style.transform = `translateX(0px) translateY(140px)`;
		upThis.dispatchEvent("mode", "?");
		upThis.dispatchEvent("mastervolume", 100);
		upThis.dispatchEvent("tempo", 120);
		upThis.dispatchEvent("tsig", [4, 4]);
		upThis.dispatchEvent("title", "");
		upThis.dispatchEvent(`efxreverb`, upThis.device.getEffectType(0));
		upThis.dispatchEvent(`efxchorus`, upThis.device.getEffectType(1));
		upThis.dispatchEvent(`efxdelay`, upThis.device.getEffectType(2));
		upThis.dispatchEvent(`efxinsert0`, upThis.device.getEffectType(3));
		upThis.#setPortView();
	};
	detach(attachElement) {
		let upThis = this;
		self.removeEventListener("resize", upThis.#resizer);
		upThis.#canvas.remove();
		upThis.#canvas = undefined;
		upThis.#container.remove();
		upThis.#container = undefined;
		upThis.#visualizer = undefined;
		clearInterval(upThis.#renderThread);
	};
	constructor(attachElement, clockSource) {
		super(new OctaviaDevice, 0.1, 0.75);
		let upThis = this;
		upThis.#resizer = upThis.#resizerSrc.bind(this);
		upThis.#renderer = upThis.#rendererSrc.bind(this);
		if (attachElement) {
			upThis.attach(attachElement);
		};
		if (clockSource) {
			upThis.setClockSource(clockSource);
		};
		upThis.addEventListener("reset", () => {
			upThis.#maxPoly = 0;
			upThis.#metaAmend = false;
			upThis.#metaType = "";
			upThis.#metaLastLine = null;
			try {
				// Remove all meta
				let list = upThis.#sectMeta.view.children;
				for (let pointer = list.length - 1; pointer >= 0; pointer --) {
					list[pointer].remove();
				};
				upThis.#sectMeta.view.style.transform = `translateX(0px) translateY(140px)`;
				// Reset channels
				for (let part = 0; part < allocated.ch; part ++) {
					let e = upThis.#sectPart[part >> 4][part & 15];
					classOff(e.root, [
						`part-active`
					]);
					classOff(e.number, [
						`part-efx`
					]);
					setCanvasText(e.metre, "");
					e.type.innerText = "";
					e.std.innerText = "";
					e.msb.innerText = "";
					e.prg.innerText = "";
					e.lsb.innerText = "";
					e.notes.style.transform = "";
				};
			} catch (err) {};
		});
	};
};

export {
	Cambiare
};
