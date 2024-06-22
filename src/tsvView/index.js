"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";
import {
	MxFont40,
	MxFont176,
	MxBm256,
	MxBmDef
} from "../basic/mxReader.js";

const propsTsv = JSON.parse(`{"extensions":[".tsv",".TSV"],"startIn":"pictures","id":"tsvOpener","description":"Open a TSV file"}`);

let cpReflects = Array.from(` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}`);
cpReflects.push("~→", "←");
let cpOverride = {};
cpOverride[0xa4] = "€¤";
cpOverride[0x378] = "¤";
cpOverride[0xa6] = "Š¦";
cpOverride[0x379] = "¦";
cpOverride[0xa8] = "š¨";
cpOverride[0x380] = "¨";
cpOverride[0xad] = "-";
cpOverride[0xb4] = "Ž´";
cpOverride[0x381] = "´";
cpOverride[0xb8] = "ž¸";
cpOverride[0x382] = "¸";
cpOverride[0xbc] = "Œ¼";
cpOverride[0x383] = "¼";
cpOverride[0xbd] = "œ½";
cpOverride[0x38b] = "½";
cpOverride[0xbe] = "Ÿ¾";
cpOverride[0x38d] = "¾";

let selectValueConverter = function (ev) {
	switch (this.as) {
		case "number": {
			this.data = parseFloat(this.value);
			break;
		};
		default: {
			this.data = this.value;
		};
	};
};
$a("select").forEach((e) => {
	e.as = e.attributes.getNamedItem("as")?.value || "text";
	e.addEventListener("change", selectValueConverter);
	selectValueConverter.call(e);
});

let cutW = $e("#cutW"), cutH = $e("#cutH"), segX = $e("#segX"), segY = $e("#segY"), maxSW = $e("#maxSW");
let loadType = $e("#loaderType"), pxSize = $e("#pixelSize"), rType = $e("#renderType"), rsrcID = $e("#chosenId");
let canvas = $e("#deerChips"), ctx = canvas.getContext("2d");
ctx.fillStyle = "#000";

let resourceBlob, resourceViewer;
let renderSect = function (data, offX, offY, boundX, boundY, pixelSize, isTwoByOne) {
	if (resourceViewer && data) {
		for (let i = 0; i < data.length; i ++) {
			let iX = i % data.width, iY = (i - iX) / data.width;
			if (iX < boundX && iY < boundY) {
				let e = data[i];
				let rX = pixelSize * (offX + iX);
				let rY = pixelSize * (offY + iY);
				if (isTwoByOne) {
					rX = rX << 1;
				};
				if (e) {
					ctx.fillRect(rX, rY, isTwoByOne ? (pixelSize << 1) : pixelSize, pixelSize);
				};
			};
		};
	};
};
let renderImage = function () {
	if (resourceViewer && rsrcID.options.length > 0) {
		switch (rType.data) {
			case 0: {
				// Single render
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				let data = resourceViewer.data(rsrcID.data || resourceViewer.keys()[0]);
				canvas.width = data.width * pxSize.data;
				canvas.height = data.height * pxSize.data;
				if (loadType.data == 1) {
					canvas.width = canvas.width << 1;
				};
				if (data) {
					renderSect(data, 0, 0, data.width, data.height, pxSize.data, loadType.data == 1);
				};
				break;
			};
			case 1: {
				break;
			};
		};
	};
};
let loadResource = async () => {
	if (resourceBlob) {
		resourceViewer = new [MxBmDef, MxBm256, MxFont40, MxFont176][loadType.data]();
		await resourceViewer.load(resourceBlob);
		while (rsrcID.options.length > 0) {
			rsrcID.options[0].remove();
		};
		resourceViewer.keys().forEach((e) => {
			let newChoice = document.createElement("option");
			newChoice.value = e;
			switch (loadType.data) {
				case 2:
				case 3: {
					let num = parseInt(e);
					newChoice.appendChild(document.createTextNode(`${num.toString(16).padStart(4, "0")}(${e})`));
					if (num < 33) {} else if (num < 128) {
						newChoice.appendChild(document.createTextNode(`: ${cpReflects[num - 32]}`));
					} else if (num < 161) {} else if (num < 0x5d0) {
						newChoice.appendChild(document.createTextNode(`: ${cpOverride[num] || String.fromCodePoint(num)}`));
					} else if (num < 0x5ef) {} else {
						newChoice.appendChild(document.createTextNode(`: ${cpOverride[num] || String.fromCodePoint(num)}`));
					};
					break;
				};
				default: {
					newChoice.appendChild(document.createTextNode(e));
				};
			};
			rsrcID.appendChild(newChoice);
		});
		renderImage();
	};
};
$e("#openImage").addEventListener("mouseup", async () => {
	resourceBlob = await (await fileOpen(propsTsv)).text();
	await loadResource();
});
loadType.addEventListener("change", loadResource);

rType.addEventListener("change", renderImage);
rsrcID.addEventListener("change", renderImage);
pxSize.addEventListener("change", renderImage);
$e("#renderImage").addEventListener("mouseup", renderImage);
document.addEventListener("keydown", (ev) => {
	let intercepted = true;
	switch (ev.key) {
		case "Enter": {
			renderImage();
			break;
		};
		case "ArrowDown":
		case "ArrowRight": {
			if (rsrcID.selectedIndex + 1 < rsrcID.options.length) {
				rsrcID.selectedIndex ++;
				rsrcID.dispatchEvent(new Event("change"));
			};
			break;
		};
		case "ArrowUp":
		case "ArrowLeft": {
			if (rsrcID.selectedIndex > 0) {
				rsrcID.selectedIndex --;
				rsrcID.dispatchEvent(new Event("change"));
			};
			break;
		};
		default: {
			intercepted = false;
			console.debug(`Unknown key "${ev.key}".`);
		};
	};
	if (intercepted) {
		ev.preventDefault();
	};
});
