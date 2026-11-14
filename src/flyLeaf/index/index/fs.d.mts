// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

// WIP: Translate Node.js errors into Deno-native errors.

import type {
	DisposableObject,
	WrappedAbortSignal
} from "./conventions.d.mts";
import type {
	LeafSeekMode,
    LeafSetRawOptions
} from "./io.d.mts";

/** Meta information of a folder entry from `Leaf.readDir`. */
export interface LeafDirEntry {
	/** Entry name. */
	name: string;
	/** If the entry is a directory. */
	isDirectory: boolean;
	/** If the entry is a normal file. */
	isFile: boolean;
	/** If the entry is a symbolic link. */
	isSymlink: boolean;
}
export type DirEntry = LeafDirEntry;

/** Meta information of a specific path. Suspiciously close to Node.js conventions. */
export interface LeafFileInfo {
	/** Last access time. */
	atime?: Date;
	/** Creation time. */
	birthtime?: Date;
	/** Block size for file system I/O. Only available on Unix-likes. */
	blksize?: number;
	/** Number of blocks allocated to the entity on the path. */
	blocks?: number;
	/** Last change time. */
	ctime?: Date;
	/** ID of the device containing the entity on the path. */
	dev: number;
	/** Group ID of the owner of the entity on the path. */
	gid?: number;
	/** `inode` number on Unix-likes, or file index number on Windows. Not guaranteed to exist on all platforms. */
	ino?: number;
	/** If the path points to a block device. Only available on Unix-likes. */
	isBlockDevice?: boolean;
	/** If the path points to a character device. Only available on Unix-likes. */
	isCharDevice?: boolean;
	/** If the path points to a regular directory. */
	isDirectory: boolean;
	/** If the path points to a FIFO (first-in first-out, or a queue). Only available on Unix-likes. */
	isFifo?: boolean;
	/** If the path points to a regular file. */
	isFile: boolean;
	/** If the path points to a (Unix domain) socket. Only available on Unix-likes. */
	isSocket?: boolean;
	/** If the path points to a symbolic link. */
	isSymlink: boolean;
	/** Unix file mode as three octal digits. */
	mode?: number;
	/** Last modification time. */
	mtime?: Date;
	/** Number of hard links the entity on the path. */
	nlink?: number;
	/** Device ID of the entity on the path. */
	rdev?: number;
	/** Size in bytes. */
	size: number;
	/** User ID of the owner of the entity on the path. */
	uid?: number;
}
export type FileInfo = LeafFileInfo;

export type LeafFsEventFlag = "rescan";
export type FsEventFlag = LeafFsEventFlag;

export interface LeafFsEvent {
	/**  */
	flag?: LeafFsEventFlag;
	/**  */
	kind: "access"|"create"|"modify"|"remove"|"rename"|"other"|"any";
	/**  */
	path: string[];
}
export type FsEvent = LeafFsEvent;

export interface LeafFsWatcher extends AsyncIterable<LeafFsEvent>, DisposableObject {}
export type FsWatcher = LeafFsWatcher;

