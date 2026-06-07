// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

/** The most feature-rich visualiser built on top of Octavia, available as a module.
* @license LGPL-3.0-only
* @module cc.ltgc.octavia.cambiare
*/

import type {
	RootDisplay,
	MxBmDef,
    MxFont40
} from "../basic/index.d.mts";

/** The Cambiare visualiser. */
export class Cambiare extends RootDisplay {
	/** Attach to an HTML container element. Only one element can be attached to one instance. */
	attach(e: HTMLElement): void;
	/** Detach from the attached container element. */
	detach(): void;
	/** What the numeric counter should show.
	* - `0`: Amount of MIDI events handled during the frame render. (default)
	* - `1`: The FPS value calculated from the actual frame time.
	*/
	eventViewMode: number;
	/** The libre duo-component bitmaps for chords. */
	freeChord: MxBmDef;
	/** When `true`, the oscillator count is used in counting voice polyphony. */
	useElementCount: boolean;
	/** The maximum intensity for pixels on the dot matrix display segments. */
	pixelMax: number;
	/** The minimum intensity for pixels on the dot matrix display segments. */
	pixelMin: number;
}
