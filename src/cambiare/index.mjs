"use strict";

import {RootDisplay} from "../basic/index.mjs";
import {OctaviaDevice} from "../state/index.mjs";

let Cambiare = class Cambiare extends RootDisplay {
	context;
	mode = 0;
	startPort = 0;
	fontPadding = 4;
	#lineHeights = [];
	#noteWidths = [];
	#noteHeights = [];
	#noteRegW = [];
	noteTops = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
	noteLefts = [[], [], []];
	eventBuffer = {}; // Track if there are hidden notes
	eventQueue = []; // Add back hidden notes
	get lineHeight() {
		return this.#lineHeights[this.mode];
	};
	get noteWidth() {
		return this.#noteWidths[this.mode];
	};
	get noteHeight() {
		return this.#noteHeights[this.mode];
	};
	get noteRegW() {
		return this.#noteRegW[this.mode];
	};
	get noteOutline() {
		return Math.ceil(devicePixelRatio);
	};
	resizeCanvas(width, height) {
		this.context.canvas.width = width;
		this.context.canvas.height = height;
		for (let mode = 0; mode < 3; mode ++) {
			this.#lineHeights[mode] = Math.floor(height / [24, 24, 40][mode]);
			this.#noteHeights[mode] = Math.floor(height / [48, 48, 80][mode]);
			this.#noteWidths[mode] = Math.floor(width / ([75, 150, 150][mode] + 28 + 12));
			this.#noteRegW[mode] = Math.floor(width / ([75, 150, 150][mode] + 28 + 12) * 7);
			for (let key = 0; key < 12; key ++) {
				this.noteLefts[mode][key] = Math.round(this.#noteWidths[mode] * [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6][key]);
			};
		};
	};
	drawNote(part, note, velo, state) {
		let context = this.context;
		//let startX = (data.note + (data.part >> (this.mode > 1 ? 5 : 4) << 7)) * this.noteWidth;
		let startX = Math.floor(2 + note / 12) * this.noteRegW + this.noteLefts[this.mode][note % 12] + 101 * (part >> (this.mode > 1 ? 5 : 4)) * this.noteWidth + (this.device.getPitchShift(part) / 12) * this.noteRegW;
		let startY = (3 + part % (this.mode > 1 ? 32 : 16)) * this.lineHeight + this.noteTops[note % 12] * this.noteHeight;
		if (velo > 0) {
			context.fillStyle = `#ffffff${(velo * 2).toString(16).padStart(2, "0")}`;
			context.fillRect(startX + 1, startY + 1, this.noteWidth - 2, this.noteHeight - 2);
			switch (state) {
				case this.device.NOTE_HELD:
				case this.device.NOTE_SOSTENUTO_HELD: {
					context.clearRect(startX + 1 + this.noteOutline, startY + 1 + this.noteOutline, this.noteWidth - 2 * (1 + this.noteOutline), this.noteHeight - 2 * (1 + this.noteOutline));
					break;
				};
			};
		};
	};
	render(time) {
		let sum = super.render(time),
		upThis = this,
		context = this.context;
		// Global reset
		context.globalCompositeOperation = "source-over";
		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		// Set font size and get font metrics
		context.font = `${this.lineHeight - this.fontPadding * 2}px "Noto Sans Mono", "Noto Sans Mono Web", mono`;
		self.metrics = context.measureText("Op");
		let fontLeft = metrics.actualBoundingBoxLeft,
		fontTop = metrics.actualBoundingBoxAscent;
		// Information section
		context.fillStyle = "#fff";
		context.fillText(`${sum.eventCount}`.padStart(3, "0"), upThis.fontPadding + fontLeft, fontTop + upThis.fontPadding); // Event count
		// Key press section
		// Use available states
		sum.chKeyPr.forEach((e, part) => {
			e.forEach((e, note) => {
				upThis.drawNote(part, note, e.v, e.s);
			});
		});
		// Also show hidden notes
		upThis.eventQueue.forEach((e) => {
			upThis.drawNote(e.part, e.note, e.velo, e.state);
		});
		// Channel voices
		context.fillStyle = "#fff";
		for (let part = 0; part < (16 << upThis.mode); part ++) {
			let ch = part + (upThis.startPort << 4);
			if (sum.chInUse[part]) {
				let voice = upThis.device.getChVoice(ch);
				context.fillText(voice.name, upThis.fontPadding + fontLeft + (part >> (this.mode > 1 ? 5 : 4)) * (context.canvas.width >> 1), 2 + fontTop + upThis.fontPadding + upThis.lineHeight * (3 + (part % (this.mode > 1 ? 32 : 16))));
			};
		};
		// Letter display
		// Bitmap display
		// Draw strength metres
		context.globalCompositeOperation = "xor";
		// Clean event buffer up
		for (let rawNote in upThis.eventBuffer) {
			delete upThis.eventBuffer[rawNote];
		};
		// Clean event queue up
		while (upThis.eventQueue.length > 0) {
			delete upThis.eventQueue[0];
			upThis.eventQueue.shift();
		};
	};
	constructor(context) {
		super(new OctaviaDevice(), 0, 0.75);
		let upThis = this;
		this.context = context;
		this.resizeCanvas(1280, 720);
		this.device.addEventListener("note", (ev) => {
			let data = ev.data;
			let noteId = data.part * 128 + data.note;
			let oldEvent = this.eventBuffer[noteId];
			this.eventBuffer[noteId] = data;
			// Schedule a hidden note in event queue
			if (oldEvent?.velo > 0 && data.velo == 0) {
				this.eventQueue.push(oldEvent);
			};
		});
	};
};

export default Cambiare;