export class LeafFsFile implements DisposableObject, Disposable {
	[Symbol.dispose](): void;
	/** The binary file content present in a WHATWG readable stream. */
	readable: ReadableStream<Uint8Array>;
	/**  */
	writable: WritableStream<Uint8Array>;
	/** Close the file. */
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
export type FsFile = typeof LeafFsFile;
export const FsFile: LeafFsFile;

/** Options for temporary entity creation. */
export interface LeafMakeTempOptions {
	/** The target temporary folder.
	*
	* When this is not set, it defaults to the environment variable `TMPDIR` first, then the OS-native temporary folder. */
	dir?: string;
	/** String prefix of the random name. Defaults to `""` (empty string). */
	prefix?: string;
	/** String suffix of the random name. Defaults to `""` (empty string). */
	suffix?: string;
}
export type MakeTempOptions = LeafMakeTempOptions;

/** Options for folder creation. */
export interface LeafMkdirOptions {
	/** The permissions (e.g. `0o777`) associated with the target. */
	mode?: number;
	/** Attempt to create directories recursively, akin to `mkdir -p` on POSIX. */
	recursive?: boolean;
}
export type MkdirOptions = LeafMkdirOptions;

/** Options for file opening. */
export interface LeafOpenOptions {
	/** When true, imply `write: true` and append data to the end of a file. */
	append?: boolean;
	/** When true, create the file if it doesn't already exist. Requires write permissions. */
	create?: boolean;
	/** When true, no existing file at the path is allowed before a new one is created. Requires write or append permissions, causes `create` and `truncate` to be ignored. */
	createNew?: boolean;
	/** The permissions (e.g. `0o777`) associated with the target. */
	mode?: number;
	/** When true, request read permissions. */
	read?: boolean;
	/** When true, the target file will have its data purged and size set to 0. Requires write permissions. */
	truncate?: boolean;
	/** When true, request write permissions. */
	write?: boolean;
}
export type OpenOptions = LeafOpenOptions;

/** Options for reading. */
declare type LeafReadFileOptions = WrappedAbortSignal;
export type ReadFileOptions = WrappedAbortSignal;

/** Options for removal. */
export interface LeafRemoveOptions {
	/** If the removal needs to be recursive, akin to `rm -r`. */
	recursive?: boolean;
}
export type RemoveOptions = LeafRemoveOptions;

/** Options for symbolic links. */
export interface LeafSymlinkOptions {
	/**  */
	type: "file"|"dir"|"junction";
}
export type SymlinkOptions = LeafSymlinkOptions;

export interface LeafWatchOptions {
	/**  */
	recursive?: boolean;
	/**  */
	ignore?: string|string[];
}
export type WatchOptions = LeafWatchOptions;

/** Options for writing. */
export interface LeafWriteFileOptions extends WrappedAbortSignal {
	/** When true, imply `write: true` and append data to the end of a file. */
	append?: boolean;
	/** When true, create the file if it doesn't already exist. Requires write permissions. */
	create?: boolean;
	/** When true, no existing file at the path is allowed before a new one is created. Requires write or append permissions, causes `create` and `truncate` to be ignored. */
	createNew?: boolean;
	/** The permissions (e.g. `0o777`) associated with the target. */
	mode?: number;
}
export type WriteFileOptions = LeafWriteFileOptions;

/** Change the permissions of a path. */
export function chmod(path: string|URL, mode: number): Promise<void>;
/** The synchronous variant of `chmod`. */
export function chmodSync(path: string|URL, mode: number): void;
/** Change the ownership of a path. */
export function chown(path: string|URL, uid: number|null, gid: number|null): Promise<void>;
/** The synchronous variant of `chown`. */
export function chownSync(path: string|URL, uid: number|null, gid: number|null): void;
/** Copy the file from source to the target alongwith its permissions. Will overwrite the file at target, and will fail if the target path is not writable. */
export function copyFile(sourcePath: string|URL, targetPath: string|URL): Promise<void>;
/** The synchronous variant of `copyFile`. */
export function copyFileSync(sourcePath: string|URL, targetPath: string|URL): void;
/** Create a file and return its handle. If a file already exists, truncate it. */
export function create(path: string|URL): Promise<LeafFsFile>;
/** The synchronous variant of `create`. */
export function createSync(path: string|URL): LeafFsFile;
/** Create a hard link pointing to the target path, akin to `ln`. */
export function link(sourcePath: string, targetPath: string): Promise<void>;
/** The synchronous variant of `link`. */
export function linkSync(sourcePath: string, targetPath: string): void;
/** Gather meta information of a path with symbolic link awareness. If a symbolic link is encountered, information of the symbolic link itself will be obtained. */
export function lstat(path: string|URL): Promise<LeafFileInfo>;
/** The synchronous variant of `lstat`. */
export function lstatSync(path: string|URL): LeafFileInfo;
/** Create a new temporary folder in the default OS temporary file folder.
*
* Separate calls create separate temporary folders, which need to be removed manually later when unneeded. */
export function makeTempDir(options?: LeafMakeTempOptions): Promise<string>;
/** The synchronous variant of `makeTempDir`. */
export function makeTempDirSync(options?: LeafMakeTempOptions): string;
/** Create a new temporary file in the default OS temporary file folder.
*
* Separate calls create separate temporary files, which need to be removed manually later when unneeded. */
export function makeTempFile(options?: LeafMakeTempOptions): Promise<string>;
/** The synchronous variant of `makeTempFile`. */
export function makeTempFileSync(options?: LeafMakeTempOptions): string;
/** Create a new folder at the specified path, akin to `mkdir`. */
export function mkdir(path: string|URL, options?: LeafMkdirOptions): Promise<void>;
/** The synchronous variant of `mkdir`. */
export function mkdirSync(path: string|URL, options?: LeafMkdirOptions): void;
/** Open a file and get a handle. */
export function open(path: string|URL, options?: LeafOpenOptions): Promise<LeafFsFile>;
/** The synchronous variant of `open`. */
export function openSync(path: string|URL, options?: LeafOpenOptions): Promise<LeafFsFile>;
/** Iterate through all children within a directory. */
export function readDir(path: string|URL): AsyncGenerator<LeafDirEntry, void, void>;
/** The synchronous variant of `readDir`. */
export function readDirSync(path: string|URL): Generator<LeafDirEntry, void, void>;
/** Read binary data from the specified path. */
export function readFile(path: string|URL, options?: LeafReadFileOptions): Promise<Uint8Array>;
/** The synchronous variant of `readFile`. */
export function readFileSync(path: string|URL, options?: LeafReadFileOptions): Uint8Array;
/** Resolve the symbolic link. */
export function readLink(path: string|URL): Promise<string>;
/** The synchronous variant of `readLink`. */
export function readLinkSync(path: string|URL): string;
/** Read text data from the specified path. */
export function readTextFile(path: string|URL, options?: LeafReadFileOptions): Promise<string>;
/** The synchronous variant of `readTextFile`. */
export function readTextFileSync(path: string|URL, options?: LeafReadFileOptions): string;
/** Resolve the path down to the absolute path. Symbolic links are fully resolved. */
export function realPath(path: string|URL): Promise<string>;
/** The synchronous variant of `realPath`. */
export function realPathSync(path: string|URL): string;
/** Remove the file or the directory on the path, akin to `rm`. */
export function remove(path: string|URL, options?: LeafRemoveOptions): Promise<void>;
/** The synchronous variant of `remove`. */
export function removeSync(path: string|URL, options?: LeafRemoveOptions): void;
/** Rename/move the old path to the new path, akin to `mv`. */
export function rename(sourcePath: string|URL, targetPath: string|URL): Promise<void>;
/** The synchronous variant of `rename`. */
export function renameSync(sourcePath: string|URL, targetPath: string|URL): void;
/** Gather meta information of a path with no symbolic link awareness. If a symbolic link is encountered, information of the file it finally points to will be obtained. */
export function stat(path: string|URL): Promise<LeafFileInfo>;
/** The synchronous variant of `stat`. */
export function statSync(path: string|URL): LeafFileInfo;
/** Create a symbolic link pointing to the target path, akin to `ln -s`. */
export function symlink(sourcePath: string|URL, targetPath: string|URL, options?: LeafSymlinkOptions): Promise<void>;
/** The synchronous variant of `symlink`. */
export function symlinkSync(sourcePath: string|URL, targetPath: string|URL, options?: LeafSymlinkOptions): void;
/** Truncate or expand a file until it reaches the desired size. */
export function truncate(name: string, size?: number): Promise<void>;
/** The synchronous variant of `truncate`. */
export function truncateSync(name: string, size?: number): void;
/** Retrieve the current process umask. If `mask` is provided, set the process umask to the provided mask, then return the previous umask. */
export function umask(mask?: number): number;
/** Change the access and modification time, akin to `touch -c -a` and `touch -c -m`. Time can be either UNIX epoch seconds or Date objects. */
export function utime(path: string|URL, atime: number|Date, mtime: number|Date): Promise<void>;
/** The synchronous variant of `utime`. */
export function utimeSync(path: string|URL, atime: number|Date, mtime: number|Date): void;
/**  */
export function watchFs(path: string|URL, options?: LeafWatchOptions): LeafFsWatcher;
/** Write binary data to the specified path. */
export function writeFile(path: string|URL, data: Uint8Array|ReadableStream<Uint8Array>, options?: LeafWriteFileOptions): Promise<void>;
/** The synchronous variant of `writeFile`. */
export function writeFileSync(path: string|URL, data: Uint8Array, options?: LeafWriteFileOptions): void;
/** Write text data to the specified path. */
export function writeTextFile(path: string|URL, data: string|ReadableStream<string>, options?: LeafWriteFileOptions): Promise<void>;
/** The synchronous variant of `writeFile`. */
export function writeTextFileSync(path: string|URL, data: string, options?: LeafWriteFileOptions): void;