// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

export {
	_leaf_overlay_,
	_leaf_apply_,
	_leaf_yield_
} from "../leaf.async/exports.d.mts";

export type * from "../leaf.async/errors.d.mts";
export * from "../leaf.async/errors.d.mts";

//export type * from "../leaf.async/errors.d.mts";
export {
	LeafEnvPermDetails, EnvPermissionDescriptor,
	LeafFfiPermDetails, FfiPermissionDescriptor,
	LeafImportPermDetails, ImportPermissionDescriptor,
	LeafNetworkPermDetails, NetPermissionDescriptor,
	LeafPermDetails, PermissionDescriptor,
	LeafPermHookMethodAsync,
	LeafPermHookMethodBoth,
	LeafPermHookMethodSync,
	LeafPermName, PermissionName,
	LeafPermOptions, PermissionOptions,
	LeafPermRequest, PermissionOptionsObject,
	LeafPermRuntimeHookMapBoth,
	LeafPermRuntimeHooksBoth,
	LeafPermRuntimeTypeHooksBoth,
	LeafPermState, PermissionState,
	LeafPermStatus, PermissionStatus,
	LeafPermStatusEvents, PermissionStatusEventMap,
	LeafReadPermDetails, ReadPermissionDescriptor,
	LeafRunPermDetails, RunPermissionDescriptor,
	LeafSystemPermDetails, SysPermissionDescriptor,
	LeafWritePermDetails, WritePermissionDescriptor
} from "../leaf.async/permission.d.mts";

export type * from "./permission.d.mts";
export * from "./permission.d.mts";

export type * from "../leaf.async/env.d.mts";
export * from "../leaf.async/env.d.mts";

//export type * from "../leaf.async/io.d.mts";
export {
	LeafInspectOptions, InspectOptions,
	LeafIoTeletype,
	LeafLegacyWrappedReader,
	LeafLegacyWrappedWriter,
	LeafSeekMode, SeekMode,
	LeafSetRawOptions, SetRawOptions,
	LeafTeletypeDimensions,

	consoleSize,
	inspect
} from "../leaf.async/io.d.mts";

export type * from "./io.d.mts";
export * from "./io.d.mts";

//export type * from "../leaf.async/fs.d.mts";
export {
	LeafDirEntry, DirEntry,
	LeafFileInfo, FileInfo,
	LeafFsEvent, FsEvent,
	LeafFsEventFlag, FsEventFlag,
	LeafFsWatcher, FsWatcher,
	LeafMakeTempOptions, MakeTempOptions,
	LeafMkdirOptions, MkdirOptions,
	LeafOpenOptions, OpenOptions,
	LeafReadFileOptions, ReadFileOptions,
	LeafRemoveOptions, RemoveOptions,
	LeafSymlinkOptions, SymlinkOptions,
	LeafWatchOptions, WatchOptions,
	LeafWriteFileOptions, WriteFileOptions,

	chmod,
	chown,
	copyFile,
	link,
	lstat,
	makeTempDir,
	makeTempFile,
	mkdir,
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
	watchFs,
	writeFile,
	writeTextFile
} from "../leaf.async/fs.d.mts";

export type * from "./fs.d.mts";
export * from "./fs.d.mts";

export {
	LeafChildProcess, ChildProcess,
	LeafChildRunFailStatusLegacy,
	LeafChildRunFailStatusModern,
	LeafChildRunInstance,
	LeafChildRunOptions,
	LeafChildRunPassStatusLegacy,
	LeafChildRunPassStatusModern,
	LeafChildRunPassStatusSignal,
	LeafChildRunStatusLegacy,
	LeafChildRunStatusModern, CommandStatus,
	LeafCommand, Command,
	LeafCommandFailedOutput,
	LeafCommandOptions, CommandOptions,
	LeafCommandOutput, CommandOutput,
	LeafCommandPassedOutput,
	LeafRunTypes,
	LeafStdIoMode,

	kill,
	spawn,
	spawnAndWait
} from "../leaf.async/process.d.mts";

export type * from "./process.d.mts";
export * from "./process.d.mts";