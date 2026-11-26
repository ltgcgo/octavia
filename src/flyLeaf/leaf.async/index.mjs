// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { _leaf_yield_, _leaf_apply_ } from "../common/util/overlay.mjs";
import { parseUaName } from "../common/util/uaParse.mjs";

if (!globalThis.self) globalThis.self = globalThis;

const debugMsg = false;

/** @type {typeof import("./index.mjs")} */
let flyLeafGlobals, selectedBackend;
if (self.Ende) {
	selectedBackend = "Ende";
	flyLeafGlobals = await import("../ra.ende/index.mjs");
} else if (self.Deno) {
	selectedBackend = "Deno";
	flyLeafGlobals = await import("../ra.deno/index.mjs");
} else if (self.Ant) {
	selectedBackend = "Ant";
	flyLeafGlobals = await import("../ra.ant/index.mjs");
} else if (self.tjs) {
	selectedBackend = "Txiki";
	flyLeafGlobals = await import("../ra.txiki/index.mjs");
} else if (self.Bun) {
	selectedBackend = "Bun";
	flyLeafGlobals = await import("../ra.bun/index.mjs");
} else if (self.process || self.require) {
	switch (parseUaName(globalThis.navigator?.userAgent)?.toLowerCase()) {
		case "porffor": {
			selectedBackend = "Porffor";
			flyLeafGlobals = await import("../ra.porffor/index.mjs");
			break;
		};
		case "node.js":
		default: {
			selectedBackend = "Node";
			flyLeafGlobals = await import("../ra.node/index.mjs");
		};
	};
};
debugMsg && console.debug(`Selected backend: ${selectedBackend ?? "(none)"}.`);
if (flyLeafGlobals == null) {
	throw(new TypeError(`No valid backend for runtime "${selectedBackend ?? "Unknown"}".`));
};

flyLeafGlobals.version.asyncOnly = true;

const {
	_leaf_overlay_,

	// Classes and enums
	ChildProcess,
	Command,
	FsFile,
	PermissionStatus,
	Permissions,
	SeekMode,

	LeafFsFile,
	LeafPermissions,
	LeafPermStatus,
	LeafSeekMode,

	// Permissions
	permissions,

	// Runtime
	addSignalListener,
	args,
	build,
	chdir,
	cwd,
	env,
	execPath,
	exit,
	gid,
	hostname,
	loadavg,
	mainModule,
	memoryUsage,
	noColor,
	osRelease,
	osUptime,
	pid,
	ppid,
	refTimer,
	removeSignalListener,
	systemMemoryInfo,
	uid,
	unrefTimer,
	version,

	// IO
	consoleSize,
	inspect,
	stderr,
	stdin,
	stdout,

	// File system
	chmod,
	chown,
	copyFile,
	create,
	link,
	lstat,
	makeTempDir,
	makeTempFile,
	mkdir,
	open,
	readDir,
	readFile,
	readLink,
	readTextFile,
	realPath,
	remove,
	rename,
	stat,
	symlink,
	truncate,
	umask,
	utime,
	writeFile,
	writeTextFile,

	// Child process
	kill,
	spawn,
	spawnAndWait
} = flyLeafGlobals;

export {
	_leaf_overlay_,
	_leaf_yield_,
	_leaf_apply_,

	ChildProcess,
	Command,
	FsFile,
	PermissionStatus,
	Permissions,
	SeekMode,

	LeafFsFile,
	LeafPermissions,
	LeafPermStatus,
	LeafSeekMode,

	permissions,

	addSignalListener,
	args,
	build,
	chdir,
	cwd,
	env,
	execPath,
	exit,
	gid,
	hostname,
	loadavg,
	mainModule,
	memoryUsage,
	noColor,
	osRelease,
	osUptime,
	pid,
	ppid,
	refTimer,
	removeSignalListener,
	systemMemoryInfo,
	uid,
	unrefTimer,
	version,

	consoleSize,
	inspect,
	stderr,
	stdin,
	stdout,

	chmod,
	chown,
	copyFile,
	create,
	link,
	lstat,
	makeTempDir,
	makeTempFile,
	mkdir,
	open,
	readDir,
	readFile,
	readLink,
	readTextFile,
	realPath,
	remove,
	rename,
	stat,
	symlink,
	truncate,
	umask,
	utime,
	writeFile,
	writeTextFile,

	kill,
	spawn,
	spawnAndWait
};

// This section should be in each runtime implementation itself to support runtime-specific imports.
const defaultGlobals = _leaf_yield_(flyLeafGlobals, _leaf_overlay_);
if (Symbol.toStringTag) {
	defaultGlobals[Symbol.toStringTag] = "Leaf";
};
export default defaultGlobals;
export { defaultGlobals as Deno };