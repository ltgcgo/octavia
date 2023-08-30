"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {RootDisplay} from "../basic/index.mjs";

const targetRatio = 16 / 9;

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
	i?.constructor && (target.innerText = i);
	a?.constructor && (target.style.textAlign = a);
	return target;
};
let mountElement = function (root, children) {
	children?.forEach((e) => {
		root.appendChild(e);
	});
};

let Cambiare = class extends RootDisplay {
	#maxPoly = 0;
	#clockSource;
	#visualizer;
	#container;
	#canvas;
	#sectInfo = {};
	#sectMark = {};
	#sectPart = {};
	#sectMeta = {};
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
		let cramTempo = Math.round(sum.tempo * 100) / 100;
		let cramVolume = Math.round(sum.master.volume * 100) / 100;
		upThis.#sectInfo.events.innerText = `${sum.eventCount}`.padStart(3, "0");
		upThis.#sectInfo.curPoly.innerText = `${curPoly}`.padStart(3, "0");
		upThis.#sectInfo.maxPoly.innerText = `${upThis.#maxPoly}`.padStart(3, "0");
		[upThis.#sectInfo.sigN.innerText, upThis.#sectInfo.sigD.innerText] = sum.tSig;
		upThis.#sectInfo.barCount.innerText = sum.noteBar + 1;
		upThis.#sectInfo.barNote.innerText = Math.floor(sum.noteBeat) + 1;
		upThis.#sectInfo.tempo.innerText = `${Math.floor(cramTempo)}.${`${(cramTempo % 1) * 100}`.padStart(2, "0")}`;
		upThis.#sectInfo.volume.innerText = `${Math.floor(cramVolume)}.${`${Math.floor((cramVolume % 1) * 100)}`.padStart(2, "0")}`;
	};
	#renderer;
	#renderThread;
	setClockSource(clockSource) {
		this.#clockSource = clockSource;
	};
	attach(attachElement) {
		let upThis = this;
		upThis.#visualizer = attachElement;
		// Insert a container
		let containerElement = createElement("div", ["cambiare-container"]);
		attachElement.appendChild(containerElement);
		upThis.#container = containerElement;
		// Insert the canvas
		let canvasElement = createElement("div", ["cambiare-canvas"]);
		containerElement.appendChild(canvasElement);
		upThis.#canvas = canvasElement;
		// Start the resizer
		self.addEventListener("resize", upThis.#resizer);
		upThis.#resizer();
		upThis.#renderThread = setInterval(upThis.#renderer, 20);
		// Begin inserting the info section
		upThis.#sectInfo.root = createElement("div", ["sect-info"]);
		upThis.#sectInfo.events = createElement("span", ["field"], {t: 0, l: 0, w: 35, h: 33});
		upThis.#sectInfo.curPoly = createElement("span", ["field"], {t: 0, l: 52, w: 35, h: 33});
		upThis.#sectInfo.maxPoly = createElement("span", ["field"], {t: 0, l: 98, w: 35, h: 33});
		upThis.#sectInfo.sigN = createElement("span", ["field"], {t: 0, l: 194, w: 23, h: 33, a: "right"});
		upThis.#sectInfo.sigD = createElement("span", ["field"], {t: 0, l: 232, w: 23, h: 33});
		upThis.#sectInfo.barCount = createElement("span", ["field"], {t: 0, l: 304, w: 35, h: 33, a: "right"});
		upThis.#sectInfo.barNote = createElement("span", ["field"], {t: 0, l: 354, w: 23, h: 33});
		upThis.#sectInfo.tempo = createElement("span", ["field"], {t: 0, l: 454, w: 64, h: 33});
		upThis.#sectInfo.volume = createElement("span", ["field"], {t: 0, l: 562, w: 63, h: 33, a: "right"});
		canvasElement.appendChild(upThis.#sectInfo.root);
		mountElement(upThis.#sectInfo.root, [
			upThis.#sectInfo.events,
			upThis.#sectInfo.curPoly,
			createElement("span", ["field", "field-label"], {t: 0, l: 89, w: 5, h: 33, i: ":"}),
			upThis.#sectInfo.maxPoly,
			createElement("span", ["field", "field-key"], {t: 0, l: 148, w: 41, h: 33, i: "TSig"}),
			upThis.#sectInfo.sigN,
			createElement("span", ["field", "field-label"], {t: 0, l: 221, w: 8, h: 33, i: "/"}),
			upThis.#sectInfo.sigD,
			createElement("span", ["field", "field-key"], {t: 0, l: 268, w: 30, h: 33, i: "Bar"}),
			upThis.#sectInfo.barCount,
			createElement("span", ["field", "field-label"], {t: 0, l: 343, w: 8, h: 33, i: "/"}),
			upThis.#sectInfo.barNote,
			createElement("span", ["field", "field-key"], {t: 0, l: 390, w: 61, h: 33, i: "Tempo", a: "right"}),
			upThis.#sectInfo.tempo,
			createElement("span", ["field", "field-key"], {t: 0, l: 528, w: 29, h: 33, i: "Vol"}),
			upThis.#sectInfo.volume,
			createElement("span", ["field", "field-label"], {t: 0, l: 626, w: 17, h: 33, i: "%"})
		]);
		// Begin inserting the marker section
		upThis.#sectMark.root = createElement("div", ["sect-mark"]);
		canvasElement.appendChild(upThis.#sectMark.root);
		// Begin inserting the channel section
		upThis.#sectPart.root = createElement("div", ["sect-part"]);
		canvasElement.appendChild(upThis.#sectPart.root);
		// Begin inserting the meta section
		upThis.#sectMeta.root = createElement("div", ["sect-meta"]);
		canvasElement.appendChild(upThis.#sectMeta.root);
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
		});
	};
};

export {
	Cambiare
};
