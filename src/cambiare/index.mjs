"use strict";

import {RootDisplay} from "../basic/index.mjs";
import {OctaviaDevice, ccToPos} from "../state/index.mjs";

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
		return Math.ceil(2 * devicePixelRatio);
	};
	resizeCanvas(width, height) {
		this.context.canvas.width = width;
		this.context.canvas.height = height;
		for (let mode = 0; mode < 3; mode ++) {
			this.#lineHeights[mode] = Math.floor(height / [24, 24, 40][mode]);
			this.#noteHeights[mode] = Math.floor(height / [48, 48, 80][mode]);
			this.#noteWidths[mode] = Math.floor(width / ([104, 208, 208][mode] + 32));
			this.#noteRegW[mode] = Math.floor(width / ([104, 208, 208][mode] + 32) * 7);
			for (let key = 0; key < 12; key ++) {
				this.noteLefts[mode][key] = Math.round(this.#noteWidths[mode] * [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6][key]);
			};
		};
	};
	drawNote(part, note, velo, state) {
		let context = this.context;
		//let startX = (data.note + (data.part >> (this.mode > 1 ? 5 : 4) << 7)) * this.noteWidth;
		let startX = Math.floor(2 + note / 12) * this.noteRegW + this.noteLefts[this.mode][note % 12] + 14 * this.noteWidth + (context.canvas.width >> 1) * (part >> (this.mode > 1 ? 5 : 4)) + (this.device.getPitchShift(part) / 12) * this.noteRegW;
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
		context = this.context,
		timeNow = Date.now();
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
		context.fillText(`${sum.eventCount.toString().padStart(3, "0")} ${(sum.curPoly + sum.extraPoly).toString().padStart(3, "0")}/512 ${sum.tSig[0].toString().padStart(2, " ")}/${sum.tSig[1].toString().padEnd(2, " ")} ${sum.tSig[0].toString().padStart(2, " ")}/${sum.tSig[1].toString().padEnd(2, " ")} ${(sum.noteBar + 1).toString().padStart(3, " ")}-${Math.floor(sum.noteBeat + 1).toString().padEnd(2, " ")} ${Math.floor(sum.tempo).toString().padStart(3, " ")}.${Math.floor(sum.tempo * 100 % 100).toString().padStart(2, "0")}bpm ${Math.floor(sum.master.volume).toString().padStart(3, " ")}.${Math.floor(sum.master.volume * 100 % 100).toString().padStart(2, "0")}%`, upThis.fontPadding + fontLeft, fontTop + upThis.fontPadding);
		// Key press section
		// Use available states
		sum.chKeyPr.forEach((e, part) => {
			e.forEach((e, note) => {
				let minPart = upThis.startPort << 4,
				maxPart = (upThis.startPort << 4) + (16 << upThis.mode);
				if (part >= minPart && part < maxPart) {
					upThis.drawNote(part - minPart, note, e.v, e.s);
				};
			});
		});
		// Also show hidden notes
		upThis.eventQueue.forEach((e) => {
			let minPart = upThis.startPort << 4,
			maxPart = (upThis.startPort << 4) + (16 << upThis.mode);
			if (e.part >= minPart && e.part < maxPart) {
				upThis.drawNote(e.part, e.note, e.velo, e.state);
			};
		});
		context.fillStyle = "#fff";
		for (let part = 0; part < (16 << upThis.mode); part ++) {
			let ch = part + (upThis.startPort << 4);
			if (sum.chInUse[ch]) {
				let lineTop = 2 + fontTop + upThis.fontPadding + upThis.lineHeight * (3 + (part % (this.mode > 1 ? 32 : 16)));
				// Channel voices
				let voice = upThis.device.getChVoice(ch);
				context.fillText(`${ch + 1}`.padStart(2, "0"), upThis.fontPadding + fontLeft + (part >> (this.mode > 1 ? 5 : 4)) * (context.canvas.width >> 1), lineTop, upThis.noteWidth * 2.5);
				context.fillText(voice.name, upThis.fontPadding + fontLeft + (part >> (this.mode > 1 ? 5 : 4)) * (context.canvas.width >> 1) + upThis.noteWidth * 3, lineTop, upThis.noteWidth * 13);
				// Params
				let chOff = ccToPos.length * ch;
				[7, 11, 1, 91, 93, 94, 74, 5, 12, 13].forEach((e, i) => {
					context.fillRect(upThis.fontPadding * 2 + upThis.noteWidth * (16 + i) + (part >> (this.mode > 1 ? 5 : 4)) * (context.canvas.width >> 1), upThis.lineHeight * (4 + (part % (this.mode > 1 ? 32 : 16))), upThis.noteWidth - upThis.noteOutline, (upThis.lineHeight - 1) * (sum.chContr[chOff + ccToPos[e]] / -127));
				});
			};
		};
		// Letter display
		if (sum.letter.expire <= timeNow) {
			//context.fillText(voice.name, upThis.fontPadding + fontLeft + (part >> (this.mode > 1 ? 5 : 4)) * (context.canvas.width >> 1), 2 + fontTop + upThis.fontPadding + upThis.lineHeight * (3 + (part % (this.mode > 1 ? 32 : 16))), upThis.noteWidth * 8);
		};
		// Bitmap display
		// Draw strength metres
		context.globalCompositeOperation = "xor";
		context.fillStyle = "#fff";
		for (let part = 0; part < (16 << upThis.mode); part ++) {
			let ch = part + (upThis.startPort << 4);
			context.fillRect(upThis.fontPadding + (part >> (this.mode > 1 ? 5 : 4)) * (context.canvas.width >> 1), upThis.lineHeight * (3 + (part % (this.mode > 1 ? 32 : 16))), upThis.noteWidth * 16 * (sum.strength[ch] / 255), (upThis.lineHeight - 1));
		};
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
