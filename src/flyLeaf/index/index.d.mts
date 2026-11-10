// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

import _LeafExport_ from "./index/exportBlob.d.mts";
export default _LeafExport_;

export * from "./index/exportThru.d.mts";

// Copy from here.

import {
	addSignalListener,
	args,
	build,
	chdir,
	cwd,
	env,
	execPath,
	exit,
	exitCode,
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
	version
} from "./index/env.d.mts";
import type {
	Env,
	MemoryUsage,
	Signal,
	SystemMemoryInfo
} from "./index/env.d.mts";

import {
	chmod,
	chmodSync,
	chown,
	chownSync,
	copyFile,
	copyFileSync,
	create,
	createSync,
	FsFile,
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
	watchFs,
	writeFile,
	writeFileSync,
	writeTextFile,
	writeTextFileSync
} from "./index/fs.d.mts";
import type {
	DirEntry,
	FileInfo,
	FsEvent,
	FsEventFlag,
	FsWatcher,
	MakeTempOptions,
	MkdirOptions,
	OpenOptions,
	ReadFileOptions,
	SymlinkOptions,
	WatchOptions,
	WriteFileOptions
} from "./index/fs.d.mts";

import {
	SeekMode
} from "./index/io.d.mts";
import type {
	SetRawOptions
} from "./index/io.d.mts";

import {
	Command,
	kill,
	spawn,
	spawnAndWait,
	spawnAndWaitSync
} from "./index/process.d.mts";
import type {
	ChildProcess,
	CommandOptions,
	CommandOutput,
	CommandStatus
} from "./index/process.d.mts";

// Paste here.
/** Only use it as a namespace, do not import this directly as this does not exist. */
declare namespace Deno {
	// env
	export {
		addSignalListener,
		args,
		build,
		chdir,
		cwd,
		env,
		execPath,
		exit,
		exitCode,
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
		version
	}
	// env type
	export type {
		Env,
		MemoryUsage,
		Signal,
		SystemMemoryInfo
	}
	// fs
	export {
		chmod,
		chmodSync,
		chown,
		chownSync,
		copyFile,
		copyFileSync,
		create,
		createSync,
		FsFile,
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
		watchFs,
		writeFile,
		writeFileSync,
		writeTextFile,
		writeTextFileSync
	}
	// fs type
	export type {
		DirEntry,
		FileInfo,
		FsEvent,
		FsEventFlag,
		FsWatcher,
		MakeTempOptions,
		MkdirOptions,
		OpenOptions,
		ReadFileOptions,
		SymlinkOptions,
		WatchOptions,
		WriteFileOptions
	}
	// io
	export {
		SeekMode
	}
	// io type
	export type {
		SetRawOptions
	}
	// process
	export {
		Command,
		kill,
		spawn,
		spawnAndWait,
		spawnAndWaitSync
	}
	// process type
	export type {
		ChildProcess,
		CommandOptions,
		CommandOutput,
		CommandStatus
	}
}