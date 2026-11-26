// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import { _leaf_yield_, _leaf_apply_ } from "../common/util/overlay.mjs";
import { parseUaName } from "../common/util/uaParse.mjs";

if (!globalThis.self) globalThis.self = globalThis;

const debugMsg = false;

/** @type {typeof import("./index.d.mts")} */
let flyLeafGlobals, selectedBackend;
if (self.Ende) {
	selectedBackend = "Ende";
	flyLeafGlobals = await import("../rt.ende/index.mjs");
} else if (self.Deno) {
	selectedBackend = "Deno";
	flyLeafGlobals = await import("../rt.deno/index.mjs");
} else if (self.Ant) {
	selectedBackend = "Ant";
	flyLeafGlobals = await import("../rt.ant/index.mjs");
} else if (self.tjs) {
	selectedBackend = "Txiki";
} else if (self.Bun) {
	selectedBackend = "Bun";
	flyLeafGlobals = await import("../rt.bun/index.mjs");
} else if (self.process || self.require) {
	switch (parseUaName(globalThis.navigator?.userAgent)?.toLowerCase()) {
		case "porffor": {
			selectedBackend = "Porffor";
			flyLeafGlobals = await import("../rt.porffor/index.mjs");
			break;
		};
		case "node.js":
		default: {
			selectedBackend = "Node";
			flyLeafGlobals = await import("../rt.node/index.mjs");
		};
	};
};
debugMsg && console.debug(`Selected backend: ${selectedBackend ?? "(none)"}.`);
if (flyLeafGlobals == null) {
	if (selectedBackend != null) {
		console.error(`The current runtime may only allow async-only APIs.`);
	};
	throw(new TypeError(`No valid backend for runtime "${selectedBackend ?? "Unknown"}".`));
};

flyLeafGlobals.version.asyncOnly = false;

const {
	_leaf_overlay_,

	// Classes and enums
	ChildProcess,
	Command,
	FsFile,
	PermissionStatus,
	Permissions,
	SeekMode,

	LeafChildProcess,
	LeafCommand,
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
	chmodSync,
	chown,
	chownSync,
	copyFile,
	copyFileSync,
	create,
	createSync,
	link,
	linkSync,
	lstat,
	lstatSync,
	makeTempDir,
	makeTempDirSync,
	makeTempFile,
	makeTempFileSync,
	mkdir,
	mkdirSync,
	open,
	openSync,
	readDir,
	readDirSync,
	readFile,
	readFileSync,
	readLink,
	readLinkSync,
	readTextFile,
	readTextFileSync,
	realPath,
	realPathSync,
	remove,
	removeSync,
	rename,
	renameSync,
	stat,
	statSync,
	symlink,
	symlinkSync,
	truncate,
	truncateSync,
	umask,
	utime,
	utimeSync,
	writeFile,
	writeFileSync,
	writeTextFile,
	writeTextFileSync,

	// Child process
	kill,
	spawn,
	spawnAndWait,
	spawnAndWaitSync
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

	LeafChildProcess,
	LeafCommand,
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
	chmodSync,
	chown,
	chownSync,
	copyFile,
	copyFileSync,
	create,
	createSync,
	link,
	linkSync,
	lstat,
	lstatSync,
	makeTempDir,
	makeTempDirSync,
	makeTempFile,
	makeTempFileSync,
	mkdir,
	mkdirSync,
	open,
	openSync,
	readDir,
	readDirSync,
	readFile,
	readFileSync,
	readLink,
	readLinkSync,
	readTextFile,
	readTextFileSync,
	realPath,
	realPathSync,
	remove,
	removeSync,
	rename,
	renameSync,
	stat,
	statSync,
	symlink,
	symlinkSync,
	truncate,
	truncateSync,
	umask,
	utime,
	utimeSync,
	writeFile,
	writeFileSync,
	writeTextFile,
	writeTextFileSync,

	kill,
	spawn,
	spawnAndWait,
	spawnAndWaitSync
};

// This section should be in each runtime implementation itself to support runtime-specific imports.
const defaultGlobals = _leaf_yield_(flyLeafGlobals, _leaf_overlay_);
if (Symbol.toStringTag) {
	defaultGlobals[Symbol.toStringTag] = "Leaf";
};
export default defaultGlobals;
//export { defaultGlobals as Deno };