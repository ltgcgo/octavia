"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

const blobProps = JSON.parse(`{"id":"binaryOpener","description":"Open a binary file"}`);
const byteUnits = "B,KiB,MiB,GiB,TiB".split(",");
const readPageSizeBL = 15, readPageSize = 1 << readPageSizeBL;

const naturalizeBytes = (size) => {
	let targetLevel = Math.floor(Math.log2(size) / 10 + 0.105);
	let divisor = 1 << (10 * targetLevel);
	let shifted = Math.round(size / divisor * 1000).toString().padStart(4, "0");
	return `${shifted.slice(0, shifted.length - 3)}.${shifted.slice(shifted.length - 3)} ${byteUnits[targetLevel]}`;
};
const readBytePage = async (blob, intended) => {
	if (!blob?.size > 0) {
		throw(new Error(`No valid blob supplied.`));
	};
	let realOffset = (intended >> readPageSizeBL) << readPageSizeBL;
	if (realOffset >= readPageSize && blob.size - realOffset < readPageSize) {
		realOffset -= readPageSize;
	};
	if (realOffset < 0) {
		realOffset = 0;
	};
	let targetEnd = realOffset + (readPageSize << 1);
	if (targetEnd > blob.size) {
		targetEnd = blob.size;
	};
	let buffer = await blob.slice(realOffset, targetEnd).bytes();
	buffer.realOffset = realOffset;
	return buffer;
};

let loadedBlob, loadedPage;
let lg_qlb = 0;
const queryLoadedBuffer = async (offset, size) => {
	if (lg_qlb > 2) {
		throw(new Error(`Entered infinite loop.`));
	};
	//lg_qlb ++;
	let blob = loadedBlob;
	if (!blob?.size > 0) {
		return;
		throw(new Error(`No valid blob supplied.`));
	};
	if (offset < 0 || offset >= blob.size) {
		throw(new RangeError(`No valid offset specified.`));
	};
	if (size < 0 || size >= readPageSize) {
		throw(new RangeError(`No valid size specified.`));
	};
	let readOffset = 0, readSize = 0;
	if (!loadedPage) {
		console.debug(`Initialized blob page read.`);
		loadedPage = await readBytePage(loadedBlob, offset);
	};
	if (loadedPage?.length >= 0) {
		readOffset = loadedPage.realOffset;
		readSize = loadedPage.length;
	};
	let boundHigh = readOffset + readSize;
	if (offset < readOffset || (offset + size) > boundHigh) {
		loadedPage = await readBytePage(loadedBlob, offset);
		readOffset = loadedPage.realOffset;
		readSize = loadedPage.length;
		console.debug(`Queried a new blob page read: ${offset} (${readOffset}), ${size} (${readSize}).`);
	};
	let shiftedOffset = offset - readOffset;
	return loadedPage.subarray(shiftedOffset, shiftedOffset + size);
};

const elements = {
	"offset": $e("#binOffset"),
	"width": $e("#binWidth"),
	"height": $e("#binHeight"),
	"stretch": $e("#binStretch"),
	"canvas": $e("canvas"),
	"hexCode": $e("#result")
};
const canvasContext = elements.canvas.getContext("2d");
const pixelColour = ["#0001", "#000a"];
$e("#openImage").addEventListener("mouseup", async function () {
	let candidate = await fileOpen(blobProps);
	if (candidate?.size > 0) {
		loadedBlob = candidate;
		$e("#binFileSize").innerText = loadedBlob.size;
		$e("#binNaturalSize").innerText = naturalizeBytes(loadedBlob.size);
	};
});

document.addEventListener("keydown", (ev) => {
	if (ev.target === document.body) {
		switch (ev.key) {
			case "ArrowLeft": {
				elements.offset.value = parseInt(elements.offset.value) - 1;
				break;
			};
			case "ArrowRight": {
				elements.offset.value = parseInt(elements.offset.value) + 1;
				break;
			};
			case "ArrowUp": {
				elements.offset.value = parseInt(elements.offset.value) - 32;
				break;
			};
			case "ArrowDown": {
				elements.offset.value = parseInt(elements.offset.value) + 32;
				break;
			};
			case "PageUp": {
				elements.offset.value = parseInt(elements.offset.value) - 256;
				break;
			};
			case "PageDown": {
				elements.offset.value = parseInt(elements.offset.value) + 256;
				break;
			};
		};
	};
});

let drawBuffer, lastOffset;
self.renderThread = setInterval(async () => {
	// Sanitize
	let bufOffset = parseInt(elements.offset.value),
	bufWidth = parseInt(elements.width.value),
	bufHeight = parseInt(elements.height.value);
	if (bufOffset < 0 || bufOffset >= (loadedBlob?.size ?? 1)) {
		bufOffset = 0;
		elements.offset.value = bufOffset;
	};
	if (bufWidth < 0 || bufWidth > 64) {
		bufWidth = 16;
		elements.width.value = bufWidth;
	};
	if (bufHeight < 0 || bufHeight > 64) {
		bufHeight = 16;
		elements.height.value = bufHeight;
	};
	let bufSize = bufWidth * bufHeight,
	canvasWidth = bufWidth << 2,
	canvasHeight = bufHeight << 2;
	if (drawBuffer?.length !== bufSize) {
		drawBuffer = new Uint8Array(bufSize);
	};
	if (elements.stretch.checked) {
		canvasWidth <<= 1;
	};
	canvasWidth ++;
	canvasHeight ++;
	// Render
	if (elements.canvas.width !== canvasWidth) {
		elements.canvas.width = canvasWidth;
	};
	if (elements.canvas.height !== canvasHeight) {
		elements.canvas.height = canvasHeight;
	};
	canvasContext.fillStyle = "#c1ff0a";
	canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
	let queriedBuffer = await queryLoadedBuffer(bufOffset, bufSize >> 3);
	if (queriedBuffer?.length) {
		//console.debug(queriedBuffer.join(", "));
		for (let i = 0; i < bufSize; i ++) {
			if ((i >> 3) < queriedBuffer.length) {
				drawBuffer[i] = (queriedBuffer[i >> 3] >> (7 - (i & 7))) & 1;
			} else {
				drawBuffer[i] = 0;
			};
		};
	};
	for (let i = 0; i < bufSize; i ++) {
		let x = i % bufWidth, y = Math.floor(i / bufWidth);
		let ax = x << 2, ay = y << 2;
		if (elements.stretch.checked) {
			ax <<= 1;
		};
		ax ++;
		ay ++;
		canvasContext.fillStyle = pixelColour[drawBuffer[i] ? 1 : 0];
		canvasContext.fillRect(ax, ay, elements.stretch.checked ? 7 : 3, 3);
	};
	if (bufOffset !== lastOffset) {
		let hexCodes = [];
		for (let byte of queriedBuffer) {
			hexCodes.push(byte.toString(16).padStart(2, "0"));
		};
		elements.hexCode.innerText = `${bufWidth.toString(16).padStart(4, "0")}${bufHeight.toString(16).padStart(4, "0")}${hexCodes.join("")}`;
		lastOffset = bufOffset;
	};
	//console.debug(drawBuffer.join(", "));
}, 1000/50);
