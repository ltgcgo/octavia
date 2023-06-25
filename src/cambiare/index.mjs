"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {RootDisplay} from "../basic/index.mjs";

const targetRatio = 16 / 9;

let Cambiare = class extends RootDisplay {
	#visualizer;
	#container;
	#canvas;
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
	#rendererSrc() {};
	#renderer;
	#renderThread;
	attach(attachElement) {
		this.#visualizer = attachElement;
		let containerElement = document.createElement("div");
		containerElement.classList.add("cambiare-container");
		attachElement.appendChild(containerElement);
		this.#container = containerElement;
		let canvasElement = document.createElement("div");
		canvasElement.classList.add("cambiare-canvas");
		containerElement.appendChild(canvasElement);
		this.#canvas = canvasElement;
		self.addEventListener("resize", this.#resizer);
		this.#resizer();
		this.#renderThread = setInterval(this.#renderer, 20);
	};
	detach(attachElement) {
		self.removeEventListener("resize", this.#resizer);
		this.#canvas.remove();
		this.#canvas = undefined;
		this.#container.remove();
		this.#container = undefined;
		this.#visualizer = undefined;
		clearInterval(this.#renderThread);
	};
	constructor(attachElement) {
		super(new OctaviaDevice, 0.1, 0.75);
		this.#resizer = this.#resizerSrc.bind(this);
		this.#renderer = this.#rendererSrc.bind(this);
		if (attachElement) {
			this.attach(attachElement);
		};
	};
};

export {
	Cambiare
};
