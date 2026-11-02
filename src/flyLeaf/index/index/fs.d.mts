// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

import type {
	DisposableObject,
	WrappedAbortSignal
} from "./conventions.d.mts";
import type {
	LeafSeekMode,
    LeafSetRawOptions
} from "./io.d.mts";

export interface LeafDirEntry {
	/**  */
	name: string;
	/**  */
	isDirectory: boolean;
	/**  */
	isFile: boolean;
	/**  */
	isSymlink: boolean;
}

export interface LeafFileInfo {
	/**  */
	atime?: Date;
	/**  */
	birthtime?: Date;
	/**  */
	blksize?: number;
	/**  */
	blocks?: number;
	/**  */
	ctime?: Date;
	/**  */
	dev: number;
	/**  */
	gid?: number;
	/**  */
	ino?: number;
	/**  */
	isBlockDevice?: boolean;
	/**  */
	isCharDevice?: boolean;
	/**  */
	isDirectory: boolean;
	/**  */
	isFifo?: boolean;
	/**  */
	isFile: boolean;
	/**  */
	isSocket?: boolean;
	/**  */
	isSymlink: boolean;
	/**  */
	mode?: number;
	/**  */
	mtime?: Date;
	/**  */
	nlink?: number;
	/**  */
	rdev?: number;
	/**  */
	size: number;
	/**  */
	uid?: number;
}

export interface LeafFsEvent {
	/**  */
	flag?: "rescan";
	/**  */
	kind: "access"|"create"|"modify"|"remove"|"rename"|"other"|"any";
	/**  */
	path: string[];
}

export interface LeafFsWatcher extends AsyncIterable<LeafFsEvent>, DisposableObject {}

export class LeafFsFile implements DisposableObject {
	/**  */
	readable: ReadableStream<Uint8Array>;
	/**  */
	writable: WritableStream<Uint8Array>;
	/**  */
	close(): void;
	/**  */
	isTerminal(): boolean;
	/**  */
	lock(exclusive?: boolean): Promise<void>;
	/**  */
	lockSync(exclusive?: boolean): void;
	/**  */
	read(buffer: Uint8Array): Promise<number|null>;
	/**  */
	readSync(buffer: Uint8Array): number|null;
	/**  */
	seek(offset: number|bigint, whence: LeafSeekMode): Promise<number>;
	/**  */
	seekSync(offset: number|bigint, whence: LeafSeekMode): number;
	/**  */
	setRaw(mode: boolean, options?: LeafSetRawOptions): void;
	/**  */
	stat(): Promise<LeafFileInfo>;
	/**  */
	statSync(): LeafFileInfo;
	/**  */
	sync(): Promise<void>;
	/**  */
	syncData(): Promise<void>;
	/**  */
	syncDataSync(): Promise<void>;
	/**  */
	syncSync(): Promise<void>;
	/**  */
	truncate(size?: number): Promise<void>;
	/**  */
	truncateSync(size?: number): void;
	/**  */
	tryLock(exclusive?: boolean): void;
	/**  */
	tryLockSync(exclusive?: boolean): void;
	/**  */
	unlock(): Promise<void>;
	/**  */
	unlockSync(): Promise<void>;
	/**  */
	utime(atime: number|Date, mtime: number|Date): Promise<void>;
	/**  */
	utimeSync(atime: number|Date, mtime: number|Date): void;
	/**  */
	write(buffer: Uint8Array): Promise<number>;
	/**  */
	writeSync(buffer: Uint8Array): number;
}

export interface LeafMakeTempOptions {
	/**  */
	dir?: string;
	/**  */
	prefix?: string;
	/**  */
	suffix?: string;
}

export interface LeafMkdirOptions {
	/**  */
	mode?: number;
	/**  */
	recursive?: boolean;
}

export interface LeafOpenOptions {
	/**  */
	append?: boolean;
	/**  */
	create?: boolean;
	/**  */
	createNew?: boolean;
	/**  */
	mode?: number;
	/**  */
	read?: boolean;
	/**  */
	truncate?: boolean;
	/**  */
	write?: boolean;
}

declare type LeafReadFileOptions = WrappedAbortSignal;

export interface LeafRemoveOptions {
	/**  */
	recursive?: boolean;
}

export interface LeafSymlinkOptions {
	/**  */
	type: "file"|"dir"|"junction";
}

export interface LeafWatchOptions {
	/**  */
	recursive?: boolean;
	/**  */
	ignore?: string|string[];
}

export interface LeafWriteFileOptions extends WrappedAbortSignal {
	/**  */
	append?: boolean;
	/**  */
	create?: boolean;
	/**  */
	createNew?: boolean;
	/**  */
	mode?: number;
	/**  */
	read?: boolean;
	/**  */
	truncate?: boolean;
	/**  */
	write?: boolean;
}

