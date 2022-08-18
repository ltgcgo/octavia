"use strict";

import {$e, $a} from "../../libs/lightfelt@ltgcgo/main/quickPath.js";
import {TuiDisplay} from "../disp/index.mjs";
import {fileOpen} from "../../libs/browser-fs-access@GoogleChromeLabs/browser_fs_access.min.js";

// Start the visualizers
let tuiVis = new TuiDisplay();

// Open the files
const propsMid = JSON.parse('{"extensions":[".mid",".MID"],"startIn":"music","id":"midiOpener","description":"Open a MIDI file"}'),
propsAud = JSON.parse('{"mimeTypes":["audio/*"],"startIn":"music","id":"audioOpener","description":"Open an audio file"}');
$e("#openMidi").addEventListener("click", async function () {
	tuiVis.reset();
	tuiVis.load(await fileOpen(propsMid));
});
$e("#openAudio").addEventListener("click", async function () {
	await fileOpen(propsAud);
});
