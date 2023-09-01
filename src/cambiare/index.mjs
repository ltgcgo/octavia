"use strict";

import {OctaviaDevice, allocated} from "../state/index.mjs";
import {RootDisplay} from "../basic/index.mjs";

const targetRatio = 16 / 9;
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
	t?.constructor && (target.style.top = `${t}px`);
	l?.constructor && (target.style.left = `${l}px`);
	w?.constructor && (target.style.width = `${w}px`);
	h?.constructor && (target.style.height = `${h}px`);
	i?.constructor && (target.appendChild(document.createTextNode(i)));
	a?.constructor && (target.style.textAlign = a);
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
			upThis.#metaMoveY = 140 - upThis.#sectMeta.view.clientHeight;
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
		if (aspectRatio > targetRatio) {
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
		sum = upThis.render(upThis.#clockSource?.currentTime || 0);
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
		let canvasElement = createElement("div", ["cambiare-canvas", "cambiare-port1", "cambiare-start0", "debug"]);
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
			createElement("span", ["field", "field-key"], {t: 0, l: 214, w: 35, h: 33, i: "Pan"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 256, w: 45, h: 33, i: "Note"})
		]);
		mountElement(upThis.#sectMark.right, [
			createElement("span", ["field", "field-key"], {t: 0, l: 0, w: 26, h: 33, i: "CH"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 30, w: 49, h: 33, i: "Voice"}),
			createElement("span", ["field", "field-key", "mark-send-title"], {t: 2, l: 164, w: 25, h: 18, i: "Send"}),
			createElement("span", ["field", "field-label", "mark-send-param"], {t: 16, l: 146, w: 58, h: 16, i: "VEMRCDBP12", a: "center"}),
			createElement("span", ["field", "field-key"], {t: 0, l: 214, w: 35, h: 33, i: "Pan"}),
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
					"vol": createElement("span", [`field`, `part-cc`], {l: 146}),
					"exp": createElement("span", [`field`, `part-cc`], {l: 152}),
					"mod": createElement("span", [`field`, `part-cc`], {l: 158}),
					"rev": createElement("span", [`field`, `part-cc`], {l: 164}),
					"cho": createElement("span", [`field`, `part-cc`], {l: 170}),
					"var": createElement("span", [`field`, `part-cc`], {l: 176}),
					"brt": createElement("span", [`field`, `part-cc`], {l: 182}),
					"por": createElement("span", [`field`, `part-cc`], {l: 188}),
					"cea": createElement("span", [`field`, `part-cc`], {l: 194}),
					"ceb": createElement("span", [`field`, `part-cc`], {l: 200})
				};
				mountElement(upThis.#sectPart[port][part].keys, [
					upThis.#sectPart[port][part].notes
				]);
				mountElement(upThis.#sectPart[port][part].major, [
					upThis.#sectPart[port][part].number,
					upThis.#sectPart[port][part].voice,
					upThis.#sectPart[port][part].vol,
					upThis.#sectPart[port][part].exp,
					upThis.#sectPart[port][part].mod,
					upThis.#sectPart[port][part].rev,
					upThis.#sectPart[port][part].cho,
					upThis.#sectPart[port][part].var,
					upThis.#sectPart[port][part].brt,
					upThis.#sectPart[port][part].por,
					upThis.#sectPart[port][part].cea,
					upThis.#sectPart[port][part].ceb
				]);
				mountElement(upThis.#sectPart[port][part].root, [
					upThis.#sectPart[port][part].major,
					upThis.#sectPart[port][part].minor,
					upThis.#sectPart[port][part].keys
				]);
				mountElement(upThis.#sectPart[port].root, [
					upThis.#sectPart[port][part].root
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
					classOff(upThis.#sectPart[part >> 4][part & 15].root, [
						`part-active`
					]);
				};
			} catch (err) {};
		});
	};
};

export {
	Cambiare
};