/**  */
export function chmod(path: string|URL, mode: number): Promise<void>;
/**  */
export function chmodSync(path: string|URL, mode: number): void;
/**  */
export function chown(path: string|URL, uid: number|null, gid: number|null): Promise<void>;
/**  */
export function chownSync(path: string|URL, uid: number|null, gid: number|null): void;
/**  */
export function copyFile(sourcePath: string|URL, targetPath: string|URL): Promise<void>;
/**  */
export function copyFileSync(sourcePath: string|URL, targetPath: string|URL): void;
/**  */
export function create(path: string|URL): Promise<LeafFsFile>;
/**  */
export function createSync(path: string|URL): LeafFsFile;
/**  */
export function link(sourcePath: string|URL, targetPath: string|URL): Promise<void>;
/**  */
export function linkSync(sourcePath: string|URL, targetPath: string|URL): void;
/**  */
export function lstat(path: string|URL): Promise<LeafFileInfo>;
/**  */
export function lstatSync(path: string|URL): LeafFileInfo;
/**  */
export function makeTempDir(options?: LeafMakeTempOptions): Promise<string>;
/**  */
export function makeTempDirSync(options?: LeafMakeTempOptions): string;
/**  */
export function makeTempFile(options?: LeafMakeTempOptions): Promise<string>;
/**  */
export function makeTempFileSync(options?: LeafMakeTempOptions): string;
/**  */
export function mkdir(path: string|URL, options?: LeafMkdirOptions): Promise<void>;
/**  */
export function mkdirSync(path: string|URL, options?: LeafMkdirOptions): void;
/**  */
export function open(path: string|URL, options?: LeafOpenOptions): Promise<LeafFsFile>;
/**  */
export function openSync(path: string|URL, options?: LeafOpenOptions): Promise<LeafFsFile>;
/**  */
export function readDir(path: string|URL): AsyncGenerator<LeafDirEntry, void, void>;
/**  */
export function readDirSync(path: string|URL): Generator<LeafDirEntry, void, void>;
/**  */
export function readFile(path: string|URL, options?: LeafReadFileOptions): Promise<Uint8Array>;
/**  */
export function readFileSync(path: string|URL, options?: LeafReadFileOptions): Uint8Array;
/**  */
export function readLink(path: string|URL): Promise<string>;
/**  */
export function readLinkSync(path: string|URL): string;
/**  */
export function readTextFile(path: string|URL, options?: LeafReadFileOptions): Promise<string>;
/**  */
export function readTextFileSync(path: string|URL, options?: LeafReadFileOptions): string;
/**  */
export function realPath(path: string|URL): Promise<string>;
/**  */
export function realPathSync(path: string|URL): string;
/**  */
export function remove(path: string|URL, options?: LeafRemoveOptions): Promise<void>;
/**  */
export function removeSync(path: string|URL, options?: LeafRemoveOptions): void;
/**  */
export function rename(sourcePath: string|URL, targetPath: string|URL): Promise<void>;
/**  */
export function renameSync(sourcePath: string|URL, targetPath: string|URL): void;
/**  */
export function stat(path: string|URL): Promise<LeafFileInfo>;
/**  */
export function statSync(path: string|URL): LeafFileInfo;
/**  */
export function symlink(sourcePath: string|URL, targetPath: string|URL, options?: LeafSymlinkOptions): Promise<void>;
/**  */
export function symlinkSync(sourcePath: string|URL, targetPath: string|URL, options?: LeafSymlinkOptions): void;
/**  */
export function truncate(name: string, size?: number): Promise<void>;
/**  */
export function truncateSync(name: string, size?: number): void;
/**  */
export function umask(mask?: number): number;
/**  */
export function utime(path: string|URL, atime: number|Date, mtime: number|Date): Promise<void>;
/**  */
export function utimeSync(path: string|URL, atime: number|Date, mtime: number|Date): void;
/**  */
export function watchFs(path: string|URL, options?: LeafWatchOptions): LeafFsWatcher;
/**  */
export function writeFile(path: string|URL, data: Uint8Array|ReadableStream<Uint8Array>, options?: LeafWriteFileOptions): Promise<void>;
/**  */
export function writeFileSync(path: string|URL, data: Uint8Array, options?: LeafWriteFileOptions): void;
/**  */
export function writeTextFile(path: string|URL, data: string|ReadableStream<string>, options?: LeafWriteFileOptions): Promise<void>;
/**  */
export function writeTextFileSync(path: string|URL, data: string, options?: LeafWriteFileOptions): void;