// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

// WIP: Translate Node.js errors into Deno-native errors.

import {
	DisposableObject
} from "../leaf.async/conventions.d.mts";
import {
	LeafSeekMode
} from "../leaf.async/io.d.mts";
import {
	LeafFsFile as LeafFsFileAsync,
	LeafDirEntry,
	LeafFileInfo,
	LeafMakeTempOptions,
	LeafMkdirOptions,
	LeafOpenOptions,
	LeafReadFileOptions,
	LeafRemoveOptions,
	LeafSymlinkOptions,
	LeafWriteFileOptions
} from "../leaf.async/fs.d.mts";

export class LeafFsFile extends LeafFsFileAsync implements DisposableObject, Disposable {
	/**  */
	lockSync(exclusive?: boolean): void;
	/**  */
	readSync(buffer: Uint8Array): number|null;
	/**  */
	seekSync(offset: number|bigint, whence: LeafSeekMode): number;
	/**  */
	statSync(): LeafFileInfo;
	/**  */
	syncDataSync(): void;
	/**  */
	syncSync(): void;
	/**  */
	truncateSync(size?: number): void;
	/**  */
	tryLockSync(exclusive?: boolean): void;
	/**  */
	unlockSync(): Promise<void>;
	/**  */
	utimeSync(atime: number|Date, mtime: number|Date): void;
	/**  */
	writeSync(buffer: Uint8Array): number;
}
export type FsFile = LeafFsFile;

/** The synchronous variant of `chmod`. */
export function chmodSync(path: string|URL, mode: number): void;
/** The synchronous variant of `chown`. */
export function chownSync(path: string|URL, uid: number|null, gid: number|null): void;
/** The synchronous variant of `copyFile`. */
export function copyFileSync(sourcePath: string|URL, targetPath: string|URL): void;
/** Create a file and return its handle. If a file already exists, truncate it. */
export function create(path: string|URL): Promise<LeafFsFile>;
/** The synchronous variant of `create`. */
export function createSync(path: string|URL): LeafFsFile;
/** The synchronous variant of `link`. */
export function linkSync(sourcePath: string, targetPath: string): void;
/** The synchronous variant of `lstat`. */
export function lstatSync(path: string|URL): LeafFileInfo;
/** The synchronous variant of `makeTempDir`. */
export function makeTempDirSync(options?: LeafMakeTempOptions): string;
/** The synchronous variant of `makeTempFile`. */
export function makeTempFileSync(options?: LeafMakeTempOptions): string;
/** The synchronous variant of `mkdir`. */
export function mkdirSync(path: string|URL, options?: LeafMkdirOptions): void;
/** Open a file and get a handle. */
export function open(path: string|URL, options?: LeafOpenOptions): Promise<LeafFsFile>;
/** The synchronous variant of `open`. */
export function openSync(path: string|URL, options?: LeafOpenOptions): Promise<LeafFsFile>;
/** The synchronous variant of `readDir`. */
export function readDirSync(path: string|URL): Generator<LeafDirEntry, void, void>;
/** The synchronous variant of `readFile`. */
export function readFileSync(path: string|URL, options?: LeafReadFileOptions): Uint8Array;
/** The synchronous variant of `readLink`. */
export function readLinkSync(path: string|URL): string;
/** The synchronous variant of `readTextFile`. */
export function readTextFileSync(path: string|URL, options?: LeafReadFileOptions): string;
/** The synchronous variant of `realPath`. */
export function realPathSync(path: string|URL): string;
/** The synchronous variant of `remove`. */
export function removeSync(path: string|URL, options?: LeafRemoveOptions): void;
/** The synchronous variant of `rename`. */
export function renameSync(sourcePath: string|URL, targetPath: string|URL): void;
/** The synchronous variant of `stat`. */
export function statSync(path: string|URL): LeafFileInfo;
/** The synchronous variant of `symlink`. */
export function symlinkSync(sourcePath: string|URL, targetPath: string|URL, options?: LeafSymlinkOptions): void;
/** The synchronous variant of `truncate`. */
export function truncateSync(name: string, size?: number): void;
/** The synchronous variant of `utime`. */
export function utimeSync(path: string|URL, atime: number|Date, mtime: number|Date): void;
/** The synchronous variant of `writeFile`. */
export function writeFileSync(path: string|URL, data: Uint8Array, options?: LeafWriteFileOptions): void;
/** The synchronous variant of `writeFile`. */
export function writeTextFileSync(path: string|URL, data: string, options?: LeafWriteFileOptions): void;