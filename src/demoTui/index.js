"use strict";

import {} from "../../libs/lightfelt@ltgcgo/main/cssClass.js";
import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {TuiDisplay} from "../disp/index.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

// Standard switching
let stSwitch = $a("[id^=mode]");
stSwitch.to = function (i) {
	stSwitch.forEach(function (e) {
		e.classList.off("active");
	});
	stSwitch[i].classList.on("active");
};
stSwitch.forEach(function (e, i, a) {
	e.addEventListener("click", function () {
		tuiVis.switchMode(e.title);
		stSwitch.to(i);
	});
});

// Start the visualizers
self.tuiVis = new TuiDisplay();
tuiVis.addEventListener("reset", function (e) {
});

// Open the files
let audioBlob;
const propsMid = JSON.parse('{"extensions":[".mid",".MID"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
$e("#openMidi").addEventListener("click", async function () {
	tuiVis.reset();
	tuiVis.loadFile(await fileOpen(propsMid));
});
$e("#openAudio").addEventListener("click", async function () {
	if (audioBlob) {
		URL.revokeObjectURL(audioBlob);
	};
	audioBlob = await fileOpen(propsAud);
	audioPlayer.src = URL.createObjectURL(audioBlob);
});

// Render frames
let audioPlayer = $e("#audioPlayer");
let textDisplay = $e("#display");
audioPlayer.onended = function () {
	tuiVis.reset();
};
let renderThread = setInterval(function () {
	if (!audioPlayer.paused) {
		textDisplay.innerHTML = tuiVis.render(audioPlayer.currentTime - (self.audioDelay || 0));
	};
}, 40);
