"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

const propsImg = JSON.parse(`{"extensions":[".png",".PNG",".jpg",".JPG",".jpeg",".JPEG",".webp",".WEBP",".WebP"],"startIn":"pictures","id":"imageOpener","description":"Open an image file"}`);

let imageShow = $e("#imgShow");
let canvas = $e("canvas"), context = canvas.getContext("2d");

let eX = $e("#cutX"),
eY = $e("#cutY"),
eW = $e("#cutWidth"),
eH = $e("#cutHeight");
let cutX = 0, cutY = 0, cutWidth = 5, cutHeight = 8;
let cutXMax = 0, cutYMax = 0;
let floatyCursor = $e("#floatyCursor");

let updateConstraint = () => {
	cutXMax = Math.max(0, imageShow.width - cutWidth);
	cutYMax = Math.max(0, imageShow.height - cutHeight)
	eX.max = `${cutXMax}`;
	eY.max = `${cutYMax}`;
};
let updateDraw = () => {
	canvas.width = cutWidth;
	canvas.height = cutHeight;
	context.clearRect(0, 0, cutWidth, cutHeight);
	context.drawImage(imageShow, cutX, cutY, cutWidth, cutHeight, 0, 0, cutWidth, cutHeight);
	floatyCursor.style.top = `${imageShow.offsetTop + cutY}px`;
	floatyCursor.style.left = `${imageShow.offsetLeft + cutX}px`;
	floatyCursor.style.width = `${cutWidth}px`;
	floatyCursor.style.height = `${cutHeight}px`;
};
let canvasToBitmap = async (context) => {
	let imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
	let hexString = imageData.width.toString(16).padStart(4, "0");
	hexString += imageData.height.toString(16).padStart(4, "0");
	let hexBuffer = 0, hexPointer = 0;
	for (let i = 0; i < imageData.data.length >> 2; i ++) {
		let e = imageData.data[i << 2];
		hexBuffer |= +(e < 16) << (3 - (i & 3));
		hexPointer ++;
		if (!(hexPointer & 3)) {
			hexString += "0123456789abcdef"[hexBuffer];
			hexBuffer = 0;
			hexPointer = 0;
		};
	};
	if (hexPointer) {
		hexString += "0123456789abcdef"[hexBuffer];
	};
	return hexString;
};

let blobUrl;
$e("#openImage").addEventListener("click", async () => {
	let imageFile = await fileOpen(propsImg);
	imageShow.src = "";
	if (blobUrl) {
		URL.revokeObjectURL(blobUrl);
	};
	blobUrl = URL.createObjectURL(imageFile);
	imageShow.src = blobUrl;
});
let convertImage = async () => {
	$e("#result").innerText = await canvasToBitmap(context);
};
$e("#convertImage").addEventListener("click", convertImage);
imageShow.addEventListener("load", () => {
	updateConstraint();
	updateDraw();
});
cutX = eX.value || 0;
cutY = eY.value || 0;
cutWidth = eW.value || 5;
cutHeight = eH.value || 8;
eX.onchange = function () {
	cutX = this.value;
	updateDraw();
};
eY.onchange = function () {
	cutY = this.value;
	updateDraw();
};
eW.onchange = function () {
	cutWidth = this.value;
	updateConstraint();
	updateDraw();
};
eH.onchange = function () {
	cutHeight = this.value;
	updateConstraint();
	updateDraw();
};
document.body.addEventListener("keydown", async (ev) => {
	let {key} = ev;
	let stopIt = true;
	switch(key) {
		case "ArrowUp": {
			cutY = Math.max(0, cutY - 1);
			updateDraw();
			break;
		};
		case "ArrowDown": {
			cutY = Math.min(cutYMax, cutY + 1);
			updateDraw();
			break;
		};
		case "ArrowLeft": {
			cutX = Math.max(0, cutX - 1);
			updateDraw();
			break;
		};
		case "ArrowRight": {
			cutX = Math.min(cutXMax, cutX + 1);
			updateDraw();
			break;
		};
		case "Enter": {
			await convertImage();
			break;
		};
		default: {
			stopIt = false;
		};
	};
	if (stopIt) {
		ev.preventDefault();
		eX.value = cutX;
		eY.value = cutY;
		//ev.stopImmediatePropagation();
	};
});
