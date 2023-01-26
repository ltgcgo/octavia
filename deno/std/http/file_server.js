#!/usr/bin/env -S deno run --allow-net --allow-read
// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const osType = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                    end = firstNonSlashEnd;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                    }
                }
            }
        }
        if (end === -1) return "";
        if (start === end) end = firstNonSlashEnd;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename1(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (isPosixPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                    end = firstNonSlashEnd;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                    }
                }
            }
        }
        if (end === -1) return "";
        if (start === end) end = firstNonSlashEnd;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (isPosixPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2  } = path1;
const extensions = new Map();
function consumeToken(v) {
    const notPos = indexOf(v, isNotTokenChar);
    if (notPos == -1) {
        return [
            v,
            ""
        ];
    }
    if (notPos == 0) {
        return [
            "",
            v
        ];
    }
    return [
        v.slice(0, notPos),
        v.slice(notPos)
    ];
}
function consumeValue(v) {
    if (!v) {
        return [
            "",
            v
        ];
    }
    if (v[0] !== `"`) {
        return consumeToken(v);
    }
    let value = "";
    for(let i = 1; i < v.length; i++){
        const r = v[i];
        if (r === `"`) {
            return [
                value,
                v.slice(i + 1)
            ];
        }
        if (r === "\\" && i + 1 < v.length && isTSpecial(v[i + 1])) {
            value += v[i + 1];
            i++;
            continue;
        }
        if (r === "\r" || r === "\n") {
            return [
                "",
                v
            ];
        }
        value += v[i];
    }
    return [
        "",
        v
    ];
}
function consumeMediaParam(v) {
    let rest = v.trimStart();
    if (!rest.startsWith(";")) {
        return [
            "",
            "",
            v
        ];
    }
    rest = rest.slice(1);
    rest = rest.trimStart();
    let param;
    [param, rest] = consumeToken(rest);
    param = param.toLowerCase();
    if (!param) {
        return [
            "",
            "",
            v
        ];
    }
    rest = rest.slice(1);
    rest = rest.trimStart();
    const [value, rest2] = consumeValue(rest);
    if (value == "" && rest2 === rest) {
        return [
            "",
            "",
            v
        ];
    }
    rest = rest2;
    return [
        param,
        value,
        rest
    ];
}
function decode2331Encoding(v) {
    const sv = v.split(`'`, 3);
    if (sv.length !== 3) {
        return undefined;
    }
    const charset = sv[0].toLowerCase();
    if (!charset) {
        return undefined;
    }
    if (charset != "us-ascii" && charset != "utf-8") {
        return undefined;
    }
    const encv = decodeURI(sv[2]);
    if (!encv) {
        return undefined;
    }
    return encv;
}
function indexOf(s, fn) {
    let i = -1;
    for (const v of s){
        i++;
        if (fn(v)) {
            return i;
        }
    }
    return -1;
}
function isIterator(obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === "function";
}
function isToken(s) {
    if (!s) {
        return false;
    }
    return indexOf(s, isNotTokenChar) < 0;
}
function isNotTokenChar(r) {
    return !isTokenChar(r);
}
function isTokenChar(r) {
    const code = r.charCodeAt(0);
    return code > 0x20 && code < 0x7f && !isTSpecial(r);
}
function isTSpecial(r) {
    return `()<>@,;:\\"/[]?=`.includes(r[0]);
}
const CHAR_CODE_SPACE = " ".charCodeAt(0);
const CHAR_CODE_TILDE = "~".charCodeAt(0);
function needsEncoding(s) {
    for (const b of s){
        const charCode = b.charCodeAt(0);
        if ((charCode < CHAR_CODE_SPACE || charCode > CHAR_CODE_TILDE) && b !== "\t") {
            return true;
        }
    }
    return false;
}
function parseMediaType(v) {
    const [base] = v.split(";");
    const mediaType = base.toLowerCase().trim();
    const params = {};
    const continuation = new Map();
    v = v.slice(base.length);
    while(v.length){
        v = v.trimStart();
        if (v.length === 0) {
            break;
        }
        const [key, value, rest] = consumeMediaParam(v);
        if (!key) {
            if (rest.trim() === ";") {
                break;
            }
            throw new TypeError("Invalid media parameter.");
        }
        let pmap = params;
        const [baseName, rest2] = key.split("*");
        if (baseName && rest2 != null) {
            if (!continuation.has(baseName)) {
                continuation.set(baseName, {});
            }
            pmap = continuation.get(baseName);
        }
        if (key in pmap) {
            throw new TypeError("Duplicate key parsed.");
        }
        pmap[key] = value;
        v = rest;
    }
    let str = "";
    for (const [key1, pieceMap] of continuation){
        const singlePartKey = `${key1}*`;
        const v1 = pieceMap[singlePartKey];
        if (v1) {
            const decv = decode2331Encoding(v1);
            if (decv) {
                params[key1] = decv;
            }
            continue;
        }
        str = "";
        let valid = false;
        for(let n = 0;; n++){
            const simplePart = `${key1}*${n}`;
            let v2 = pieceMap[simplePart];
            if (v2) {
                valid = true;
                str += v2;
                continue;
            }
            const encodedPart = `${simplePart}*`;
            v2 = pieceMap[encodedPart];
            if (!v2) {
                break;
            }
            valid = true;
            if (n === 0) {
                const decv1 = decode2331Encoding(v2);
                if (decv1) {
                    str += decv1;
                }
            } else {
                const decv2 = decodeURI(v2);
                str += decv2;
            }
        }
        if (valid) {
            params[key1] = str;
        }
    }
    return Object.keys(params).length ? [
        mediaType,
        params
    ] : [
        mediaType,
        undefined
    ];
}
const __default = {
    "application/1d-interleaved-parityfec": {
        "source": "iana"
    },
    "application/3gpdash-qoe-report+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/3gpp-ims+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/3gpphal+json": {
        "source": "iana",
        "compressible": true
    },
    "application/3gpphalforms+json": {
        "source": "iana",
        "compressible": true
    },
    "application/a2l": {
        "source": "iana"
    },
    "application/ace+cbor": {
        "source": "iana"
    },
    "application/activemessage": {
        "source": "iana"
    },
    "application/activity+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-costmap+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-costmapfilter+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-directory+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-endpointcost+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-endpointcostparams+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-endpointprop+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-endpointpropparams+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-error+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-networkmap+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-networkmapfilter+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-updatestreamcontrol+json": {
        "source": "iana",
        "compressible": true
    },
    "application/alto-updatestreamparams+json": {
        "source": "iana",
        "compressible": true
    },
    "application/aml": {
        "source": "iana"
    },
    "application/andrew-inset": {
        "source": "iana",
        "extensions": [
            "ez"
        ]
    },
    "application/applefile": {
        "source": "iana"
    },
    "application/applixware": {
        "source": "apache",
        "extensions": [
            "aw"
        ]
    },
    "application/at+jwt": {
        "source": "iana"
    },
    "application/atf": {
        "source": "iana"
    },
    "application/atfx": {
        "source": "iana"
    },
    "application/atom+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "atom"
        ]
    },
    "application/atomcat+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "atomcat"
        ]
    },
    "application/atomdeleted+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "atomdeleted"
        ]
    },
    "application/atomicmail": {
        "source": "iana"
    },
    "application/atomsvc+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "atomsvc"
        ]
    },
    "application/atsc-dwd+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "dwd"
        ]
    },
    "application/atsc-dynamic-event-message": {
        "source": "iana"
    },
    "application/atsc-held+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "held"
        ]
    },
    "application/atsc-rdt+json": {
        "source": "iana",
        "compressible": true
    },
    "application/atsc-rsat+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rsat"
        ]
    },
    "application/atxml": {
        "source": "iana"
    },
    "application/auth-policy+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/bacnet-xdd+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/batch-smtp": {
        "source": "iana"
    },
    "application/bdoc": {
        "compressible": false,
        "extensions": [
            "bdoc"
        ]
    },
    "application/beep+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/calendar+json": {
        "source": "iana",
        "compressible": true
    },
    "application/calendar+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xcs"
        ]
    },
    "application/call-completion": {
        "source": "iana"
    },
    "application/cals-1840": {
        "source": "iana"
    },
    "application/captive+json": {
        "source": "iana",
        "compressible": true
    },
    "application/cbor": {
        "source": "iana"
    },
    "application/cbor-seq": {
        "source": "iana"
    },
    "application/cccex": {
        "source": "iana"
    },
    "application/ccmp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/ccxml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ccxml"
        ]
    },
    "application/cdfx+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "cdfx"
        ]
    },
    "application/cdmi-capability": {
        "source": "iana",
        "extensions": [
            "cdmia"
        ]
    },
    "application/cdmi-container": {
        "source": "iana",
        "extensions": [
            "cdmic"
        ]
    },
    "application/cdmi-domain": {
        "source": "iana",
        "extensions": [
            "cdmid"
        ]
    },
    "application/cdmi-object": {
        "source": "iana",
        "extensions": [
            "cdmio"
        ]
    },
    "application/cdmi-queue": {
        "source": "iana",
        "extensions": [
            "cdmiq"
        ]
    },
    "application/cdni": {
        "source": "iana"
    },
    "application/cea": {
        "source": "iana"
    },
    "application/cea-2018+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/cellml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/cfw": {
        "source": "iana"
    },
    "application/city+json": {
        "source": "iana",
        "compressible": true
    },
    "application/clr": {
        "source": "iana"
    },
    "application/clue+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/clue_info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/cms": {
        "source": "iana"
    },
    "application/cnrp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/coap-group+json": {
        "source": "iana",
        "compressible": true
    },
    "application/coap-payload": {
        "source": "iana"
    },
    "application/commonground": {
        "source": "iana"
    },
    "application/conference-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/cose": {
        "source": "iana"
    },
    "application/cose-key": {
        "source": "iana"
    },
    "application/cose-key-set": {
        "source": "iana"
    },
    "application/cpl+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "cpl"
        ]
    },
    "application/csrattrs": {
        "source": "iana"
    },
    "application/csta+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/cstadata+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/csvm+json": {
        "source": "iana",
        "compressible": true
    },
    "application/cu-seeme": {
        "source": "apache",
        "extensions": [
            "cu"
        ]
    },
    "application/cwt": {
        "source": "iana"
    },
    "application/cybercash": {
        "source": "iana"
    },
    "application/dart": {
        "compressible": true
    },
    "application/dash+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mpd"
        ]
    },
    "application/dash-patch+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mpp"
        ]
    },
    "application/dashdelta": {
        "source": "iana"
    },
    "application/davmount+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "davmount"
        ]
    },
    "application/dca-rft": {
        "source": "iana"
    },
    "application/dcd": {
        "source": "iana"
    },
    "application/dec-dx": {
        "source": "iana"
    },
    "application/dialog-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/dicom": {
        "source": "iana"
    },
    "application/dicom+json": {
        "source": "iana",
        "compressible": true
    },
    "application/dicom+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/dii": {
        "source": "iana"
    },
    "application/dit": {
        "source": "iana"
    },
    "application/dns": {
        "source": "iana"
    },
    "application/dns+json": {
        "source": "iana",
        "compressible": true
    },
    "application/dns-message": {
        "source": "iana"
    },
    "application/docbook+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "dbk"
        ]
    },
    "application/dots+cbor": {
        "source": "iana"
    },
    "application/dskpp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/dssc+der": {
        "source": "iana",
        "extensions": [
            "dssc"
        ]
    },
    "application/dssc+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xdssc"
        ]
    },
    "application/dvcs": {
        "source": "iana"
    },
    "application/ecmascript": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "es",
            "ecma"
        ]
    },
    "application/edi-consent": {
        "source": "iana"
    },
    "application/edi-x12": {
        "source": "iana",
        "compressible": false
    },
    "application/edifact": {
        "source": "iana",
        "compressible": false
    },
    "application/efi": {
        "source": "iana"
    },
    "application/elm+json": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/elm+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.cap+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/emergencycalldata.comment+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.control+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.deviceinfo+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.ecall.msd": {
        "source": "iana"
    },
    "application/emergencycalldata.providerinfo+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.serviceinfo+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.subscriberinfo+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emergencycalldata.veds+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/emma+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "emma"
        ]
    },
    "application/emotionml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "emotionml"
        ]
    },
    "application/encaprtp": {
        "source": "iana"
    },
    "application/epp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/epub+zip": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "epub"
        ]
    },
    "application/eshop": {
        "source": "iana"
    },
    "application/exi": {
        "source": "iana",
        "extensions": [
            "exi"
        ]
    },
    "application/expect-ct-report+json": {
        "source": "iana",
        "compressible": true
    },
    "application/express": {
        "source": "iana",
        "extensions": [
            "exp"
        ]
    },
    "application/fastinfoset": {
        "source": "iana"
    },
    "application/fastsoap": {
        "source": "iana"
    },
    "application/fdt+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "fdt"
        ]
    },
    "application/fhir+json": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/fhir+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/fido.trusted-apps+json": {
        "compressible": true
    },
    "application/fits": {
        "source": "iana"
    },
    "application/flexfec": {
        "source": "iana"
    },
    "application/font-sfnt": {
        "source": "iana"
    },
    "application/font-tdpfr": {
        "source": "iana",
        "extensions": [
            "pfr"
        ]
    },
    "application/font-woff": {
        "source": "iana",
        "compressible": false
    },
    "application/framework-attributes+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/geo+json": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "geojson"
        ]
    },
    "application/geo+json-seq": {
        "source": "iana"
    },
    "application/geopackage+sqlite3": {
        "source": "iana"
    },
    "application/geoxacml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/gltf-buffer": {
        "source": "iana"
    },
    "application/gml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "gml"
        ]
    },
    "application/gpx+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "gpx"
        ]
    },
    "application/gxf": {
        "source": "apache",
        "extensions": [
            "gxf"
        ]
    },
    "application/gzip": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "gz"
        ]
    },
    "application/h224": {
        "source": "iana"
    },
    "application/held+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/hjson": {
        "extensions": [
            "hjson"
        ]
    },
    "application/http": {
        "source": "iana"
    },
    "application/hyperstudio": {
        "source": "iana",
        "extensions": [
            "stk"
        ]
    },
    "application/ibe-key-request+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/ibe-pkg-reply+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/ibe-pp-data": {
        "source": "iana"
    },
    "application/iges": {
        "source": "iana"
    },
    "application/im-iscomposing+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/index": {
        "source": "iana"
    },
    "application/index.cmd": {
        "source": "iana"
    },
    "application/index.obj": {
        "source": "iana"
    },
    "application/index.response": {
        "source": "iana"
    },
    "application/index.vnd": {
        "source": "iana"
    },
    "application/inkml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ink",
            "inkml"
        ]
    },
    "application/iotp": {
        "source": "iana"
    },
    "application/ipfix": {
        "source": "iana",
        "extensions": [
            "ipfix"
        ]
    },
    "application/ipp": {
        "source": "iana"
    },
    "application/isup": {
        "source": "iana"
    },
    "application/its+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "its"
        ]
    },
    "application/java-archive": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "jar",
            "war",
            "ear"
        ]
    },
    "application/java-serialized-object": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "ser"
        ]
    },
    "application/java-vm": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "class"
        ]
    },
    "application/javascript": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "js",
            "mjs"
        ]
    },
    "application/jf2feed+json": {
        "source": "iana",
        "compressible": true
    },
    "application/jose": {
        "source": "iana"
    },
    "application/jose+json": {
        "source": "iana",
        "compressible": true
    },
    "application/jrd+json": {
        "source": "iana",
        "compressible": true
    },
    "application/jscalendar+json": {
        "source": "iana",
        "compressible": true
    },
    "application/json": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "json",
            "map"
        ]
    },
    "application/json-patch+json": {
        "source": "iana",
        "compressible": true
    },
    "application/json-seq": {
        "source": "iana"
    },
    "application/json5": {
        "extensions": [
            "json5"
        ]
    },
    "application/jsonml+json": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "jsonml"
        ]
    },
    "application/jwk+json": {
        "source": "iana",
        "compressible": true
    },
    "application/jwk-set+json": {
        "source": "iana",
        "compressible": true
    },
    "application/jwt": {
        "source": "iana"
    },
    "application/kpml-request+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/kpml-response+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/ld+json": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "jsonld"
        ]
    },
    "application/lgr+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "lgr"
        ]
    },
    "application/link-format": {
        "source": "iana"
    },
    "application/load-control+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/lost+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "lostxml"
        ]
    },
    "application/lostsync+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/lpf+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/lxf": {
        "source": "iana"
    },
    "application/mac-binhex40": {
        "source": "iana",
        "extensions": [
            "hqx"
        ]
    },
    "application/mac-compactpro": {
        "source": "apache",
        "extensions": [
            "cpt"
        ]
    },
    "application/macwriteii": {
        "source": "iana"
    },
    "application/mads+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mads"
        ]
    },
    "application/manifest+json": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "webmanifest"
        ]
    },
    "application/marc": {
        "source": "iana",
        "extensions": [
            "mrc"
        ]
    },
    "application/marcxml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mrcx"
        ]
    },
    "application/mathematica": {
        "source": "iana",
        "extensions": [
            "ma",
            "nb",
            "mb"
        ]
    },
    "application/mathml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mathml"
        ]
    },
    "application/mathml-content+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mathml-presentation+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-associated-procedure-description+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-deregister+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-envelope+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-msk+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-msk-response+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-protection-description+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-reception-report+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-register+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-register-response+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-schedule+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbms-user-service-description+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mbox": {
        "source": "iana",
        "extensions": [
            "mbox"
        ]
    },
    "application/media-policy-dataset+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mpf"
        ]
    },
    "application/media_control+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mediaservercontrol+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mscml"
        ]
    },
    "application/merge-patch+json": {
        "source": "iana",
        "compressible": true
    },
    "application/metalink+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "metalink"
        ]
    },
    "application/metalink4+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "meta4"
        ]
    },
    "application/mets+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mets"
        ]
    },
    "application/mf4": {
        "source": "iana"
    },
    "application/mikey": {
        "source": "iana"
    },
    "application/mipc": {
        "source": "iana"
    },
    "application/missing-blocks+cbor-seq": {
        "source": "iana"
    },
    "application/mmt-aei+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "maei"
        ]
    },
    "application/mmt-usd+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "musd"
        ]
    },
    "application/mods+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mods"
        ]
    },
    "application/moss-keys": {
        "source": "iana"
    },
    "application/moss-signature": {
        "source": "iana"
    },
    "application/mosskey-data": {
        "source": "iana"
    },
    "application/mosskey-request": {
        "source": "iana"
    },
    "application/mp21": {
        "source": "iana",
        "extensions": [
            "m21",
            "mp21"
        ]
    },
    "application/mp4": {
        "source": "iana",
        "extensions": [
            "mp4s",
            "m4p"
        ]
    },
    "application/mpeg4-generic": {
        "source": "iana"
    },
    "application/mpeg4-iod": {
        "source": "iana"
    },
    "application/mpeg4-iod-xmt": {
        "source": "iana"
    },
    "application/mrb-consumer+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/mrb-publish+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/msc-ivr+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/msc-mixer+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/msword": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "doc",
            "dot"
        ]
    },
    "application/mud+json": {
        "source": "iana",
        "compressible": true
    },
    "application/multipart-core": {
        "source": "iana"
    },
    "application/mxf": {
        "source": "iana",
        "extensions": [
            "mxf"
        ]
    },
    "application/n-quads": {
        "source": "iana",
        "extensions": [
            "nq"
        ]
    },
    "application/n-triples": {
        "source": "iana",
        "extensions": [
            "nt"
        ]
    },
    "application/nasdata": {
        "source": "iana"
    },
    "application/news-checkgroups": {
        "source": "iana",
        "charset": "US-ASCII"
    },
    "application/news-groupinfo": {
        "source": "iana",
        "charset": "US-ASCII"
    },
    "application/news-transmission": {
        "source": "iana"
    },
    "application/nlsml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/node": {
        "source": "iana",
        "extensions": [
            "cjs"
        ]
    },
    "application/nss": {
        "source": "iana"
    },
    "application/oauth-authz-req+jwt": {
        "source": "iana"
    },
    "application/oblivious-dns-message": {
        "source": "iana"
    },
    "application/ocsp-request": {
        "source": "iana"
    },
    "application/ocsp-response": {
        "source": "iana"
    },
    "application/octet-stream": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "bin",
            "dms",
            "lrf",
            "mar",
            "so",
            "dist",
            "distz",
            "pkg",
            "bpk",
            "dump",
            "elc",
            "deploy",
            "exe",
            "dll",
            "deb",
            "dmg",
            "iso",
            "img",
            "msi",
            "msp",
            "msm",
            "buffer"
        ]
    },
    "application/oda": {
        "source": "iana",
        "extensions": [
            "oda"
        ]
    },
    "application/odm+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/odx": {
        "source": "iana"
    },
    "application/oebps-package+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "opf"
        ]
    },
    "application/ogg": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "ogx"
        ]
    },
    "application/omdoc+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "omdoc"
        ]
    },
    "application/onenote": {
        "source": "apache",
        "extensions": [
            "onetoc",
            "onetoc2",
            "onetmp",
            "onepkg"
        ]
    },
    "application/opc-nodeset+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/oscore": {
        "source": "iana"
    },
    "application/oxps": {
        "source": "iana",
        "extensions": [
            "oxps"
        ]
    },
    "application/p21": {
        "source": "iana"
    },
    "application/p21+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/p2p-overlay+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "relo"
        ]
    },
    "application/parityfec": {
        "source": "iana"
    },
    "application/passport": {
        "source": "iana"
    },
    "application/patch-ops-error+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xer"
        ]
    },
    "application/pdf": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "pdf"
        ]
    },
    "application/pdx": {
        "source": "iana"
    },
    "application/pem-certificate-chain": {
        "source": "iana"
    },
    "application/pgp-encrypted": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "pgp"
        ]
    },
    "application/pgp-keys": {
        "source": "iana",
        "extensions": [
            "asc"
        ]
    },
    "application/pgp-signature": {
        "source": "iana",
        "extensions": [
            "asc",
            "sig"
        ]
    },
    "application/pics-rules": {
        "source": "apache",
        "extensions": [
            "prf"
        ]
    },
    "application/pidf+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/pidf-diff+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/pkcs10": {
        "source": "iana",
        "extensions": [
            "p10"
        ]
    },
    "application/pkcs12": {
        "source": "iana"
    },
    "application/pkcs7-mime": {
        "source": "iana",
        "extensions": [
            "p7m",
            "p7c"
        ]
    },
    "application/pkcs7-signature": {
        "source": "iana",
        "extensions": [
            "p7s"
        ]
    },
    "application/pkcs8": {
        "source": "iana",
        "extensions": [
            "p8"
        ]
    },
    "application/pkcs8-encrypted": {
        "source": "iana"
    },
    "application/pkix-attr-cert": {
        "source": "iana",
        "extensions": [
            "ac"
        ]
    },
    "application/pkix-cert": {
        "source": "iana",
        "extensions": [
            "cer"
        ]
    },
    "application/pkix-crl": {
        "source": "iana",
        "extensions": [
            "crl"
        ]
    },
    "application/pkix-pkipath": {
        "source": "iana",
        "extensions": [
            "pkipath"
        ]
    },
    "application/pkixcmp": {
        "source": "iana",
        "extensions": [
            "pki"
        ]
    },
    "application/pls+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "pls"
        ]
    },
    "application/poc-settings+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/postscript": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ai",
            "eps",
            "ps"
        ]
    },
    "application/ppsp-tracker+json": {
        "source": "iana",
        "compressible": true
    },
    "application/problem+json": {
        "source": "iana",
        "compressible": true
    },
    "application/problem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/provenance+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "provx"
        ]
    },
    "application/prs.alvestrand.titrax-sheet": {
        "source": "iana"
    },
    "application/prs.cww": {
        "source": "iana",
        "extensions": [
            "cww"
        ]
    },
    "application/prs.cyn": {
        "source": "iana",
        "charset": "7-BIT"
    },
    "application/prs.hpub+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/prs.nprend": {
        "source": "iana"
    },
    "application/prs.plucker": {
        "source": "iana"
    },
    "application/prs.rdf-xml-crypt": {
        "source": "iana"
    },
    "application/prs.xsf+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/pskc+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "pskcxml"
        ]
    },
    "application/pvd+json": {
        "source": "iana",
        "compressible": true
    },
    "application/qsig": {
        "source": "iana"
    },
    "application/raml+yaml": {
        "compressible": true,
        "extensions": [
            "raml"
        ]
    },
    "application/raptorfec": {
        "source": "iana"
    },
    "application/rdap+json": {
        "source": "iana",
        "compressible": true
    },
    "application/rdf+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rdf",
            "owl"
        ]
    },
    "application/reginfo+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rif"
        ]
    },
    "application/relax-ng-compact-syntax": {
        "source": "iana",
        "extensions": [
            "rnc"
        ]
    },
    "application/remote-printing": {
        "source": "iana"
    },
    "application/reputon+json": {
        "source": "iana",
        "compressible": true
    },
    "application/resource-lists+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rl"
        ]
    },
    "application/resource-lists-diff+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rld"
        ]
    },
    "application/rfc+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/riscos": {
        "source": "iana"
    },
    "application/rlmi+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/rls-services+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rs"
        ]
    },
    "application/route-apd+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rapd"
        ]
    },
    "application/route-s-tsid+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "sls"
        ]
    },
    "application/route-usd+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rusd"
        ]
    },
    "application/rpki-ghostbusters": {
        "source": "iana",
        "extensions": [
            "gbr"
        ]
    },
    "application/rpki-manifest": {
        "source": "iana",
        "extensions": [
            "mft"
        ]
    },
    "application/rpki-publication": {
        "source": "iana"
    },
    "application/rpki-roa": {
        "source": "iana",
        "extensions": [
            "roa"
        ]
    },
    "application/rpki-updown": {
        "source": "iana"
    },
    "application/rsd+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "rsd"
        ]
    },
    "application/rss+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "rss"
        ]
    },
    "application/rtf": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rtf"
        ]
    },
    "application/rtploopback": {
        "source": "iana"
    },
    "application/rtx": {
        "source": "iana"
    },
    "application/samlassertion+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/samlmetadata+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/sarif+json": {
        "source": "iana",
        "compressible": true
    },
    "application/sarif-external-properties+json": {
        "source": "iana",
        "compressible": true
    },
    "application/sbe": {
        "source": "iana"
    },
    "application/sbml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "sbml"
        ]
    },
    "application/scaip+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/scim+json": {
        "source": "iana",
        "compressible": true
    },
    "application/scvp-cv-request": {
        "source": "iana",
        "extensions": [
            "scq"
        ]
    },
    "application/scvp-cv-response": {
        "source": "iana",
        "extensions": [
            "scs"
        ]
    },
    "application/scvp-vp-request": {
        "source": "iana",
        "extensions": [
            "spq"
        ]
    },
    "application/scvp-vp-response": {
        "source": "iana",
        "extensions": [
            "spp"
        ]
    },
    "application/sdp": {
        "source": "iana",
        "extensions": [
            "sdp"
        ]
    },
    "application/secevent+jwt": {
        "source": "iana"
    },
    "application/senml+cbor": {
        "source": "iana"
    },
    "application/senml+json": {
        "source": "iana",
        "compressible": true
    },
    "application/senml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "senmlx"
        ]
    },
    "application/senml-etch+cbor": {
        "source": "iana"
    },
    "application/senml-etch+json": {
        "source": "iana",
        "compressible": true
    },
    "application/senml-exi": {
        "source": "iana"
    },
    "application/sensml+cbor": {
        "source": "iana"
    },
    "application/sensml+json": {
        "source": "iana",
        "compressible": true
    },
    "application/sensml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "sensmlx"
        ]
    },
    "application/sensml-exi": {
        "source": "iana"
    },
    "application/sep+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/sep-exi": {
        "source": "iana"
    },
    "application/session-info": {
        "source": "iana"
    },
    "application/set-payment": {
        "source": "iana"
    },
    "application/set-payment-initiation": {
        "source": "iana",
        "extensions": [
            "setpay"
        ]
    },
    "application/set-registration": {
        "source": "iana"
    },
    "application/set-registration-initiation": {
        "source": "iana",
        "extensions": [
            "setreg"
        ]
    },
    "application/sgml": {
        "source": "iana"
    },
    "application/sgml-open-catalog": {
        "source": "iana"
    },
    "application/shf+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "shf"
        ]
    },
    "application/sieve": {
        "source": "iana",
        "extensions": [
            "siv",
            "sieve"
        ]
    },
    "application/simple-filter+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/simple-message-summary": {
        "source": "iana"
    },
    "application/simplesymbolcontainer": {
        "source": "iana"
    },
    "application/sipc": {
        "source": "iana"
    },
    "application/slate": {
        "source": "iana"
    },
    "application/smil": {
        "source": "iana"
    },
    "application/smil+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "smi",
            "smil"
        ]
    },
    "application/smpte336m": {
        "source": "iana"
    },
    "application/soap+fastinfoset": {
        "source": "iana"
    },
    "application/soap+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/sparql-query": {
        "source": "iana",
        "extensions": [
            "rq"
        ]
    },
    "application/sparql-results+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "srx"
        ]
    },
    "application/spdx+json": {
        "source": "iana",
        "compressible": true
    },
    "application/spirits-event+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/sql": {
        "source": "iana"
    },
    "application/srgs": {
        "source": "iana",
        "extensions": [
            "gram"
        ]
    },
    "application/srgs+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "grxml"
        ]
    },
    "application/sru+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "sru"
        ]
    },
    "application/ssdl+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "ssdl"
        ]
    },
    "application/ssml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ssml"
        ]
    },
    "application/stix+json": {
        "source": "iana",
        "compressible": true
    },
    "application/swid+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "swidtag"
        ]
    },
    "application/tamp-apex-update": {
        "source": "iana"
    },
    "application/tamp-apex-update-confirm": {
        "source": "iana"
    },
    "application/tamp-community-update": {
        "source": "iana"
    },
    "application/tamp-community-update-confirm": {
        "source": "iana"
    },
    "application/tamp-error": {
        "source": "iana"
    },
    "application/tamp-sequence-adjust": {
        "source": "iana"
    },
    "application/tamp-sequence-adjust-confirm": {
        "source": "iana"
    },
    "application/tamp-status-query": {
        "source": "iana"
    },
    "application/tamp-status-response": {
        "source": "iana"
    },
    "application/tamp-update": {
        "source": "iana"
    },
    "application/tamp-update-confirm": {
        "source": "iana"
    },
    "application/tar": {
        "compressible": true
    },
    "application/taxii+json": {
        "source": "iana",
        "compressible": true
    },
    "application/td+json": {
        "source": "iana",
        "compressible": true
    },
    "application/tei+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "tei",
            "teicorpus"
        ]
    },
    "application/tetra_isi": {
        "source": "iana"
    },
    "application/thraud+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "tfi"
        ]
    },
    "application/timestamp-query": {
        "source": "iana"
    },
    "application/timestamp-reply": {
        "source": "iana"
    },
    "application/timestamped-data": {
        "source": "iana",
        "extensions": [
            "tsd"
        ]
    },
    "application/tlsrpt+gzip": {
        "source": "iana"
    },
    "application/tlsrpt+json": {
        "source": "iana",
        "compressible": true
    },
    "application/tnauthlist": {
        "source": "iana"
    },
    "application/token-introspection+jwt": {
        "source": "iana"
    },
    "application/toml": {
        "compressible": true,
        "extensions": [
            "toml"
        ]
    },
    "application/trickle-ice-sdpfrag": {
        "source": "iana"
    },
    "application/trig": {
        "source": "iana",
        "extensions": [
            "trig"
        ]
    },
    "application/ttml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ttml"
        ]
    },
    "application/tve-trigger": {
        "source": "iana"
    },
    "application/tzif": {
        "source": "iana"
    },
    "application/tzif-leap": {
        "source": "iana"
    },
    "application/ubjson": {
        "compressible": false,
        "extensions": [
            "ubj"
        ]
    },
    "application/ulpfec": {
        "source": "iana"
    },
    "application/urc-grpsheet+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/urc-ressheet+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rsheet"
        ]
    },
    "application/urc-targetdesc+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "td"
        ]
    },
    "application/urc-uisocketdesc+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vcard+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vcard+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vemmi": {
        "source": "iana"
    },
    "application/vividence.scriptfile": {
        "source": "apache"
    },
    "application/vnd.1000minds.decision-model+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "1km"
        ]
    },
    "application/vnd.3gpp-prose+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp-prose-pc3ch+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp-v2x-local-service-information": {
        "source": "iana"
    },
    "application/vnd.3gpp.5gnas": {
        "source": "iana"
    },
    "application/vnd.3gpp.access-transfer-events+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.bsf+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.gmop+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.gtpc": {
        "source": "iana"
    },
    "application/vnd.3gpp.interworking-data": {
        "source": "iana"
    },
    "application/vnd.3gpp.lpp": {
        "source": "iana"
    },
    "application/vnd.3gpp.mc-signalling-ear": {
        "source": "iana"
    },
    "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcdata-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcdata-payload": {
        "source": "iana"
    },
    "application/vnd.3gpp.mcdata-service-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcdata-signalling": {
        "source": "iana"
    },
    "application/vnd.3gpp.mcdata-ue-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcdata-user-profile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-floor-request+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-location-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-service-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-signed+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-ue-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcptt-user-profile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-location-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-service-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-ue-config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mcvideo-user-profile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.mid-call+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.ngap": {
        "source": "iana"
    },
    "application/vnd.3gpp.pfcp": {
        "source": "iana"
    },
    "application/vnd.3gpp.pic-bw-large": {
        "source": "iana",
        "extensions": [
            "plb"
        ]
    },
    "application/vnd.3gpp.pic-bw-small": {
        "source": "iana",
        "extensions": [
            "psb"
        ]
    },
    "application/vnd.3gpp.pic-bw-var": {
        "source": "iana",
        "extensions": [
            "pvb"
        ]
    },
    "application/vnd.3gpp.s1ap": {
        "source": "iana"
    },
    "application/vnd.3gpp.sms": {
        "source": "iana"
    },
    "application/vnd.3gpp.sms+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.srvcc-ext+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.srvcc-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.state-and-event-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp.ussd+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp2.bcmcsinfo+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.3gpp2.sms": {
        "source": "iana"
    },
    "application/vnd.3gpp2.tcap": {
        "source": "iana",
        "extensions": [
            "tcap"
        ]
    },
    "application/vnd.3lightssoftware.imagescal": {
        "source": "iana"
    },
    "application/vnd.3m.post-it-notes": {
        "source": "iana",
        "extensions": [
            "pwn"
        ]
    },
    "application/vnd.accpac.simply.aso": {
        "source": "iana",
        "extensions": [
            "aso"
        ]
    },
    "application/vnd.accpac.simply.imp": {
        "source": "iana",
        "extensions": [
            "imp"
        ]
    },
    "application/vnd.acucobol": {
        "source": "iana",
        "extensions": [
            "acu"
        ]
    },
    "application/vnd.acucorp": {
        "source": "iana",
        "extensions": [
            "atc",
            "acutc"
        ]
    },
    "application/vnd.adobe.air-application-installer-package+zip": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "air"
        ]
    },
    "application/vnd.adobe.flash.movie": {
        "source": "iana"
    },
    "application/vnd.adobe.formscentral.fcdt": {
        "source": "iana",
        "extensions": [
            "fcdt"
        ]
    },
    "application/vnd.adobe.fxp": {
        "source": "iana",
        "extensions": [
            "fxp",
            "fxpl"
        ]
    },
    "application/vnd.adobe.partial-upload": {
        "source": "iana"
    },
    "application/vnd.adobe.xdp+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xdp"
        ]
    },
    "application/vnd.adobe.xfdf": {
        "source": "iana",
        "extensions": [
            "xfdf"
        ]
    },
    "application/vnd.aether.imp": {
        "source": "iana"
    },
    "application/vnd.afpc.afplinedata": {
        "source": "iana"
    },
    "application/vnd.afpc.afplinedata-pagedef": {
        "source": "iana"
    },
    "application/vnd.afpc.cmoca-cmresource": {
        "source": "iana"
    },
    "application/vnd.afpc.foca-charset": {
        "source": "iana"
    },
    "application/vnd.afpc.foca-codedfont": {
        "source": "iana"
    },
    "application/vnd.afpc.foca-codepage": {
        "source": "iana"
    },
    "application/vnd.afpc.modca": {
        "source": "iana"
    },
    "application/vnd.afpc.modca-cmtable": {
        "source": "iana"
    },
    "application/vnd.afpc.modca-formdef": {
        "source": "iana"
    },
    "application/vnd.afpc.modca-mediummap": {
        "source": "iana"
    },
    "application/vnd.afpc.modca-objectcontainer": {
        "source": "iana"
    },
    "application/vnd.afpc.modca-overlay": {
        "source": "iana"
    },
    "application/vnd.afpc.modca-pagesegment": {
        "source": "iana"
    },
    "application/vnd.age": {
        "source": "iana",
        "extensions": [
            "age"
        ]
    },
    "application/vnd.ah-barcode": {
        "source": "iana"
    },
    "application/vnd.ahead.space": {
        "source": "iana",
        "extensions": [
            "ahead"
        ]
    },
    "application/vnd.airzip.filesecure.azf": {
        "source": "iana",
        "extensions": [
            "azf"
        ]
    },
    "application/vnd.airzip.filesecure.azs": {
        "source": "iana",
        "extensions": [
            "azs"
        ]
    },
    "application/vnd.amadeus+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.amazon.ebook": {
        "source": "apache",
        "extensions": [
            "azw"
        ]
    },
    "application/vnd.amazon.mobi8-ebook": {
        "source": "iana"
    },
    "application/vnd.americandynamics.acc": {
        "source": "iana",
        "extensions": [
            "acc"
        ]
    },
    "application/vnd.amiga.ami": {
        "source": "iana",
        "extensions": [
            "ami"
        ]
    },
    "application/vnd.amundsen.maze+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.android.ota": {
        "source": "iana"
    },
    "application/vnd.android.package-archive": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "apk"
        ]
    },
    "application/vnd.anki": {
        "source": "iana"
    },
    "application/vnd.anser-web-certificate-issue-initiation": {
        "source": "iana",
        "extensions": [
            "cii"
        ]
    },
    "application/vnd.anser-web-funds-transfer-initiation": {
        "source": "apache",
        "extensions": [
            "fti"
        ]
    },
    "application/vnd.antix.game-component": {
        "source": "iana",
        "extensions": [
            "atx"
        ]
    },
    "application/vnd.apache.arrow.file": {
        "source": "iana"
    },
    "application/vnd.apache.arrow.stream": {
        "source": "iana"
    },
    "application/vnd.apache.thrift.binary": {
        "source": "iana"
    },
    "application/vnd.apache.thrift.compact": {
        "source": "iana"
    },
    "application/vnd.apache.thrift.json": {
        "source": "iana"
    },
    "application/vnd.api+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.aplextor.warrp+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.apothekende.reservation+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.apple.installer+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mpkg"
        ]
    },
    "application/vnd.apple.keynote": {
        "source": "iana",
        "extensions": [
            "key"
        ]
    },
    "application/vnd.apple.mpegurl": {
        "source": "iana",
        "extensions": [
            "m3u8"
        ]
    },
    "application/vnd.apple.numbers": {
        "source": "iana",
        "extensions": [
            "numbers"
        ]
    },
    "application/vnd.apple.pages": {
        "source": "iana",
        "extensions": [
            "pages"
        ]
    },
    "application/vnd.apple.pkpass": {
        "compressible": false,
        "extensions": [
            "pkpass"
        ]
    },
    "application/vnd.arastra.swi": {
        "source": "iana"
    },
    "application/vnd.aristanetworks.swi": {
        "source": "iana",
        "extensions": [
            "swi"
        ]
    },
    "application/vnd.artisan+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.artsquare": {
        "source": "iana"
    },
    "application/vnd.astraea-software.iota": {
        "source": "iana",
        "extensions": [
            "iota"
        ]
    },
    "application/vnd.audiograph": {
        "source": "iana",
        "extensions": [
            "aep"
        ]
    },
    "application/vnd.autopackage": {
        "source": "iana"
    },
    "application/vnd.avalon+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.avistar+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.balsamiq.bmml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "bmml"
        ]
    },
    "application/vnd.balsamiq.bmpr": {
        "source": "iana"
    },
    "application/vnd.banana-accounting": {
        "source": "iana"
    },
    "application/vnd.bbf.usp.error": {
        "source": "iana"
    },
    "application/vnd.bbf.usp.msg": {
        "source": "iana"
    },
    "application/vnd.bbf.usp.msg+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.bekitzur-stech+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.bint.med-content": {
        "source": "iana"
    },
    "application/vnd.biopax.rdf+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.blink-idb-value-wrapper": {
        "source": "iana"
    },
    "application/vnd.blueice.multipass": {
        "source": "iana",
        "extensions": [
            "mpm"
        ]
    },
    "application/vnd.bluetooth.ep.oob": {
        "source": "iana"
    },
    "application/vnd.bluetooth.le.oob": {
        "source": "iana"
    },
    "application/vnd.bmi": {
        "source": "iana",
        "extensions": [
            "bmi"
        ]
    },
    "application/vnd.bpf": {
        "source": "iana"
    },
    "application/vnd.bpf3": {
        "source": "iana"
    },
    "application/vnd.businessobjects": {
        "source": "iana",
        "extensions": [
            "rep"
        ]
    },
    "application/vnd.byu.uapi+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.cab-jscript": {
        "source": "iana"
    },
    "application/vnd.canon-cpdl": {
        "source": "iana"
    },
    "application/vnd.canon-lips": {
        "source": "iana"
    },
    "application/vnd.capasystems-pg+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.cendio.thinlinc.clientconf": {
        "source": "iana"
    },
    "application/vnd.century-systems.tcp_stream": {
        "source": "iana"
    },
    "application/vnd.chemdraw+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "cdxml"
        ]
    },
    "application/vnd.chess-pgn": {
        "source": "iana"
    },
    "application/vnd.chipnuts.karaoke-mmd": {
        "source": "iana",
        "extensions": [
            "mmd"
        ]
    },
    "application/vnd.ciedi": {
        "source": "iana"
    },
    "application/vnd.cinderella": {
        "source": "iana",
        "extensions": [
            "cdy"
        ]
    },
    "application/vnd.cirpack.isdn-ext": {
        "source": "iana"
    },
    "application/vnd.citationstyles.style+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "csl"
        ]
    },
    "application/vnd.claymore": {
        "source": "iana",
        "extensions": [
            "cla"
        ]
    },
    "application/vnd.cloanto.rp9": {
        "source": "iana",
        "extensions": [
            "rp9"
        ]
    },
    "application/vnd.clonk.c4group": {
        "source": "iana",
        "extensions": [
            "c4g",
            "c4d",
            "c4f",
            "c4p",
            "c4u"
        ]
    },
    "application/vnd.cluetrust.cartomobile-config": {
        "source": "iana",
        "extensions": [
            "c11amc"
        ]
    },
    "application/vnd.cluetrust.cartomobile-config-pkg": {
        "source": "iana",
        "extensions": [
            "c11amz"
        ]
    },
    "application/vnd.coffeescript": {
        "source": "iana"
    },
    "application/vnd.collabio.xodocuments.document": {
        "source": "iana"
    },
    "application/vnd.collabio.xodocuments.document-template": {
        "source": "iana"
    },
    "application/vnd.collabio.xodocuments.presentation": {
        "source": "iana"
    },
    "application/vnd.collabio.xodocuments.presentation-template": {
        "source": "iana"
    },
    "application/vnd.collabio.xodocuments.spreadsheet": {
        "source": "iana"
    },
    "application/vnd.collabio.xodocuments.spreadsheet-template": {
        "source": "iana"
    },
    "application/vnd.collection+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.collection.doc+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.collection.next+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.comicbook+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.comicbook-rar": {
        "source": "iana"
    },
    "application/vnd.commerce-battelle": {
        "source": "iana"
    },
    "application/vnd.commonspace": {
        "source": "iana",
        "extensions": [
            "csp"
        ]
    },
    "application/vnd.contact.cmsg": {
        "source": "iana",
        "extensions": [
            "cdbcmsg"
        ]
    },
    "application/vnd.coreos.ignition+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.cosmocaller": {
        "source": "iana",
        "extensions": [
            "cmc"
        ]
    },
    "application/vnd.crick.clicker": {
        "source": "iana",
        "extensions": [
            "clkx"
        ]
    },
    "application/vnd.crick.clicker.keyboard": {
        "source": "iana",
        "extensions": [
            "clkk"
        ]
    },
    "application/vnd.crick.clicker.palette": {
        "source": "iana",
        "extensions": [
            "clkp"
        ]
    },
    "application/vnd.crick.clicker.template": {
        "source": "iana",
        "extensions": [
            "clkt"
        ]
    },
    "application/vnd.crick.clicker.wordbank": {
        "source": "iana",
        "extensions": [
            "clkw"
        ]
    },
    "application/vnd.criticaltools.wbs+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "wbs"
        ]
    },
    "application/vnd.cryptii.pipe+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.crypto-shade-file": {
        "source": "iana"
    },
    "application/vnd.cryptomator.encrypted": {
        "source": "iana"
    },
    "application/vnd.cryptomator.vault": {
        "source": "iana"
    },
    "application/vnd.ctc-posml": {
        "source": "iana",
        "extensions": [
            "pml"
        ]
    },
    "application/vnd.ctct.ws+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.cups-pdf": {
        "source": "iana"
    },
    "application/vnd.cups-postscript": {
        "source": "iana"
    },
    "application/vnd.cups-ppd": {
        "source": "iana",
        "extensions": [
            "ppd"
        ]
    },
    "application/vnd.cups-raster": {
        "source": "iana"
    },
    "application/vnd.cups-raw": {
        "source": "iana"
    },
    "application/vnd.curl": {
        "source": "iana"
    },
    "application/vnd.curl.car": {
        "source": "apache",
        "extensions": [
            "car"
        ]
    },
    "application/vnd.curl.pcurl": {
        "source": "apache",
        "extensions": [
            "pcurl"
        ]
    },
    "application/vnd.cyan.dean.root+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.cybank": {
        "source": "iana"
    },
    "application/vnd.cyclonedx+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.cyclonedx+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.d2l.coursepackage1p0+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.d3m-dataset": {
        "source": "iana"
    },
    "application/vnd.d3m-problem": {
        "source": "iana"
    },
    "application/vnd.dart": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "dart"
        ]
    },
    "application/vnd.data-vision.rdz": {
        "source": "iana",
        "extensions": [
            "rdz"
        ]
    },
    "application/vnd.datapackage+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dataresource+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dbf": {
        "source": "iana",
        "extensions": [
            "dbf"
        ]
    },
    "application/vnd.debian.binary-package": {
        "source": "iana"
    },
    "application/vnd.dece.data": {
        "source": "iana",
        "extensions": [
            "uvf",
            "uvvf",
            "uvd",
            "uvvd"
        ]
    },
    "application/vnd.dece.ttml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "uvt",
            "uvvt"
        ]
    },
    "application/vnd.dece.unspecified": {
        "source": "iana",
        "extensions": [
            "uvx",
            "uvvx"
        ]
    },
    "application/vnd.dece.zip": {
        "source": "iana",
        "extensions": [
            "uvz",
            "uvvz"
        ]
    },
    "application/vnd.denovo.fcselayout-link": {
        "source": "iana",
        "extensions": [
            "fe_launch"
        ]
    },
    "application/vnd.desmume.movie": {
        "source": "iana"
    },
    "application/vnd.dir-bi.plate-dl-nosuffix": {
        "source": "iana"
    },
    "application/vnd.dm.delegation+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dna": {
        "source": "iana",
        "extensions": [
            "dna"
        ]
    },
    "application/vnd.document+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dolby.mlp": {
        "source": "apache",
        "extensions": [
            "mlp"
        ]
    },
    "application/vnd.dolby.mobile.1": {
        "source": "iana"
    },
    "application/vnd.dolby.mobile.2": {
        "source": "iana"
    },
    "application/vnd.doremir.scorecloud-binary-document": {
        "source": "iana"
    },
    "application/vnd.dpgraph": {
        "source": "iana",
        "extensions": [
            "dpg"
        ]
    },
    "application/vnd.dreamfactory": {
        "source": "iana",
        "extensions": [
            "dfac"
        ]
    },
    "application/vnd.drive+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ds-keypoint": {
        "source": "apache",
        "extensions": [
            "kpxx"
        ]
    },
    "application/vnd.dtg.local": {
        "source": "iana"
    },
    "application/vnd.dtg.local.flash": {
        "source": "iana"
    },
    "application/vnd.dtg.local.html": {
        "source": "iana"
    },
    "application/vnd.dvb.ait": {
        "source": "iana",
        "extensions": [
            "ait"
        ]
    },
    "application/vnd.dvb.dvbisl+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.dvbj": {
        "source": "iana"
    },
    "application/vnd.dvb.esgcontainer": {
        "source": "iana"
    },
    "application/vnd.dvb.ipdcdftnotifaccess": {
        "source": "iana"
    },
    "application/vnd.dvb.ipdcesgaccess": {
        "source": "iana"
    },
    "application/vnd.dvb.ipdcesgaccess2": {
        "source": "iana"
    },
    "application/vnd.dvb.ipdcesgpdd": {
        "source": "iana"
    },
    "application/vnd.dvb.ipdcroaming": {
        "source": "iana"
    },
    "application/vnd.dvb.iptv.alfec-base": {
        "source": "iana"
    },
    "application/vnd.dvb.iptv.alfec-enhancement": {
        "source": "iana"
    },
    "application/vnd.dvb.notif-aggregate-root+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.notif-container+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.notif-generic+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.notif-ia-msglist+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.notif-ia-registration-request+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.notif-ia-registration-response+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.notif-init+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.dvb.pfr": {
        "source": "iana"
    },
    "application/vnd.dvb.service": {
        "source": "iana",
        "extensions": [
            "svc"
        ]
    },
    "application/vnd.dxr": {
        "source": "iana"
    },
    "application/vnd.dynageo": {
        "source": "iana",
        "extensions": [
            "geo"
        ]
    },
    "application/vnd.dzr": {
        "source": "iana"
    },
    "application/vnd.easykaraoke.cdgdownload": {
        "source": "iana"
    },
    "application/vnd.ecdis-update": {
        "source": "iana"
    },
    "application/vnd.ecip.rlp": {
        "source": "iana"
    },
    "application/vnd.eclipse.ditto+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ecowin.chart": {
        "source": "iana",
        "extensions": [
            "mag"
        ]
    },
    "application/vnd.ecowin.filerequest": {
        "source": "iana"
    },
    "application/vnd.ecowin.fileupdate": {
        "source": "iana"
    },
    "application/vnd.ecowin.series": {
        "source": "iana"
    },
    "application/vnd.ecowin.seriesrequest": {
        "source": "iana"
    },
    "application/vnd.ecowin.seriesupdate": {
        "source": "iana"
    },
    "application/vnd.efi.img": {
        "source": "iana"
    },
    "application/vnd.efi.iso": {
        "source": "iana"
    },
    "application/vnd.emclient.accessrequest+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.enliven": {
        "source": "iana",
        "extensions": [
            "nml"
        ]
    },
    "application/vnd.enphase.envoy": {
        "source": "iana"
    },
    "application/vnd.eprints.data+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.epson.esf": {
        "source": "iana",
        "extensions": [
            "esf"
        ]
    },
    "application/vnd.epson.msf": {
        "source": "iana",
        "extensions": [
            "msf"
        ]
    },
    "application/vnd.epson.quickanime": {
        "source": "iana",
        "extensions": [
            "qam"
        ]
    },
    "application/vnd.epson.salt": {
        "source": "iana",
        "extensions": [
            "slt"
        ]
    },
    "application/vnd.epson.ssf": {
        "source": "iana",
        "extensions": [
            "ssf"
        ]
    },
    "application/vnd.ericsson.quickcall": {
        "source": "iana"
    },
    "application/vnd.espass-espass+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.eszigno3+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "es3",
            "et3"
        ]
    },
    "application/vnd.etsi.aoc+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.asic-e+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.etsi.asic-s+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.etsi.cug+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvcommand+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvdiscovery+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvprofile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvsad-bc+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvsad-cod+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvsad-npvr+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvservice+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvsync+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.iptvueprofile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.mcid+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.mheg5": {
        "source": "iana"
    },
    "application/vnd.etsi.overload-control-policy-dataset+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.pstn+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.sci+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.simservs+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.timestamp-token": {
        "source": "iana"
    },
    "application/vnd.etsi.tsl+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.etsi.tsl.der": {
        "source": "iana"
    },
    "application/vnd.eu.kasparian.car+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.eudora.data": {
        "source": "iana"
    },
    "application/vnd.evolv.ecig.profile": {
        "source": "iana"
    },
    "application/vnd.evolv.ecig.settings": {
        "source": "iana"
    },
    "application/vnd.evolv.ecig.theme": {
        "source": "iana"
    },
    "application/vnd.exstream-empower+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.exstream-package": {
        "source": "iana"
    },
    "application/vnd.ezpix-album": {
        "source": "iana",
        "extensions": [
            "ez2"
        ]
    },
    "application/vnd.ezpix-package": {
        "source": "iana",
        "extensions": [
            "ez3"
        ]
    },
    "application/vnd.f-secure.mobile": {
        "source": "iana"
    },
    "application/vnd.familysearch.gedcom+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.fastcopy-disk-image": {
        "source": "iana"
    },
    "application/vnd.fdf": {
        "source": "iana",
        "extensions": [
            "fdf"
        ]
    },
    "application/vnd.fdsn.mseed": {
        "source": "iana",
        "extensions": [
            "mseed"
        ]
    },
    "application/vnd.fdsn.seed": {
        "source": "iana",
        "extensions": [
            "seed",
            "dataless"
        ]
    },
    "application/vnd.ffsns": {
        "source": "iana"
    },
    "application/vnd.ficlab.flb+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.filmit.zfc": {
        "source": "iana"
    },
    "application/vnd.fints": {
        "source": "iana"
    },
    "application/vnd.firemonkeys.cloudcell": {
        "source": "iana"
    },
    "application/vnd.flographit": {
        "source": "iana",
        "extensions": [
            "gph"
        ]
    },
    "application/vnd.fluxtime.clip": {
        "source": "iana",
        "extensions": [
            "ftc"
        ]
    },
    "application/vnd.font-fontforge-sfd": {
        "source": "iana"
    },
    "application/vnd.framemaker": {
        "source": "iana",
        "extensions": [
            "fm",
            "frame",
            "maker",
            "book"
        ]
    },
    "application/vnd.frogans.fnc": {
        "source": "iana",
        "extensions": [
            "fnc"
        ]
    },
    "application/vnd.frogans.ltf": {
        "source": "iana",
        "extensions": [
            "ltf"
        ]
    },
    "application/vnd.fsc.weblaunch": {
        "source": "iana",
        "extensions": [
            "fsc"
        ]
    },
    "application/vnd.fujifilm.fb.docuworks": {
        "source": "iana"
    },
    "application/vnd.fujifilm.fb.docuworks.binder": {
        "source": "iana"
    },
    "application/vnd.fujifilm.fb.docuworks.container": {
        "source": "iana"
    },
    "application/vnd.fujifilm.fb.jfi+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.fujitsu.oasys": {
        "source": "iana",
        "extensions": [
            "oas"
        ]
    },
    "application/vnd.fujitsu.oasys2": {
        "source": "iana",
        "extensions": [
            "oa2"
        ]
    },
    "application/vnd.fujitsu.oasys3": {
        "source": "iana",
        "extensions": [
            "oa3"
        ]
    },
    "application/vnd.fujitsu.oasysgp": {
        "source": "iana",
        "extensions": [
            "fg5"
        ]
    },
    "application/vnd.fujitsu.oasysprs": {
        "source": "iana",
        "extensions": [
            "bh2"
        ]
    },
    "application/vnd.fujixerox.art-ex": {
        "source": "iana"
    },
    "application/vnd.fujixerox.art4": {
        "source": "iana"
    },
    "application/vnd.fujixerox.ddd": {
        "source": "iana",
        "extensions": [
            "ddd"
        ]
    },
    "application/vnd.fujixerox.docuworks": {
        "source": "iana",
        "extensions": [
            "xdw"
        ]
    },
    "application/vnd.fujixerox.docuworks.binder": {
        "source": "iana",
        "extensions": [
            "xbd"
        ]
    },
    "application/vnd.fujixerox.docuworks.container": {
        "source": "iana"
    },
    "application/vnd.fujixerox.hbpl": {
        "source": "iana"
    },
    "application/vnd.fut-misnet": {
        "source": "iana"
    },
    "application/vnd.futoin+cbor": {
        "source": "iana"
    },
    "application/vnd.futoin+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.fuzzysheet": {
        "source": "iana",
        "extensions": [
            "fzs"
        ]
    },
    "application/vnd.genomatix.tuxedo": {
        "source": "iana",
        "extensions": [
            "txd"
        ]
    },
    "application/vnd.gentics.grd+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.geo+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.geocube+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.geogebra.file": {
        "source": "iana",
        "extensions": [
            "ggb"
        ]
    },
    "application/vnd.geogebra.slides": {
        "source": "iana"
    },
    "application/vnd.geogebra.tool": {
        "source": "iana",
        "extensions": [
            "ggt"
        ]
    },
    "application/vnd.geometry-explorer": {
        "source": "iana",
        "extensions": [
            "gex",
            "gre"
        ]
    },
    "application/vnd.geonext": {
        "source": "iana",
        "extensions": [
            "gxt"
        ]
    },
    "application/vnd.geoplan": {
        "source": "iana",
        "extensions": [
            "g2w"
        ]
    },
    "application/vnd.geospace": {
        "source": "iana",
        "extensions": [
            "g3w"
        ]
    },
    "application/vnd.gerber": {
        "source": "iana"
    },
    "application/vnd.globalplatform.card-content-mgt": {
        "source": "iana"
    },
    "application/vnd.globalplatform.card-content-mgt-response": {
        "source": "iana"
    },
    "application/vnd.gmx": {
        "source": "iana",
        "extensions": [
            "gmx"
        ]
    },
    "application/vnd.google-apps.document": {
        "compressible": false,
        "extensions": [
            "gdoc"
        ]
    },
    "application/vnd.google-apps.presentation": {
        "compressible": false,
        "extensions": [
            "gslides"
        ]
    },
    "application/vnd.google-apps.spreadsheet": {
        "compressible": false,
        "extensions": [
            "gsheet"
        ]
    },
    "application/vnd.google-earth.kml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "kml"
        ]
    },
    "application/vnd.google-earth.kmz": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "kmz"
        ]
    },
    "application/vnd.gov.sk.e-form+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.gov.sk.e-form+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.gov.sk.xmldatacontainer+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.grafeq": {
        "source": "iana",
        "extensions": [
            "gqf",
            "gqs"
        ]
    },
    "application/vnd.gridmp": {
        "source": "iana"
    },
    "application/vnd.groove-account": {
        "source": "iana",
        "extensions": [
            "gac"
        ]
    },
    "application/vnd.groove-help": {
        "source": "iana",
        "extensions": [
            "ghf"
        ]
    },
    "application/vnd.groove-identity-message": {
        "source": "iana",
        "extensions": [
            "gim"
        ]
    },
    "application/vnd.groove-injector": {
        "source": "iana",
        "extensions": [
            "grv"
        ]
    },
    "application/vnd.groove-tool-message": {
        "source": "iana",
        "extensions": [
            "gtm"
        ]
    },
    "application/vnd.groove-tool-template": {
        "source": "iana",
        "extensions": [
            "tpl"
        ]
    },
    "application/vnd.groove-vcard": {
        "source": "iana",
        "extensions": [
            "vcg"
        ]
    },
    "application/vnd.hal+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.hal+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "hal"
        ]
    },
    "application/vnd.handheld-entertainment+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "zmm"
        ]
    },
    "application/vnd.hbci": {
        "source": "iana",
        "extensions": [
            "hbci"
        ]
    },
    "application/vnd.hc+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.hcl-bireports": {
        "source": "iana"
    },
    "application/vnd.hdt": {
        "source": "iana"
    },
    "application/vnd.heroku+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.hhe.lesson-player": {
        "source": "iana",
        "extensions": [
            "les"
        ]
    },
    "application/vnd.hl7cda+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/vnd.hl7v2+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/vnd.hp-hpgl": {
        "source": "iana",
        "extensions": [
            "hpgl"
        ]
    },
    "application/vnd.hp-hpid": {
        "source": "iana",
        "extensions": [
            "hpid"
        ]
    },
    "application/vnd.hp-hps": {
        "source": "iana",
        "extensions": [
            "hps"
        ]
    },
    "application/vnd.hp-jlyt": {
        "source": "iana",
        "extensions": [
            "jlt"
        ]
    },
    "application/vnd.hp-pcl": {
        "source": "iana",
        "extensions": [
            "pcl"
        ]
    },
    "application/vnd.hp-pclxl": {
        "source": "iana",
        "extensions": [
            "pclxl"
        ]
    },
    "application/vnd.httphone": {
        "source": "iana"
    },
    "application/vnd.hydrostatix.sof-data": {
        "source": "iana",
        "extensions": [
            "sfd-hdstx"
        ]
    },
    "application/vnd.hyper+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.hyper-item+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.hyperdrive+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.hzn-3d-crossword": {
        "source": "iana"
    },
    "application/vnd.ibm.afplinedata": {
        "source": "iana"
    },
    "application/vnd.ibm.electronic-media": {
        "source": "iana"
    },
    "application/vnd.ibm.minipay": {
        "source": "iana",
        "extensions": [
            "mpy"
        ]
    },
    "application/vnd.ibm.modcap": {
        "source": "iana",
        "extensions": [
            "afp",
            "listafp",
            "list3820"
        ]
    },
    "application/vnd.ibm.rights-management": {
        "source": "iana",
        "extensions": [
            "irm"
        ]
    },
    "application/vnd.ibm.secure-container": {
        "source": "iana",
        "extensions": [
            "sc"
        ]
    },
    "application/vnd.iccprofile": {
        "source": "iana",
        "extensions": [
            "icc",
            "icm"
        ]
    },
    "application/vnd.ieee.1905": {
        "source": "iana"
    },
    "application/vnd.igloader": {
        "source": "iana",
        "extensions": [
            "igl"
        ]
    },
    "application/vnd.imagemeter.folder+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.imagemeter.image+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.immervision-ivp": {
        "source": "iana",
        "extensions": [
            "ivp"
        ]
    },
    "application/vnd.immervision-ivu": {
        "source": "iana",
        "extensions": [
            "ivu"
        ]
    },
    "application/vnd.ims.imsccv1p1": {
        "source": "iana"
    },
    "application/vnd.ims.imsccv1p2": {
        "source": "iana"
    },
    "application/vnd.ims.imsccv1p3": {
        "source": "iana"
    },
    "application/vnd.ims.lis.v2.result+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ims.lti.v2.toolproxy+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ims.lti.v2.toolproxy.id+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ims.lti.v2.toolsettings+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.informedcontrol.rms+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.informix-visionary": {
        "source": "iana"
    },
    "application/vnd.infotech.project": {
        "source": "iana"
    },
    "application/vnd.infotech.project+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.innopath.wamp.notification": {
        "source": "iana"
    },
    "application/vnd.insors.igm": {
        "source": "iana",
        "extensions": [
            "igm"
        ]
    },
    "application/vnd.intercon.formnet": {
        "source": "iana",
        "extensions": [
            "xpw",
            "xpx"
        ]
    },
    "application/vnd.intergeo": {
        "source": "iana",
        "extensions": [
            "i2g"
        ]
    },
    "application/vnd.intertrust.digibox": {
        "source": "iana"
    },
    "application/vnd.intertrust.nncp": {
        "source": "iana"
    },
    "application/vnd.intu.qbo": {
        "source": "iana",
        "extensions": [
            "qbo"
        ]
    },
    "application/vnd.intu.qfx": {
        "source": "iana",
        "extensions": [
            "qfx"
        ]
    },
    "application/vnd.iptc.g2.catalogitem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.iptc.g2.conceptitem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.iptc.g2.knowledgeitem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.iptc.g2.newsitem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.iptc.g2.newsmessage+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.iptc.g2.packageitem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.iptc.g2.planningitem+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ipunplugged.rcprofile": {
        "source": "iana",
        "extensions": [
            "rcprofile"
        ]
    },
    "application/vnd.irepository.package+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "irp"
        ]
    },
    "application/vnd.is-xpr": {
        "source": "iana",
        "extensions": [
            "xpr"
        ]
    },
    "application/vnd.isac.fcs": {
        "source": "iana",
        "extensions": [
            "fcs"
        ]
    },
    "application/vnd.iso11783-10+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.jam": {
        "source": "iana",
        "extensions": [
            "jam"
        ]
    },
    "application/vnd.japannet-directory-service": {
        "source": "iana"
    },
    "application/vnd.japannet-jpnstore-wakeup": {
        "source": "iana"
    },
    "application/vnd.japannet-payment-wakeup": {
        "source": "iana"
    },
    "application/vnd.japannet-registration": {
        "source": "iana"
    },
    "application/vnd.japannet-registration-wakeup": {
        "source": "iana"
    },
    "application/vnd.japannet-setstore-wakeup": {
        "source": "iana"
    },
    "application/vnd.japannet-verification": {
        "source": "iana"
    },
    "application/vnd.japannet-verification-wakeup": {
        "source": "iana"
    },
    "application/vnd.jcp.javame.midlet-rms": {
        "source": "iana",
        "extensions": [
            "rms"
        ]
    },
    "application/vnd.jisp": {
        "source": "iana",
        "extensions": [
            "jisp"
        ]
    },
    "application/vnd.joost.joda-archive": {
        "source": "iana",
        "extensions": [
            "joda"
        ]
    },
    "application/vnd.jsk.isdn-ngn": {
        "source": "iana"
    },
    "application/vnd.kahootz": {
        "source": "iana",
        "extensions": [
            "ktz",
            "ktr"
        ]
    },
    "application/vnd.kde.karbon": {
        "source": "iana",
        "extensions": [
            "karbon"
        ]
    },
    "application/vnd.kde.kchart": {
        "source": "iana",
        "extensions": [
            "chrt"
        ]
    },
    "application/vnd.kde.kformula": {
        "source": "iana",
        "extensions": [
            "kfo"
        ]
    },
    "application/vnd.kde.kivio": {
        "source": "iana",
        "extensions": [
            "flw"
        ]
    },
    "application/vnd.kde.kontour": {
        "source": "iana",
        "extensions": [
            "kon"
        ]
    },
    "application/vnd.kde.kpresenter": {
        "source": "iana",
        "extensions": [
            "kpr",
            "kpt"
        ]
    },
    "application/vnd.kde.kspread": {
        "source": "iana",
        "extensions": [
            "ksp"
        ]
    },
    "application/vnd.kde.kword": {
        "source": "iana",
        "extensions": [
            "kwd",
            "kwt"
        ]
    },
    "application/vnd.kenameaapp": {
        "source": "iana",
        "extensions": [
            "htke"
        ]
    },
    "application/vnd.kidspiration": {
        "source": "iana",
        "extensions": [
            "kia"
        ]
    },
    "application/vnd.kinar": {
        "source": "iana",
        "extensions": [
            "kne",
            "knp"
        ]
    },
    "application/vnd.koan": {
        "source": "iana",
        "extensions": [
            "skp",
            "skd",
            "skt",
            "skm"
        ]
    },
    "application/vnd.kodak-descriptor": {
        "source": "iana",
        "extensions": [
            "sse"
        ]
    },
    "application/vnd.las": {
        "source": "iana"
    },
    "application/vnd.las.las+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.las.las+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "lasxml"
        ]
    },
    "application/vnd.laszip": {
        "source": "iana"
    },
    "application/vnd.leap+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.liberty-request+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.llamagraphics.life-balance.desktop": {
        "source": "iana",
        "extensions": [
            "lbd"
        ]
    },
    "application/vnd.llamagraphics.life-balance.exchange+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "lbe"
        ]
    },
    "application/vnd.logipipe.circuit+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.loom": {
        "source": "iana"
    },
    "application/vnd.lotus-1-2-3": {
        "source": "iana",
        "extensions": [
            "123"
        ]
    },
    "application/vnd.lotus-approach": {
        "source": "iana",
        "extensions": [
            "apr"
        ]
    },
    "application/vnd.lotus-freelance": {
        "source": "iana",
        "extensions": [
            "pre"
        ]
    },
    "application/vnd.lotus-notes": {
        "source": "iana",
        "extensions": [
            "nsf"
        ]
    },
    "application/vnd.lotus-organizer": {
        "source": "iana",
        "extensions": [
            "org"
        ]
    },
    "application/vnd.lotus-screencam": {
        "source": "iana",
        "extensions": [
            "scm"
        ]
    },
    "application/vnd.lotus-wordpro": {
        "source": "iana",
        "extensions": [
            "lwp"
        ]
    },
    "application/vnd.macports.portpkg": {
        "source": "iana",
        "extensions": [
            "portpkg"
        ]
    },
    "application/vnd.mapbox-vector-tile": {
        "source": "iana",
        "extensions": [
            "mvt"
        ]
    },
    "application/vnd.marlin.drm.actiontoken+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.marlin.drm.conftoken+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.marlin.drm.license+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.marlin.drm.mdcf": {
        "source": "iana"
    },
    "application/vnd.mason+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.maxar.archive.3tz+zip": {
        "source": "iana",
        "compressible": false
    },
    "application/vnd.maxmind.maxmind-db": {
        "source": "iana"
    },
    "application/vnd.mcd": {
        "source": "iana",
        "extensions": [
            "mcd"
        ]
    },
    "application/vnd.medcalcdata": {
        "source": "iana",
        "extensions": [
            "mc1"
        ]
    },
    "application/vnd.mediastation.cdkey": {
        "source": "iana",
        "extensions": [
            "cdkey"
        ]
    },
    "application/vnd.meridian-slingshot": {
        "source": "iana"
    },
    "application/vnd.mfer": {
        "source": "iana",
        "extensions": [
            "mwf"
        ]
    },
    "application/vnd.mfmp": {
        "source": "iana",
        "extensions": [
            "mfm"
        ]
    },
    "application/vnd.micro+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.micrografx.flo": {
        "source": "iana",
        "extensions": [
            "flo"
        ]
    },
    "application/vnd.micrografx.igx": {
        "source": "iana",
        "extensions": [
            "igx"
        ]
    },
    "application/vnd.microsoft.portable-executable": {
        "source": "iana"
    },
    "application/vnd.microsoft.windows.thumbnail-cache": {
        "source": "iana"
    },
    "application/vnd.miele+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.mif": {
        "source": "iana",
        "extensions": [
            "mif"
        ]
    },
    "application/vnd.minisoft-hp3000-save": {
        "source": "iana"
    },
    "application/vnd.mitsubishi.misty-guard.trustweb": {
        "source": "iana"
    },
    "application/vnd.mobius.daf": {
        "source": "iana",
        "extensions": [
            "daf"
        ]
    },
    "application/vnd.mobius.dis": {
        "source": "iana",
        "extensions": [
            "dis"
        ]
    },
    "application/vnd.mobius.mbk": {
        "source": "iana",
        "extensions": [
            "mbk"
        ]
    },
    "application/vnd.mobius.mqy": {
        "source": "iana",
        "extensions": [
            "mqy"
        ]
    },
    "application/vnd.mobius.msl": {
        "source": "iana",
        "extensions": [
            "msl"
        ]
    },
    "application/vnd.mobius.plc": {
        "source": "iana",
        "extensions": [
            "plc"
        ]
    },
    "application/vnd.mobius.txf": {
        "source": "iana",
        "extensions": [
            "txf"
        ]
    },
    "application/vnd.mophun.application": {
        "source": "iana",
        "extensions": [
            "mpn"
        ]
    },
    "application/vnd.mophun.certificate": {
        "source": "iana",
        "extensions": [
            "mpc"
        ]
    },
    "application/vnd.motorola.flexsuite": {
        "source": "iana"
    },
    "application/vnd.motorola.flexsuite.adsi": {
        "source": "iana"
    },
    "application/vnd.motorola.flexsuite.fis": {
        "source": "iana"
    },
    "application/vnd.motorola.flexsuite.gotap": {
        "source": "iana"
    },
    "application/vnd.motorola.flexsuite.kmr": {
        "source": "iana"
    },
    "application/vnd.motorola.flexsuite.ttc": {
        "source": "iana"
    },
    "application/vnd.motorola.flexsuite.wem": {
        "source": "iana"
    },
    "application/vnd.motorola.iprm": {
        "source": "iana"
    },
    "application/vnd.mozilla.xul+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xul"
        ]
    },
    "application/vnd.ms-3mfdocument": {
        "source": "iana"
    },
    "application/vnd.ms-artgalry": {
        "source": "iana",
        "extensions": [
            "cil"
        ]
    },
    "application/vnd.ms-asf": {
        "source": "iana"
    },
    "application/vnd.ms-cab-compressed": {
        "source": "iana",
        "extensions": [
            "cab"
        ]
    },
    "application/vnd.ms-color.iccprofile": {
        "source": "apache"
    },
    "application/vnd.ms-excel": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "xls",
            "xlm",
            "xla",
            "xlc",
            "xlt",
            "xlw"
        ]
    },
    "application/vnd.ms-excel.addin.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "xlam"
        ]
    },
    "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "xlsb"
        ]
    },
    "application/vnd.ms-excel.sheet.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "xlsm"
        ]
    },
    "application/vnd.ms-excel.template.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "xltm"
        ]
    },
    "application/vnd.ms-fontobject": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "eot"
        ]
    },
    "application/vnd.ms-htmlhelp": {
        "source": "iana",
        "extensions": [
            "chm"
        ]
    },
    "application/vnd.ms-ims": {
        "source": "iana",
        "extensions": [
            "ims"
        ]
    },
    "application/vnd.ms-lrm": {
        "source": "iana",
        "extensions": [
            "lrm"
        ]
    },
    "application/vnd.ms-office.activex+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ms-officetheme": {
        "source": "iana",
        "extensions": [
            "thmx"
        ]
    },
    "application/vnd.ms-opentype": {
        "source": "apache",
        "compressible": true
    },
    "application/vnd.ms-outlook": {
        "compressible": false,
        "extensions": [
            "msg"
        ]
    },
    "application/vnd.ms-package.obfuscated-opentype": {
        "source": "apache"
    },
    "application/vnd.ms-pki.seccat": {
        "source": "apache",
        "extensions": [
            "cat"
        ]
    },
    "application/vnd.ms-pki.stl": {
        "source": "apache",
        "extensions": [
            "stl"
        ]
    },
    "application/vnd.ms-playready.initiator+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ms-powerpoint": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "ppt",
            "pps",
            "pot"
        ]
    },
    "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "ppam"
        ]
    },
    "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "pptm"
        ]
    },
    "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "sldm"
        ]
    },
    "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "ppsm"
        ]
    },
    "application/vnd.ms-powerpoint.template.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "potm"
        ]
    },
    "application/vnd.ms-printdevicecapabilities+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ms-printing.printticket+xml": {
        "source": "apache",
        "compressible": true
    },
    "application/vnd.ms-printschematicket+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ms-project": {
        "source": "iana",
        "extensions": [
            "mpp",
            "mpt"
        ]
    },
    "application/vnd.ms-tnef": {
        "source": "iana"
    },
    "application/vnd.ms-windows.devicepairing": {
        "source": "iana"
    },
    "application/vnd.ms-windows.nwprinting.oob": {
        "source": "iana"
    },
    "application/vnd.ms-windows.printerpairing": {
        "source": "iana"
    },
    "application/vnd.ms-windows.wsd.oob": {
        "source": "iana"
    },
    "application/vnd.ms-wmdrm.lic-chlg-req": {
        "source": "iana"
    },
    "application/vnd.ms-wmdrm.lic-resp": {
        "source": "iana"
    },
    "application/vnd.ms-wmdrm.meter-chlg-req": {
        "source": "iana"
    },
    "application/vnd.ms-wmdrm.meter-resp": {
        "source": "iana"
    },
    "application/vnd.ms-word.document.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "docm"
        ]
    },
    "application/vnd.ms-word.template.macroenabled.12": {
        "source": "iana",
        "extensions": [
            "dotm"
        ]
    },
    "application/vnd.ms-works": {
        "source": "iana",
        "extensions": [
            "wps",
            "wks",
            "wcm",
            "wdb"
        ]
    },
    "application/vnd.ms-wpl": {
        "source": "iana",
        "extensions": [
            "wpl"
        ]
    },
    "application/vnd.ms-xpsdocument": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "xps"
        ]
    },
    "application/vnd.msa-disk-image": {
        "source": "iana"
    },
    "application/vnd.mseq": {
        "source": "iana",
        "extensions": [
            "mseq"
        ]
    },
    "application/vnd.msign": {
        "source": "iana"
    },
    "application/vnd.multiad.creator": {
        "source": "iana"
    },
    "application/vnd.multiad.creator.cif": {
        "source": "iana"
    },
    "application/vnd.music-niff": {
        "source": "iana"
    },
    "application/vnd.musician": {
        "source": "iana",
        "extensions": [
            "mus"
        ]
    },
    "application/vnd.muvee.style": {
        "source": "iana",
        "extensions": [
            "msty"
        ]
    },
    "application/vnd.mynfc": {
        "source": "iana",
        "extensions": [
            "taglet"
        ]
    },
    "application/vnd.nacamar.ybrid+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.ncd.control": {
        "source": "iana"
    },
    "application/vnd.ncd.reference": {
        "source": "iana"
    },
    "application/vnd.nearst.inv+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.nebumind.line": {
        "source": "iana"
    },
    "application/vnd.nervana": {
        "source": "iana"
    },
    "application/vnd.netfpx": {
        "source": "iana"
    },
    "application/vnd.neurolanguage.nlu": {
        "source": "iana",
        "extensions": [
            "nlu"
        ]
    },
    "application/vnd.nimn": {
        "source": "iana"
    },
    "application/vnd.nintendo.nitro.rom": {
        "source": "iana"
    },
    "application/vnd.nintendo.snes.rom": {
        "source": "iana"
    },
    "application/vnd.nitf": {
        "source": "iana",
        "extensions": [
            "ntf",
            "nitf"
        ]
    },
    "application/vnd.noblenet-directory": {
        "source": "iana",
        "extensions": [
            "nnd"
        ]
    },
    "application/vnd.noblenet-sealer": {
        "source": "iana",
        "extensions": [
            "nns"
        ]
    },
    "application/vnd.noblenet-web": {
        "source": "iana",
        "extensions": [
            "nnw"
        ]
    },
    "application/vnd.nokia.catalogs": {
        "source": "iana"
    },
    "application/vnd.nokia.conml+wbxml": {
        "source": "iana"
    },
    "application/vnd.nokia.conml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.nokia.iptv.config+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.nokia.isds-radio-presets": {
        "source": "iana"
    },
    "application/vnd.nokia.landmark+wbxml": {
        "source": "iana"
    },
    "application/vnd.nokia.landmark+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.nokia.landmarkcollection+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.nokia.n-gage.ac+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ac"
        ]
    },
    "application/vnd.nokia.n-gage.data": {
        "source": "iana",
        "extensions": [
            "ngdat"
        ]
    },
    "application/vnd.nokia.n-gage.symbian.install": {
        "source": "iana",
        "extensions": [
            "n-gage"
        ]
    },
    "application/vnd.nokia.ncd": {
        "source": "iana"
    },
    "application/vnd.nokia.pcd+wbxml": {
        "source": "iana"
    },
    "application/vnd.nokia.pcd+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.nokia.radio-preset": {
        "source": "iana",
        "extensions": [
            "rpst"
        ]
    },
    "application/vnd.nokia.radio-presets": {
        "source": "iana",
        "extensions": [
            "rpss"
        ]
    },
    "application/vnd.novadigm.edm": {
        "source": "iana",
        "extensions": [
            "edm"
        ]
    },
    "application/vnd.novadigm.edx": {
        "source": "iana",
        "extensions": [
            "edx"
        ]
    },
    "application/vnd.novadigm.ext": {
        "source": "iana",
        "extensions": [
            "ext"
        ]
    },
    "application/vnd.ntt-local.content-share": {
        "source": "iana"
    },
    "application/vnd.ntt-local.file-transfer": {
        "source": "iana"
    },
    "application/vnd.ntt-local.ogw_remote-access": {
        "source": "iana"
    },
    "application/vnd.ntt-local.sip-ta_remote": {
        "source": "iana"
    },
    "application/vnd.ntt-local.sip-ta_tcp_stream": {
        "source": "iana"
    },
    "application/vnd.oasis.opendocument.chart": {
        "source": "iana",
        "extensions": [
            "odc"
        ]
    },
    "application/vnd.oasis.opendocument.chart-template": {
        "source": "iana",
        "extensions": [
            "otc"
        ]
    },
    "application/vnd.oasis.opendocument.database": {
        "source": "iana",
        "extensions": [
            "odb"
        ]
    },
    "application/vnd.oasis.opendocument.formula": {
        "source": "iana",
        "extensions": [
            "odf"
        ]
    },
    "application/vnd.oasis.opendocument.formula-template": {
        "source": "iana",
        "extensions": [
            "odft"
        ]
    },
    "application/vnd.oasis.opendocument.graphics": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "odg"
        ]
    },
    "application/vnd.oasis.opendocument.graphics-template": {
        "source": "iana",
        "extensions": [
            "otg"
        ]
    },
    "application/vnd.oasis.opendocument.image": {
        "source": "iana",
        "extensions": [
            "odi"
        ]
    },
    "application/vnd.oasis.opendocument.image-template": {
        "source": "iana",
        "extensions": [
            "oti"
        ]
    },
    "application/vnd.oasis.opendocument.presentation": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "odp"
        ]
    },
    "application/vnd.oasis.opendocument.presentation-template": {
        "source": "iana",
        "extensions": [
            "otp"
        ]
    },
    "application/vnd.oasis.opendocument.spreadsheet": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "ods"
        ]
    },
    "application/vnd.oasis.opendocument.spreadsheet-template": {
        "source": "iana",
        "extensions": [
            "ots"
        ]
    },
    "application/vnd.oasis.opendocument.text": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "odt"
        ]
    },
    "application/vnd.oasis.opendocument.text-master": {
        "source": "iana",
        "extensions": [
            "odm"
        ]
    },
    "application/vnd.oasis.opendocument.text-template": {
        "source": "iana",
        "extensions": [
            "ott"
        ]
    },
    "application/vnd.oasis.opendocument.text-web": {
        "source": "iana",
        "extensions": [
            "oth"
        ]
    },
    "application/vnd.obn": {
        "source": "iana"
    },
    "application/vnd.ocf+cbor": {
        "source": "iana"
    },
    "application/vnd.oci.image.manifest.v1+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oftn.l10n+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.contentaccessdownload+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.contentaccessstreaming+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.cspg-hexbinary": {
        "source": "iana"
    },
    "application/vnd.oipf.dae.svg+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.dae.xhtml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.mippvcontrolmessage+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.pae.gem": {
        "source": "iana"
    },
    "application/vnd.oipf.spdiscovery+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.spdlist+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.ueprofile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oipf.userprofile+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.olpc-sugar": {
        "source": "iana",
        "extensions": [
            "xo"
        ]
    },
    "application/vnd.oma-scws-config": {
        "source": "iana"
    },
    "application/vnd.oma-scws-http-request": {
        "source": "iana"
    },
    "application/vnd.oma-scws-http-response": {
        "source": "iana"
    },
    "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.drm-trigger+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.imd+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.ltkm": {
        "source": "iana"
    },
    "application/vnd.oma.bcast.notification+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.provisioningtrigger": {
        "source": "iana"
    },
    "application/vnd.oma.bcast.sgboot": {
        "source": "iana"
    },
    "application/vnd.oma.bcast.sgdd+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.sgdu": {
        "source": "iana"
    },
    "application/vnd.oma.bcast.simple-symbol-container": {
        "source": "iana"
    },
    "application/vnd.oma.bcast.smartcard-trigger+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.sprov+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.bcast.stkm": {
        "source": "iana"
    },
    "application/vnd.oma.cab-address-book+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.cab-feature-handler+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.cab-pcc+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.cab-subs-invite+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.cab-user-prefs+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.dcd": {
        "source": "iana"
    },
    "application/vnd.oma.dcdc": {
        "source": "iana"
    },
    "application/vnd.oma.dd2+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "dd2"
        ]
    },
    "application/vnd.oma.drm.risd+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.group-usage-list+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.lwm2m+cbor": {
        "source": "iana"
    },
    "application/vnd.oma.lwm2m+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.lwm2m+tlv": {
        "source": "iana"
    },
    "application/vnd.oma.pal+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.poc.detailed-progress-report+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.poc.final-report+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.poc.groups+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.poc.invocation-descriptor+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.poc.optimized-progress-report+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.push": {
        "source": "iana"
    },
    "application/vnd.oma.scidm.messages+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oma.xcap-directory+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.omads-email+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/vnd.omads-file+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/vnd.omads-folder+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/vnd.omaloc-supl-init": {
        "source": "iana"
    },
    "application/vnd.onepager": {
        "source": "iana"
    },
    "application/vnd.onepagertamp": {
        "source": "iana"
    },
    "application/vnd.onepagertamx": {
        "source": "iana"
    },
    "application/vnd.onepagertat": {
        "source": "iana"
    },
    "application/vnd.onepagertatp": {
        "source": "iana"
    },
    "application/vnd.onepagertatx": {
        "source": "iana"
    },
    "application/vnd.openblox.game+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "obgx"
        ]
    },
    "application/vnd.openblox.game-binary": {
        "source": "iana"
    },
    "application/vnd.openeye.oeb": {
        "source": "iana"
    },
    "application/vnd.openofficeorg.extension": {
        "source": "apache",
        "extensions": [
            "oxt"
        ]
    },
    "application/vnd.openstreetmap.data+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "osm"
        ]
    },
    "application/vnd.opentimestamps.ots": {
        "source": "iana"
    },
    "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawing+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "pptx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        "source": "iana",
        "extensions": [
            "sldx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        "source": "iana",
        "extensions": [
            "ppsx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.template": {
        "source": "iana",
        "extensions": [
            "potx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "xlsx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        "source": "iana",
        "extensions": [
            "xltx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.theme+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.vmldrawing": {
        "source": "iana"
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "docx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        "source": "iana",
        "extensions": [
            "dotx"
        ]
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-package.core-properties+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.openxmlformats-package.relationships+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oracle.resource+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.orange.indata": {
        "source": "iana"
    },
    "application/vnd.osa.netdeploy": {
        "source": "iana"
    },
    "application/vnd.osgeo.mapguide.package": {
        "source": "iana",
        "extensions": [
            "mgp"
        ]
    },
    "application/vnd.osgi.bundle": {
        "source": "iana"
    },
    "application/vnd.osgi.dp": {
        "source": "iana",
        "extensions": [
            "dp"
        ]
    },
    "application/vnd.osgi.subsystem": {
        "source": "iana",
        "extensions": [
            "esa"
        ]
    },
    "application/vnd.otps.ct-kip+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.oxli.countgraph": {
        "source": "iana"
    },
    "application/vnd.pagerduty+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.palm": {
        "source": "iana",
        "extensions": [
            "pdb",
            "pqa",
            "oprc"
        ]
    },
    "application/vnd.panoply": {
        "source": "iana"
    },
    "application/vnd.paos.xml": {
        "source": "iana"
    },
    "application/vnd.patentdive": {
        "source": "iana"
    },
    "application/vnd.patientecommsdoc": {
        "source": "iana"
    },
    "application/vnd.pawaafile": {
        "source": "iana",
        "extensions": [
            "paw"
        ]
    },
    "application/vnd.pcos": {
        "source": "iana"
    },
    "application/vnd.pg.format": {
        "source": "iana",
        "extensions": [
            "str"
        ]
    },
    "application/vnd.pg.osasli": {
        "source": "iana",
        "extensions": [
            "ei6"
        ]
    },
    "application/vnd.piaccess.application-licence": {
        "source": "iana"
    },
    "application/vnd.picsel": {
        "source": "iana",
        "extensions": [
            "efif"
        ]
    },
    "application/vnd.pmi.widget": {
        "source": "iana",
        "extensions": [
            "wg"
        ]
    },
    "application/vnd.poc.group-advertisement+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.pocketlearn": {
        "source": "iana",
        "extensions": [
            "plf"
        ]
    },
    "application/vnd.powerbuilder6": {
        "source": "iana",
        "extensions": [
            "pbd"
        ]
    },
    "application/vnd.powerbuilder6-s": {
        "source": "iana"
    },
    "application/vnd.powerbuilder7": {
        "source": "iana"
    },
    "application/vnd.powerbuilder7-s": {
        "source": "iana"
    },
    "application/vnd.powerbuilder75": {
        "source": "iana"
    },
    "application/vnd.powerbuilder75-s": {
        "source": "iana"
    },
    "application/vnd.preminet": {
        "source": "iana"
    },
    "application/vnd.previewsystems.box": {
        "source": "iana",
        "extensions": [
            "box"
        ]
    },
    "application/vnd.proteus.magazine": {
        "source": "iana",
        "extensions": [
            "mgz"
        ]
    },
    "application/vnd.psfs": {
        "source": "iana"
    },
    "application/vnd.publishare-delta-tree": {
        "source": "iana",
        "extensions": [
            "qps"
        ]
    },
    "application/vnd.pvi.ptid1": {
        "source": "iana",
        "extensions": [
            "ptid"
        ]
    },
    "application/vnd.pwg-multiplexed": {
        "source": "iana"
    },
    "application/vnd.pwg-xhtml-print+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.qualcomm.brew-app-res": {
        "source": "iana"
    },
    "application/vnd.quarantainenet": {
        "source": "iana"
    },
    "application/vnd.quark.quarkxpress": {
        "source": "iana",
        "extensions": [
            "qxd",
            "qxt",
            "qwd",
            "qwt",
            "qxl",
            "qxb"
        ]
    },
    "application/vnd.quobject-quoxdocument": {
        "source": "iana"
    },
    "application/vnd.radisys.moml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-audit+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-audit-conf+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-audit-conn+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-audit-dialog+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-audit-stream+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-conf+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog-base+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog-group+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog-speech+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.radisys.msml-dialog-transform+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.rainstor.data": {
        "source": "iana"
    },
    "application/vnd.rapid": {
        "source": "iana"
    },
    "application/vnd.rar": {
        "source": "iana",
        "extensions": [
            "rar"
        ]
    },
    "application/vnd.realvnc.bed": {
        "source": "iana",
        "extensions": [
            "bed"
        ]
    },
    "application/vnd.recordare.musicxml": {
        "source": "iana",
        "extensions": [
            "mxl"
        ]
    },
    "application/vnd.recordare.musicxml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "musicxml"
        ]
    },
    "application/vnd.renlearn.rlprint": {
        "source": "iana"
    },
    "application/vnd.resilient.logic": {
        "source": "iana"
    },
    "application/vnd.restful+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.rig.cryptonote": {
        "source": "iana",
        "extensions": [
            "cryptonote"
        ]
    },
    "application/vnd.rim.cod": {
        "source": "apache",
        "extensions": [
            "cod"
        ]
    },
    "application/vnd.rn-realmedia": {
        "source": "apache",
        "extensions": [
            "rm"
        ]
    },
    "application/vnd.rn-realmedia-vbr": {
        "source": "apache",
        "extensions": [
            "rmvb"
        ]
    },
    "application/vnd.route66.link66+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "link66"
        ]
    },
    "application/vnd.rs-274x": {
        "source": "iana"
    },
    "application/vnd.ruckus.download": {
        "source": "iana"
    },
    "application/vnd.s3sms": {
        "source": "iana"
    },
    "application/vnd.sailingtracker.track": {
        "source": "iana",
        "extensions": [
            "st"
        ]
    },
    "application/vnd.sar": {
        "source": "iana"
    },
    "application/vnd.sbm.cid": {
        "source": "iana"
    },
    "application/vnd.sbm.mid2": {
        "source": "iana"
    },
    "application/vnd.scribus": {
        "source": "iana"
    },
    "application/vnd.sealed.3df": {
        "source": "iana"
    },
    "application/vnd.sealed.csf": {
        "source": "iana"
    },
    "application/vnd.sealed.doc": {
        "source": "iana"
    },
    "application/vnd.sealed.eml": {
        "source": "iana"
    },
    "application/vnd.sealed.mht": {
        "source": "iana"
    },
    "application/vnd.sealed.net": {
        "source": "iana"
    },
    "application/vnd.sealed.ppt": {
        "source": "iana"
    },
    "application/vnd.sealed.tiff": {
        "source": "iana"
    },
    "application/vnd.sealed.xls": {
        "source": "iana"
    },
    "application/vnd.sealedmedia.softseal.html": {
        "source": "iana"
    },
    "application/vnd.sealedmedia.softseal.pdf": {
        "source": "iana"
    },
    "application/vnd.seemail": {
        "source": "iana",
        "extensions": [
            "see"
        ]
    },
    "application/vnd.seis+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.sema": {
        "source": "iana",
        "extensions": [
            "sema"
        ]
    },
    "application/vnd.semd": {
        "source": "iana",
        "extensions": [
            "semd"
        ]
    },
    "application/vnd.semf": {
        "source": "iana",
        "extensions": [
            "semf"
        ]
    },
    "application/vnd.shade-save-file": {
        "source": "iana"
    },
    "application/vnd.shana.informed.formdata": {
        "source": "iana",
        "extensions": [
            "ifm"
        ]
    },
    "application/vnd.shana.informed.formtemplate": {
        "source": "iana",
        "extensions": [
            "itp"
        ]
    },
    "application/vnd.shana.informed.interchange": {
        "source": "iana",
        "extensions": [
            "iif"
        ]
    },
    "application/vnd.shana.informed.package": {
        "source": "iana",
        "extensions": [
            "ipk"
        ]
    },
    "application/vnd.shootproof+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.shopkick+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.shp": {
        "source": "iana"
    },
    "application/vnd.shx": {
        "source": "iana"
    },
    "application/vnd.sigrok.session": {
        "source": "iana"
    },
    "application/vnd.simtech-mindmapper": {
        "source": "iana",
        "extensions": [
            "twd",
            "twds"
        ]
    },
    "application/vnd.siren+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.smaf": {
        "source": "iana",
        "extensions": [
            "mmf"
        ]
    },
    "application/vnd.smart.notebook": {
        "source": "iana"
    },
    "application/vnd.smart.teacher": {
        "source": "iana",
        "extensions": [
            "teacher"
        ]
    },
    "application/vnd.snesdev-page-table": {
        "source": "iana"
    },
    "application/vnd.software602.filler.form+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "fo"
        ]
    },
    "application/vnd.software602.filler.form-xml-zip": {
        "source": "iana"
    },
    "application/vnd.solent.sdkm+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "sdkm",
            "sdkd"
        ]
    },
    "application/vnd.spotfire.dxp": {
        "source": "iana",
        "extensions": [
            "dxp"
        ]
    },
    "application/vnd.spotfire.sfs": {
        "source": "iana",
        "extensions": [
            "sfs"
        ]
    },
    "application/vnd.sqlite3": {
        "source": "iana"
    },
    "application/vnd.sss-cod": {
        "source": "iana"
    },
    "application/vnd.sss-dtf": {
        "source": "iana"
    },
    "application/vnd.sss-ntf": {
        "source": "iana"
    },
    "application/vnd.stardivision.calc": {
        "source": "apache",
        "extensions": [
            "sdc"
        ]
    },
    "application/vnd.stardivision.draw": {
        "source": "apache",
        "extensions": [
            "sda"
        ]
    },
    "application/vnd.stardivision.impress": {
        "source": "apache",
        "extensions": [
            "sdd"
        ]
    },
    "application/vnd.stardivision.math": {
        "source": "apache",
        "extensions": [
            "smf"
        ]
    },
    "application/vnd.stardivision.writer": {
        "source": "apache",
        "extensions": [
            "sdw",
            "vor"
        ]
    },
    "application/vnd.stardivision.writer-global": {
        "source": "apache",
        "extensions": [
            "sgl"
        ]
    },
    "application/vnd.stepmania.package": {
        "source": "iana",
        "extensions": [
            "smzip"
        ]
    },
    "application/vnd.stepmania.stepchart": {
        "source": "iana",
        "extensions": [
            "sm"
        ]
    },
    "application/vnd.street-stream": {
        "source": "iana"
    },
    "application/vnd.sun.wadl+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "wadl"
        ]
    },
    "application/vnd.sun.xml.calc": {
        "source": "apache",
        "extensions": [
            "sxc"
        ]
    },
    "application/vnd.sun.xml.calc.template": {
        "source": "apache",
        "extensions": [
            "stc"
        ]
    },
    "application/vnd.sun.xml.draw": {
        "source": "apache",
        "extensions": [
            "sxd"
        ]
    },
    "application/vnd.sun.xml.draw.template": {
        "source": "apache",
        "extensions": [
            "std"
        ]
    },
    "application/vnd.sun.xml.impress": {
        "source": "apache",
        "extensions": [
            "sxi"
        ]
    },
    "application/vnd.sun.xml.impress.template": {
        "source": "apache",
        "extensions": [
            "sti"
        ]
    },
    "application/vnd.sun.xml.math": {
        "source": "apache",
        "extensions": [
            "sxm"
        ]
    },
    "application/vnd.sun.xml.writer": {
        "source": "apache",
        "extensions": [
            "sxw"
        ]
    },
    "application/vnd.sun.xml.writer.global": {
        "source": "apache",
        "extensions": [
            "sxg"
        ]
    },
    "application/vnd.sun.xml.writer.template": {
        "source": "apache",
        "extensions": [
            "stw"
        ]
    },
    "application/vnd.sus-calendar": {
        "source": "iana",
        "extensions": [
            "sus",
            "susp"
        ]
    },
    "application/vnd.svd": {
        "source": "iana",
        "extensions": [
            "svd"
        ]
    },
    "application/vnd.swiftview-ics": {
        "source": "iana"
    },
    "application/vnd.sycle+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.syft+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.symbian.install": {
        "source": "apache",
        "extensions": [
            "sis",
            "sisx"
        ]
    },
    "application/vnd.syncml+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "xsm"
        ]
    },
    "application/vnd.syncml.dm+wbxml": {
        "source": "iana",
        "charset": "UTF-8",
        "extensions": [
            "bdm"
        ]
    },
    "application/vnd.syncml.dm+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "xdm"
        ]
    },
    "application/vnd.syncml.dm.notification": {
        "source": "iana"
    },
    "application/vnd.syncml.dmddf+wbxml": {
        "source": "iana"
    },
    "application/vnd.syncml.dmddf+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "ddf"
        ]
    },
    "application/vnd.syncml.dmtnds+wbxml": {
        "source": "iana"
    },
    "application/vnd.syncml.dmtnds+xml": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true
    },
    "application/vnd.syncml.ds.notification": {
        "source": "iana"
    },
    "application/vnd.tableschema+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.tao.intent-module-archive": {
        "source": "iana",
        "extensions": [
            "tao"
        ]
    },
    "application/vnd.tcpdump.pcap": {
        "source": "iana",
        "extensions": [
            "pcap",
            "cap",
            "dmp"
        ]
    },
    "application/vnd.think-cell.ppttc+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.tmd.mediaflex.api+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.tml": {
        "source": "iana"
    },
    "application/vnd.tmobile-livetv": {
        "source": "iana",
        "extensions": [
            "tmo"
        ]
    },
    "application/vnd.tri.onesource": {
        "source": "iana"
    },
    "application/vnd.trid.tpt": {
        "source": "iana",
        "extensions": [
            "tpt"
        ]
    },
    "application/vnd.triscape.mxs": {
        "source": "iana",
        "extensions": [
            "mxs"
        ]
    },
    "application/vnd.trueapp": {
        "source": "iana",
        "extensions": [
            "tra"
        ]
    },
    "application/vnd.truedoc": {
        "source": "iana"
    },
    "application/vnd.ubisoft.webplayer": {
        "source": "iana"
    },
    "application/vnd.ufdl": {
        "source": "iana",
        "extensions": [
            "ufd",
            "ufdl"
        ]
    },
    "application/vnd.uiq.theme": {
        "source": "iana",
        "extensions": [
            "utz"
        ]
    },
    "application/vnd.umajin": {
        "source": "iana",
        "extensions": [
            "umj"
        ]
    },
    "application/vnd.unity": {
        "source": "iana",
        "extensions": [
            "unityweb"
        ]
    },
    "application/vnd.uoml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "uoml"
        ]
    },
    "application/vnd.uplanet.alert": {
        "source": "iana"
    },
    "application/vnd.uplanet.alert-wbxml": {
        "source": "iana"
    },
    "application/vnd.uplanet.bearer-choice": {
        "source": "iana"
    },
    "application/vnd.uplanet.bearer-choice-wbxml": {
        "source": "iana"
    },
    "application/vnd.uplanet.cacheop": {
        "source": "iana"
    },
    "application/vnd.uplanet.cacheop-wbxml": {
        "source": "iana"
    },
    "application/vnd.uplanet.channel": {
        "source": "iana"
    },
    "application/vnd.uplanet.channel-wbxml": {
        "source": "iana"
    },
    "application/vnd.uplanet.list": {
        "source": "iana"
    },
    "application/vnd.uplanet.list-wbxml": {
        "source": "iana"
    },
    "application/vnd.uplanet.listcmd": {
        "source": "iana"
    },
    "application/vnd.uplanet.listcmd-wbxml": {
        "source": "iana"
    },
    "application/vnd.uplanet.signal": {
        "source": "iana"
    },
    "application/vnd.uri-map": {
        "source": "iana"
    },
    "application/vnd.valve.source.material": {
        "source": "iana"
    },
    "application/vnd.vcx": {
        "source": "iana",
        "extensions": [
            "vcx"
        ]
    },
    "application/vnd.vd-study": {
        "source": "iana"
    },
    "application/vnd.vectorworks": {
        "source": "iana"
    },
    "application/vnd.vel+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.verimatrix.vcas": {
        "source": "iana"
    },
    "application/vnd.veritone.aion+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.veryant.thin": {
        "source": "iana"
    },
    "application/vnd.ves.encrypted": {
        "source": "iana"
    },
    "application/vnd.vidsoft.vidconference": {
        "source": "iana"
    },
    "application/vnd.visio": {
        "source": "iana",
        "extensions": [
            "vsd",
            "vst",
            "vss",
            "vsw"
        ]
    },
    "application/vnd.visionary": {
        "source": "iana",
        "extensions": [
            "vis"
        ]
    },
    "application/vnd.vividence.scriptfile": {
        "source": "iana"
    },
    "application/vnd.vsf": {
        "source": "iana",
        "extensions": [
            "vsf"
        ]
    },
    "application/vnd.wap.sic": {
        "source": "iana"
    },
    "application/vnd.wap.slc": {
        "source": "iana"
    },
    "application/vnd.wap.wbxml": {
        "source": "iana",
        "charset": "UTF-8",
        "extensions": [
            "wbxml"
        ]
    },
    "application/vnd.wap.wmlc": {
        "source": "iana",
        "extensions": [
            "wmlc"
        ]
    },
    "application/vnd.wap.wmlscriptc": {
        "source": "iana",
        "extensions": [
            "wmlsc"
        ]
    },
    "application/vnd.webturbo": {
        "source": "iana",
        "extensions": [
            "wtb"
        ]
    },
    "application/vnd.wfa.dpp": {
        "source": "iana"
    },
    "application/vnd.wfa.p2p": {
        "source": "iana"
    },
    "application/vnd.wfa.wsc": {
        "source": "iana"
    },
    "application/vnd.windows.devicepairing": {
        "source": "iana"
    },
    "application/vnd.wmc": {
        "source": "iana"
    },
    "application/vnd.wmf.bootstrap": {
        "source": "iana"
    },
    "application/vnd.wolfram.mathematica": {
        "source": "iana"
    },
    "application/vnd.wolfram.mathematica.package": {
        "source": "iana"
    },
    "application/vnd.wolfram.player": {
        "source": "iana",
        "extensions": [
            "nbp"
        ]
    },
    "application/vnd.wordperfect": {
        "source": "iana",
        "extensions": [
            "wpd"
        ]
    },
    "application/vnd.wqd": {
        "source": "iana",
        "extensions": [
            "wqd"
        ]
    },
    "application/vnd.wrq-hp3000-labelled": {
        "source": "iana"
    },
    "application/vnd.wt.stf": {
        "source": "iana",
        "extensions": [
            "stf"
        ]
    },
    "application/vnd.wv.csp+wbxml": {
        "source": "iana"
    },
    "application/vnd.wv.csp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.wv.ssp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.xacml+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.xara": {
        "source": "iana",
        "extensions": [
            "xar"
        ]
    },
    "application/vnd.xfdl": {
        "source": "iana",
        "extensions": [
            "xfdl"
        ]
    },
    "application/vnd.xfdl.webform": {
        "source": "iana"
    },
    "application/vnd.xmi+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/vnd.xmpie.cpkg": {
        "source": "iana"
    },
    "application/vnd.xmpie.dpkg": {
        "source": "iana"
    },
    "application/vnd.xmpie.plan": {
        "source": "iana"
    },
    "application/vnd.xmpie.ppkg": {
        "source": "iana"
    },
    "application/vnd.xmpie.xlim": {
        "source": "iana"
    },
    "application/vnd.yamaha.hv-dic": {
        "source": "iana",
        "extensions": [
            "hvd"
        ]
    },
    "application/vnd.yamaha.hv-script": {
        "source": "iana",
        "extensions": [
            "hvs"
        ]
    },
    "application/vnd.yamaha.hv-voice": {
        "source": "iana",
        "extensions": [
            "hvp"
        ]
    },
    "application/vnd.yamaha.openscoreformat": {
        "source": "iana",
        "extensions": [
            "osf"
        ]
    },
    "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "osfpvg"
        ]
    },
    "application/vnd.yamaha.remote-setup": {
        "source": "iana"
    },
    "application/vnd.yamaha.smaf-audio": {
        "source": "iana",
        "extensions": [
            "saf"
        ]
    },
    "application/vnd.yamaha.smaf-phrase": {
        "source": "iana",
        "extensions": [
            "spf"
        ]
    },
    "application/vnd.yamaha.through-ngn": {
        "source": "iana"
    },
    "application/vnd.yamaha.tunnel-udpencap": {
        "source": "iana"
    },
    "application/vnd.yaoweme": {
        "source": "iana"
    },
    "application/vnd.yellowriver-custom-menu": {
        "source": "iana",
        "extensions": [
            "cmp"
        ]
    },
    "application/vnd.youtube.yt": {
        "source": "iana"
    },
    "application/vnd.zul": {
        "source": "iana",
        "extensions": [
            "zir",
            "zirz"
        ]
    },
    "application/vnd.zzazz.deck+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "zaz"
        ]
    },
    "application/voicexml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "vxml"
        ]
    },
    "application/voucher-cms+json": {
        "source": "iana",
        "compressible": true
    },
    "application/vq-rtcpxr": {
        "source": "iana"
    },
    "application/wasm": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "wasm"
        ]
    },
    "application/watcherinfo+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "wif"
        ]
    },
    "application/webpush-options+json": {
        "source": "iana",
        "compressible": true
    },
    "application/whoispp-query": {
        "source": "iana"
    },
    "application/whoispp-response": {
        "source": "iana"
    },
    "application/widget": {
        "source": "iana",
        "extensions": [
            "wgt"
        ]
    },
    "application/winhlp": {
        "source": "apache",
        "extensions": [
            "hlp"
        ]
    },
    "application/wita": {
        "source": "iana"
    },
    "application/wordperfect5.1": {
        "source": "iana"
    },
    "application/wsdl+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "wsdl"
        ]
    },
    "application/wspolicy+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "wspolicy"
        ]
    },
    "application/x-7z-compressed": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "7z"
        ]
    },
    "application/x-abiword": {
        "source": "apache",
        "extensions": [
            "abw"
        ]
    },
    "application/x-ace-compressed": {
        "source": "apache",
        "extensions": [
            "ace"
        ]
    },
    "application/x-amf": {
        "source": "apache"
    },
    "application/x-apple-diskimage": {
        "source": "apache",
        "extensions": [
            "dmg"
        ]
    },
    "application/x-arj": {
        "compressible": false,
        "extensions": [
            "arj"
        ]
    },
    "application/x-authorware-bin": {
        "source": "apache",
        "extensions": [
            "aab",
            "x32",
            "u32",
            "vox"
        ]
    },
    "application/x-authorware-map": {
        "source": "apache",
        "extensions": [
            "aam"
        ]
    },
    "application/x-authorware-seg": {
        "source": "apache",
        "extensions": [
            "aas"
        ]
    },
    "application/x-bcpio": {
        "source": "apache",
        "extensions": [
            "bcpio"
        ]
    },
    "application/x-bdoc": {
        "compressible": false,
        "extensions": [
            "bdoc"
        ]
    },
    "application/x-bittorrent": {
        "source": "apache",
        "extensions": [
            "torrent"
        ]
    },
    "application/x-blorb": {
        "source": "apache",
        "extensions": [
            "blb",
            "blorb"
        ]
    },
    "application/x-bzip": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "bz"
        ]
    },
    "application/x-bzip2": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "bz2",
            "boz"
        ]
    },
    "application/x-cbr": {
        "source": "apache",
        "extensions": [
            "cbr",
            "cba",
            "cbt",
            "cbz",
            "cb7"
        ]
    },
    "application/x-cdlink": {
        "source": "apache",
        "extensions": [
            "vcd"
        ]
    },
    "application/x-cfs-compressed": {
        "source": "apache",
        "extensions": [
            "cfs"
        ]
    },
    "application/x-chat": {
        "source": "apache",
        "extensions": [
            "chat"
        ]
    },
    "application/x-chess-pgn": {
        "source": "apache",
        "extensions": [
            "pgn"
        ]
    },
    "application/x-chrome-extension": {
        "extensions": [
            "crx"
        ]
    },
    "application/x-cocoa": {
        "source": "nginx",
        "extensions": [
            "cco"
        ]
    },
    "application/x-compress": {
        "source": "apache"
    },
    "application/x-conference": {
        "source": "apache",
        "extensions": [
            "nsc"
        ]
    },
    "application/x-cpio": {
        "source": "apache",
        "extensions": [
            "cpio"
        ]
    },
    "application/x-csh": {
        "source": "apache",
        "extensions": [
            "csh"
        ]
    },
    "application/x-deb": {
        "compressible": false
    },
    "application/x-debian-package": {
        "source": "apache",
        "extensions": [
            "deb",
            "udeb"
        ]
    },
    "application/x-dgc-compressed": {
        "source": "apache",
        "extensions": [
            "dgc"
        ]
    },
    "application/x-director": {
        "source": "apache",
        "extensions": [
            "dir",
            "dcr",
            "dxr",
            "cst",
            "cct",
            "cxt",
            "w3d",
            "fgd",
            "swa"
        ]
    },
    "application/x-doom": {
        "source": "apache",
        "extensions": [
            "wad"
        ]
    },
    "application/x-dtbncx+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "ncx"
        ]
    },
    "application/x-dtbook+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "dtb"
        ]
    },
    "application/x-dtbresource+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "res"
        ]
    },
    "application/x-dvi": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "dvi"
        ]
    },
    "application/x-envoy": {
        "source": "apache",
        "extensions": [
            "evy"
        ]
    },
    "application/x-eva": {
        "source": "apache",
        "extensions": [
            "eva"
        ]
    },
    "application/x-font-bdf": {
        "source": "apache",
        "extensions": [
            "bdf"
        ]
    },
    "application/x-font-dos": {
        "source": "apache"
    },
    "application/x-font-framemaker": {
        "source": "apache"
    },
    "application/x-font-ghostscript": {
        "source": "apache",
        "extensions": [
            "gsf"
        ]
    },
    "application/x-font-libgrx": {
        "source": "apache"
    },
    "application/x-font-linux-psf": {
        "source": "apache",
        "extensions": [
            "psf"
        ]
    },
    "application/x-font-pcf": {
        "source": "apache",
        "extensions": [
            "pcf"
        ]
    },
    "application/x-font-snf": {
        "source": "apache",
        "extensions": [
            "snf"
        ]
    },
    "application/x-font-speedo": {
        "source": "apache"
    },
    "application/x-font-sunos-news": {
        "source": "apache"
    },
    "application/x-font-type1": {
        "source": "apache",
        "extensions": [
            "pfa",
            "pfb",
            "pfm",
            "afm"
        ]
    },
    "application/x-font-vfont": {
        "source": "apache"
    },
    "application/x-freearc": {
        "source": "apache",
        "extensions": [
            "arc"
        ]
    },
    "application/x-futuresplash": {
        "source": "apache",
        "extensions": [
            "spl"
        ]
    },
    "application/x-gca-compressed": {
        "source": "apache",
        "extensions": [
            "gca"
        ]
    },
    "application/x-glulx": {
        "source": "apache",
        "extensions": [
            "ulx"
        ]
    },
    "application/x-gnumeric": {
        "source": "apache",
        "extensions": [
            "gnumeric"
        ]
    },
    "application/x-gramps-xml": {
        "source": "apache",
        "extensions": [
            "gramps"
        ]
    },
    "application/x-gtar": {
        "source": "apache",
        "extensions": [
            "gtar"
        ]
    },
    "application/x-gzip": {
        "source": "apache"
    },
    "application/x-hdf": {
        "source": "apache",
        "extensions": [
            "hdf"
        ]
    },
    "application/x-httpd-php": {
        "compressible": true,
        "extensions": [
            "php"
        ]
    },
    "application/x-install-instructions": {
        "source": "apache",
        "extensions": [
            "install"
        ]
    },
    "application/x-iso9660-image": {
        "source": "apache",
        "extensions": [
            "iso"
        ]
    },
    "application/x-iwork-keynote-sffkey": {
        "extensions": [
            "key"
        ]
    },
    "application/x-iwork-numbers-sffnumbers": {
        "extensions": [
            "numbers"
        ]
    },
    "application/x-iwork-pages-sffpages": {
        "extensions": [
            "pages"
        ]
    },
    "application/x-java-archive-diff": {
        "source": "nginx",
        "extensions": [
            "jardiff"
        ]
    },
    "application/x-java-jnlp-file": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "jnlp"
        ]
    },
    "application/x-javascript": {
        "compressible": true
    },
    "application/x-keepass2": {
        "extensions": [
            "kdbx"
        ]
    },
    "application/x-latex": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "latex"
        ]
    },
    "application/x-lua-bytecode": {
        "extensions": [
            "luac"
        ]
    },
    "application/x-lzh-compressed": {
        "source": "apache",
        "extensions": [
            "lzh",
            "lha"
        ]
    },
    "application/x-makeself": {
        "source": "nginx",
        "extensions": [
            "run"
        ]
    },
    "application/x-mie": {
        "source": "apache",
        "extensions": [
            "mie"
        ]
    },
    "application/x-mobipocket-ebook": {
        "source": "apache",
        "extensions": [
            "prc",
            "mobi"
        ]
    },
    "application/x-mpegurl": {
        "compressible": false
    },
    "application/x-ms-application": {
        "source": "apache",
        "extensions": [
            "application"
        ]
    },
    "application/x-ms-shortcut": {
        "source": "apache",
        "extensions": [
            "lnk"
        ]
    },
    "application/x-ms-wmd": {
        "source": "apache",
        "extensions": [
            "wmd"
        ]
    },
    "application/x-ms-wmz": {
        "source": "apache",
        "extensions": [
            "wmz"
        ]
    },
    "application/x-ms-xbap": {
        "source": "apache",
        "extensions": [
            "xbap"
        ]
    },
    "application/x-msaccess": {
        "source": "apache",
        "extensions": [
            "mdb"
        ]
    },
    "application/x-msbinder": {
        "source": "apache",
        "extensions": [
            "obd"
        ]
    },
    "application/x-mscardfile": {
        "source": "apache",
        "extensions": [
            "crd"
        ]
    },
    "application/x-msclip": {
        "source": "apache",
        "extensions": [
            "clp"
        ]
    },
    "application/x-msdos-program": {
        "extensions": [
            "exe"
        ]
    },
    "application/x-msdownload": {
        "source": "apache",
        "extensions": [
            "exe",
            "dll",
            "com",
            "bat",
            "msi"
        ]
    },
    "application/x-msmediaview": {
        "source": "apache",
        "extensions": [
            "mvb",
            "m13",
            "m14"
        ]
    },
    "application/x-msmetafile": {
        "source": "apache",
        "extensions": [
            "wmf",
            "wmz",
            "emf",
            "emz"
        ]
    },
    "application/x-msmoney": {
        "source": "apache",
        "extensions": [
            "mny"
        ]
    },
    "application/x-mspublisher": {
        "source": "apache",
        "extensions": [
            "pub"
        ]
    },
    "application/x-msschedule": {
        "source": "apache",
        "extensions": [
            "scd"
        ]
    },
    "application/x-msterminal": {
        "source": "apache",
        "extensions": [
            "trm"
        ]
    },
    "application/x-mswrite": {
        "source": "apache",
        "extensions": [
            "wri"
        ]
    },
    "application/x-netcdf": {
        "source": "apache",
        "extensions": [
            "nc",
            "cdf"
        ]
    },
    "application/x-ns-proxy-autoconfig": {
        "compressible": true,
        "extensions": [
            "pac"
        ]
    },
    "application/x-nzb": {
        "source": "apache",
        "extensions": [
            "nzb"
        ]
    },
    "application/x-perl": {
        "source": "nginx",
        "extensions": [
            "pl",
            "pm"
        ]
    },
    "application/x-pilot": {
        "source": "nginx",
        "extensions": [
            "prc",
            "pdb"
        ]
    },
    "application/x-pkcs12": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "p12",
            "pfx"
        ]
    },
    "application/x-pkcs7-certificates": {
        "source": "apache",
        "extensions": [
            "p7b",
            "spc"
        ]
    },
    "application/x-pkcs7-certreqresp": {
        "source": "apache",
        "extensions": [
            "p7r"
        ]
    },
    "application/x-pki-message": {
        "source": "iana"
    },
    "application/x-rar-compressed": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "rar"
        ]
    },
    "application/x-redhat-package-manager": {
        "source": "nginx",
        "extensions": [
            "rpm"
        ]
    },
    "application/x-research-info-systems": {
        "source": "apache",
        "extensions": [
            "ris"
        ]
    },
    "application/x-sea": {
        "source": "nginx",
        "extensions": [
            "sea"
        ]
    },
    "application/x-sh": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "sh"
        ]
    },
    "application/x-shar": {
        "source": "apache",
        "extensions": [
            "shar"
        ]
    },
    "application/x-shockwave-flash": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "swf"
        ]
    },
    "application/x-silverlight-app": {
        "source": "apache",
        "extensions": [
            "xap"
        ]
    },
    "application/x-sql": {
        "source": "apache",
        "extensions": [
            "sql"
        ]
    },
    "application/x-stuffit": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "sit"
        ]
    },
    "application/x-stuffitx": {
        "source": "apache",
        "extensions": [
            "sitx"
        ]
    },
    "application/x-subrip": {
        "source": "apache",
        "extensions": [
            "srt"
        ]
    },
    "application/x-sv4cpio": {
        "source": "apache",
        "extensions": [
            "sv4cpio"
        ]
    },
    "application/x-sv4crc": {
        "source": "apache",
        "extensions": [
            "sv4crc"
        ]
    },
    "application/x-t3vm-image": {
        "source": "apache",
        "extensions": [
            "t3"
        ]
    },
    "application/x-tads": {
        "source": "apache",
        "extensions": [
            "gam"
        ]
    },
    "application/x-tar": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "tar"
        ]
    },
    "application/x-tcl": {
        "source": "apache",
        "extensions": [
            "tcl",
            "tk"
        ]
    },
    "application/x-tex": {
        "source": "apache",
        "extensions": [
            "tex"
        ]
    },
    "application/x-tex-tfm": {
        "source": "apache",
        "extensions": [
            "tfm"
        ]
    },
    "application/x-texinfo": {
        "source": "apache",
        "extensions": [
            "texinfo",
            "texi"
        ]
    },
    "application/x-tgif": {
        "source": "apache",
        "extensions": [
            "obj"
        ]
    },
    "application/x-ustar": {
        "source": "apache",
        "extensions": [
            "ustar"
        ]
    },
    "application/x-virtualbox-hdd": {
        "compressible": true,
        "extensions": [
            "hdd"
        ]
    },
    "application/x-virtualbox-ova": {
        "compressible": true,
        "extensions": [
            "ova"
        ]
    },
    "application/x-virtualbox-ovf": {
        "compressible": true,
        "extensions": [
            "ovf"
        ]
    },
    "application/x-virtualbox-vbox": {
        "compressible": true,
        "extensions": [
            "vbox"
        ]
    },
    "application/x-virtualbox-vbox-extpack": {
        "compressible": false,
        "extensions": [
            "vbox-extpack"
        ]
    },
    "application/x-virtualbox-vdi": {
        "compressible": true,
        "extensions": [
            "vdi"
        ]
    },
    "application/x-virtualbox-vhd": {
        "compressible": true,
        "extensions": [
            "vhd"
        ]
    },
    "application/x-virtualbox-vmdk": {
        "compressible": true,
        "extensions": [
            "vmdk"
        ]
    },
    "application/x-wais-source": {
        "source": "apache",
        "extensions": [
            "src"
        ]
    },
    "application/x-web-app-manifest+json": {
        "compressible": true,
        "extensions": [
            "webapp"
        ]
    },
    "application/x-www-form-urlencoded": {
        "source": "iana",
        "compressible": true
    },
    "application/x-x509-ca-cert": {
        "source": "iana",
        "extensions": [
            "der",
            "crt",
            "pem"
        ]
    },
    "application/x-x509-ca-ra-cert": {
        "source": "iana"
    },
    "application/x-x509-next-ca-cert": {
        "source": "iana"
    },
    "application/x-xfig": {
        "source": "apache",
        "extensions": [
            "fig"
        ]
    },
    "application/x-xliff+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "xlf"
        ]
    },
    "application/x-xpinstall": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "xpi"
        ]
    },
    "application/x-xz": {
        "source": "apache",
        "extensions": [
            "xz"
        ]
    },
    "application/x-zmachine": {
        "source": "apache",
        "extensions": [
            "z1",
            "z2",
            "z3",
            "z4",
            "z5",
            "z6",
            "z7",
            "z8"
        ]
    },
    "application/x400-bp": {
        "source": "iana"
    },
    "application/xacml+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/xaml+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "xaml"
        ]
    },
    "application/xcap-att+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xav"
        ]
    },
    "application/xcap-caps+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xca"
        ]
    },
    "application/xcap-diff+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xdf"
        ]
    },
    "application/xcap-el+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xel"
        ]
    },
    "application/xcap-error+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/xcap-ns+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xns"
        ]
    },
    "application/xcon-conference-info+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/xcon-conference-info-diff+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/xenc+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xenc"
        ]
    },
    "application/xhtml+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xhtml",
            "xht"
        ]
    },
    "application/xhtml-voice+xml": {
        "source": "apache",
        "compressible": true
    },
    "application/xliff+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xlf"
        ]
    },
    "application/xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xml",
            "xsl",
            "xsd",
            "rng"
        ]
    },
    "application/xml-dtd": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "dtd"
        ]
    },
    "application/xml-external-parsed-entity": {
        "source": "iana"
    },
    "application/xml-patch+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/xmpp+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/xop+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xop"
        ]
    },
    "application/xproc+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "xpl"
        ]
    },
    "application/xslt+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xsl",
            "xslt"
        ]
    },
    "application/xspf+xml": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "xspf"
        ]
    },
    "application/xv+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "mxml",
            "xhvml",
            "xvml",
            "xvm"
        ]
    },
    "application/yang": {
        "source": "iana",
        "extensions": [
            "yang"
        ]
    },
    "application/yang-data+json": {
        "source": "iana",
        "compressible": true
    },
    "application/yang-data+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/yang-patch+json": {
        "source": "iana",
        "compressible": true
    },
    "application/yang-patch+xml": {
        "source": "iana",
        "compressible": true
    },
    "application/yin+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "yin"
        ]
    },
    "application/zip": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "zip"
        ]
    },
    "application/zlib": {
        "source": "iana"
    },
    "application/zstd": {
        "source": "iana"
    },
    "audio/1d-interleaved-parityfec": {
        "source": "iana"
    },
    "audio/32kadpcm": {
        "source": "iana"
    },
    "audio/3gpp": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "3gpp"
        ]
    },
    "audio/3gpp2": {
        "source": "iana"
    },
    "audio/aac": {
        "source": "iana"
    },
    "audio/ac3": {
        "source": "iana"
    },
    "audio/adpcm": {
        "source": "apache",
        "extensions": [
            "adp"
        ]
    },
    "audio/amr": {
        "source": "iana",
        "extensions": [
            "amr"
        ]
    },
    "audio/amr-wb": {
        "source": "iana"
    },
    "audio/amr-wb+": {
        "source": "iana"
    },
    "audio/aptx": {
        "source": "iana"
    },
    "audio/asc": {
        "source": "iana"
    },
    "audio/atrac-advanced-lossless": {
        "source": "iana"
    },
    "audio/atrac-x": {
        "source": "iana"
    },
    "audio/atrac3": {
        "source": "iana"
    },
    "audio/basic": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "au",
            "snd"
        ]
    },
    "audio/bv16": {
        "source": "iana"
    },
    "audio/bv32": {
        "source": "iana"
    },
    "audio/clearmode": {
        "source": "iana"
    },
    "audio/cn": {
        "source": "iana"
    },
    "audio/dat12": {
        "source": "iana"
    },
    "audio/dls": {
        "source": "iana"
    },
    "audio/dsr-es201108": {
        "source": "iana"
    },
    "audio/dsr-es202050": {
        "source": "iana"
    },
    "audio/dsr-es202211": {
        "source": "iana"
    },
    "audio/dsr-es202212": {
        "source": "iana"
    },
    "audio/dv": {
        "source": "iana"
    },
    "audio/dvi4": {
        "source": "iana"
    },
    "audio/eac3": {
        "source": "iana"
    },
    "audio/encaprtp": {
        "source": "iana"
    },
    "audio/evrc": {
        "source": "iana"
    },
    "audio/evrc-qcp": {
        "source": "iana"
    },
    "audio/evrc0": {
        "source": "iana"
    },
    "audio/evrc1": {
        "source": "iana"
    },
    "audio/evrcb": {
        "source": "iana"
    },
    "audio/evrcb0": {
        "source": "iana"
    },
    "audio/evrcb1": {
        "source": "iana"
    },
    "audio/evrcnw": {
        "source": "iana"
    },
    "audio/evrcnw0": {
        "source": "iana"
    },
    "audio/evrcnw1": {
        "source": "iana"
    },
    "audio/evrcwb": {
        "source": "iana"
    },
    "audio/evrcwb0": {
        "source": "iana"
    },
    "audio/evrcwb1": {
        "source": "iana"
    },
    "audio/evs": {
        "source": "iana"
    },
    "audio/flexfec": {
        "source": "iana"
    },
    "audio/fwdred": {
        "source": "iana"
    },
    "audio/g711-0": {
        "source": "iana"
    },
    "audio/g719": {
        "source": "iana"
    },
    "audio/g722": {
        "source": "iana"
    },
    "audio/g7221": {
        "source": "iana"
    },
    "audio/g723": {
        "source": "iana"
    },
    "audio/g726-16": {
        "source": "iana"
    },
    "audio/g726-24": {
        "source": "iana"
    },
    "audio/g726-32": {
        "source": "iana"
    },
    "audio/g726-40": {
        "source": "iana"
    },
    "audio/g728": {
        "source": "iana"
    },
    "audio/g729": {
        "source": "iana"
    },
    "audio/g7291": {
        "source": "iana"
    },
    "audio/g729d": {
        "source": "iana"
    },
    "audio/g729e": {
        "source": "iana"
    },
    "audio/gsm": {
        "source": "iana"
    },
    "audio/gsm-efr": {
        "source": "iana"
    },
    "audio/gsm-hr-08": {
        "source": "iana"
    },
    "audio/ilbc": {
        "source": "iana"
    },
    "audio/ip-mr_v2.5": {
        "source": "iana"
    },
    "audio/isac": {
        "source": "apache"
    },
    "audio/l16": {
        "source": "iana"
    },
    "audio/l20": {
        "source": "iana"
    },
    "audio/l24": {
        "source": "iana",
        "compressible": false
    },
    "audio/l8": {
        "source": "iana"
    },
    "audio/lpc": {
        "source": "iana"
    },
    "audio/melp": {
        "source": "iana"
    },
    "audio/melp1200": {
        "source": "iana"
    },
    "audio/melp2400": {
        "source": "iana"
    },
    "audio/melp600": {
        "source": "iana"
    },
    "audio/mhas": {
        "source": "iana"
    },
    "audio/midi": {
        "source": "apache",
        "extensions": [
            "mid",
            "midi",
            "kar",
            "rmi"
        ]
    },
    "audio/mobile-xmf": {
        "source": "iana",
        "extensions": [
            "mxmf"
        ]
    },
    "audio/mp3": {
        "compressible": false,
        "extensions": [
            "mp3"
        ]
    },
    "audio/mp4": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "m4a",
            "mp4a"
        ]
    },
    "audio/mp4a-latm": {
        "source": "iana"
    },
    "audio/mpa": {
        "source": "iana"
    },
    "audio/mpa-robust": {
        "source": "iana"
    },
    "audio/mpeg": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "mpga",
            "mp2",
            "mp2a",
            "mp3",
            "m2a",
            "m3a"
        ]
    },
    "audio/mpeg4-generic": {
        "source": "iana"
    },
    "audio/musepack": {
        "source": "apache"
    },
    "audio/ogg": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "oga",
            "ogg",
            "spx",
            "opus"
        ]
    },
    "audio/opus": {
        "source": "iana"
    },
    "audio/parityfec": {
        "source": "iana"
    },
    "audio/pcma": {
        "source": "iana"
    },
    "audio/pcma-wb": {
        "source": "iana"
    },
    "audio/pcmu": {
        "source": "iana"
    },
    "audio/pcmu-wb": {
        "source": "iana"
    },
    "audio/prs.sid": {
        "source": "iana"
    },
    "audio/qcelp": {
        "source": "iana"
    },
    "audio/raptorfec": {
        "source": "iana"
    },
    "audio/red": {
        "source": "iana"
    },
    "audio/rtp-enc-aescm128": {
        "source": "iana"
    },
    "audio/rtp-midi": {
        "source": "iana"
    },
    "audio/rtploopback": {
        "source": "iana"
    },
    "audio/rtx": {
        "source": "iana"
    },
    "audio/s3m": {
        "source": "apache",
        "extensions": [
            "s3m"
        ]
    },
    "audio/scip": {
        "source": "iana"
    },
    "audio/silk": {
        "source": "apache",
        "extensions": [
            "sil"
        ]
    },
    "audio/smv": {
        "source": "iana"
    },
    "audio/smv-qcp": {
        "source": "iana"
    },
    "audio/smv0": {
        "source": "iana"
    },
    "audio/sofa": {
        "source": "iana"
    },
    "audio/sp-midi": {
        "source": "iana"
    },
    "audio/speex": {
        "source": "iana"
    },
    "audio/t140c": {
        "source": "iana"
    },
    "audio/t38": {
        "source": "iana"
    },
    "audio/telephone-event": {
        "source": "iana"
    },
    "audio/tetra_acelp": {
        "source": "iana"
    },
    "audio/tetra_acelp_bb": {
        "source": "iana"
    },
    "audio/tone": {
        "source": "iana"
    },
    "audio/tsvcis": {
        "source": "iana"
    },
    "audio/uemclip": {
        "source": "iana"
    },
    "audio/ulpfec": {
        "source": "iana"
    },
    "audio/usac": {
        "source": "iana"
    },
    "audio/vdvi": {
        "source": "iana"
    },
    "audio/vmr-wb": {
        "source": "iana"
    },
    "audio/vnd.3gpp.iufp": {
        "source": "iana"
    },
    "audio/vnd.4sb": {
        "source": "iana"
    },
    "audio/vnd.audiokoz": {
        "source": "iana"
    },
    "audio/vnd.celp": {
        "source": "iana"
    },
    "audio/vnd.cisco.nse": {
        "source": "iana"
    },
    "audio/vnd.cmles.radio-events": {
        "source": "iana"
    },
    "audio/vnd.cns.anp1": {
        "source": "iana"
    },
    "audio/vnd.cns.inf1": {
        "source": "iana"
    },
    "audio/vnd.dece.audio": {
        "source": "iana",
        "extensions": [
            "uva",
            "uvva"
        ]
    },
    "audio/vnd.digital-winds": {
        "source": "iana",
        "extensions": [
            "eol"
        ]
    },
    "audio/vnd.dlna.adts": {
        "source": "iana"
    },
    "audio/vnd.dolby.heaac.1": {
        "source": "iana"
    },
    "audio/vnd.dolby.heaac.2": {
        "source": "iana"
    },
    "audio/vnd.dolby.mlp": {
        "source": "iana"
    },
    "audio/vnd.dolby.mps": {
        "source": "iana"
    },
    "audio/vnd.dolby.pl2": {
        "source": "iana"
    },
    "audio/vnd.dolby.pl2x": {
        "source": "iana"
    },
    "audio/vnd.dolby.pl2z": {
        "source": "iana"
    },
    "audio/vnd.dolby.pulse.1": {
        "source": "iana"
    },
    "audio/vnd.dra": {
        "source": "iana",
        "extensions": [
            "dra"
        ]
    },
    "audio/vnd.dts": {
        "source": "iana",
        "extensions": [
            "dts"
        ]
    },
    "audio/vnd.dts.hd": {
        "source": "iana",
        "extensions": [
            "dtshd"
        ]
    },
    "audio/vnd.dts.uhd": {
        "source": "iana"
    },
    "audio/vnd.dvb.file": {
        "source": "iana"
    },
    "audio/vnd.everad.plj": {
        "source": "iana"
    },
    "audio/vnd.hns.audio": {
        "source": "iana"
    },
    "audio/vnd.lucent.voice": {
        "source": "iana",
        "extensions": [
            "lvp"
        ]
    },
    "audio/vnd.ms-playready.media.pya": {
        "source": "iana",
        "extensions": [
            "pya"
        ]
    },
    "audio/vnd.nokia.mobile-xmf": {
        "source": "iana"
    },
    "audio/vnd.nortel.vbk": {
        "source": "iana"
    },
    "audio/vnd.nuera.ecelp4800": {
        "source": "iana",
        "extensions": [
            "ecelp4800"
        ]
    },
    "audio/vnd.nuera.ecelp7470": {
        "source": "iana",
        "extensions": [
            "ecelp7470"
        ]
    },
    "audio/vnd.nuera.ecelp9600": {
        "source": "iana",
        "extensions": [
            "ecelp9600"
        ]
    },
    "audio/vnd.octel.sbc": {
        "source": "iana"
    },
    "audio/vnd.presonus.multitrack": {
        "source": "iana"
    },
    "audio/vnd.qcelp": {
        "source": "iana"
    },
    "audio/vnd.rhetorex.32kadpcm": {
        "source": "iana"
    },
    "audio/vnd.rip": {
        "source": "iana",
        "extensions": [
            "rip"
        ]
    },
    "audio/vnd.rn-realaudio": {
        "compressible": false
    },
    "audio/vnd.sealedmedia.softseal.mpeg": {
        "source": "iana"
    },
    "audio/vnd.vmx.cvsd": {
        "source": "iana"
    },
    "audio/vnd.wave": {
        "compressible": false
    },
    "audio/vorbis": {
        "source": "iana",
        "compressible": false
    },
    "audio/vorbis-config": {
        "source": "iana"
    },
    "audio/wav": {
        "compressible": false,
        "extensions": [
            "wav"
        ]
    },
    "audio/wave": {
        "compressible": false,
        "extensions": [
            "wav"
        ]
    },
    "audio/webm": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "weba"
        ]
    },
    "audio/x-aac": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "aac"
        ]
    },
    "audio/x-aiff": {
        "source": "apache",
        "extensions": [
            "aif",
            "aiff",
            "aifc"
        ]
    },
    "audio/x-caf": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "caf"
        ]
    },
    "audio/x-flac": {
        "source": "apache",
        "extensions": [
            "flac"
        ]
    },
    "audio/x-m4a": {
        "source": "nginx",
        "extensions": [
            "m4a"
        ]
    },
    "audio/x-matroska": {
        "source": "apache",
        "extensions": [
            "mka"
        ]
    },
    "audio/x-mpegurl": {
        "source": "apache",
        "extensions": [
            "m3u"
        ]
    },
    "audio/x-ms-wax": {
        "source": "apache",
        "extensions": [
            "wax"
        ]
    },
    "audio/x-ms-wma": {
        "source": "apache",
        "extensions": [
            "wma"
        ]
    },
    "audio/x-pn-realaudio": {
        "source": "apache",
        "extensions": [
            "ram",
            "ra"
        ]
    },
    "audio/x-pn-realaudio-plugin": {
        "source": "apache",
        "extensions": [
            "rmp"
        ]
    },
    "audio/x-realaudio": {
        "source": "nginx",
        "extensions": [
            "ra"
        ]
    },
    "audio/x-tta": {
        "source": "apache"
    },
    "audio/x-wav": {
        "source": "apache",
        "extensions": [
            "wav"
        ]
    },
    "audio/xm": {
        "source": "apache",
        "extensions": [
            "xm"
        ]
    },
    "chemical/x-cdx": {
        "source": "apache",
        "extensions": [
            "cdx"
        ]
    },
    "chemical/x-cif": {
        "source": "apache",
        "extensions": [
            "cif"
        ]
    },
    "chemical/x-cmdf": {
        "source": "apache",
        "extensions": [
            "cmdf"
        ]
    },
    "chemical/x-cml": {
        "source": "apache",
        "extensions": [
            "cml"
        ]
    },
    "chemical/x-csml": {
        "source": "apache",
        "extensions": [
            "csml"
        ]
    },
    "chemical/x-pdb": {
        "source": "apache"
    },
    "chemical/x-xyz": {
        "source": "apache",
        "extensions": [
            "xyz"
        ]
    },
    "font/collection": {
        "source": "iana",
        "extensions": [
            "ttc"
        ]
    },
    "font/otf": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "otf"
        ]
    },
    "font/sfnt": {
        "source": "iana"
    },
    "font/ttf": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ttf"
        ]
    },
    "font/woff": {
        "source": "iana",
        "extensions": [
            "woff"
        ]
    },
    "font/woff2": {
        "source": "iana",
        "extensions": [
            "woff2"
        ]
    },
    "image/aces": {
        "source": "iana",
        "extensions": [
            "exr"
        ]
    },
    "image/apng": {
        "compressible": false,
        "extensions": [
            "apng"
        ]
    },
    "image/avci": {
        "source": "iana",
        "extensions": [
            "avci"
        ]
    },
    "image/avcs": {
        "source": "iana",
        "extensions": [
            "avcs"
        ]
    },
    "image/avif": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "avif"
        ]
    },
    "image/bmp": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "bmp"
        ]
    },
    "image/cgm": {
        "source": "iana",
        "extensions": [
            "cgm"
        ]
    },
    "image/dicom-rle": {
        "source": "iana",
        "extensions": [
            "drle"
        ]
    },
    "image/emf": {
        "source": "iana",
        "extensions": [
            "emf"
        ]
    },
    "image/fits": {
        "source": "iana",
        "extensions": [
            "fits"
        ]
    },
    "image/g3fax": {
        "source": "iana",
        "extensions": [
            "g3"
        ]
    },
    "image/gif": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "gif"
        ]
    },
    "image/heic": {
        "source": "iana",
        "extensions": [
            "heic"
        ]
    },
    "image/heic-sequence": {
        "source": "iana",
        "extensions": [
            "heics"
        ]
    },
    "image/heif": {
        "source": "iana",
        "extensions": [
            "heif"
        ]
    },
    "image/heif-sequence": {
        "source": "iana",
        "extensions": [
            "heifs"
        ]
    },
    "image/hej2k": {
        "source": "iana",
        "extensions": [
            "hej2"
        ]
    },
    "image/hsj2": {
        "source": "iana",
        "extensions": [
            "hsj2"
        ]
    },
    "image/ief": {
        "source": "iana",
        "extensions": [
            "ief"
        ]
    },
    "image/jls": {
        "source": "iana",
        "extensions": [
            "jls"
        ]
    },
    "image/jp2": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "jp2",
            "jpg2"
        ]
    },
    "image/jpeg": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "jpeg",
            "jpg",
            "jpe"
        ]
    },
    "image/jph": {
        "source": "iana",
        "extensions": [
            "jph"
        ]
    },
    "image/jphc": {
        "source": "iana",
        "extensions": [
            "jhc"
        ]
    },
    "image/jpm": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "jpm"
        ]
    },
    "image/jpx": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "jpx",
            "jpf"
        ]
    },
    "image/jxr": {
        "source": "iana",
        "extensions": [
            "jxr"
        ]
    },
    "image/jxra": {
        "source": "iana",
        "extensions": [
            "jxra"
        ]
    },
    "image/jxrs": {
        "source": "iana",
        "extensions": [
            "jxrs"
        ]
    },
    "image/jxs": {
        "source": "iana",
        "extensions": [
            "jxs"
        ]
    },
    "image/jxsc": {
        "source": "iana",
        "extensions": [
            "jxsc"
        ]
    },
    "image/jxsi": {
        "source": "iana",
        "extensions": [
            "jxsi"
        ]
    },
    "image/jxss": {
        "source": "iana",
        "extensions": [
            "jxss"
        ]
    },
    "image/ktx": {
        "source": "iana",
        "extensions": [
            "ktx"
        ]
    },
    "image/ktx2": {
        "source": "iana",
        "extensions": [
            "ktx2"
        ]
    },
    "image/naplps": {
        "source": "iana"
    },
    "image/pjpeg": {
        "compressible": false
    },
    "image/png": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "png"
        ]
    },
    "image/prs.btif": {
        "source": "iana",
        "extensions": [
            "btif"
        ]
    },
    "image/prs.pti": {
        "source": "iana",
        "extensions": [
            "pti"
        ]
    },
    "image/pwg-raster": {
        "source": "iana"
    },
    "image/sgi": {
        "source": "apache",
        "extensions": [
            "sgi"
        ]
    },
    "image/svg+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "svg",
            "svgz"
        ]
    },
    "image/t38": {
        "source": "iana",
        "extensions": [
            "t38"
        ]
    },
    "image/tiff": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "tif",
            "tiff"
        ]
    },
    "image/tiff-fx": {
        "source": "iana",
        "extensions": [
            "tfx"
        ]
    },
    "image/vnd.adobe.photoshop": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "psd"
        ]
    },
    "image/vnd.airzip.accelerator.azv": {
        "source": "iana",
        "extensions": [
            "azv"
        ]
    },
    "image/vnd.cns.inf2": {
        "source": "iana"
    },
    "image/vnd.dece.graphic": {
        "source": "iana",
        "extensions": [
            "uvi",
            "uvvi",
            "uvg",
            "uvvg"
        ]
    },
    "image/vnd.djvu": {
        "source": "iana",
        "extensions": [
            "djvu",
            "djv"
        ]
    },
    "image/vnd.dvb.subtitle": {
        "source": "iana",
        "extensions": [
            "sub"
        ]
    },
    "image/vnd.dwg": {
        "source": "iana",
        "extensions": [
            "dwg"
        ]
    },
    "image/vnd.dxf": {
        "source": "iana",
        "extensions": [
            "dxf"
        ]
    },
    "image/vnd.fastbidsheet": {
        "source": "iana",
        "extensions": [
            "fbs"
        ]
    },
    "image/vnd.fpx": {
        "source": "iana",
        "extensions": [
            "fpx"
        ]
    },
    "image/vnd.fst": {
        "source": "iana",
        "extensions": [
            "fst"
        ]
    },
    "image/vnd.fujixerox.edmics-mmr": {
        "source": "iana",
        "extensions": [
            "mmr"
        ]
    },
    "image/vnd.fujixerox.edmics-rlc": {
        "source": "iana",
        "extensions": [
            "rlc"
        ]
    },
    "image/vnd.globalgraphics.pgb": {
        "source": "iana"
    },
    "image/vnd.microsoft.icon": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "ico"
        ]
    },
    "image/vnd.mix": {
        "source": "iana"
    },
    "image/vnd.mozilla.apng": {
        "source": "iana"
    },
    "image/vnd.ms-dds": {
        "compressible": true,
        "extensions": [
            "dds"
        ]
    },
    "image/vnd.ms-modi": {
        "source": "iana",
        "extensions": [
            "mdi"
        ]
    },
    "image/vnd.ms-photo": {
        "source": "apache",
        "extensions": [
            "wdp"
        ]
    },
    "image/vnd.net-fpx": {
        "source": "iana",
        "extensions": [
            "npx"
        ]
    },
    "image/vnd.pco.b16": {
        "source": "iana",
        "extensions": [
            "b16"
        ]
    },
    "image/vnd.radiance": {
        "source": "iana"
    },
    "image/vnd.sealed.png": {
        "source": "iana"
    },
    "image/vnd.sealedmedia.softseal.gif": {
        "source": "iana"
    },
    "image/vnd.sealedmedia.softseal.jpg": {
        "source": "iana"
    },
    "image/vnd.svf": {
        "source": "iana"
    },
    "image/vnd.tencent.tap": {
        "source": "iana",
        "extensions": [
            "tap"
        ]
    },
    "image/vnd.valve.source.texture": {
        "source": "iana",
        "extensions": [
            "vtf"
        ]
    },
    "image/vnd.wap.wbmp": {
        "source": "iana",
        "extensions": [
            "wbmp"
        ]
    },
    "image/vnd.xiff": {
        "source": "iana",
        "extensions": [
            "xif"
        ]
    },
    "image/vnd.zbrush.pcx": {
        "source": "iana",
        "extensions": [
            "pcx"
        ]
    },
    "image/webp": {
        "source": "apache",
        "extensions": [
            "webp"
        ]
    },
    "image/wmf": {
        "source": "iana",
        "extensions": [
            "wmf"
        ]
    },
    "image/x-3ds": {
        "source": "apache",
        "extensions": [
            "3ds"
        ]
    },
    "image/x-cmu-raster": {
        "source": "apache",
        "extensions": [
            "ras"
        ]
    },
    "image/x-cmx": {
        "source": "apache",
        "extensions": [
            "cmx"
        ]
    },
    "image/x-freehand": {
        "source": "apache",
        "extensions": [
            "fh",
            "fhc",
            "fh4",
            "fh5",
            "fh7"
        ]
    },
    "image/x-icon": {
        "source": "apache",
        "compressible": true,
        "extensions": [
            "ico"
        ]
    },
    "image/x-jng": {
        "source": "nginx",
        "extensions": [
            "jng"
        ]
    },
    "image/x-mrsid-image": {
        "source": "apache",
        "extensions": [
            "sid"
        ]
    },
    "image/x-ms-bmp": {
        "source": "nginx",
        "compressible": true,
        "extensions": [
            "bmp"
        ]
    },
    "image/x-pcx": {
        "source": "apache",
        "extensions": [
            "pcx"
        ]
    },
    "image/x-pict": {
        "source": "apache",
        "extensions": [
            "pic",
            "pct"
        ]
    },
    "image/x-portable-anymap": {
        "source": "apache",
        "extensions": [
            "pnm"
        ]
    },
    "image/x-portable-bitmap": {
        "source": "apache",
        "extensions": [
            "pbm"
        ]
    },
    "image/x-portable-graymap": {
        "source": "apache",
        "extensions": [
            "pgm"
        ]
    },
    "image/x-portable-pixmap": {
        "source": "apache",
        "extensions": [
            "ppm"
        ]
    },
    "image/x-rgb": {
        "source": "apache",
        "extensions": [
            "rgb"
        ]
    },
    "image/x-tga": {
        "source": "apache",
        "extensions": [
            "tga"
        ]
    },
    "image/x-xbitmap": {
        "source": "apache",
        "extensions": [
            "xbm"
        ]
    },
    "image/x-xcf": {
        "compressible": false
    },
    "image/x-xpixmap": {
        "source": "apache",
        "extensions": [
            "xpm"
        ]
    },
    "image/x-xwindowdump": {
        "source": "apache",
        "extensions": [
            "xwd"
        ]
    },
    "message/cpim": {
        "source": "iana"
    },
    "message/delivery-status": {
        "source": "iana"
    },
    "message/disposition-notification": {
        "source": "iana",
        "extensions": [
            "disposition-notification"
        ]
    },
    "message/external-body": {
        "source": "iana"
    },
    "message/feedback-report": {
        "source": "iana"
    },
    "message/global": {
        "source": "iana",
        "extensions": [
            "u8msg"
        ]
    },
    "message/global-delivery-status": {
        "source": "iana",
        "extensions": [
            "u8dsn"
        ]
    },
    "message/global-disposition-notification": {
        "source": "iana",
        "extensions": [
            "u8mdn"
        ]
    },
    "message/global-headers": {
        "source": "iana",
        "extensions": [
            "u8hdr"
        ]
    },
    "message/http": {
        "source": "iana",
        "compressible": false
    },
    "message/imdn+xml": {
        "source": "iana",
        "compressible": true
    },
    "message/news": {
        "source": "iana"
    },
    "message/partial": {
        "source": "iana",
        "compressible": false
    },
    "message/rfc822": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "eml",
            "mime"
        ]
    },
    "message/s-http": {
        "source": "iana"
    },
    "message/sip": {
        "source": "iana"
    },
    "message/sipfrag": {
        "source": "iana"
    },
    "message/tracking-status": {
        "source": "iana"
    },
    "message/vnd.si.simp": {
        "source": "iana"
    },
    "message/vnd.wfa.wsc": {
        "source": "iana",
        "extensions": [
            "wsc"
        ]
    },
    "model/3mf": {
        "source": "iana",
        "extensions": [
            "3mf"
        ]
    },
    "model/e57": {
        "source": "iana"
    },
    "model/gltf+json": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "gltf"
        ]
    },
    "model/gltf-binary": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "glb"
        ]
    },
    "model/iges": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "igs",
            "iges"
        ]
    },
    "model/mesh": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "msh",
            "mesh",
            "silo"
        ]
    },
    "model/mtl": {
        "source": "iana",
        "extensions": [
            "mtl"
        ]
    },
    "model/obj": {
        "source": "iana",
        "extensions": [
            "obj"
        ]
    },
    "model/step": {
        "source": "iana"
    },
    "model/step+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "stpx"
        ]
    },
    "model/step+zip": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "stpz"
        ]
    },
    "model/step-xml+zip": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "stpxz"
        ]
    },
    "model/stl": {
        "source": "iana",
        "extensions": [
            "stl"
        ]
    },
    "model/vnd.collada+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "dae"
        ]
    },
    "model/vnd.dwf": {
        "source": "iana",
        "extensions": [
            "dwf"
        ]
    },
    "model/vnd.flatland.3dml": {
        "source": "iana"
    },
    "model/vnd.gdl": {
        "source": "iana",
        "extensions": [
            "gdl"
        ]
    },
    "model/vnd.gs-gdl": {
        "source": "apache"
    },
    "model/vnd.gs.gdl": {
        "source": "iana"
    },
    "model/vnd.gtw": {
        "source": "iana",
        "extensions": [
            "gtw"
        ]
    },
    "model/vnd.moml+xml": {
        "source": "iana",
        "compressible": true
    },
    "model/vnd.mts": {
        "source": "iana",
        "extensions": [
            "mts"
        ]
    },
    "model/vnd.opengex": {
        "source": "iana",
        "extensions": [
            "ogex"
        ]
    },
    "model/vnd.parasolid.transmit.binary": {
        "source": "iana",
        "extensions": [
            "x_b"
        ]
    },
    "model/vnd.parasolid.transmit.text": {
        "source": "iana",
        "extensions": [
            "x_t"
        ]
    },
    "model/vnd.pytha.pyox": {
        "source": "iana"
    },
    "model/vnd.rosette.annotated-data-model": {
        "source": "iana"
    },
    "model/vnd.sap.vds": {
        "source": "iana",
        "extensions": [
            "vds"
        ]
    },
    "model/vnd.usdz+zip": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "usdz"
        ]
    },
    "model/vnd.valve.source.compiled-map": {
        "source": "iana",
        "extensions": [
            "bsp"
        ]
    },
    "model/vnd.vtu": {
        "source": "iana",
        "extensions": [
            "vtu"
        ]
    },
    "model/vrml": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "wrl",
            "vrml"
        ]
    },
    "model/x3d+binary": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "x3db",
            "x3dbz"
        ]
    },
    "model/x3d+fastinfoset": {
        "source": "iana",
        "extensions": [
            "x3db"
        ]
    },
    "model/x3d+vrml": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "x3dv",
            "x3dvz"
        ]
    },
    "model/x3d+xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "x3d",
            "x3dz"
        ]
    },
    "model/x3d-vrml": {
        "source": "iana",
        "extensions": [
            "x3dv"
        ]
    },
    "multipart/alternative": {
        "source": "iana",
        "compressible": false
    },
    "multipart/appledouble": {
        "source": "iana"
    },
    "multipart/byteranges": {
        "source": "iana"
    },
    "multipart/digest": {
        "source": "iana"
    },
    "multipart/encrypted": {
        "source": "iana",
        "compressible": false
    },
    "multipart/form-data": {
        "source": "iana",
        "compressible": false
    },
    "multipart/header-set": {
        "source": "iana"
    },
    "multipart/mixed": {
        "source": "iana"
    },
    "multipart/multilingual": {
        "source": "iana"
    },
    "multipart/parallel": {
        "source": "iana"
    },
    "multipart/related": {
        "source": "iana",
        "compressible": false
    },
    "multipart/report": {
        "source": "iana"
    },
    "multipart/signed": {
        "source": "iana",
        "compressible": false
    },
    "multipart/vnd.bint.med-plus": {
        "source": "iana"
    },
    "multipart/voice-message": {
        "source": "iana"
    },
    "multipart/x-mixed-replace": {
        "source": "iana"
    },
    "text/1d-interleaved-parityfec": {
        "source": "iana"
    },
    "text/cache-manifest": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "appcache",
            "manifest"
        ]
    },
    "text/calendar": {
        "source": "iana",
        "extensions": [
            "ics",
            "ifb"
        ]
    },
    "text/calender": {
        "compressible": true
    },
    "text/cmd": {
        "compressible": true
    },
    "text/coffeescript": {
        "extensions": [
            "coffee",
            "litcoffee"
        ]
    },
    "text/cql": {
        "source": "iana"
    },
    "text/cql-expression": {
        "source": "iana"
    },
    "text/cql-identifier": {
        "source": "iana"
    },
    "text/css": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "css"
        ]
    },
    "text/csv": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "csv"
        ]
    },
    "text/csv-schema": {
        "source": "iana"
    },
    "text/directory": {
        "source": "iana"
    },
    "text/dns": {
        "source": "iana"
    },
    "text/ecmascript": {
        "source": "iana"
    },
    "text/encaprtp": {
        "source": "iana"
    },
    "text/enriched": {
        "source": "iana"
    },
    "text/fhirpath": {
        "source": "iana"
    },
    "text/flexfec": {
        "source": "iana"
    },
    "text/fwdred": {
        "source": "iana"
    },
    "text/gff3": {
        "source": "iana"
    },
    "text/grammar-ref-list": {
        "source": "iana"
    },
    "text/html": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "html",
            "htm",
            "shtml"
        ]
    },
    "text/jade": {
        "extensions": [
            "jade"
        ]
    },
    "text/javascript": {
        "source": "iana",
        "compressible": true
    },
    "text/jcr-cnd": {
        "source": "iana"
    },
    "text/jsx": {
        "compressible": true,
        "extensions": [
            "jsx"
        ]
    },
    "text/less": {
        "compressible": true,
        "extensions": [
            "less"
        ]
    },
    "text/markdown": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "markdown",
            "md"
        ]
    },
    "text/mathml": {
        "source": "nginx",
        "extensions": [
            "mml"
        ]
    },
    "text/mdx": {
        "compressible": true,
        "extensions": [
            "mdx"
        ]
    },
    "text/mizar": {
        "source": "iana"
    },
    "text/n3": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "n3"
        ]
    },
    "text/parameters": {
        "source": "iana",
        "charset": "UTF-8"
    },
    "text/parityfec": {
        "source": "iana"
    },
    "text/plain": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "txt",
            "text",
            "conf",
            "def",
            "list",
            "log",
            "in",
            "ini"
        ]
    },
    "text/provenance-notation": {
        "source": "iana",
        "charset": "UTF-8"
    },
    "text/prs.fallenstein.rst": {
        "source": "iana"
    },
    "text/prs.lines.tag": {
        "source": "iana",
        "extensions": [
            "dsc"
        ]
    },
    "text/prs.prop.logic": {
        "source": "iana"
    },
    "text/raptorfec": {
        "source": "iana"
    },
    "text/red": {
        "source": "iana"
    },
    "text/rfc822-headers": {
        "source": "iana"
    },
    "text/richtext": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rtx"
        ]
    },
    "text/rtf": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "rtf"
        ]
    },
    "text/rtp-enc-aescm128": {
        "source": "iana"
    },
    "text/rtploopback": {
        "source": "iana"
    },
    "text/rtx": {
        "source": "iana"
    },
    "text/sgml": {
        "source": "iana",
        "extensions": [
            "sgml",
            "sgm"
        ]
    },
    "text/shaclc": {
        "source": "iana"
    },
    "text/shex": {
        "source": "iana",
        "extensions": [
            "shex"
        ]
    },
    "text/slim": {
        "extensions": [
            "slim",
            "slm"
        ]
    },
    "text/spdx": {
        "source": "iana",
        "extensions": [
            "spdx"
        ]
    },
    "text/strings": {
        "source": "iana"
    },
    "text/stylus": {
        "extensions": [
            "stylus",
            "styl"
        ]
    },
    "text/t140": {
        "source": "iana"
    },
    "text/tab-separated-values": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "tsv"
        ]
    },
    "text/troff": {
        "source": "iana",
        "extensions": [
            "t",
            "tr",
            "roff",
            "man",
            "me",
            "ms"
        ]
    },
    "text/turtle": {
        "source": "iana",
        "charset": "UTF-8",
        "extensions": [
            "ttl"
        ]
    },
    "text/ulpfec": {
        "source": "iana"
    },
    "text/uri-list": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "uri",
            "uris",
            "urls"
        ]
    },
    "text/vcard": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "vcard"
        ]
    },
    "text/vnd.a": {
        "source": "iana"
    },
    "text/vnd.abc": {
        "source": "iana"
    },
    "text/vnd.ascii-art": {
        "source": "iana"
    },
    "text/vnd.curl": {
        "source": "iana",
        "extensions": [
            "curl"
        ]
    },
    "text/vnd.curl.dcurl": {
        "source": "apache",
        "extensions": [
            "dcurl"
        ]
    },
    "text/vnd.curl.mcurl": {
        "source": "apache",
        "extensions": [
            "mcurl"
        ]
    },
    "text/vnd.curl.scurl": {
        "source": "apache",
        "extensions": [
            "scurl"
        ]
    },
    "text/vnd.debian.copyright": {
        "source": "iana",
        "charset": "UTF-8"
    },
    "text/vnd.dmclientscript": {
        "source": "iana"
    },
    "text/vnd.dvb.subtitle": {
        "source": "iana",
        "extensions": [
            "sub"
        ]
    },
    "text/vnd.esmertec.theme-descriptor": {
        "source": "iana",
        "charset": "UTF-8"
    },
    "text/vnd.familysearch.gedcom": {
        "source": "iana",
        "extensions": [
            "ged"
        ]
    },
    "text/vnd.ficlab.flt": {
        "source": "iana"
    },
    "text/vnd.fly": {
        "source": "iana",
        "extensions": [
            "fly"
        ]
    },
    "text/vnd.fmi.flexstor": {
        "source": "iana",
        "extensions": [
            "flx"
        ]
    },
    "text/vnd.gml": {
        "source": "iana"
    },
    "text/vnd.graphviz": {
        "source": "iana",
        "extensions": [
            "gv"
        ]
    },
    "text/vnd.hans": {
        "source": "iana"
    },
    "text/vnd.hgl": {
        "source": "iana"
    },
    "text/vnd.in3d.3dml": {
        "source": "iana",
        "extensions": [
            "3dml"
        ]
    },
    "text/vnd.in3d.spot": {
        "source": "iana",
        "extensions": [
            "spot"
        ]
    },
    "text/vnd.iptc.newsml": {
        "source": "iana"
    },
    "text/vnd.iptc.nitf": {
        "source": "iana"
    },
    "text/vnd.latex-z": {
        "source": "iana"
    },
    "text/vnd.motorola.reflex": {
        "source": "iana"
    },
    "text/vnd.ms-mediapackage": {
        "source": "iana"
    },
    "text/vnd.net2phone.commcenter.command": {
        "source": "iana"
    },
    "text/vnd.radisys.msml-basic-layout": {
        "source": "iana"
    },
    "text/vnd.senx.warpscript": {
        "source": "iana"
    },
    "text/vnd.si.uricatalogue": {
        "source": "iana"
    },
    "text/vnd.sosi": {
        "source": "iana"
    },
    "text/vnd.sun.j2me.app-descriptor": {
        "source": "iana",
        "charset": "UTF-8",
        "extensions": [
            "jad"
        ]
    },
    "text/vnd.trolltech.linguist": {
        "source": "iana",
        "charset": "UTF-8"
    },
    "text/vnd.wap.si": {
        "source": "iana"
    },
    "text/vnd.wap.sl": {
        "source": "iana"
    },
    "text/vnd.wap.wml": {
        "source": "iana",
        "extensions": [
            "wml"
        ]
    },
    "text/vnd.wap.wmlscript": {
        "source": "iana",
        "extensions": [
            "wmls"
        ]
    },
    "text/vtt": {
        "source": "iana",
        "charset": "UTF-8",
        "compressible": true,
        "extensions": [
            "vtt"
        ]
    },
    "text/x-asm": {
        "source": "apache",
        "extensions": [
            "s",
            "asm"
        ]
    },
    "text/x-c": {
        "source": "apache",
        "extensions": [
            "c",
            "cc",
            "cxx",
            "cpp",
            "h",
            "hh",
            "dic"
        ]
    },
    "text/x-component": {
        "source": "nginx",
        "extensions": [
            "htc"
        ]
    },
    "text/x-fortran": {
        "source": "apache",
        "extensions": [
            "f",
            "for",
            "f77",
            "f90"
        ]
    },
    "text/x-gwt-rpc": {
        "compressible": true
    },
    "text/x-handlebars-template": {
        "extensions": [
            "hbs"
        ]
    },
    "text/x-java-source": {
        "source": "apache",
        "extensions": [
            "java"
        ]
    },
    "text/x-jquery-tmpl": {
        "compressible": true
    },
    "text/x-lua": {
        "extensions": [
            "lua"
        ]
    },
    "text/x-markdown": {
        "compressible": true,
        "extensions": [
            "mkd"
        ]
    },
    "text/x-nfo": {
        "source": "apache",
        "extensions": [
            "nfo"
        ]
    },
    "text/x-opml": {
        "source": "apache",
        "extensions": [
            "opml"
        ]
    },
    "text/x-org": {
        "compressible": true,
        "extensions": [
            "org"
        ]
    },
    "text/x-pascal": {
        "source": "apache",
        "extensions": [
            "p",
            "pas"
        ]
    },
    "text/x-processing": {
        "compressible": true,
        "extensions": [
            "pde"
        ]
    },
    "text/x-sass": {
        "extensions": [
            "sass"
        ]
    },
    "text/x-scss": {
        "extensions": [
            "scss"
        ]
    },
    "text/x-setext": {
        "source": "apache",
        "extensions": [
            "etx"
        ]
    },
    "text/x-sfv": {
        "source": "apache",
        "extensions": [
            "sfv"
        ]
    },
    "text/x-suse-ymp": {
        "compressible": true,
        "extensions": [
            "ymp"
        ]
    },
    "text/x-uuencode": {
        "source": "apache",
        "extensions": [
            "uu"
        ]
    },
    "text/x-vcalendar": {
        "source": "apache",
        "extensions": [
            "vcs"
        ]
    },
    "text/x-vcard": {
        "source": "apache",
        "extensions": [
            "vcf"
        ]
    },
    "text/xml": {
        "source": "iana",
        "compressible": true,
        "extensions": [
            "xml"
        ]
    },
    "text/xml-external-parsed-entity": {
        "source": "iana"
    },
    "text/yaml": {
        "compressible": true,
        "extensions": [
            "yaml",
            "yml"
        ]
    },
    "video/1d-interleaved-parityfec": {
        "source": "iana"
    },
    "video/3gpp": {
        "source": "iana",
        "extensions": [
            "3gp",
            "3gpp"
        ]
    },
    "video/3gpp-tt": {
        "source": "iana"
    },
    "video/3gpp2": {
        "source": "iana",
        "extensions": [
            "3g2"
        ]
    },
    "video/av1": {
        "source": "iana"
    },
    "video/bmpeg": {
        "source": "iana"
    },
    "video/bt656": {
        "source": "iana"
    },
    "video/celb": {
        "source": "iana"
    },
    "video/dv": {
        "source": "iana"
    },
    "video/encaprtp": {
        "source": "iana"
    },
    "video/ffv1": {
        "source": "iana"
    },
    "video/flexfec": {
        "source": "iana"
    },
    "video/h261": {
        "source": "iana",
        "extensions": [
            "h261"
        ]
    },
    "video/h263": {
        "source": "iana",
        "extensions": [
            "h263"
        ]
    },
    "video/h263-1998": {
        "source": "iana"
    },
    "video/h263-2000": {
        "source": "iana"
    },
    "video/h264": {
        "source": "iana",
        "extensions": [
            "h264"
        ]
    },
    "video/h264-rcdo": {
        "source": "iana"
    },
    "video/h264-svc": {
        "source": "iana"
    },
    "video/h265": {
        "source": "iana"
    },
    "video/iso.segment": {
        "source": "iana",
        "extensions": [
            "m4s"
        ]
    },
    "video/jpeg": {
        "source": "iana",
        "extensions": [
            "jpgv"
        ]
    },
    "video/jpeg2000": {
        "source": "iana"
    },
    "video/jpm": {
        "source": "apache",
        "extensions": [
            "jpm",
            "jpgm"
        ]
    },
    "video/jxsv": {
        "source": "iana"
    },
    "video/mj2": {
        "source": "iana",
        "extensions": [
            "mj2",
            "mjp2"
        ]
    },
    "video/mp1s": {
        "source": "iana"
    },
    "video/mp2p": {
        "source": "iana"
    },
    "video/mp2t": {
        "source": "iana",
        "extensions": [
            "ts"
        ]
    },
    "video/mp4": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "mp4",
            "mp4v",
            "mpg4"
        ]
    },
    "video/mp4v-es": {
        "source": "iana"
    },
    "video/mpeg": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "mpeg",
            "mpg",
            "mpe",
            "m1v",
            "m2v"
        ]
    },
    "video/mpeg4-generic": {
        "source": "iana"
    },
    "video/mpv": {
        "source": "iana"
    },
    "video/nv": {
        "source": "iana"
    },
    "video/ogg": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "ogv"
        ]
    },
    "video/parityfec": {
        "source": "iana"
    },
    "video/pointer": {
        "source": "iana"
    },
    "video/quicktime": {
        "source": "iana",
        "compressible": false,
        "extensions": [
            "qt",
            "mov"
        ]
    },
    "video/raptorfec": {
        "source": "iana"
    },
    "video/raw": {
        "source": "iana"
    },
    "video/rtp-enc-aescm128": {
        "source": "iana"
    },
    "video/rtploopback": {
        "source": "iana"
    },
    "video/rtx": {
        "source": "iana"
    },
    "video/scip": {
        "source": "iana"
    },
    "video/smpte291": {
        "source": "iana"
    },
    "video/smpte292m": {
        "source": "iana"
    },
    "video/ulpfec": {
        "source": "iana"
    },
    "video/vc1": {
        "source": "iana"
    },
    "video/vc2": {
        "source": "iana"
    },
    "video/vnd.cctv": {
        "source": "iana"
    },
    "video/vnd.dece.hd": {
        "source": "iana",
        "extensions": [
            "uvh",
            "uvvh"
        ]
    },
    "video/vnd.dece.mobile": {
        "source": "iana",
        "extensions": [
            "uvm",
            "uvvm"
        ]
    },
    "video/vnd.dece.mp4": {
        "source": "iana"
    },
    "video/vnd.dece.pd": {
        "source": "iana",
        "extensions": [
            "uvp",
            "uvvp"
        ]
    },
    "video/vnd.dece.sd": {
        "source": "iana",
        "extensions": [
            "uvs",
            "uvvs"
        ]
    },
    "video/vnd.dece.video": {
        "source": "iana",
        "extensions": [
            "uvv",
            "uvvv"
        ]
    },
    "video/vnd.directv.mpeg": {
        "source": "iana"
    },
    "video/vnd.directv.mpeg-tts": {
        "source": "iana"
    },
    "video/vnd.dlna.mpeg-tts": {
        "source": "iana"
    },
    "video/vnd.dvb.file": {
        "source": "iana",
        "extensions": [
            "dvb"
        ]
    },
    "video/vnd.fvt": {
        "source": "iana",
        "extensions": [
            "fvt"
        ]
    },
    "video/vnd.hns.video": {
        "source": "iana"
    },
    "video/vnd.iptvforum.1dparityfec-1010": {
        "source": "iana"
    },
    "video/vnd.iptvforum.1dparityfec-2005": {
        "source": "iana"
    },
    "video/vnd.iptvforum.2dparityfec-1010": {
        "source": "iana"
    },
    "video/vnd.iptvforum.2dparityfec-2005": {
        "source": "iana"
    },
    "video/vnd.iptvforum.ttsavc": {
        "source": "iana"
    },
    "video/vnd.iptvforum.ttsmpeg2": {
        "source": "iana"
    },
    "video/vnd.motorola.video": {
        "source": "iana"
    },
    "video/vnd.motorola.videop": {
        "source": "iana"
    },
    "video/vnd.mpegurl": {
        "source": "iana",
        "extensions": [
            "mxu",
            "m4u"
        ]
    },
    "video/vnd.ms-playready.media.pyv": {
        "source": "iana",
        "extensions": [
            "pyv"
        ]
    },
    "video/vnd.nokia.interleaved-multimedia": {
        "source": "iana"
    },
    "video/vnd.nokia.mp4vr": {
        "source": "iana"
    },
    "video/vnd.nokia.videovoip": {
        "source": "iana"
    },
    "video/vnd.objectvideo": {
        "source": "iana"
    },
    "video/vnd.radgamettools.bink": {
        "source": "iana"
    },
    "video/vnd.radgamettools.smacker": {
        "source": "iana"
    },
    "video/vnd.sealed.mpeg1": {
        "source": "iana"
    },
    "video/vnd.sealed.mpeg4": {
        "source": "iana"
    },
    "video/vnd.sealed.swf": {
        "source": "iana"
    },
    "video/vnd.sealedmedia.softseal.mov": {
        "source": "iana"
    },
    "video/vnd.uvvu.mp4": {
        "source": "iana",
        "extensions": [
            "uvu",
            "uvvu"
        ]
    },
    "video/vnd.vivo": {
        "source": "iana",
        "extensions": [
            "viv"
        ]
    },
    "video/vnd.youtube.yt": {
        "source": "iana"
    },
    "video/vp8": {
        "source": "iana"
    },
    "video/vp9": {
        "source": "iana"
    },
    "video/webm": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "webm"
        ]
    },
    "video/x-f4v": {
        "source": "apache",
        "extensions": [
            "f4v"
        ]
    },
    "video/x-fli": {
        "source": "apache",
        "extensions": [
            "fli"
        ]
    },
    "video/x-flv": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "flv"
        ]
    },
    "video/x-m4v": {
        "source": "apache",
        "extensions": [
            "m4v"
        ]
    },
    "video/x-matroska": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "mkv",
            "mk3d",
            "mks"
        ]
    },
    "video/x-mng": {
        "source": "apache",
        "extensions": [
            "mng"
        ]
    },
    "video/x-ms-asf": {
        "source": "apache",
        "extensions": [
            "asf",
            "asx"
        ]
    },
    "video/x-ms-vob": {
        "source": "apache",
        "extensions": [
            "vob"
        ]
    },
    "video/x-ms-wm": {
        "source": "apache",
        "extensions": [
            "wm"
        ]
    },
    "video/x-ms-wmv": {
        "source": "apache",
        "compressible": false,
        "extensions": [
            "wmv"
        ]
    },
    "video/x-ms-wmx": {
        "source": "apache",
        "extensions": [
            "wmx"
        ]
    },
    "video/x-ms-wvx": {
        "source": "apache",
        "extensions": [
            "wvx"
        ]
    },
    "video/x-msvideo": {
        "source": "apache",
        "extensions": [
            "avi"
        ]
    },
    "video/x-sgi-movie": {
        "source": "apache",
        "extensions": [
            "movie"
        ]
    },
    "video/x-smv": {
        "source": "apache",
        "extensions": [
            "smv"
        ]
    },
    "x-conference/x-cooltalk": {
        "source": "apache",
        "extensions": [
            "ice"
        ]
    },
    "x-shader/x-fragment": {
        "compressible": true
    },
    "x-shader/x-vertex": {
        "compressible": true
    }
};
const types = new Map();
(function populateMaps() {
    const preference = [
        "nginx",
        "apache",
        undefined,
        "iana"
    ];
    for (const type of Object.keys(__default)){
        const mime = __default[type];
        const exts = mime.extensions;
        if (!exts || !exts.length) {
            continue;
        }
        extensions.set(type, exts);
        for (const ext of exts){
            const current = types.get(ext);
            if (current) {
                const from = preference.indexOf(__default[current].source);
                const to = preference.indexOf(mime.source);
                if (current !== "application/octet-stream" && (from > to || from === to && current.startsWith("application/"))) {
                    continue;
                }
            }
            types.set(ext, type);
        }
    }
})();
function typeByExtension(extension) {
    extension = extension.startsWith(".") ? extension.slice(1) : extension;
    return types.get(extension.toLowerCase());
}
function getCharset(type) {
    try {
        const [mediaType, params] = parseMediaType(type);
        if (params && params["charset"]) {
            return params["charset"];
        }
        const entry = __default[mediaType];
        if (entry && entry.charset) {
            return entry.charset;
        }
        if (mediaType.startsWith("text/")) {
            return "UTF-8";
        }
    } catch  {}
    return undefined;
}
function formatMediaType(type, param) {
    let b = "";
    const [major, sub] = type.split("/");
    if (!sub) {
        if (!isToken(type)) {
            return "";
        }
        b += type.toLowerCase();
    } else {
        if (!isToken(major) || !isToken(sub)) {
            return "";
        }
        b += `${major.toLowerCase()}/${sub.toLowerCase()}`;
    }
    if (param) {
        param = isIterator(param) ? Object.fromEntries(param) : param;
        const attrs = Object.keys(param);
        attrs.sort();
        for (const attribute of attrs){
            if (!isToken(attribute)) {
                return "";
            }
            const value = param[attribute];
            b += `; ${attribute.toLowerCase()}`;
            const needEnc = needsEncoding(value);
            if (needEnc) {
                b += "*";
            }
            b += "=";
            if (needEnc) {
                b += `utf-8''${encodeURIComponent(value)}`;
                continue;
            }
            if (isToken(value)) {
                b += value;
                continue;
            }
            b += `"${value.replace(/["\\]/gi, (m)=>`\\${m}`)}"`;
        }
    }
    return b;
}
function contentType(extensionOrType) {
    try {
        const [mediaType, params = {}] = extensionOrType.includes("/") ? parseMediaType(extensionOrType) : [
            typeByExtension(extensionOrType),
            undefined
        ];
        if (!mediaType) {
            return undefined;
        }
        if (!("charset" in params)) {
            const charset = getCharset(mediaType);
            if (charset) {
                params.charset = charset;
            }
        }
        return formatMediaType(mediaType, params);
    } catch  {}
    return undefined;
}
function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject)=>{
        methods = {
            async resolve (value) {
                await value;
                state = "fulfilled";
                resolve(value);
            },
            reject (reason) {
                state = "rejected";
                reject(reason);
            }
        };
    });
    Object.defineProperty(promise, "state", {
        get: ()=>state
    });
    return Object.assign(promise, methods);
}
function delay(ms, options = {}) {
    const { signal , persistent  } = options;
    if (signal?.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve, reject)=>{
        const abort = ()=>{
            clearTimeout(i);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = ()=>{
            signal?.removeEventListener("abort", abort);
            resolve();
        };
        const i = setTimeout(done, ms);
        signal?.addEventListener("abort", abort, {
            once: true
        });
        if (persistent === false) {
            try {
                Deno.unrefTimer(i);
            } catch (error) {
                if (!(error instanceof ReferenceError)) {
                    throw error;
                }
                console.error("`persistent` option is only available in Deno");
            }
        }
    });
}
class MuxAsyncIterator {
    #iteratorCount = 0;
    #yields = [];
    #throws = [];
    #signal = deferred();
    add(iterable) {
        ++this.#iteratorCount;
        this.#callIteratorNext(iterable[Symbol.asyncIterator]());
    }
    async #callIteratorNext(iterator) {
        try {
            const { value , done  } = await iterator.next();
            if (done) {
                --this.#iteratorCount;
            } else {
                this.#yields.push({
                    iterator,
                    value
                });
            }
        } catch (e) {
            this.#throws.push(e);
        }
        this.#signal.resolve();
    }
    async *iterate() {
        while(this.#iteratorCount > 0){
            await this.#signal;
            for(let i = 0; i < this.#yields.length; i++){
                const { iterator , value  } = this.#yields[i];
                yield value;
                this.#callIteratorNext(iterator);
            }
            if (this.#throws.length) {
                for (const e of this.#throws){
                    throw e;
                }
                this.#throws.length = 0;
            }
            this.#yields.length = 0;
            this.#signal = deferred();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
const ERROR_SERVER_CLOSED = "Server closed";
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;
const MAX_ACCEPT_BACKOFF_DELAY = 1000;
class Server {
    #port;
    #host;
    #handler;
    #closed = false;
    #listeners = new Set();
    #acceptBackoffDelayAbortController = new AbortController();
    #httpConnections = new Set();
    #onError;
    constructor(serverInit){
        this.#port = serverInit.port;
        this.#host = serverInit.hostname;
        this.#handler = serverInit.handler;
        this.#onError = serverInit.onError ?? function(error) {
            console.error(error);
            return new Response("Internal Server Error", {
                status: 500
            });
        };
    }
    async serve(listener) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#trackListener(listener);
        try {
            return await this.#accept(listener);
        } finally{
            this.#untrackListener(listener);
            try {
                listener.close();
            } catch  {}
        }
    }
    async listenAndServe() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listen({
            port: this.#port ?? 80,
            hostname: this.#host ?? "0.0.0.0",
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    async listenAndServeTls(certFile, keyFile) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listenTls({
            port: this.#port ?? 443,
            hostname: this.#host ?? "0.0.0.0",
            certFile,
            keyFile,
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    close() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#closed = true;
        for (const listener of this.#listeners){
            try {
                listener.close();
            } catch  {}
        }
        this.#listeners.clear();
        this.#acceptBackoffDelayAbortController.abort();
        for (const httpConn of this.#httpConnections){
            this.#closeHttpConn(httpConn);
        }
        this.#httpConnections.clear();
    }
    get closed() {
        return this.#closed;
    }
    get addrs() {
        return Array.from(this.#listeners).map((listener)=>listener.addr);
    }
    async #respond(requestEvent, connInfo) {
        let response;
        try {
            response = await this.#handler(requestEvent.request, connInfo);
            if (response.bodyUsed && response.body !== null) {
                throw new TypeError("Response body already consumed.");
            }
        } catch (error) {
            response = await this.#onError(error);
        }
        try {
            await requestEvent.respondWith(response);
        } catch  {}
    }
    async #serveHttp(httpConn, connInfo1) {
        while(!this.#closed){
            let requestEvent1;
            try {
                requestEvent1 = await httpConn.nextRequest();
            } catch  {
                break;
            }
            if (requestEvent1 === null) {
                break;
            }
            this.#respond(requestEvent1, connInfo1);
        }
        this.#closeHttpConn(httpConn);
    }
    async #accept(listener) {
        let acceptBackoffDelay;
        while(!this.#closed){
            let conn;
            try {
                conn = await listener.accept();
            } catch (error1) {
                if (error1 instanceof Deno.errors.BadResource || error1 instanceof Deno.errors.InvalidData || error1 instanceof Deno.errors.UnexpectedEof || error1 instanceof Deno.errors.ConnectionReset || error1 instanceof Deno.errors.NotConnected) {
                    if (!acceptBackoffDelay) {
                        acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
                    } else {
                        acceptBackoffDelay *= 2;
                    }
                    if (acceptBackoffDelay >= 1000) {
                        acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
                    }
                    try {
                        await delay(acceptBackoffDelay, {
                            signal: this.#acceptBackoffDelayAbortController.signal
                        });
                    } catch (err) {
                        if (!(err instanceof DOMException && err.name === "AbortError")) {
                            throw err;
                        }
                    }
                    continue;
                }
                throw error1;
            }
            acceptBackoffDelay = undefined;
            let httpConn1;
            try {
                httpConn1 = Deno.serveHttp(conn);
            } catch  {
                continue;
            }
            this.#trackHttpConnection(httpConn1);
            const connInfo2 = {
                localAddr: conn.localAddr,
                remoteAddr: conn.remoteAddr
            };
            this.#serveHttp(httpConn1, connInfo2);
        }
    }
    #closeHttpConn(httpConn2) {
        this.#untrackHttpConnection(httpConn2);
        try {
            httpConn2.close();
        } catch  {}
    }
    #trackListener(listener1) {
        this.#listeners.add(listener1);
    }
    #untrackListener(listener2) {
        this.#listeners.delete(listener2);
    }
    #trackHttpConnection(httpConn3) {
        this.#httpConnections.add(httpConn3);
    }
    #untrackHttpConnection(httpConn4) {
        this.#httpConnections.delete(httpConn4);
    }
}
function hostnameForDisplay(hostname) {
    return hostname === "0.0.0.0" ? "localhost" : hostname;
}
async function serve(handler, options = {}) {
    let port = options.port ?? 8000;
    const hostname = options.hostname ?? "0.0.0.0";
    const server = new Server({
        port,
        hostname,
        handler,
        onError: options.onError
    });
    options?.signal?.addEventListener("abort", ()=>server.close(), {
        once: true
    });
    const s = server.listenAndServe();
    port = server.addrs[0].port;
    if ("onListen" in options) {
        options.onListen?.({
            port,
            hostname
        });
    } else {
        console.log(`Listening on http://${hostnameForDisplay(hostname)}:${port}/`);
    }
    return await s;
}
async function serveTls(handler, options) {
    if (!options.key && !options.keyFile) {
        throw new Error("TLS config is given, but 'key' is missing.");
    }
    if (!options.cert && !options.certFile) {
        throw new Error("TLS config is given, but 'cert' is missing.");
    }
    let port = options.port ?? 8443;
    const hostname = options.hostname ?? "0.0.0.0";
    const server = new Server({
        port,
        hostname,
        handler,
        onError: options.onError
    });
    options?.signal?.addEventListener("abort", ()=>server.close(), {
        once: true
    });
    const key = options.key || Deno.readTextFileSync(options.keyFile);
    const cert = options.cert || Deno.readTextFileSync(options.certFile);
    const listener = Deno.listenTls({
        port,
        hostname,
        cert,
        key,
        transport: "tcp"
    });
    const s = server.serve(listener);
    port = server.addrs[0].port;
    if ("onListen" in options) {
        options.onListen?.({
            port,
            hostname
        });
    } else {
        console.log(`Listening on https://${hostnameForDisplay(hostname)}:${port}/`);
    }
    return await s;
}
var Status;
(function(Status) {
    Status[Status["Continue"] = 100] = "Continue";
    Status[Status["SwitchingProtocols"] = 101] = "SwitchingProtocols";
    Status[Status["Processing"] = 102] = "Processing";
    Status[Status["EarlyHints"] = 103] = "EarlyHints";
    Status[Status["OK"] = 200] = "OK";
    Status[Status["Created"] = 201] = "Created";
    Status[Status["Accepted"] = 202] = "Accepted";
    Status[Status["NonAuthoritativeInfo"] = 203] = "NonAuthoritativeInfo";
    Status[Status["NoContent"] = 204] = "NoContent";
    Status[Status["ResetContent"] = 205] = "ResetContent";
    Status[Status["PartialContent"] = 206] = "PartialContent";
    Status[Status["MultiStatus"] = 207] = "MultiStatus";
    Status[Status["AlreadyReported"] = 208] = "AlreadyReported";
    Status[Status["IMUsed"] = 226] = "IMUsed";
    Status[Status["MultipleChoices"] = 300] = "MultipleChoices";
    Status[Status["MovedPermanently"] = 301] = "MovedPermanently";
    Status[Status["Found"] = 302] = "Found";
    Status[Status["SeeOther"] = 303] = "SeeOther";
    Status[Status["NotModified"] = 304] = "NotModified";
    Status[Status["UseProxy"] = 305] = "UseProxy";
    Status[Status["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    Status[Status["PermanentRedirect"] = 308] = "PermanentRedirect";
    Status[Status["BadRequest"] = 400] = "BadRequest";
    Status[Status["Unauthorized"] = 401] = "Unauthorized";
    Status[Status["PaymentRequired"] = 402] = "PaymentRequired";
    Status[Status["Forbidden"] = 403] = "Forbidden";
    Status[Status["NotFound"] = 404] = "NotFound";
    Status[Status["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    Status[Status["NotAcceptable"] = 406] = "NotAcceptable";
    Status[Status["ProxyAuthRequired"] = 407] = "ProxyAuthRequired";
    Status[Status["RequestTimeout"] = 408] = "RequestTimeout";
    Status[Status["Conflict"] = 409] = "Conflict";
    Status[Status["Gone"] = 410] = "Gone";
    Status[Status["LengthRequired"] = 411] = "LengthRequired";
    Status[Status["PreconditionFailed"] = 412] = "PreconditionFailed";
    Status[Status["RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
    Status[Status["RequestURITooLong"] = 414] = "RequestURITooLong";
    Status[Status["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
    Status[Status["RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
    Status[Status["ExpectationFailed"] = 417] = "ExpectationFailed";
    Status[Status["Teapot"] = 418] = "Teapot";
    Status[Status["MisdirectedRequest"] = 421] = "MisdirectedRequest";
    Status[Status["UnprocessableEntity"] = 422] = "UnprocessableEntity";
    Status[Status["Locked"] = 423] = "Locked";
    Status[Status["FailedDependency"] = 424] = "FailedDependency";
    Status[Status["TooEarly"] = 425] = "TooEarly";
    Status[Status["UpgradeRequired"] = 426] = "UpgradeRequired";
    Status[Status["PreconditionRequired"] = 428] = "PreconditionRequired";
    Status[Status["TooManyRequests"] = 429] = "TooManyRequests";
    Status[Status["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
    Status[Status["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
    Status[Status["InternalServerError"] = 500] = "InternalServerError";
    Status[Status["NotImplemented"] = 501] = "NotImplemented";
    Status[Status["BadGateway"] = 502] = "BadGateway";
    Status[Status["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    Status[Status["GatewayTimeout"] = 504] = "GatewayTimeout";
    Status[Status["HTTPVersionNotSupported"] = 505] = "HTTPVersionNotSupported";
    Status[Status["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
    Status[Status["InsufficientStorage"] = 507] = "InsufficientStorage";
    Status[Status["LoopDetected"] = 508] = "LoopDetected";
    Status[Status["NotExtended"] = 510] = "NotExtended";
    Status[Status["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(Status || (Status = {}));
const STATUS_TEXT = {
    [Status.Accepted]: "Accepted",
    [Status.AlreadyReported]: "Already Reported",
    [Status.BadGateway]: "Bad Gateway",
    [Status.BadRequest]: "Bad Request",
    [Status.Conflict]: "Conflict",
    [Status.Continue]: "Continue",
    [Status.Created]: "Created",
    [Status.EarlyHints]: "Early Hints",
    [Status.ExpectationFailed]: "Expectation Failed",
    [Status.FailedDependency]: "Failed Dependency",
    [Status.Forbidden]: "Forbidden",
    [Status.Found]: "Found",
    [Status.GatewayTimeout]: "Gateway Timeout",
    [Status.Gone]: "Gone",
    [Status.HTTPVersionNotSupported]: "HTTP Version Not Supported",
    [Status.IMUsed]: "IM Used",
    [Status.InsufficientStorage]: "Insufficient Storage",
    [Status.InternalServerError]: "Internal Server Error",
    [Status.LengthRequired]: "Length Required",
    [Status.Locked]: "Locked",
    [Status.LoopDetected]: "Loop Detected",
    [Status.MethodNotAllowed]: "Method Not Allowed",
    [Status.MisdirectedRequest]: "Misdirected Request",
    [Status.MovedPermanently]: "Moved Permanently",
    [Status.MultiStatus]: "Multi Status",
    [Status.MultipleChoices]: "Multiple Choices",
    [Status.NetworkAuthenticationRequired]: "Network Authentication Required",
    [Status.NoContent]: "No Content",
    [Status.NonAuthoritativeInfo]: "Non Authoritative Info",
    [Status.NotAcceptable]: "Not Acceptable",
    [Status.NotExtended]: "Not Extended",
    [Status.NotFound]: "Not Found",
    [Status.NotImplemented]: "Not Implemented",
    [Status.NotModified]: "Not Modified",
    [Status.OK]: "OK",
    [Status.PartialContent]: "Partial Content",
    [Status.PaymentRequired]: "Payment Required",
    [Status.PermanentRedirect]: "Permanent Redirect",
    [Status.PreconditionFailed]: "Precondition Failed",
    [Status.PreconditionRequired]: "Precondition Required",
    [Status.Processing]: "Processing",
    [Status.ProxyAuthRequired]: "Proxy Auth Required",
    [Status.RequestEntityTooLarge]: "Request Entity Too Large",
    [Status.RequestHeaderFieldsTooLarge]: "Request Header Fields Too Large",
    [Status.RequestTimeout]: "Request Timeout",
    [Status.RequestURITooLong]: "Request URI Too Long",
    [Status.RequestedRangeNotSatisfiable]: "Requested Range Not Satisfiable",
    [Status.ResetContent]: "Reset Content",
    [Status.SeeOther]: "See Other",
    [Status.ServiceUnavailable]: "Service Unavailable",
    [Status.SwitchingProtocols]: "Switching Protocols",
    [Status.Teapot]: "I'm a teapot",
    [Status.TemporaryRedirect]: "Temporary Redirect",
    [Status.TooEarly]: "Too Early",
    [Status.TooManyRequests]: "Too Many Requests",
    [Status.Unauthorized]: "Unauthorized",
    [Status.UnavailableForLegalReasons]: "Unavailable For Legal Reasons",
    [Status.UnprocessableEntity]: "Unprocessable Entity",
    [Status.UnsupportedMediaType]: "Unsupported Media Type",
    [Status.UpgradeRequired]: "Upgrade Required",
    [Status.UseProxy]: "Use Proxy",
    [Status.VariantAlsoNegotiates]: "Variant Also Negotiates"
};
const { hasOwn  } = Object;
function get(obj, key) {
    if (hasOwn(obj, key)) {
        return obj[key];
    }
}
function getForce(obj, key) {
    const v = get(obj, key);
    assert(v != null);
    return v;
}
function isNumber(x) {
    if (typeof x === "number") return true;
    if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function hasKey(obj, keys) {
    let o = obj;
    keys.slice(0, -1).forEach((key)=>{
        o = get(o, key) ?? {};
    });
    const key = keys[keys.length - 1];
    return hasOwn(o, key);
}
function parse3(args, { "--": doubleDash = false , alias ={} , boolean: __boolean = false , default: defaults = {} , stopEarly =false , string =[] , collect =[] , negatable =[] , unknown =(i)=>i  } = {}) {
    const aliases = {};
    const flags = {
        bools: {},
        strings: {},
        unknownFn: unknown,
        allBools: false,
        collect: {},
        negatable: {}
    };
    if (alias !== undefined) {
        for(const key in alias){
            const val = getForce(alias, key);
            if (typeof val === "string") {
                aliases[key] = [
                    val
                ];
            } else {
                aliases[key] = val;
            }
            for (const alias1 of getForce(aliases, key)){
                aliases[alias1] = [
                    key
                ].concat(aliases[key].filter((y)=>alias1 !== y));
            }
        }
    }
    if (__boolean !== undefined) {
        if (typeof __boolean === "boolean") {
            flags.allBools = !!__boolean;
        } else {
            const booleanArgs = typeof __boolean === "string" ? [
                __boolean
            ] : __boolean;
            for (const key1 of booleanArgs.filter(Boolean)){
                flags.bools[key1] = true;
                const alias2 = get(aliases, key1);
                if (alias2) {
                    for (const al of alias2){
                        flags.bools[al] = true;
                    }
                }
            }
        }
    }
    if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [
            string
        ] : string;
        for (const key2 of stringArgs.filter(Boolean)){
            flags.strings[key2] = true;
            const alias3 = get(aliases, key2);
            if (alias3) {
                for (const al1 of alias3){
                    flags.strings[al1] = true;
                }
            }
        }
    }
    if (collect !== undefined) {
        const collectArgs = typeof collect === "string" ? [
            collect
        ] : collect;
        for (const key3 of collectArgs.filter(Boolean)){
            flags.collect[key3] = true;
            const alias4 = get(aliases, key3);
            if (alias4) {
                for (const al2 of alias4){
                    flags.collect[al2] = true;
                }
            }
        }
    }
    if (negatable !== undefined) {
        const negatableArgs = typeof negatable === "string" ? [
            negatable
        ] : negatable;
        for (const key4 of negatableArgs.filter(Boolean)){
            flags.negatable[key4] = true;
            const alias5 = get(aliases, key4);
            if (alias5) {
                for (const al3 of alias5){
                    flags.negatable[al3] = true;
                }
            }
        }
    }
    const argv = {
        _: []
    };
    function argDefined(key, arg) {
        return flags.allBools && /^--[^=]+$/.test(arg) || get(flags.bools, key) || !!get(flags.strings, key) || !!get(aliases, key);
    }
    function setKey(obj, name, value, collect = true) {
        let o = obj;
        const keys = name.split(".");
        keys.slice(0, -1).forEach(function(key) {
            if (get(o, key) === undefined) {
                o[key] = {};
            }
            o = get(o, key);
        });
        const key = keys[keys.length - 1];
        const collectable = collect && !!get(flags.collect, name);
        if (!collectable) {
            o[key] = value;
        } else if (get(o, key) === undefined) {
            o[key] = [
                value
            ];
        } else if (Array.isArray(get(o, key))) {
            o[key].push(value);
        } else {
            o[key] = [
                get(o, key),
                value
            ];
        }
    }
    function setArg(key, val, arg = undefined, collect) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg, key, val) === false) return;
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
        setKey(argv, key, value, collect);
        const alias = get(aliases, key);
        if (alias) {
            for (const x of alias){
                setKey(argv, x, value, collect);
            }
        }
    }
    function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x)=>typeof get(flags.bools, x) === "boolean");
    }
    let notFlags = [];
    if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
    }
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
            const m = arg.match(/^--([^=]+)=(.*)$/s);
            assert(m != null);
            const [, key5, value] = m;
            if (flags.bools[key5]) {
                const booleanValue = value !== "false";
                setArg(key5, booleanValue, arg);
            } else {
                setArg(key5, value, arg);
            }
        } else if (/^--no-.+/.test(arg) && get(flags.negatable, arg.replace(/^--no-/, ""))) {
            const m1 = arg.match(/^--no-(.+)/);
            assert(m1 != null);
            setArg(m1[1], false, arg, false);
        } else if (/^--.+/.test(arg)) {
            const m2 = arg.match(/^--(.+)/);
            assert(m2 != null);
            const [, key6] = m2;
            const next = args[i + 1];
            if (next !== undefined && !/^-/.test(next) && !get(flags.bools, key6) && !flags.allBools && (get(aliases, key6) ? !aliasIsBoolean(key6) : true)) {
                setArg(key6, next, arg);
                i++;
            } else if (/^(true|false)$/.test(next)) {
                setArg(key6, next === "true", arg);
                i++;
            } else {
                setArg(key6, get(flags.strings, key6) ? "" : true, arg);
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for(let j = 0; j < letters.length; j++){
                const next1 = arg.slice(j + 2);
                if (next1 === "-") {
                    setArg(letters[j], next1, arg);
                    continue;
                }
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next1)) {
                    setArg(letters[j], next1.split(/=(.+)/)[1], arg);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next1)) {
                    setArg(letters[j], next1, arg);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg);
                    broken = true;
                    break;
                } else {
                    setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
                }
            }
            const [key7] = arg.slice(-1);
            if (!broken && key7 !== "-") {
                if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !get(flags.bools, key7) && (get(aliases, key7) ? !aliasIsBoolean(key7) : true)) {
                    setArg(key7, args[i + 1], arg);
                    i++;
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key7, args[i + 1] === "true", arg);
                    i++;
                } else {
                    setArg(key7, get(flags.strings, key7) ? "" : true, arg);
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
            }
            if (stopEarly) {
                argv._.push(...args.slice(i + 1));
                break;
            }
        }
    }
    for (const [key8, value1] of Object.entries(defaults)){
        if (!hasKey(argv, key8.split("."))) {
            setKey(argv, key8, value1);
            if (aliases[key8]) {
                for (const x of aliases[key8]){
                    setKey(argv, x, value1);
                }
            }
        }
    }
    for (const key9 of Object.keys(flags.bools)){
        if (!hasKey(argv, key9.split("."))) {
            const value2 = get(flags.collect, key9) ? [] : false;
            setKey(argv, key9, value2, false);
        }
    }
    for (const key10 of Object.keys(flags.strings)){
        if (!hasKey(argv, key10.split(".")) && get(flags.collect, key10)) {
            setKey(argv, key10, [], false);
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key11 of notFlags){
            argv["--"].push(key11);
        }
    } else {
        for (const key12 of notFlags){
            argv._.push(key12);
        }
    }
    return argv;
}
const { Deno: Deno1  } = globalThis;
const noColor = typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
let enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
function red(str) {
    return run(str, code([
        31
    ], 39));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
function filterInPlace(array, predicate) {
    let outputIndex = 0;
    for (const cur of array){
        if (!predicate(cur)) {
            continue;
        }
        array[outputIndex] = cur;
        outputIndex += 1;
    }
    array.splice(outputIndex);
    return array;
}
const { hasOwn: hasOwn1  } = Object;
function deepMerge(record, other, options) {
    return deepMergeInternal(record, other, new Set(), options);
}
function deepMergeInternal(record, other, seen, options) {
    const result = {};
    const keys = new Set([
        ...getKeys(record),
        ...getKeys(other)
    ]);
    for (const key of keys){
        if (key === "__proto__") {
            continue;
        }
        const a = record[key];
        if (!hasOwn1(other, key)) {
            result[key] = a;
            continue;
        }
        const b = other[key];
        if (isNonNullObject(a) && isNonNullObject(b) && !seen.has(a) && !seen.has(b)) {
            seen.add(a);
            seen.add(b);
            result[key] = mergeObjects(a, b, seen, options);
            continue;
        }
        result[key] = b;
    }
    return result;
}
function mergeObjects(left, right, seen, options = {
    arrays: "merge",
    sets: "merge",
    maps: "merge"
}) {
    if (isMergeable(left) && isMergeable(right)) {
        return deepMergeInternal(left, right, seen, options);
    }
    if (isIterable(left) && isIterable(right)) {
        if (Array.isArray(left) && Array.isArray(right)) {
            if (options.arrays === "merge") {
                return left.concat(right);
            }
            return right;
        }
        if (left instanceof Map && right instanceof Map) {
            if (options.maps === "merge") {
                return new Map([
                    ...left,
                    ...right
                ]);
            }
            return right;
        }
        if (left instanceof Set && right instanceof Set) {
            if (options.sets === "merge") {
                return new Set([
                    ...left,
                    ...right
                ]);
            }
            return right;
        }
    }
    return right;
}
function isMergeable(value) {
    return Object.getPrototypeOf(value) === Object.prototype;
}
function isIterable(value) {
    return typeof value[Symbol.iterator] === "function";
}
function isNonNullObject(value) {
    return value !== null && typeof value === "object";
}
function getKeys(record) {
    const ret = Object.getOwnPropertySymbols(record);
    filterInPlace(ret, (key)=>Object.prototype.propertyIsEnumerable.call(record, key));
    ret.push(...Object.keys(record));
    return ret;
}
function compareEtag(a, b) {
    if (a === b) {
        return true;
    }
    if (a.startsWith("W/") && !b.startsWith("W/")) {
        return a.slice(2) === b;
    }
    if (!a.startsWith("W/") && b.startsWith("W/")) {
        return a === b.slice(2);
    }
    return false;
}
function createCommonResponse(status, body, init) {
    if (body === undefined) {
        body = STATUS_TEXT[status];
    }
    init = deepMerge({
        status,
        statusText: STATUS_TEXT[status]
    }, init ?? {});
    return new Response(body, init);
}
const hexTable = new TextEncoder().encode("0123456789abcdef");
function encode(src) {
    const dst = new Uint8Array(src.length * 2);
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
const base64abc = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/"
];
function encode1(data) {
    const uint8 = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
const decoder = new TextDecoder();
function toHashString(hash, encoding = "hex") {
    switch(encoding){
        case "hex":
            return decoder.decode(encode(new Uint8Array(hash)));
        case "base64":
            return encode1(hash);
    }
}
let wasm;
const heap = new Array(32).fill(undefined);
heap.push(undefined, null, true, false);
function getObject(idx) {
    return heap[idx];
}
let heap_next = heap.length;
function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}
function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}
function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
}
const cachedTextDecoder = new TextDecoder("utf-8", {
    ignoreBOM: true,
    fatal: true
});
cachedTextDecoder.decode();
let cachedUint8Memory0 = new Uint8Array();
function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}
function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
let WASM_VECTOR_LEN = 0;
const cachedTextEncoder = new TextEncoder("utf-8");
const encodeString = function(arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
};
function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }
    let len = arg.length;
    let ptr1 = malloc(len);
    const mem = getUint8Memory0();
    let offset = 0;
    for(; offset < len; offset++){
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr1 + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr1 = realloc(ptr1, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr1 + offset, ptr1 + len);
        const ret = encodeString(arg, view);
        offset += ret.written;
    }
    WASM_VECTOR_LEN = offset;
    return ptr1;
}
function isLikeNone(x) {
    return x === undefined || x === null;
}
let cachedInt32Memory0 = new Int32Array();
function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
function digest(algorithm, data, length) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.digest(retptr, ptr0, len0, addHeapObject(data), !isLikeNone(length), isLikeNone(length) ? 0 : length);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        var r3 = getInt32Memory0()[retptr / 4 + 3];
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v1;
    } finally{
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
const DigestContextFinalization = new FinalizationRegistry((ptr)=>wasm.__wbg_digestcontext_free(ptr));
class DigestContext {
    static __wrap(ptr) {
        const obj = Object.create(DigestContext.prototype);
        obj.ptr = ptr;
        DigestContextFinalization.register(obj, obj.ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        DigestContextFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_digestcontext_free(ptr);
    }
    constructor(algorithm){
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.digestcontext_new(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return DigestContext.__wrap(r0);
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    update(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_update(retptr, this.ptr, addHeapObject(data));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    digest(length) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_digest(retptr, this.ptr, !isLikeNone(length), isLikeNone(length) ? 0 : length);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    digestAndReset(length) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_digestAndReset(retptr, this.ptr, !isLikeNone(length), isLikeNone(length) ? 0 : length);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    digestAndDrop(length) {
        try {
            const ptr = this.__destroy_into_raw();
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_digestAndDrop(retptr, ptr, !isLikeNone(length), isLikeNone(length) ? 0 : length);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    reset() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_reset(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    clone() {
        const ret = wasm.digestcontext_clone(this.ptr);
        return DigestContext.__wrap(ret);
    }
}
const imports = {
    __wbindgen_placeholder__: {
        __wbg_new_db254ae0a1bb0ff5: function(arg0, arg1) {
            const ret = new TypeError(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        },
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject(arg0);
        },
        __wbg_byteLength_87a0436a74adc26c: function(arg0) {
            const ret = getObject(arg0).byteLength;
            return ret;
        },
        __wbg_byteOffset_4477d54710af6f9b: function(arg0) {
            const ret = getObject(arg0).byteOffset;
            return ret;
        },
        __wbg_buffer_21310ea17257b0b4: function(arg0) {
            const ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        },
        __wbg_newwithbyteoffsetandlength_d9aa266703cb98be: function(arg0, arg1, arg2) {
            const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        },
        __wbg_length_9e1ae1900cb0fbd5: function(arg0) {
            const ret = getObject(arg0).length;
            return ret;
        },
        __wbindgen_memory: function() {
            const ret = wasm.memory;
            return addHeapObject(ret);
        },
        __wbg_buffer_3f3d764d4747d564: function(arg0) {
            const ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        },
        __wbg_new_8c3f0052272a457a: function(arg0) {
            const ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_set_83db9690f9353e79: function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        },
        __wbindgen_throw: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        }
    }
};
function instantiate() {
    return instantiateWithInstance().exports;
}
let instanceWithExports;
function instantiateWithInstance() {
    if (instanceWithExports == null) {
        const instance = instantiateInstance();
        wasm = instance.exports;
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        instanceWithExports = {
            instance,
            exports: {
                digest,
                DigestContext
            }
        };
    }
    return instanceWithExports;
}
function instantiateInstance() {
    const wasmBytes = base64decode("\
AGFzbQEAAAABrIGAgAAZYAAAYAABf2ABfwBgAX8Bf2ABfwF+YAJ/fwBgAn9/AX9gA39/fwBgA39/fw\
F/YAR/f39/AGAEf39/fwF/YAV/f39/fwBgBX9/f39/AX9gBn9/f39/fwBgBn9/f39/fwF/YAV/f39+\
fwBgB39/f35/f38Bf2ADf39+AGAFf39+f38AYAV/f31/fwBgBX9/fH9/AGACf34AYAR/fn9/AGAEf3\
1/fwBgBH98f38AAqSFgIAADBhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18aX193YmdfbmV3X2RiMjU0\
YWUwYTFiYjBmZjUABhhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18aX193YmluZGdlbl9vYmplY3RfZH\
JvcF9yZWYAAhhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18hX193YmdfYnl0ZUxlbmd0aF84N2EwNDM2\
YTc0YWRjMjZjAAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fIV9fd2JnX2J5dGVPZmZzZXRfNDQ3N2\
Q1NDcxMGFmNmY5YgADGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXx1fX3diZ19idWZmZXJfMjEzMTBl\
YTE3MjU3YjBiNAADGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXzFfX3diZ19uZXd3aXRoYnl0ZW9mZn\
NldGFuZGxlbmd0aF9kOWFhMjY2NzAzY2I5OGJlAAgYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHV9f\
d2JnX2xlbmd0aF85ZTFhZTE5MDBjYjBmYmQ1AAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fEV9fd2\
JpbmRnZW5fbWVtb3J5AAEYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHV9fd2JnX2J1ZmZlcl8zZjNk\
NzY0ZDQ3NDdkNTY0AAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX25ld184YzNmMDA1Mj\
I3MmE0NTdhAAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX3NldF84M2RiOTY5MGY5MzUz\
ZTc5AAcYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fEF9fd2JpbmRnZW5fdGhyb3cABQOPgYCAAI0BCw\
cLBwMJEQUHBwUHDwMHBQgFEAUHBQIHBQIGBwYHFQgHDgcHBwYBAQEBBwgHBwcBBwcHAQgHBwcHBwUC\
BwcHBwcBAQcHBQ0IBwkHCQEBAQEBBQkNCwkFBQUFBQUGBgcHBwcCAggHBwUCCgAFAgMCAg4MCwwLCx\
MUEgkICAYGBQcHAAYDAAAFCAgIBAACBIWAgIAAAXABFRUFg4CAgAABABEGiYCAgAABfwFBgIDAAAsH\
uYKAgAAOBm1lbW9yeQIABmRpZ2VzdABSGF9fd2JnX2RpZ2VzdGNvbnRleHRfZnJlZQBuEWRpZ2VzdG\
NvbnRleHRfbmV3AFYUZGlnZXN0Y29udGV4dF91cGRhdGUAcRRkaWdlc3Rjb250ZXh0X2RpZ2VzdABV\
HGRpZ2VzdGNvbnRleHRfZGlnZXN0QW5kUmVzZXQAVxtkaWdlc3Rjb250ZXh0X2RpZ2VzdEFuZERyb3\
AAXhNkaWdlc3Rjb250ZXh0X3Jlc2V0ACETZGlnZXN0Y29udGV4dF9jbG9uZQAQH19fd2JpbmRnZW5f\
YWRkX3RvX3N0YWNrX3BvaW50ZXIAjwERX193YmluZGdlbl9tYWxsb2MAeRJfX3diaW5kZ2VuX3JlYW\
xsb2MAhgEPX193YmluZGdlbl9mcmVlAIoBCaaAgIAAAQBBAQsUiAGJASiOAX1ffn98hwGFAYABgQGC\
AYMBhAGYAWlolgEK//KIgACNAYZ2AhF/An4jAEHAKGsiBSQAAkACQAJAAkACQAJAAkACQAJAAkACQA\
JAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCABDhgAAQIDBAUGBwgJCgsMDQ4PEBES\
ExQVFhcAC0HQARAZIgZFDRggBUHQE2pBOGogAkE4aikDADcDACAFQdATakEwaiACQTBqKQMANwMAIA\
VB0BNqQShqIAJBKGopAwA3AwAgBUHQE2pBIGogAkEgaikDADcDACAFQdATakEYaiACQRhqKQMANwMA\
IAVB0BNqQRBqIAJBEGopAwA3AwAgBUHQE2pBCGogAkEIaikDADcDACAFIAIpAwA3A9ATIAIpA0AhFi\
AFQdATakHIAGogAkHIAGoQYiAFIBY3A5AUIAYgBUHQE2pB0AEQlAEaDBcLQdABEBkiBkUNFyAFQdAT\
akE4aiACQThqKQMANwMAIAVB0BNqQTBqIAJBMGopAwA3AwAgBUHQE2pBKGogAkEoaikDADcDACAFQd\
ATakEgaiACQSBqKQMANwMAIAVB0BNqQRhqIAJBGGopAwA3AwAgBUHQE2pBEGogAkEQaikDADcDACAF\
QdATakEIaiACQQhqKQMANwMAIAUgAikDADcD0BMgAikDQCEWIAVB0BNqQcgAaiACQcgAahBiIAUgFj\
cDkBQgBiAFQdATakHQARCUARoMFgtB0AEQGSIGRQ0WIAVB0BNqQThqIAJBOGopAwA3AwAgBUHQE2pB\
MGogAkEwaikDADcDACAFQdATakEoaiACQShqKQMANwMAIAVB0BNqQSBqIAJBIGopAwA3AwAgBUHQE2\
pBGGogAkEYaikDADcDACAFQdATakEQaiACQRBqKQMANwMAIAVB0BNqQQhqIAJBCGopAwA3AwAgBSAC\
KQMANwPQEyACKQNAIRYgBUHQE2pByABqIAJByABqEGIgBSAWNwOQFCAGIAVB0BNqQdABEJQBGgwVC0\
HwABAZIgZFDRUgBUHQE2pBIGogAkEgaikDADcDACAFQdATakEYaiACQRhqKQMANwMAIAVB0BNqQRBq\
IAJBEGopAwA3AwAgBSACKQMINwPYEyACKQMAIRYgBUHQE2pBKGogAkEoahBRIAUgFjcD0BMgBiAFQd\
ATakHwABCUARoMFAtB+A4QGSIGRQ0UIAVB0BNqQYgBaiACQYgBaikDADcDACAFQdATakGAAWogAkGA\
AWopAwA3AwAgBUHQE2pB+ABqIAJB+ABqKQMANwMAIAVB0BNqQRBqIAJBEGopAwA3AwAgBUHQE2pBGG\
ogAkEYaikDADcDACAFQdATakEgaiACQSBqKQMANwMAIAVB0BNqQTBqIAJBMGopAwA3AwAgBUHQE2pB\
OGogAkE4aikDADcDACAFQdATakHAAGogAkHAAGopAwA3AwAgBUHQE2pByABqIAJByABqKQMANwMAIA\
VB0BNqQdAAaiACQdAAaikDADcDACAFQdATakHYAGogAkHYAGopAwA3AwAgBUHQE2pB4ABqIAJB4ABq\
KQMANwMAIAUgAikDcDcDwBQgBSACKQMINwPYEyAFIAIpAyg3A/gTIAIpAwAhFkEAIQcgBUEANgLgFC\
ACKAKQASIIQf///z9xIglBNyAJQTdJGyEKIAJBlAFqIgkgCEEFdCILaiEMIAVBxCJqIQ0gAi0AaiEO\
IAItAGkhDyACLQBoIRACQANAIAsgB0YNASAFQdATaiAHakGUAWoiAiAJKQAANwAAIAJBGGogCUEYai\
kAADcAACACQRBqIAlBEGopAAA3AAAgAkEIaiAJQQhqKQAANwAAIAlBIGoiCCAMRg0BIAJBIGogCCkA\
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\
GGoiDCAEQdATakEcaikCADcDACAEQfgmakEQaiILIARB0BNqQRRqKQIANwMAIARB+CZqQQhqIg0gBE\
HQE2pBDGopAgA3AwAgBCAEKQLUEzcD+CYgBEHQE2ogBEHQARCUARogBCAEKQOQFCAEQZgVai0AACIC\
rXw3A5AUIARBmBRqIQECQCACQYABRg0AIAEgAmpBAEGAASACaxCTARoLIARBADoAmBUgBEHQE2ogAU\
J/EBIgBEH4DmpBCGoiAiAEQdATakEIaikDADcDACAEQfgOakEQaiIBIARB0BNqQRBqKQMANwMAIARB\
+A5qQRhqIgogBEHQE2pBGGopAwA3AwAgBEH4DmpBIGoiDiAEKQPwEzcDACAEQfgOakEoaiIPIARB0B\
NqQShqKQMANwMAIARB+A5qQTBqIhAgBEHQE2pBMGopAwA3AwAgBEH4DmpBOGoiESAEQdATakE4aikD\
ADcDACAEIAQpA9ATNwP4DiANIAIpAwA3AwAgCyABKQMANwMAIAwgCikDADcDACAHIA4pAwA3AwAgCC\
APKQMANwMAIAMgECkDADcDACAJIBEpAwA3AwAgBCAEKQP4DjcD+CZBwAAQGSICRQ0cIAIgBCkD+CY3\
AAAgAkE4aiAEQfgmakE4aikDADcAACACQTBqIARB+CZqQTBqKQMANwAAIAJBKGogBEH4JmpBKGopAw\
A3AAAgAkEgaiAEQfgmakEgaikDADcAACACQRhqIARB+CZqQRhqKQMANwAAIAJBEGogBEH4JmpBEGop\
AwA3AAAgAkEIaiAEQfgmakEIaikDADcAACAGECJBwAAhBAweCyAFIAZB0AEQlAEiBEH4DmpBDGpCAD\
cCACAEQfgOakEUakIANwIAIARB+A5qQRxqQgA3AgAgBEIANwL8DiAEQQA2AvgOIARB+A5qIARB+A5q\
QQRyQX9zakEkakEHSRogBEEgNgL4DiAEQdATakEQaiIHIARB+A5qQRBqIgIpAwA3AwAgBEHQE2pBCG\
oiDCAEQfgOakEIaiIBKQMANwMAIARB0BNqQRhqIgsgBEH4DmpBGGoiCSkDADcDACAEQdATakEgaiAE\
QfgOakEgaiINKAIANgIAIARB+CZqQQhqIgogBEHQE2pBDGopAgA3AwAgBEH4JmpBEGoiDiAEQdATak\
EUaikCADcDACAEQfgmakEYaiIPIARB0BNqQRxqKQIANwMAIAQgBCkD+A43A9ATIAQgBCkC1BM3A/gm\
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\
AgAgAUGUD2pBADYCACABQgA3AvwOIAFBADYC+A5BBCECIAFB+A5qIAFB+A5qQQRyQX9zakEgaiEEA0\
AgAkF/aiICDQALAkAgBEEHSQ0AQRghAgNAIAJBeGoiAg0ACwtBHCEEIAFBHDYC+A4gAUHQE2pBEGog\
AUH4DmpBEGopAwA3AwAgAUHQE2pBCGogAUH4DmpBCGopAwA3AwAgAUHQE2pBGGogAUH4DmpBGGopAw\
A3AwAgAUH4JmpBCGoiCSABQdwTaikCADcDACABQfgmakEQaiIDIAFB5BNqKQIANwMAIAFB+CZqQRhq\
IgggAUHQE2pBHGooAgA2AgAgASABKQP4DjcD0BMgASABKQLUEzcD+CYgAUHQE2ogAUHgAhCUARogAU\
HQE2ogAUGYFWogAUH4JmoQOEEcEBkiAkUNFyACIAEpA/gmNwAAIAJBGGogCCgCADYAACACQRBqIAMp\
AwA3AAAgAkEIaiAJKQMANwAADBYLIAUgBkHYAhCUASIBQfgOakEMakIANwIAIAFB+A5qQRRqQgA3Ag\
AgAUH4DmpBHGpCADcCACABQgA3AvwOIAFBADYC+A4gAUH4DmogAUH4DmpBBHJBf3NqQSRqQQdJGkEg\
IQQgAUEgNgL4DiABQdATakEQaiABQfgOakEQaikDADcDACABQdATakEIaiABQfgOakEIaikDADcDAC\
ABQdATakEYaiABQfgOakEYaikDADcDACABQdATakEgaiABQfgOakEgaigCADYCACABQfgmakEIaiIJ\
IAFB0BNqQQxqKQIANwMAIAFB+CZqQRBqIgMgAUHQE2pBFGopAgA3AwAgAUH4JmpBGGoiCCABQdATak\
EcaikCADcDACABIAEpA/gONwPQEyABIAEpAtQTNwP4JiABQdATaiABQdgCEJQBGiABQdATaiABQZgV\
aiABQfgmahBBQSAQGSICRQ0WIAIgASkD+CY3AAAgAkEYaiAIKQMANwAAIAJBEGogAykDADcAACACQQ\
hqIAkpAwA3AAAMFQsgBSAGQbgCEJQBIgFB+A5qQQxqQgA3AgAgAUH4DmpBFGpCADcCACABQfgOakEc\
akIANwIAIAFB+A5qQSRqQgA3AgAgAUH4DmpBLGpCADcCACABQgA3AvwOIAFBADYC+A4gAUH4DmogAU\
H4DmpBBHJBf3NqQTRqQQdJGkEwIQQgAUEwNgL4DiABQdATakEQaiABQfgOakEQaikDADcDACABQdAT\
akEIaiABQfgOakEIaikDADcDACABQdATakEYaiABQfgOakEYaikDADcDACABQdATakEgaiABQfgOak\
EgaikDADcDACABQdATakEoaiABQfgOakEoaikDADcDACABQdATakEwaiABQfgOakEwaigCADYCACAB\
QfgmakEIaiIJIAFB0BNqQQxqKQIANwMAIAFB+CZqQRBqIgMgAUHQE2pBFGopAgA3AwAgAUH4JmpBGG\
oiCCABQdATakEcaikCADcDACABQfgmakEgaiIHIAFB0BNqQSRqKQIANwMAIAFB+CZqQShqIgwgAUHQ\
E2pBLGopAgA3AwAgASABKQP4DjcD0BMgASABKQLUEzcD+CYgAUHQE2ogAUG4AhCUARogAUHQE2ogAU\
GYFWogAUH4JmoQSUEwEBkiAkUNFSACIAEpA/gmNwAAIAJBKGogDCkDADcAACACQSBqIAcpAwA3AAAg\
AkEYaiAIKQMANwAAIAJBEGogAykDADcAACACQQhqIAkpAwA3AAAMFAsgBSAGQZgCEJQBIgFB+A5qQQ\
xqQgA3AgAgAUH4DmpBFGpCADcCACABQfgOakEcakIANwIAIAFB+A5qQSRqQgA3AgAgAUH4DmpBLGpC\
ADcCACABQfgOakE0akIANwIAIAFB+A5qQTxqQgA3AgAgAUIANwL8DiABQQA2AvgOIAFB+A5qIAFB+A\
5qQQRyQX9zakHEAGpBB0kaQcAAIQQgAUHAADYC+A4gAUHQE2ogAUH4DmpBxAAQlAEaIAFB+CZqQThq\
IgkgAUHQE2pBPGopAgA3AwAgAUH4JmpBMGoiAyABQdATakE0aikCADcDACABQfgmakEoaiIIIAFB0B\
NqQSxqKQIANwMAIAFB+CZqQSBqIgcgAUHQE2pBJGopAgA3AwAgAUH4JmpBGGoiDCABQdATakEcaikC\
ADcDACABQfgmakEQaiILIAFB0BNqQRRqKQIANwMAIAFB+CZqQQhqIg0gAUHQE2pBDGopAgA3AwAgAS\
ABKQLUEzcD+CYgAUHQE2ogAUGYAhCUARogAUHQE2ogAUGYFWogAUH4JmoQS0HAABAZIgJFDRQgAiAB\
KQP4JjcAACACQThqIAkpAwA3AAAgAkEwaiADKQMANwAAIAJBKGogCCkDADcAACACQSBqIAcpAwA3AA\
AgAkEYaiAMKQMANwAAIAJBEGogCykDADcAACACQQhqIA0pAwA3AAAMEwsgBSAGQeAAEJQBIgFB+A5q\
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\
aiABQfgmahBCQSAQGSICRQ0OIAIgASkD+CY3AAAgAkEYaiAIKQMANwAAIAJBEGogAykDADcAACACQQ\
hqIAkpAwA3AAAMDQsgBSAGQbgCEJQBIgFB+A5qQQxqQgA3AgAgAUH4DmpBFGpCADcCACABQfgOakEc\
akIANwIAIAFB+A5qQSRqQgA3AgAgAUH4DmpBLGpCADcCACABQgA3AvwOIAFBADYC+A4gAUH4DmogAU\
H4DmpBBHJBf3NqQTRqQQdJGkEwIQQgAUEwNgL4DiABQdATakEQaiABQfgOakEQaikDADcDACABQdAT\
akEIaiABQfgOakEIaikDADcDACABQdATakEYaiABQfgOakEYaikDADcDACABQdATakEgaiABQfgOak\
EgaikDADcDACABQdATakEoaiABQfgOakEoaikDADcDACABQdATakEwaiABQfgOakEwaigCADYCACAB\
QfgmakEIaiIJIAFB0BNqQQxqKQIANwMAIAFB+CZqQRBqIgMgAUHQE2pBFGopAgA3AwAgAUH4JmpBGG\
oiCCABQdATakEcaikCADcDACABQfgmakEgaiIHIAFB0BNqQSRqKQIANwMAIAFB+CZqQShqIgwgAUHQ\
E2pBLGopAgA3AwAgASABKQP4DjcD0BMgASABKQLUEzcD+CYgAUHQE2ogAUG4AhCUARogAUHQE2ogAU\
GYFWogAUH4JmoQSkEwEBkiAkUNDSACIAEpA/gmNwAAIAJBKGogDCkDADcAACACQSBqIAcpAwA3AAAg\
AkEYaiAIKQMANwAAIAJBEGogAykDADcAACACQQhqIAkpAwA3AAAMDAsgBSAGQZgCEJQBIgFB+A5qQQ\
xqQgA3AgAgAUH4DmpBFGpCADcCACABQfgOakEcakIANwIAIAFB+A5qQSRqQgA3AgAgAUH4DmpBLGpC\
ADcCACABQfgOakE0akIANwIAIAFB+A5qQTxqQgA3AgAgAUIANwL8DiABQQA2AvgOIAFB+A5qIAFB+A\
5qQQRyQX9zakHEAGpBB0kaQcAAIQQgAUHAADYC+A4gAUHQE2ogAUH4DmpBxAAQlAEaIAFB+CZqQThq\
IgkgAUHQE2pBPGopAgA3AwAgAUH4JmpBMGoiAyABQdATakE0aikCADcDACABQfgmakEoaiIIIAFB0B\
NqQSxqKQIANwMAIAFB+CZqQSBqIgcgAUHQE2pBJGopAgA3AwAgAUH4JmpBGGoiDCABQdATakEcaikC\
ADcDACABQfgmakEQaiILIAFB0BNqQRRqKQIANwMAIAFB+CZqQQhqIg0gAUHQE2pBDGopAgA3AwAgAS\
ABKQLUEzcD+CYgAUHQE2ogAUGYAhCUARogAUHQE2ogAUGYFWogAUH4JmoQTEHAABAZIgJFDQwgAiAB\
KQP4JjcAACACQThqIAkpAwA3AAAgAkEwaiADKQMANwAAIAJBKGogCCkDADcAACACQSBqIAcpAwA3AA\
AgAkEYaiAMKQMANwAAIAJBEGogCykDADcAACACQQhqIA0pAwA3AAAMCwsgBSAGQfAAEJQBIQRBBCEC\
A0AgAkF/aiICDQALAkBBG0EHSQ0AQRghAgNAIAJBeGoiAg0ACwsgBEHQE2ogBEHwABCUARogBEH4Jm\
pBDGpCADcCACAEQfgmakEUakIANwIAIARB+CZqQRxqQgA3AgAgBEIANwL8JiAEQQA2AvgmIARB+CZq\
IARB+CZqQQRyQX9zakEkakEHSRogBEEgNgL4JiAEQfgOakEQaiIBIARB+CZqQRBqKQMANwMAIARB+A\
5qQQhqIgkgBEH4JmpBCGopAwA3AwAgBEH4DmpBGGoiAyAEQfgmakEYaikDADcDACAEQfgOakEgaiAE\
QfgmakEgaigCADYCACAEQcglakEIaiICIARB+A5qQQxqKQIANwMAIARByCVqQRBqIgggBEH4DmpBFG\
opAgA3AwAgBEHIJWpBGGoiByAEQfgOakEcaikCADcDACAEIAQpA/gmNwP4DiAEIAQpAvwONwPIJSAE\
QdATaiAEQfgTaiAEQcglahAnIAMgBygCADYCACABIAgpAwA3AwAgCSACKQMANwMAIAQgBCkDyCU3A/\
gOQRwQGSICRQ0LIAIgBCkD+A43AAAgAkEYaiADKAIANgAAIAJBEGogASkDADcAACACQQhqIAkpAwA3\
AAAgBhAiQRwhBAwNCyAFIAZB8AAQlAEiAUHQE2ogAUHwABCUARogAUH4JmpBDGpCADcCACABQfgmak\
EUakIANwIAIAFB+CZqQRxqQgA3AgAgAUIANwL8JiABQQA2AvgmIAFB+CZqIAFB+CZqQQRyQX9zakEk\
akEHSRpBICEEIAFBIDYC+CYgAUH4DmpBEGoiCSABQfgmakEQaikDADcDACABQfgOakEIaiIDIAFB+C\
ZqQQhqKQMANwMAIAFB+A5qQRhqIgggAUH4JmpBGGopAwA3AwAgAUH4DmpBIGogAUH4JmpBIGooAgA2\
AgAgAUHIJWpBCGoiAiABQfgOakEMaikCADcDACABQcglakEQaiIHIAFB+A5qQRRqKQIANwMAIAFByC\
VqQRhqIgwgAUH4DmpBHGopAgA3AwAgASABKQP4JjcD+A4gASABKQL8DjcDyCUgAUHQE2ogAUH4E2og\
AUHIJWoQJyAIIAwpAwA3AwAgCSAHKQMANwMAIAMgAikDADcDACABIAEpA8glNwP4DkEgEBkiAkUNCi\
ACIAEpA/gONwAAIAJBGGogCCkDADcAACACQRBqIAkpAwA3AAAgAkEIaiADKQMANwAADAkLIAUgBkHY\
ARCUASIBQdATaiABQdgBEJQBGiABQfgmakEMakIANwIAIAFB+CZqQRRqQgA3AgAgAUH4JmpBHGpCAD\
cCACABQfgmakEkakIANwIAIAFB+CZqQSxqQgA3AgAgAUH4JmpBNGpCADcCACABQfgmakE8akIANwIA\
IAFCADcC/CYgAUEANgL4JiABQfgmaiABQfgmakEEckF/c2pBxABqQQdJGiABQcAANgL4JiABQfgOai\
ABQfgmakHEABCUARogAUGAJmogAUH4DmpBPGopAgA3AwBBMCEEIAFByCVqQTBqIAFB+A5qQTRqKQIA\
NwMAIAFByCVqQShqIgIgAUH4DmpBLGopAgA3AwAgAUHIJWpBIGoiCSABQfgOakEkaikCADcDACABQc\
glakEYaiIDIAFB+A5qQRxqKQIANwMAIAFByCVqQRBqIgggAUH4DmpBFGopAgA3AwAgAUHIJWpBCGoi\
ByABQfgOakEMaikCADcDACABIAEpAvwONwPIJSABQdATaiABQaAUaiABQcglahAjIAFB+A5qQShqIg\
wgAikDADcDACABQfgOakEgaiILIAkpAwA3AwAgAUH4DmpBGGoiCSADKQMANwMAIAFB+A5qQRBqIgMg\
CCkDADcDACABQfgOakEIaiIIIAcpAwA3AwAgASABKQPIJTcD+A5BMBAZIgJFDQkgAiABKQP4DjcAAC\
ACQShqIAwpAwA3AAAgAkEgaiALKQMANwAAIAJBGGogCSkDADcAACACQRBqIAMpAwA3AAAgAkEIaiAI\
KQMANwAADAgLIAUgBkHYARCUASIBQdATaiABQdgBEJQBGiABQfgmakEMakIANwIAIAFB+CZqQRRqQg\
A3AgAgAUH4JmpBHGpCADcCACABQfgmakEkakIANwIAIAFB+CZqQSxqQgA3AgAgAUH4JmpBNGpCADcC\
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\
ADcCACAFQdgHakE8akIANwIAIAVCADcC3AcgBUEANgLYByAFQdgHaiAFQdgHakEEckF/c2pBxABqQQ\
dJGiAFQcAANgLYByAFQYACaiAFQdgHakHEABCUARogBUGoBmpBOGogBUGAAmpBPGopAgA3AwBBMCEE\
IAVBqAZqQTBqIAVBgAJqQTRqKQIANwMAIAVBqAZqQShqIgEgBUGAAmpBLGopAgA3AwAgBUGoBmpBIG\
oiAyAFQYACakEkaikCADcDACAFQagGakEYaiIGIAVBgAJqQRxqKQIANwMAIAVBqAZqQRBqIgcgBUGA\
AmpBFGopAgA3AwAgBUGoBmpBCGoiCCAFQYACakEMaikCADcDACAFIAUpAoQCNwOoBiACIAJB0ABqIA\
VBqAZqECMgBUGAAmpBKGoiCSABKQMANwMAIAVBgAJqQSBqIgogAykDADcDACAFQYACakEYaiIDIAYp\
AwA3AwAgBUGAAmpBEGoiBiAHKQMANwMAIAVBgAJqQQhqIgcgCCkDADcDACAFIAUpA6gGNwOAAiACQc\
gAakIANwMAIAJCADcDQCACQThqQQApA+COQDcDACACQTBqQQApA9iOQDcDACACQShqQQApA9COQDcD\
ACACQSBqQQApA8iOQDcDACACQRhqQQApA8COQDcDACACQRBqQQApA7iOQDcDACACQQhqQQApA7COQD\
cDACACQQApA6iOQDcDACACQdABakEAOgAAQTAQGSIBRQ0LIAEgBSkDgAI3AAAgAUEoaiAJKQMANwAA\
IAFBIGogCikDADcAACABQRhqIAMpAwA3AAAgAUEQaiAGKQMANwAAIAFBCGogBykDADcAAAwKCyAFQd\
gHakEMakIANwIAIAVB2AdqQRRqQgA3AgAgBUHYB2pBHGpCADcCACAFQdgHakEkakIANwIAIAVB2Adq\
QSxqQgA3AgAgBUHYB2pBNGpCADcCACAFQdgHakE8akIANwIAIAVCADcC3AcgBUEANgLYByAFQdgHai\
AFQdgHakEEckF/c2pBxABqQQdJGkHAACEEIAVBwAA2AtgHIAVBgAJqIAVB2AdqQcQAEJQBGiAFQagG\
akE4aiIBIAVBgAJqQTxqKQIANwMAIAVBqAZqQTBqIgMgBUGAAmpBNGopAgA3AwAgBUGoBmpBKGoiBi\
AFQYACakEsaikCADcDACAFQagGakEgaiIHIAVBgAJqQSRqKQIANwMAIAVBqAZqQRhqIgggBUGAAmpB\
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\
cyAjQR53ICNBE3dzICNBCndzaiACIBtBGXcgG0EOd3MgG0EDdnNqIBlqIBJBD3cgEkENd3MgEkEKdn\
NqICJqIBAgHGoiAiAhIB5zcSAec2ogAkEadyACQRV3cyACQQd3c2pB98fm93tqIiJqIhwgIyAgc3Eg\
E3MgC2ogHEEedyAcQRN3cyAcQQp3c2ogGyAfQRl3IB9BDndzIB9BA3ZzaiARaiAkQQ93ICRBDXdzIC\
RBCnZzaiAeaiAiICVqIhsgAiAhc3EgIXNqIBtBGncgG0EVd3MgG0EHd3NqQfLxxbN8aiIeaiELIBwg\
CmohCiAjIAlqIQkgICAIaiEIIB0gB2ogHmohByAbIAZqIQYgAiAFaiEFICEgBGohBCABQcAAaiIBIA\
xHDQALCyAAIAQ2AhwgACAFNgIYIAAgBjYCFCAAIAc2AhAgACAINgIMIAAgCTYCCCAAIAo2AgQgACAL\
NgIAC71AAgp/BH4jAEGAD2siASQAAkACQAJAAkAgAEUNACAAKAIAIgJBf0YNASAAIAJBAWo2AgAgAE\
EIaigCACECAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAg\
AEEEaigCACIDDhgAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcAC0HQARAZIgRFDRogAUEIakE4aiACQT\
hqKQMANwMAIAFBCGpBMGogAkEwaikDADcDACABQQhqQShqIAJBKGopAwA3AwAgAUEIakEgaiACQSBq\
KQMANwMAIAFBCGpBGGogAkEYaikDADcDACABQQhqQRBqIAJBEGopAwA3AwAgAUEIakEIaiACQQhqKQ\
MANwMAIAEgAikDADcDCCACKQNAIQsgAUEIakHIAGogAkHIAGoQYiABIAs3A0ggBCABQQhqQdABEJQB\
GgwXC0HQARAZIgRFDRkgAUEIakE4aiACQThqKQMANwMAIAFBCGpBMGogAkEwaikDADcDACABQQhqQS\
hqIAJBKGopAwA3AwAgAUEIakEgaiACQSBqKQMANwMAIAFBCGpBGGogAkEYaikDADcDACABQQhqQRBq\
IAJBEGopAwA3AwAgAUEIakEIaiACQQhqKQMANwMAIAEgAikDADcDCCACKQNAIQsgAUEIakHIAGogAk\
HIAGoQYiABIAs3A0ggBCABQQhqQdABEJQBGgwWC0HQARAZIgRFDRggAUEIakE4aiACQThqKQMANwMA\
IAFBCGpBMGogAkEwaikDADcDACABQQhqQShqIAJBKGopAwA3AwAgAUEIakEgaiACQSBqKQMANwMAIA\
FBCGpBGGogAkEYaikDADcDACABQQhqQRBqIAJBEGopAwA3AwAgAUEIakEIaiACQQhqKQMANwMAIAEg\
AikDADcDCCACKQNAIQsgAUEIakHIAGogAkHIAGoQYiABIAs3A0ggBCABQQhqQdABEJQBGgwVC0HwAB\
AZIgRFDRcgAUEIakEgaiACQSBqKQMANwMAIAFBCGpBGGogAkEYaikDADcDACABQQhqQRBqIAJBEGop\
AwA3AwAgASACKQMINwMQIAIpAwAhCyABQQhqQShqIAJBKGoQUSABIAs3AwggBCABQQhqQfAAEJQBGg\
wUC0H4DhAZIgRFDRYgAUEIakGIAWogAkGIAWopAwA3AwAgAUEIakGAAWogAkGAAWopAwA3AwAgAUEI\
akH4AGogAkH4AGopAwA3AwAgASACKQNwNwN4IAFBCGpBEGogAkEQaikDADcDACABQQhqQRhqIAJBGG\
opAwA3AwAgAUEIakEgaiACQSBqKQMANwMAIAEgAikDCDcDECACKQMAIQsgAUEIakHgAGogAkHgAGop\
AwA3AwAgAUEIakHYAGogAkHYAGopAwA3AwAgAUEIakHQAGogAkHQAGopAwA3AwAgAUEIakHIAGogAk\
HIAGopAwA3AwAgAUEIakHAAGogAkHAAGopAwA3AwAgAUEIakE4aiACQThqKQMANwMAIAFBCGpBMGog\
AkEwaikDADcDACABIAIpAyg3AzAgAi0AaiEFIAItAGkhBiACLQBoIQcgAUEANgKYAQJAIAIoApABIg\
hFDQAgAkGUAWoiCUEIaikAACEMIAlBEGopAAAhDSAJKQAAIQ4gAUG0AWogCUEYaikAADcCACABQawB\
aiANNwIAIAFBpAFqIAw3AgAgAUEIakGUAWogDjcCACACQbQBaiIKIAkgCEEFdGoiCUYNACAKQQhqKQ\
AAIQwgCkEQaikAACENIAopAAAhDiABQdQBaiAKQRhqKQAANwIAIAFBzAFqIA03AgAgAUHEAWogDDcC\
ACABQQhqQbQBaiAONwIAIAJB1AFqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQf\
QBaiAKQRhqKQAANwIAIAFB7AFqIA03AgAgAUHkAWogDDcCACABQQhqQdQBaiAONwIAIAJB9AFqIgog\
CUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQCaiAKQRhqKQAANwIAIAFBjAJqIA03Ag\
AgAUGEAmogDDcCACABQQhqQfQBaiAONwIAIAJBlAJqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACEN\
IAopAAAhDiABQbQCaiAKQRhqKQAANwIAIAFBrAJqIA03AgAgAUGkAmogDDcCACABQQhqQZQCaiAONw\
IAIAJBtAJqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQCaiAKQRhqKQAANwIA\
IAFBzAJqIA03AgAgAUHEAmogDDcCACABQQhqQbQCaiAONwIAIAJB1AJqIgogCUYNACAKQQhqKQAAIQ\
wgCkEQaikAACENIAopAAAhDiABQfQCaiAKQRhqKQAANwIAIAFB7AJqIA03AgAgAUHkAmogDDcCACAB\
QQhqQdQCaiAONwIAIAJB9AJqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQDai\
AKQRhqKQAANwIAIAFBjANqIA03AgAgAUGEA2ogDDcCACABQQhqQfQCaiAONwIAIAJBlANqIgogCUYN\
ACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQDaiAKQRhqKQAANwIAIAFBrANqIA03AgAgAU\
GkA2ogDDcCACABQQhqQZQDaiAONwIAIAJBtANqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAop\
AAAhDiABQdQDaiAKQRhqKQAANwIAIAFBzANqIA03AgAgAUHEA2ogDDcCACABQQhqQbQDaiAONwIAIA\
JB1ANqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQDaiAKQRhqKQAANwIAIAFB\
7ANqIA03AgAgAUHkA2ogDDcCACABQQhqQdQDaiAONwIAIAJB9ANqIgogCUYNACAKQQhqKQAAIQwgCk\
EQaikAACENIAopAAAhDiABQZQEaiAKQRhqKQAANwIAIAFBjARqIA03AgAgAUGEBGogDDcCACABQQhq\
QfQDaiAONwIAIAJBlARqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQEaiAKQR\
hqKQAANwIAIAFBrARqIA03AgAgAUGkBGogDDcCACABQQhqQZQEaiAONwIAIAJBtARqIgogCUYNACAK\
QQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQEaiAKQRhqKQAANwIAIAFBzARqIA03AgAgAUHEBG\
ogDDcCACABQQhqQbQEaiAONwIAIAJB1ARqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAh\
DiABQfQEaiAKQRhqKQAANwIAIAFB7ARqIA03AgAgAUHkBGogDDcCACABQQhqQdQEaiAONwIAIAJB9A\
RqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQFaiAKQRhqKQAANwIAIAFBjAVq\
IA03AgAgAUGEBWogDDcCACABQQhqQfQEaiAONwIAIAJBlAVqIgogCUYNACAKQQhqKQAAIQwgCkEQai\
kAACENIAopAAAhDiABQbQFaiAKQRhqKQAANwIAIAFBrAVqIA03AgAgAUGkBWogDDcCACABQQhqQZQF\
aiAONwIAIAJBtAVqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQFaiAKQRhqKQ\
AANwIAIAFBzAVqIA03AgAgAUHEBWogDDcCACABQQhqQbQFaiAONwIAIAJB1AVqIgogCUYNACAKQQhq\
KQAAIQwgCkEQaikAACENIAopAAAhDiABQfQFaiAKQRhqKQAANwIAIAFB7AVqIA03AgAgAUHkBWogDD\
cCACABQQhqQdQFaiAONwIAIAJB9AVqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiAB\
QZQGaiAKQRhqKQAANwIAIAFBjAZqIA03AgAgAUGEBmogDDcCACABQQhqQfQFaiAONwIAIAJBlAZqIg\
ogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQGaiAKQRhqKQAANwIAIAFBrAZqIA03\
AgAgAUGkBmogDDcCACABQQhqQZQGaiAONwIAIAJBtAZqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAAC\
ENIAopAAAhDiABQdQGaiAKQRhqKQAANwIAIAFBzAZqIA03AgAgAUHEBmogDDcCACABQQhqQbQGaiAO\
NwIAIAJB1AZqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQGaiAKQRhqKQAANw\
IAIAFB7AZqIA03AgAgAUHkBmogDDcCACABQQhqQdQGaiAONwIAIAJB9AZqIgogCUYNACAKQQhqKQAA\
IQwgCkEQaikAACENIAopAAAhDiABQZQHaiAKQRhqKQAANwIAIAFBjAdqIA03AgAgAUGEB2ogDDcCAC\
ABQQhqQfQGaiAONwIAIAJBlAdqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQH\
aiAKQRhqKQAANwIAIAFBrAdqIA03AgAgAUGkB2ogDDcCACABQQhqQZQHaiAONwIAIAJBtAdqIgogCU\
YNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQHaiAKQRhqKQAANwIAIAFBzAdqIA03AgAg\
AUHEB2ogDDcCACABQQhqQbQHaiAONwIAIAJB1AdqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIA\
opAAAhDiABQfQHaiAKQRhqKQAANwIAIAFB7AdqIA03AgAgAUHkB2ogDDcCACABQQhqQdQHaiAONwIA\
IAJB9AdqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQIaiAKQRhqKQAANwIAIA\
FBjAhqIA03AgAgAUGECGogDDcCACABQQhqQfQHaiAONwIAIAJBlAhqIgogCUYNACAKQQhqKQAAIQwg\
CkEQaikAACENIAopAAAhDiABQbQIaiAKQRhqKQAANwIAIAFBrAhqIA03AgAgAUGkCGogDDcCACABQQ\
hqQZQIaiAONwIAIAJBtAhqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQIaiAK\
QRhqKQAANwIAIAFBzAhqIA03AgAgAUHECGogDDcCACABQQhqQbQIaiAONwIAIAJB1AhqIgogCUYNAC\
AKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQIaiAKQRhqKQAANwIAIAFB7AhqIA03AgAgAUHk\
CGogDDcCACABQQhqQdQIaiAONwIAIAJB9AhqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAA\
AhDiABQZQJaiAKQRhqKQAANwIAIAFBjAlqIA03AgAgAUGECWogDDcCACABQQhqQfQIaiAONwIAIAJB\
lAlqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQJaiAKQRhqKQAANwIAIAFBrA\
lqIA03AgAgAUGkCWogDDcCACABQQhqQZQJaiAONwIAIAJBtAlqIgogCUYNACAKQQhqKQAAIQwgCkEQ\
aikAACENIAopAAAhDiABQdQJaiAKQRhqKQAANwIAIAFBzAlqIA03AgAgAUHECWogDDcCACABQQhqQb\
QJaiAONwIAIAJB1AlqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQJaiAKQRhq\
KQAANwIAIAFB7AlqIA03AgAgAUHkCWogDDcCACABQQhqQdQJaiAONwIAIAJB9AlqIgogCUYNACAKQQ\
hqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQKaiAKQRhqKQAANwIAIAFBjApqIA03AgAgAUGECmog\
DDcCACABQQhqQfQJaiAONwIAIAJBlApqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDi\
ABQbQKaiAKQRhqKQAANwIAIAFBrApqIA03AgAgAUGkCmogDDcCACABQQhqQZQKaiAONwIAIAJBtApq\
IgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQKaiAKQRhqKQAANwIAIAFBzApqIA\
03AgAgAUHECmogDDcCACABQQhqQbQKaiAONwIAIAJB1ApqIgogCUYNACAKQQhqKQAAIQwgCkEQaikA\
ACENIAopAAAhDiABQfQKaiAKQRhqKQAANwIAIAFB7ApqIA03AgAgAUHkCmogDDcCACABQQhqQdQKai\
AONwIAIAJB9ApqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQLaiAKQRhqKQAA\
NwIAIAFBjAtqIA03AgAgAUGEC2ogDDcCACABQQhqQfQKaiAONwIAIAJBlAtqIgogCUYNACAKQQhqKQ\
AAIQwgCkEQaikAACENIAopAAAhDiABQbQLaiAKQRhqKQAANwIAIAFBrAtqIA03AgAgAUGkC2ogDDcC\
ACABQQhqQZQLaiAONwIAIAJBtAtqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQd\
QLaiAKQRhqKQAANwIAIAFBzAtqIA03AgAgAUHEC2ogDDcCACABQQhqQbQLaiAONwIAIAJB1AtqIgog\
CUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQLaiAKQRhqKQAANwIAIAFB7AtqIA03Ag\
AgAUHkC2ogDDcCACABQQhqQdQLaiAONwIAIAJB9AtqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACEN\
IAopAAAhDiABQZQMaiAKQRhqKQAANwIAIAFBjAxqIA03AgAgAUGEDGogDDcCACABQQhqQfQLaiAONw\
IAIAJBlAxqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQMaiAKQRhqKQAANwIA\
IAFBrAxqIA03AgAgAUGkDGogDDcCACABQQhqQZQMaiAONwIAIAJBtAxqIgogCUYNACAKQQhqKQAAIQ\
wgCkEQaikAACENIAopAAAhDiABQdQMaiAKQRhqKQAANwIAIAFBzAxqIA03AgAgAUHEDGogDDcCACAB\
QQhqQbQMaiAONwIAIAJB1AxqIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQMai\
AKQRhqKQAANwIAIAFB7AxqIA03AgAgAUHkDGogDDcCACABQQhqQdQMaiAONwIAIAJB9AxqIgogCUYN\
ACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQNaiAKQRhqKQAANwIAIAFBjA1qIA03AgAgAU\
GEDWogDDcCACABQQhqQfQMaiAONwIAIAJBlA1qIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAop\
AAAhDiABQbQNaiAKQRhqKQAANwIAIAFBrA1qIA03AgAgAUGkDWogDDcCACABQQhqQZQNaiAONwIAIA\
JBtA1qIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQdQNaiAKQRhqKQAANwIAIAFB\
zA1qIA03AgAgAUHEDWogDDcCACABQQhqQbQNaiAONwIAIAJB1A1qIgogCUYNACAKQQhqKQAAIQwgCk\
EQaikAACENIAopAAAhDiABQfQNaiAKQRhqKQAANwIAIAFB7A1qIA03AgAgAUHkDWogDDcCACABQQhq\
QdQNaiAONwIAIAJB9A1qIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQZQOaiAKQR\
hqKQAANwIAIAFBjA5qIA03AgAgAUGEDmogDDcCACABQQhqQfQNaiAONwIAIAJBlA5qIgogCUYNACAK\
QQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQbQOaiAKQRhqKQAANwIAIAFBrA5qIA03AgAgAUGkDm\
ogDDcCACABQQhqQZQOaiAONwIAIAJBtA5qIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAh\
DiABQdQOaiAKQRhqKQAANwIAIAFBzA5qIA03AgAgAUHEDmogDDcCACABQQhqQbQOaiAONwIAIAJB1A\
5qIgogCUYNACAKQQhqKQAAIQwgCkEQaikAACENIAopAAAhDiABQfQOaiAKQRhqKQAANwIAIAFB7A5q\
IA03AgAgAUHkDmogDDcCACABQQhqQdQOaiAONwIAIAJB9A5qIAlHDRgLIAEgBToAciABIAY6AHEgAS\
AHOgBwIAEgCzcDCCABIAhB////P3EiAkE3IAJBN0kbNgKYASAEIAFBCGpB+A4QlAEaDBMLQeACEBki\
BEUNFSABQQhqIAJByAEQlAEaIAFBCGpByAFqIAJByAFqEGMgBCABQQhqQeACEJQBGgwSC0HYAhAZIg\
RFDRQgAUEIaiACQcgBEJQBGiABQQhqQcgBaiACQcgBahBkIAQgAUEIakHYAhCUARoMEQtBuAIQGSIE\
RQ0TIAFBCGogAkHIARCUARogAUEIakHIAWogAkHIAWoQZSAEIAFBCGpBuAIQlAEaDBALQZgCEBkiBE\
UNEiABQQhqIAJByAEQlAEaIAFBCGpByAFqIAJByAFqEGYgBCABQQhqQZgCEJQBGgwPC0HgABAZIgRF\
DREgAUEIakEQaiACQRBqKQMANwMAIAEgAikDCDcDECACKQMAIQsgAUEIakEYaiACQRhqEFEgASALNw\
MIIAQgAUEIakHgABCUARoMDgtB4AAQGSIERQ0QIAFBCGpBEGogAkEQaikDADcDACABIAIpAwg3AxAg\
AikDACELIAFBCGpBGGogAkEYahBRIAEgCzcDCCAEIAFBCGpB4AAQlAEaDA0LQegAEBkiBEUNDyABQQ\
hqQRhqIAJBGGooAgA2AgAgAUEIakEQaiACQRBqKQMANwMAIAEgAikDCDcDECACKQMAIQsgAUEIakEg\
aiACQSBqEFEgASALNwMIIAQgAUEIakHoABCUARoMDAtB6AAQGSIERQ0OIAFBCGpBGGogAkEYaigCAD\
YCACABQQhqQRBqIAJBEGopAwA3AwAgASACKQMINwMQIAIpAwAhCyABQQhqQSBqIAJBIGoQUSABIAs3\
AwggBCABQQhqQegAEJQBGgwLC0HgAhAZIgRFDQ0gAUEIaiACQcgBEJQBGiABQQhqQcgBaiACQcgBah\
BjIAQgAUEIakHgAhCUARoMCgtB2AIQGSIERQ0MIAFBCGogAkHIARCUARogAUEIakHIAWogAkHIAWoQ\
ZCAEIAFBCGpB2AIQlAEaDAkLQbgCEBkiBEUNCyABQQhqIAJByAEQlAEaIAFBCGpByAFqIAJByAFqEG\
UgBCABQQhqQbgCEJQBGgwIC0GYAhAZIgRFDQogAUEIaiACQcgBEJQBGiABQQhqQcgBaiACQcgBahBm\
IAQgAUEIakGYAhCUARoMBwtB8AAQGSIERQ0JIAFBCGpBIGogAkEgaikDADcDACABQQhqQRhqIAJBGG\
opAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIAEgAikDCDcDECACKQMAIQsgAUEIakEoaiACQShqEFEg\
ASALNwMIIAQgAUEIakHwABCUARoMBgtB8AAQGSIERQ0IIAFBCGpBIGogAkEgaikDADcDACABQQhqQR\
hqIAJBGGopAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIAEgAikDCDcDECACKQMAIQsgAUEIakEoaiAC\
QShqEFEgASALNwMIIAQgAUEIakHwABCUARoMBQtB2AEQGSIERQ0HIAFBCGpBOGogAkE4aikDADcDAC\
ABQQhqQTBqIAJBMGopAwA3AwAgAUEIakEoaiACQShqKQMANwMAIAFBCGpBIGogAkEgaikDADcDACAB\
QQhqQRhqIAJBGGopAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIAFBCGpBCGogAkEIaikDADcDACABIA\
IpAwA3AwggAkHIAGopAwAhCyACKQNAIQwgAUEIakHQAGogAkHQAGoQYiABQQhqQcgAaiALNwMAIAEg\
DDcDSCAEIAFBCGpB2AEQlAEaDAQLQdgBEBkiBEUNBiABQQhqQThqIAJBOGopAwA3AwAgAUEIakEwai\
ACQTBqKQMANwMAIAFBCGpBKGogAkEoaikDADcDACABQQhqQSBqIAJBIGopAwA3AwAgAUEIakEYaiAC\
QRhqKQMANwMAIAFBCGpBEGogAkEQaikDADcDACABQQhqQQhqIAJBCGopAwA3AwAgASACKQMANwMIIA\
JByABqKQMAIQsgAikDQCEMIAFBCGpB0ABqIAJB0ABqEGIgAUEIakHIAGogCzcDACABIAw3A0ggBCAB\
QQhqQdgBEJQBGgwDC0H4AhAZIgRFDQUgAUEIaiACQcgBEJQBGiABQQhqQcgBaiACQcgBahBnIAQgAU\
EIakH4AhCUARoMAgtB2AIQGSIERQ0EIAFBCGogAkHIARCUARogAUEIakHIAWogAkHIAWoQZCAEIAFB\
CGpB2AIQlAEaDAELQegAEBkiBEUNAyABQQhqQRBqIAJBEGopAwA3AwAgAUEIakEYaiACQRhqKQMANw\
MAIAEgAikDCDcDECACKQMAIQsgAUEIakEgaiACQSBqEFEgASALNwMIIAQgAUEIakHoABCUARoLIAAg\
ACgCAEF/ajYCAEEMEBkiAEUNAiAAIAQ2AgggACADNgIEIABBADYCACABQYAPaiQAIAAPCxCQAQALEJ\
EBAAsACxCNAQAL1TwCE38CfiMAQYACayIEJAACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC\
QAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAk\
ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJA\
IAAOGAABAgMEBQYHCAkKCwwNDg8QERITFBUWFwALIAFByABqIQVBgAEgAUHIAWotAAAiAGsiBiADTw\
0XAkAgAEUNACAFIABqIAIgBhCUARogASABKQNAQoABfDcDQCABIAVCABASIAMgBmshAyACIAZqIQIL\
IAMgA0EHdiADQQBHIANB/wBxRXFrIgBBB3QiB2shAyAARQ1GIAchBiACIQADQCABIAEpA0BCgAF8Nw\
NAIAEgAEIAEBIgAEGAAWohACAGQYB/aiIGDQAMRwsLIAFByABqIQVBgAEgAUHIAWotAAAiAGsiBiAD\
Tw0XAkAgAEUNACAFIABqIAIgBhCUARogASABKQNAQoABfDcDQCABIAVCABASIAMgBmshAyACIAZqIQ\
ILIAMgA0EHdiADQQBHIANB/wBxRXFrIgBBB3QiB2shAyAARQ1EIAchBiACIQADQCABIAEpA0BCgAF8\
NwNAIAEgAEIAEBIgAEGAAWohACAGQYB/aiIGDQAMRQsLIAFByABqIQVBgAEgAUHIAWotAAAiAGsiBi\
ADTw0XAkAgAEUNACAFIABqIAIgBhCUARogASABKQNAQoABfDcDQCABIAVCABASIAMgBmshAyACIAZq\
IQILIAMgA0EHdiADQQBHIANB/wBxRXFrIgBBB3QiB2shAyAARQ1CIAchBiACIQADQCABIAEpA0BCgA\
F8NwNAIAEgAEIAEBIgAEGAAWohACAGQYB/aiIGDQAMQwsLIAFBKGohBUHAACABQegAai0AACIAayIG\
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\
OgDIAQwtCyAFIABqIAIgAxCUARogASAAIANqOgBoDCwLIAQgCzYCjAEgBCAJNgKIASAEIAw2AoQBIA\
QgCDYCgAEgBCANNgJ8IAQgCjYCeCAEIA42AnQgBCAPNgJwQbCRwAAgBEHwAGpBpIfAAEGUh8AAEGEA\
CyAGIABqIAIgAxCUARogASAAIANqOgDYAgwqCyAGIABqIAIgAxCUARogASAAIANqOgDQAgwpCyAGIA\
BqIAIgAxCUARogASAAIANqOgCwAgwoCyAGIABqIAIgAxCUARogASAAIANqOgCQAgwnCyAFIABqIAIg\
AxCUARogASAAIANqOgBYDCYLIAYgAGogAiADEJQBGiABIAAgA2o6AFgMJQsgBSAAaiACIAMQlAEaIA\
EgACADajoAYAwkCyAGIABqIAIgAxCUARogASAAIANqOgBgDCMLIAYgAGogAiADEJQBGiABIAAgA2o6\
ANgCDCILIAYgAGogAiADEJQBGiABIAAgA2o6ANACDCELIAYgAGogAiADEJQBGiABIAAgA2o6ALACDC\
ALIAYgAGogAiADEJQBGiABIAAgA2o6AJACDB8LIAYgAGogAiADEJQBGiABIAAgA2o6AGgMHgsgBiAA\
aiACIAMQlAEaIAEgACADajoAaAwdCyAGIABqIAIgAxCUARogASAAIANqOgDQAQwcCyAGIABqIAIgAx\
CUARogASAAIANqOgDQAQwbCyAGIABqIAIgAxCUARogASAAIANqOgDwAgwaCyAGIABqIAIgAxCUARog\
ASAAIANqOgDQAgwZCyAFIAggBxCUARoLIAEgBzoAYAwXCwJAIABBiQFPDQAgBiACIAVqIAAQlAEaIA\
EgADoA0AIMFwsgAEGIAUGAgMAAEIsBAAsCQCAAQakBTw0AIAYgAiAFaiAAEJQBGiABIAA6APACDBYL\
IABBqAFBgIDAABCLAQALIAYgBSAAEJQBGiABIAA6ANABDBQLIAYgBSAAEJQBGiABIAA6ANABDBMLIA\
YgBSAAEJQBGiABIAA6AGgMEgsgBiAFIAAQlAEaIAEgADoAaAwRCwJAIABByQBPDQAgBiACIAVqIAAQ\
lAEaIAEgADoAkAIMEQsgAEHIAEGAgMAAEIsBAAsCQCAAQekATw0AIAYgAiAFaiAAEJQBGiABIAA6AL\
ACDBALIABB6ABBgIDAABCLAQALAkAgAEGJAU8NACAGIAIgBWogABCUARogASAAOgDQAgwPCyAAQYgB\
QYCAwAAQiwEACwJAIABBkQFPDQAgBiACIAVqIAAQlAEaIAEgADoA2AIMDgsgAEGQAUGAgMAAEIsBAA\
sgBiAFIAAQlAEaIAEgADoAYAwMCyAFIAggBxCUARogASAHOgBgDAsLIAYgBSAAEJQBGiABIAA6AFgM\
CgsgBSAIIAcQlAEaIAEgBzoAWAwJCwJAIABByQBPDQAgBiACIAVqIAAQlAEaIAEgADoAkAIMCQsgAE\
HIAEGAgMAAEIsBAAsCQCAAQekATw0AIAYgAiAFaiAAEJQBGiABIAA6ALACDAgLIABB6ABBgIDAABCL\
AQALAkAgAEGJAU8NACAGIAIgBWogABCUARogASAAOgDQAgwHCyAAQYgBQYCAwAAQiwEACwJAIABBkQ\
FPDQAgBiACIAVqIAAQlAEaIAEgADoA2AIMBgsgAEGQAUGAgMAAEIsBAAsCQAJAAkACQAJAAkACQAJA\
AkAgA0GBCEkNACABQZQBaiEOIAFB8ABqIQcgASkDACEYIARBKGohCiAEQQhqIQwgBEHwAGpBKGohCS\
AEQfAAakEIaiELIARBIGohDQNAIBhCCoYhF0F/IANBAXZndkEBaiEGA0AgBiIAQQF2IQYgFyAAQX9q\
rYNCAFINAAsgAEEKdq0hFwJAAkAgAEGBCEkNACADIABJDQQgAS0AaiEIIARB8ABqQThqIg9CADcDAC\
AEQfAAakEwaiIQQgA3AwAgCUIANwMAIARB8ABqQSBqIhFCADcDACAEQfAAakEYaiISQgA3AwAgBEHw\
AGpBEGoiE0IANwMAIAtCADcDACAEQgA3A3AgAiAAIAcgGCAIIARB8ABqQcAAEB4hBiAEQeABakEYak\
IANwMAIARB4AFqQRBqQgA3AwAgBEHgAWpBCGpCADcDACAEQgA3A+ABAkAgBkEDSQ0AA0AgBkEFdCIG\
QcEATw0HIARB8ABqIAYgByAIIARB4AFqQSAQLSIGQQV0IgVBwQBPDQggBUEhTw0JIARB8ABqIARB4A\
FqIAUQlAEaIAZBAksNAAsLIARBOGogDykDADcDACAEQTBqIBApAwA3AwAgCiAJKQMANwMAIA0gESkD\
ADcDACAEQRhqIgggEikDADcDACAEQRBqIg8gEykDADcDACAMIAspAwA3AwAgBCAEKQNwNwMAIAEgAS\
kDABAqIAEoApABIgVBN08NCCAOIAVBBXRqIgZBGGogCCkDADcAACAGQRBqIA8pAwA3AAAgBkEIaiAM\
KQMANwAAIAYgBCkDADcAACABIAVBAWo2ApABIAEgASkDACAXQgGIfBAqIAEoApABIgVBN08NCSAOIA\
VBBXRqIgZBGGogDUEYaikAADcAACAGIA0pAAA3AAAgBkEQaiANQRBqKQAANwAAIAZBCGogDUEIaikA\
ADcAACABIAVBAWo2ApABDAELIAlCADcDACAJQQhqIg9CADcDACAJQRBqIhBCADcDACAJQRhqIhFCAD\
cDACAJQSBqIhJCADcDACAJQShqIhNCADcDACAJQTBqIhRCADcDACAJQThqIhVCADcDACALIAcpAwA3\
AwAgC0EIaiIGIAdBCGopAwA3AwAgC0EQaiIFIAdBEGopAwA3AwAgC0EYaiIIIAdBGGopAwA3AwAgBE\
EAOwHYASAEIBg3A3AgBCABLQBqOgDaASAEQfAAaiACIAAQNyEWIAwgCykDADcDACAMQQhqIAYpAwA3\
AwAgDEEQaiAFKQMANwMAIAxBGGogCCkDADcDACAKIAkpAwA3AwAgCkEIaiAPKQMANwMAIApBEGogEC\
kDADcDACAKQRhqIBEpAwA3AwAgCkEgaiASKQMANwMAIApBKGogEykDADcDACAKQTBqIBQpAwA3AwAg\
CkE4aiAVKQMANwMAIAQtANoBIQ8gBC0A2QEhECAEIAQtANgBIhE6AGggBCAWKQMAIhg3AwAgBCAPIB\
BFckECciIPOgBpIARB4AFqQRhqIhAgCCkCADcDACAEQeABakEQaiIIIAUpAgA3AwAgBEHgAWpBCGoi\
BSAGKQIANwMAIAQgCykCADcD4AEgBEHgAWogCiARIBggDxAYIBAoAgAhDyAIKAIAIQggBSgCACEQIA\
QoAvwBIREgBCgC9AEhEiAEKALsASETIAQoAuQBIRQgBCgC4AEhFSABIAEpAwAQKiABKAKQASIFQTdP\
DQkgDiAFQQV0aiIGIBE2AhwgBiAPNgIYIAYgEjYCFCAGIAg2AhAgBiATNgIMIAYgEDYCCCAGIBQ2Ag\
QgBiAVNgIAIAEgBUEBajYCkAELIAEgASkDACAXfCIYNwMAIAMgAEkNCSACIABqIQIgAyAAayIDQYAI\
Sw0ACwsgA0UNDCABIAIgAxA3IgAgACkDABAqDAwLIAAgA0HQhcAAEIsBAAsgBkHAAEGQhcAAEIsBAA\
sgBUHAAEGghcAAEIsBAAsgBUEgQbCFwAAQiwEACyAEQfAAakEYaiAEQRhqKQMANwMAIARB8ABqQRBq\
IARBEGopAwA3AwAgBEHwAGpBCGogBEEIaikDADcDACAEIAQpAwA3A3BBsJHAACAEQfAAakGkh8AAQZ\
SHwAAQYQALIARB8ABqQRhqIA1BGGopAAA3AwAgBEHwAGpBEGogDUEQaikAADcDACAEQfAAakEIaiAN\
QQhqKQAANwMAIAQgDSkAADcDcEGwkcAAIARB8ABqQaSHwABBlIfAABBhAAsgBCARNgL8ASAEIA82Av\
gBIAQgEjYC9AEgBCAINgLwASAEIBM2AuwBIAQgEDYC6AEgBCAUNgLkASAEIBU2AuABQbCRwAAgBEHg\
AWpBpIfAAEGUh8AAEGEACyAAIANB4IXAABCMAQALAkAgA0HBAE8NACAFIAIgB2ogAxCUARogASADOg\
BoDAQLIANBwABBgIDAABCLAQALAkAgA0GBAU8NACAFIAIgB2ogAxCUARogASADOgDIAQwDCyADQYAB\
QYCAwAAQiwEACwJAIANBgQFPDQAgBSACIAdqIAMQlAEaIAEgAzoAyAEMAgsgA0GAAUGAgMAAEIsBAA\
sgA0GBAU8NASAFIAIgB2ogAxCUARogASADOgDIAQsgBEGAAmokAA8LIANBgAFBgIDAABCLAQALmi8C\
A38qfiMAQYABayIDJAAgA0EAQYABEJMBIgMgASkAADcDACADIAEpAAg3AwggAyABKQAQNwMQIAMgAS\
kAGDcDGCADIAEpACA3AyAgAyABKQAoNwMoIAMgASkAMCIGNwMwIAMgASkAOCIHNwM4IAMgASkAQCII\
NwNAIAMgASkASCIJNwNIIAMgASkAUCIKNwNQIAMgASkAWCILNwNYIAMgASkAYCIMNwNgIAMgASkAaC\
INNwNoIAMgASkAcCIONwNwIAMgASkAeCIPNwN4IAAgCCALIAogCyAPIAggByANIAsgBiAIIAkgCSAK\
IA4gDyAIIAggBiAPIAogDiALIAcgDSAPIAcgCyAGIA0gDSAMIAcgBiAAQThqIgEpAwAiECAAKQMYIh\
F8fCISQvnC+JuRo7Pw2wCFQiCJIhNC8e30+KWn/aelf3wiFCAQhUIoiSIVIBJ8fCIWIBOFQjCJIhcg\
FHwiGCAVhUIBiSIZIABBMGoiBCkDACIaIAApAxAiG3wgAykDICISfCITIAKFQuv6htq/tfbBH4VCII\
kiHEKr8NP0r+68tzx8Ih0gGoVCKIkiHiATfCADKQMoIgJ8Ih98fCIgIABBKGoiBSkDACIhIAApAwgi\
InwgAykDECITfCIUQp/Y+dnCkdqCm3+FQiCJIhVCu86qptjQ67O7f3wiIyAhhUIoiSIkIBR8IAMpAx\
giFHwiJSAVhUIwiSImhUIgiSInIAApA0AgACkDICIoIAApAwAiKXwgAykDACIVfCIqhULRhZrv+s+U\
h9EAhUIgiSIrQoiS853/zPmE6gB8IiwgKIVCKIkiLSAqfCADKQMIIip8Ii4gK4VCMIkiKyAsfCIsfC\
IvIBmFQiiJIhkgIHx8IiAgJ4VCMIkiJyAvfCIvIBmFQgGJIhkgDyAOIBYgLCAthUIBiSIsfHwiFiAf\
IByFQjCJIhyFQiCJIh8gJiAjfCIjfCImICyFQiiJIiwgFnx8IhZ8fCItIAkgCCAjICSFQgGJIiMgLn\
x8IiQgF4VCIIkiFyAcIB18Ihx8Ih0gI4VCKIkiIyAkfHwiJCAXhUIwiSIXhUIgiSIuIAsgCiAcIB6F\
QgGJIhwgJXx8Ih4gK4VCIIkiJSAYfCIYIByFQiiJIhwgHnx8Ih4gJYVCMIkiJSAYfCIYfCIrIBmFQi\
iJIhkgLXx8Ii0gLoVCMIkiLiArfCIrIBmFQgGJIhkgDyAJICAgGCAchUIBiSIYfHwiHCAWIB+FQjCJ\
IhaFQiCJIh8gFyAdfCIXfCIdIBiFQiiJIhggHHx8Ihx8fCIgIAggHiAXICOFQgGJIhd8IBJ8Ih4gJ4\
VCIIkiIyAWICZ8IhZ8IiYgF4VCKIkiFyAefHwiHiAjhUIwiSIjhUIgiSInIAogDiAWICyFQgGJIhYg\
JHx8IiQgJYVCIIkiJSAvfCIsIBaFQiiJIhYgJHx8IiQgJYVCMIkiJSAsfCIsfCIvIBmFQiiJIhkgIH\
x8IiAgJ4VCMIkiJyAvfCIvIBmFQgGJIhkgLSAsIBaFQgGJIhZ8IAJ8IiwgHCAfhUIwiSIchUIgiSIf\
ICMgJnwiI3wiJiAWhUIoiSIWICx8IBR8Iix8fCItIAwgIyAXhUIBiSIXICR8ICp8IiMgLoVCIIkiJC\
AcIB18Ihx8Ih0gF4VCKIkiFyAjfHwiIyAkhUIwiSIkhUIgiSIuIBwgGIVCAYkiGCAefCAVfCIcICWF\
QiCJIh4gK3wiJSAYhUIoiSIYIBx8IBN8IhwgHoVCMIkiHiAlfCIlfCIrIBmFQiiJIhkgLXx8Ii0gLo\
VCMIkiLiArfCIrIBmFQgGJIhkgICAlIBiFQgGJIhh8IAJ8IiAgLCAfhUIwiSIfhUIgiSIlICQgHXwi\
HXwiJCAYhUIoiSIYICB8IBN8IiB8fCIsIAwgHCAdIBeFQgGJIhd8fCIcICeFQiCJIh0gHyAmfCIffC\
ImIBeFQiiJIhcgHHwgFXwiHCAdhUIwiSIdhUIgiSInIAggCyAfIBaFQgGJIhYgI3x8Ih8gHoVCIIki\
HiAvfCIjIBaFQiiJIhYgH3x8Ih8gHoVCMIkiHiAjfCIjfCIvIBmFQiiJIhkgLHwgKnwiLCAnhUIwiS\
InIC98Ii8gGYVCAYkiGSAJIC0gIyAWhUIBiSIWfHwiIyAgICWFQjCJIiCFQiCJIiUgHSAmfCIdfCIm\
IBaFQiiJIhYgI3wgEnwiI3x8Ii0gDiAKIB0gF4VCAYkiFyAffHwiHSAuhUIgiSIfICAgJHwiIHwiJC\
AXhUIoiSIXIB18fCIdIB+FQjCJIh+FQiCJIi4gBiAgIBiFQgGJIhggHHwgFHwiHCAehUIgiSIeICt8\
IiAgGIVCKIkiGCAcfHwiHCAehUIwiSIeICB8IiB8IisgGYVCKIkiGSAtfHwiLSAuhUIwiSIuICt8Ii\
sgGYVCAYkiGSAMIA0gLCAgIBiFQgGJIhh8fCIgICMgJYVCMIkiI4VCIIkiJSAfICR8Ih98IiQgGIVC\
KIkiGCAgfHwiIHwgEnwiLCAcIB8gF4VCAYkiF3wgFHwiHCAnhUIgiSIfICMgJnwiI3wiJiAXhUIoiS\
IXIBx8ICp8IhwgH4VCMIkiH4VCIIkiJyAJIAcgIyAWhUIBiSIWIB18fCIdIB6FQiCJIh4gL3wiIyAW\
hUIoiSIWIB18fCIdIB6FQjCJIh4gI3wiI3wiLyAZhUIoiSIZICx8IBV8IiwgJ4VCMIkiJyAvfCIvIB\
mFQgGJIhkgCCAPIC0gIyAWhUIBiSIWfHwiIyAgICWFQjCJIiCFQiCJIiUgHyAmfCIffCImIBaFQiiJ\
IhYgI3x8IiN8fCItIAYgHyAXhUIBiSIXIB18IBN8Ih0gLoVCIIkiHyAgICR8IiB8IiQgF4VCKIkiFy\
AdfHwiHSAfhUIwiSIfhUIgiSIuIAogICAYhUIBiSIYIBx8IAJ8IhwgHoVCIIkiHiArfCIgIBiFQiiJ\
IhggHHx8IhwgHoVCMIkiHiAgfCIgfCIrIBmFQiiJIhkgLXx8Ii0gLoVCMIkiLiArfCIrIBmFQgGJIh\
kgLCAgIBiFQgGJIhh8IBN8IiAgIyAlhUIwiSIjhUIgiSIlIB8gJHwiH3wiJCAYhUIoiSIYICB8IBJ8\
IiB8fCIsIAcgHCAfIBeFQgGJIhd8IAJ8IhwgJ4VCIIkiHyAjICZ8IiN8IiYgF4VCKIkiFyAcfHwiHC\
AfhUIwiSIfhUIgiSInIAkgIyAWhUIBiSIWIB18fCIdIB6FQiCJIh4gL3wiIyAWhUIoiSIWIB18IBV8\
Ih0gHoVCMIkiHiAjfCIjfCIvIBmFQiiJIhkgLHx8IiwgJ4VCMIkiJyAvfCIvIBmFQgGJIhkgDSAtIC\
MgFoVCAYkiFnwgFHwiIyAgICWFQjCJIiCFQiCJIiUgHyAmfCIffCImIBaFQiiJIhYgI3x8IiN8fCIt\
IA4gHyAXhUIBiSIXIB18fCIdIC6FQiCJIh8gICAkfCIgfCIkIBeFQiiJIhcgHXwgKnwiHSAfhUIwiS\
IfhUIgiSIuIAwgCyAgIBiFQgGJIhggHHx8IhwgHoVCIIkiHiArfCIgIBiFQiiJIhggHHx8IhwgHoVC\
MIkiHiAgfCIgfCIrIBmFQiiJIhkgLXwgFHwiLSAuhUIwiSIuICt8IisgGYVCAYkiGSALICwgICAYhU\
IBiSIYfCAVfCIgICMgJYVCMIkiI4VCIIkiJSAfICR8Ih98IiQgGIVCKIkiGCAgfHwiIHx8IiwgCiAG\
IBwgHyAXhUIBiSIXfHwiHCAnhUIgiSIfICMgJnwiI3wiJiAXhUIoiSIXIBx8fCIcIB+FQjCJIh+FQi\
CJIicgDCAjIBaFQgGJIhYgHXwgE3wiHSAehUIgiSIeIC98IiMgFoVCKIkiFiAdfHwiHSAehUIwiSIe\
ICN8IiN8Ii8gGYVCKIkiGSAsfHwiLCAnhUIwiSInIC98Ii8gGYVCAYkiGSAJIC0gIyAWhUIBiSIWfC\
AqfCIjICAgJYVCMIkiIIVCIIkiJSAfICZ8Ih98IiYgFoVCKIkiFiAjfHwiI3wgEnwiLSANIB8gF4VC\
AYkiFyAdfCASfCIdIC6FQiCJIh8gICAkfCIgfCIkIBeFQiiJIhcgHXx8Ih0gH4VCMIkiH4VCIIkiLi\
AHICAgGIVCAYkiGCAcfHwiHCAehUIgiSIeICt8IiAgGIVCKIkiGCAcfCACfCIcIB6FQjCJIh4gIHwi\
IHwiKyAZhUIoiSIZIC18fCItIC6FQjCJIi4gK3wiKyAZhUIBiSIZIA0gDiAsICAgGIVCAYkiGHx8Ii\
AgIyAlhUIwiSIjhUIgiSIlIB8gJHwiH3wiJCAYhUIoiSIYICB8fCIgfHwiLCAPIBwgHyAXhUIBiSIX\
fCAqfCIcICeFQiCJIh8gIyAmfCIjfCImIBeFQiiJIhcgHHx8IhwgH4VCMIkiH4VCIIkiJyAMICMgFo\
VCAYkiFiAdfHwiHSAehUIgiSIeIC98IiMgFoVCKIkiFiAdfCACfCIdIB6FQjCJIh4gI3wiI3wiLyAZ\
hUIoiSIZICx8IBN8IiwgJ4VCMIkiJyAvfCIvIBmFQgGJIhkgCyAIIC0gIyAWhUIBiSIWfHwiIyAgIC\
WFQjCJIiCFQiCJIiUgHyAmfCIffCImIBaFQiiJIhYgI3x8IiN8IBR8Ii0gByAfIBeFQgGJIhcgHXwg\
FXwiHSAuhUIgiSIfICAgJHwiIHwiJCAXhUIoiSIXIB18fCIdIB+FQjCJIh+FQiCJIi4gBiAgIBiFQg\
GJIhggHHx8IhwgHoVCIIkiHiArfCIgIBiFQiiJIhggHHwgFHwiHCAehUIwiSIeICB8IiB8IisgGYVC\
KIkiGSAtfHwiLSAuhUIwiSIuICt8IisgGYVCAYkiGSAMICwgICAYhUIBiSIYfHwiICAjICWFQjCJIi\
OFQiCJIiUgHyAkfCIffCIkIBiFQiiJIhggIHwgKnwiIHx8IiwgDiAHIBwgHyAXhUIBiSIXfHwiHCAn\
hUIgiSIfICMgJnwiI3wiJiAXhUIoiSIXIBx8fCIcIB+FQjCJIh+FQiCJIicgCyANICMgFoVCAYkiFi\
AdfHwiHSAehUIgiSIeIC98IiMgFoVCKIkiFiAdfHwiHSAehUIwiSIeICN8IiN8Ii8gGYVCKIkiGSAs\
fHwiLCAPICAgJYVCMIkiICAkfCIkIBiFQgGJIhggHHx8IhwgHoVCIIkiHiArfCIlIBiFQiiJIhggHH\
wgEnwiHCAehUIwiSIeICV8IiUgGIVCAYkiGHx8IisgCiAtICMgFoVCAYkiFnwgE3wiIyAghUIgiSIg\
IB8gJnwiH3wiJiAWhUIoiSIWICN8fCIjICCFQjCJIiCFQiCJIi0gHyAXhUIBiSIXIB18IAJ8Ih0gLo\
VCIIkiHyAkfCIkIBeFQiiJIhcgHXwgFXwiHSAfhUIwiSIfICR8IiR8Ii4gGIVCKIkiGCArfCAUfCIr\
IC2FQjCJIi0gLnwiLiAYhUIBiSIYIAkgDiAcICQgF4VCAYkiF3x8IhwgLCAnhUIwiSIkhUIgiSInIC\
AgJnwiIHwiJiAXhUIoiSIXIBx8fCIcfHwiLCAPIAYgICAWhUIBiSIWIB18fCIdIB6FQiCJIh4gJCAv\
fCIgfCIkIBaFQiiJIhYgHXx8Ih0gHoVCMIkiHoVCIIkiLyAIICAgGYVCAYkiGSAjfCAVfCIgIB+FQi\
CJIh8gJXwiIyAZhUIoiSIZICB8fCIgIB+FQjCJIh8gI3wiI3wiJSAYhUIoiSIYICx8fCIsIAwgHCAn\
hUIwiSIcICZ8IiYgF4VCAYkiFyAdfHwiHSAfhUIgiSIfIC58IicgF4VCKIkiFyAdfCATfCIdIB+FQj\
CJIh8gJ3wiJyAXhUIBiSIXfHwiLiAjIBmFQgGJIhkgK3wgKnwiIyAchUIgiSIcIB4gJHwiHnwiJCAZ\
hUIoiSIZICN8IBJ8IiMgHIVCMIkiHIVCIIkiKyAKICAgHiAWhUIBiSIWfHwiHiAthUIgiSIgICZ8Ii\
YgFoVCKIkiFiAefCACfCIeICCFQjCJIiAgJnwiJnwiLSAXhUIoiSIXIC58IBJ8Ii4gK4VCMIkiKyAt\
fCItIBeFQgGJIhcgCiAmIBaFQgGJIhYgHXx8Ih0gLCAvhUIwiSImhUIgiSIsIBwgJHwiHHwiJCAWhU\
IoiSIWIB18IBN8Ih18fCIvIBwgGYVCAYkiGSAefCAqfCIcIB+FQiCJIh4gJiAlfCIffCIlIBmFQiiJ\
IhkgHHwgAnwiHCAehUIwiSIehUIgiSImIAYgByAjIB8gGIVCAYkiGHx8Ih8gIIVCIIkiICAnfCIjIB\
iFQiiJIhggH3x8Ih8gIIVCMIkiICAjfCIjfCInIBeFQiiJIhcgL3x8Ii8gJoVCMIkiJiAnfCInIBeF\
QgGJIhcgE3wgDiAJICMgGIVCAYkiGCAufHwiIyAdICyFQjCJIh2FQiCJIiwgHiAlfCIefCIlIBiFQi\
iJIhggI3x8IiN8Ii4gFHwgDSAcIB0gJHwiHSAWhUIBiSIWfHwiHCAghUIgiSIgIC18IiQgFoVCKIki\
FiAcfCAVfCIcICCFQjCJIiAgJHwiJCAMIB4gGYVCAYkiGSAffCAUfCIeICuFQiCJIh8gHXwiHSAZhU\
IoiSIZIB58fCIeIB+FQjCJIh8gLoVCIIkiK3wiLSAXhUIoiSIXfCIufCAjICyFQjCJIiMgJXwiJSAY\
hUIBiSIYIBJ8IB58Ih4gAnwgICAehUIgiSIeICd8IiAgGIVCKIkiGHwiJyAehUIwiSIeICB8IiAgGI\
VCAYkiGHwiLHwgLyAVfCAkIBaFQgGJIhZ8IiQgKnwgJCAjhUIgiSIjIB8gHXwiHXwiHyAWhUIoiSIW\
fCIkICOFQjCJIiMgLIVCIIkiLCAHIBwgBnwgHSAZhUIBiSIZfCIcfCAcICaFQiCJIhwgJXwiHSAZhU\
IoiSIZfCIlIByFQjCJIhwgHXwiHXwiJiAYhUIoiSIYfCIvIBJ8IAkgCCAuICuFQjCJIhIgLXwiKyAX\
hUIBiSIXfCAkfCIkfCAkIByFQiCJIhwgIHwiICAXhUIoiSIXfCIkIByFQjCJIhwgIHwiICAXhUIBiS\
IXfCItfCAtIA0gJyAMfCAdIBmFQgGJIgh8Ihl8IBkgEoVCIIkiEiAjIB98Ihl8Ih0gCIVCKIkiCHwi\
HyAShUIwiSIShUIgiSIjIA8gJSAOfCAZIBaFQgGJIhZ8Ihl8IBkgHoVCIIkiGSArfCIeIBaFQiiJIh\
Z8IiUgGYVCMIkiGSAefCIefCInIBeFQiiJIhd8IisgFXwgDyAfIAl8IC8gLIVCMIkiCSAmfCIVIBiF\
QgGJIhh8Ih98IBkgH4VCIIkiDyAgfCIZIBiFQiiJIhh8Ih8gD4VCMIkiDyAZfCIZIBiFQgGJIhh8Ii\
AgE3wgCiAkIA58IB4gFoVCAYkiDnwiE3wgEyAJhUIgiSIJIBIgHXwiCnwiEiAOhUIoiSIOfCITIAmF\
QjCJIgkgIIVCIIkiFiAGICUgDXwgCiAIhUIBiSIIfCIKfCAKIByFQiCJIgYgFXwiCiAIhUIoiSIIfC\
INIAaFQjCJIgYgCnwiCnwiFSAYhUIoiSIYfCIcICKFIA0gAnwgCSASfCIJIA6FQgGJIg18Ig4gFHwg\
DiAPhUIgiSIOICsgI4VCMIkiDyAnfCISfCICIA2FQiiJIg18IhQgDoVCMIkiDiACfCIChTcDCCAAIC\
kgDCAqIBIgF4VCAYkiEnwgE3wiE3wgEyAGhUIgiSIGIBl8IgwgEoVCKIkiEnwiE4UgByAfIAt8IAog\
CIVCAYkiCHwiCnwgCiAPhUIgiSIHIAl8IgkgCIVCKIkiCHwiCiAHhUIwiSIHIAl8IgmFNwMAIAEgEC\
ATIAaFQjCJIgaFIAkgCIVCAYmFNwMAIAAgKCAcIBaFQjCJIgiFIAIgDYVCAYmFNwMgIAAgESAIIBV8\
IgiFIBSFNwMYIAAgGyAGIAx8IgaFIAqFNwMQIAQgGiAIIBiFQgGJhSAOhTcDACAFICEgBiAShUIBiY\
UgB4U3AwAgA0GAAWokAAu1LQEgfyMAQcAAayICQRhqIgNCADcDACACQSBqIgRCADcDACACQThqIgVC\
ADcDACACQTBqIgZCADcDACACQShqIgdCADcDACACQQhqIgggASkACDcDACACQRBqIgkgASkAEDcDAC\
ADIAEoABgiCjYCACAEIAEoACAiAzYCACACIAEpAAA3AwAgAiABKAAcIgQ2AhwgAiABKAAkIgs2AiQg\
ByABKAAoIgw2AgAgAiABKAAsIgc2AiwgBiABKAAwIg02AgAgAiABKAA0IgY2AjQgBSABKAA4Ig42Ag\
AgAiABKAA8IgE2AjwgACAHIAwgAigCFCIFIAUgBiAMIAUgBCALIAMgCyAKIAQgByAKIAIoAgQiDyAA\
KAIQIhBqIAAoAggiEUEKdyISIAAoAgQiE3MgESATcyAAKAIMIhRzIAAoAgAiFWogAigCACIWakELdy\
AQaiIXc2pBDncgFGoiGEEKdyIZaiAJKAIAIgkgE0EKdyIaaiAIKAIAIgggFGogFyAacyAYc2pBD3cg\
EmoiGyAZcyACKAIMIgIgEmogGCAXQQp3IhdzIBtzakEMdyAaaiIYc2pBBXcgF2oiHCAYQQp3Ih1zIA\
UgF2ogGCAbQQp3IhdzIBxzakEIdyAZaiIYc2pBB3cgF2oiGUEKdyIbaiALIBxBCnciHGogFyAEaiAY\
IBxzIBlzakEJdyAdaiIXIBtzIB0gA2ogGSAYQQp3IhhzIBdzakELdyAcaiIZc2pBDXcgGGoiHCAZQQ\
p3Ih1zIBggDGogGSAXQQp3IhdzIBxzakEOdyAbaiIYc2pBD3cgF2oiGUEKdyIbaiAdIAZqIBkgGEEK\
dyIecyAXIA1qIBggHEEKdyIXcyAZc2pBBncgHWoiGHNqQQd3IBdqIhlBCnciHCAeIAFqIBkgGEEKdy\
IdcyAXIA5qIBggG3MgGXNqQQl3IB5qIhlzakEIdyAbaiIXQX9zcWogFyAZcWpBmfOJ1AVqQQd3IB1q\
IhhBCnciG2ogBiAcaiAXQQp3Ih4gCSAdaiAZQQp3IhkgGEF/c3FqIBggF3FqQZnzidQFakEGdyAcai\
IXQX9zcWogFyAYcWpBmfOJ1AVqQQh3IBlqIhhBCnciHCAMIB5qIBdBCnciHSAPIBlqIBsgGEF/c3Fq\
IBggF3FqQZnzidQFakENdyAeaiIXQX9zcWogFyAYcWpBmfOJ1AVqQQt3IBtqIhhBf3NxaiAYIBdxak\
GZ84nUBWpBCXcgHWoiGUEKdyIbaiACIBxqIBhBCnciHiABIB1qIBdBCnciHSAZQX9zcWogGSAYcWpB\
mfOJ1AVqQQd3IBxqIhdBf3NxaiAXIBlxakGZ84nUBWpBD3cgHWoiGEEKdyIcIBYgHmogF0EKdyIfIA\
0gHWogGyAYQX9zcWogGCAXcWpBmfOJ1AVqQQd3IB5qIhdBf3NxaiAXIBhxakGZ84nUBWpBDHcgG2oi\
GEF/c3FqIBggF3FqQZnzidQFakEPdyAfaiIZQQp3IhtqIAggHGogGEEKdyIdIAUgH2ogF0EKdyIeIB\
lBf3NxaiAZIBhxakGZ84nUBWpBCXcgHGoiF0F/c3FqIBcgGXFqQZnzidQFakELdyAeaiIYQQp3Ihkg\
ByAdaiAXQQp3IhwgDiAeaiAbIBhBf3NxaiAYIBdxakGZ84nUBWpBB3cgHWoiF0F/c3FqIBcgGHFqQZ\
nzidQFakENdyAbaiIYQX9zIh5xaiAYIBdxakGZ84nUBWpBDHcgHGoiG0EKdyIdaiAJIBhBCnciGGog\
DiAXQQp3IhdqIAwgGWogAiAcaiAbIB5yIBdzakGh1+f2BmpBC3cgGWoiGSAbQX9zciAYc2pBodfn9g\
ZqQQ13IBdqIhcgGUF/c3IgHXNqQaHX5/YGakEGdyAYaiIYIBdBf3NyIBlBCnciGXNqQaHX5/YGakEH\
dyAdaiIbIBhBf3NyIBdBCnciF3NqQaHX5/YGakEOdyAZaiIcQQp3Ih1qIAggG0EKdyIeaiAPIBhBCn\
ciGGogAyAXaiABIBlqIBwgG0F/c3IgGHNqQaHX5/YGakEJdyAXaiIXIBxBf3NyIB5zakGh1+f2BmpB\
DXcgGGoiGCAXQX9zciAdc2pBodfn9gZqQQ93IB5qIhkgGEF/c3IgF0EKdyIXc2pBodfn9gZqQQ53IB\
1qIhsgGUF/c3IgGEEKdyIYc2pBodfn9gZqQQh3IBdqIhxBCnciHWogByAbQQp3Ih5qIAYgGUEKdyIZ\
aiAKIBhqIBYgF2ogHCAbQX9zciAZc2pBodfn9gZqQQ13IBhqIhcgHEF/c3IgHnNqQaHX5/YGakEGdy\
AZaiIYIBdBf3NyIB1zakGh1+f2BmpBBXcgHmoiGSAYQX9zciAXQQp3IhtzakGh1+f2BmpBDHcgHWoi\
HCAZQX9zciAYQQp3IhhzakGh1+f2BmpBB3cgG2oiHUEKdyIXaiALIBlBCnciGWogDSAbaiAdIBxBf3\
NyIBlzakGh1+f2BmpBBXcgGGoiGyAXQX9zcWogDyAYaiAdIBxBCnciGEF/c3FqIBsgGHFqQdz57vh4\
akELdyAZaiIcIBdxakHc+e74eGpBDHcgGGoiHSAcQQp3IhlBf3NxaiAHIBhqIBwgG0EKdyIYQX9zcW\
ogHSAYcWpB3Pnu+HhqQQ53IBdqIhwgGXFqQdz57vh4akEPdyAYaiIeQQp3IhdqIA0gHUEKdyIbaiAW\
IBhqIBwgG0F/c3FqIB4gG3FqQdz57vh4akEOdyAZaiIdIBdBf3NxaiADIBlqIB4gHEEKdyIYQX9zcW\
ogHSAYcWpB3Pnu+HhqQQ93IBtqIhsgF3FqQdz57vh4akEJdyAYaiIcIBtBCnciGUF/c3FqIAkgGGog\
GyAdQQp3IhhBf3NxaiAcIBhxakHc+e74eGpBCHcgF2oiHSAZcWpB3Pnu+HhqQQl3IBhqIh5BCnciF2\
ogASAcQQp3IhtqIAIgGGogHSAbQX9zcWogHiAbcWpB3Pnu+HhqQQ53IBlqIhwgF0F/c3FqIAQgGWog\
HiAdQQp3IhhBf3NxaiAcIBhxakHc+e74eGpBBXcgG2oiGyAXcWpB3Pnu+HhqQQZ3IBhqIh0gG0EKdy\
IZQX9zcWogDiAYaiAbIBxBCnciGEF/c3FqIB0gGHFqQdz57vh4akEIdyAXaiIcIBlxakHc+e74eGpB\
BncgGGoiHkEKdyIfaiAWIBxBCnciF2ogCSAdQQp3IhtqIAggGWogHiAXQX9zcWogCiAYaiAcIBtBf3\
NxaiAeIBtxakHc+e74eGpBBXcgGWoiGCAXcWpB3Pnu+HhqQQx3IBtqIhkgGCAfQX9zcnNqQc76z8p6\
akEJdyAXaiIXIBkgGEEKdyIYQX9zcnNqQc76z8p6akEPdyAfaiIbIBcgGUEKdyIZQX9zcnNqQc76z8\
p6akEFdyAYaiIcQQp3Ih1qIAggG0EKdyIeaiANIBdBCnciF2ogBCAZaiALIBhqIBwgGyAXQX9zcnNq\
Qc76z8p6akELdyAZaiIYIBwgHkF/c3JzakHO+s/KempBBncgF2oiFyAYIB1Bf3Nyc2pBzvrPynpqQQ\
h3IB5qIhkgFyAYQQp3IhhBf3Nyc2pBzvrPynpqQQ13IB1qIhsgGSAXQQp3IhdBf3Nyc2pBzvrPynpq\
QQx3IBhqIhxBCnciHWogAyAbQQp3Ih5qIAIgGUEKdyIZaiAPIBdqIA4gGGogHCAbIBlBf3Nyc2pBzv\
rPynpqQQV3IBdqIhcgHCAeQX9zcnNqQc76z8p6akEMdyAZaiIYIBcgHUF/c3JzakHO+s/KempBDXcg\
HmoiGSAYIBdBCnciF0F/c3JzakHO+s/KempBDncgHWoiGyAZIBhBCnciGEF/c3JzakHO+s/KempBC3\
cgF2oiHEEKdyIgIAAoAgxqIA4gAyABIAsgFiAJIBYgByACIA8gASAWIA0gASAIIBUgESAUQX9zciAT\
c2ogBWpB5peKhQVqQQh3IBBqIh1BCnciHmogGiALaiASIBZqIBQgBGogDiAQIB0gEyASQX9zcnNqak\
Hml4qFBWpBCXcgFGoiFCAdIBpBf3Nyc2pB5peKhQVqQQl3IBJqIhIgFCAeQX9zcnNqQeaXioUFakEL\
dyAaaiIaIBIgFEEKdyIUQX9zcnNqQeaXioUFakENdyAeaiIQIBogEkEKdyISQX9zcnNqQeaXioUFak\
EPdyAUaiIdQQp3Ih5qIAogEEEKdyIfaiAGIBpBCnciGmogCSASaiAHIBRqIB0gECAaQX9zcnNqQeaX\
ioUFakEPdyASaiISIB0gH0F/c3JzakHml4qFBWpBBXcgGmoiFCASIB5Bf3Nyc2pB5peKhQVqQQd3IB\
9qIhogFCASQQp3IhJBf3Nyc2pB5peKhQVqQQd3IB5qIhAgGiAUQQp3IhRBf3Nyc2pB5peKhQVqQQh3\
IBJqIh1BCnciHmogAiAQQQp3Ih9qIAwgGkEKdyIaaiAPIBRqIAMgEmogHSAQIBpBf3Nyc2pB5peKhQ\
VqQQt3IBRqIhIgHSAfQX9zcnNqQeaXioUFakEOdyAaaiIUIBIgHkF/c3JzakHml4qFBWpBDncgH2oi\
GiAUIBJBCnciEEF/c3JzakHml4qFBWpBDHcgHmoiHSAaIBRBCnciHkF/c3JzakHml4qFBWpBBncgEG\
oiH0EKdyISaiACIBpBCnciFGogCiAQaiAdIBRBf3NxaiAfIBRxakGkorfiBWpBCXcgHmoiECASQX9z\
cWogByAeaiAfIB1BCnciGkF/c3FqIBAgGnFqQaSit+IFakENdyAUaiIdIBJxakGkorfiBWpBD3cgGm\
oiHiAdQQp3IhRBf3NxaiAEIBpqIB0gEEEKdyIaQX9zcWogHiAacWpBpKK34gVqQQd3IBJqIh0gFHFq\
QaSit+IFakEMdyAaaiIfQQp3IhJqIAwgHkEKdyIQaiAGIBpqIB0gEEF/c3FqIB8gEHFqQaSit+IFak\
EIdyAUaiIeIBJBf3NxaiAFIBRqIB8gHUEKdyIUQX9zcWogHiAUcWpBpKK34gVqQQl3IBBqIhAgEnFq\
QaSit+IFakELdyAUaiIdIBBBCnciGkF/c3FqIA4gFGogECAeQQp3IhRBf3NxaiAdIBRxakGkorfiBW\
pBB3cgEmoiHiAacWpBpKK34gVqQQd3IBRqIh9BCnciEmogCSAdQQp3IhBqIAMgFGogHiAQQX9zcWog\
HyAQcWpBpKK34gVqQQx3IBpqIh0gEkF/c3FqIA0gGmogHyAeQQp3IhRBf3NxaiAdIBRxakGkorfiBW\
pBB3cgEGoiECAScWpBpKK34gVqQQZ3IBRqIh4gEEEKdyIaQX9zcWogCyAUaiAQIB1BCnciFEF/c3Fq\
IB4gFHFqQaSit+IFakEPdyASaiIQIBpxakGkorfiBWpBDXcgFGoiHUEKdyIfaiAPIBBBCnciIWogBS\
AeQQp3IhJqIAEgGmogCCAUaiAQIBJBf3NxaiAdIBJxakGkorfiBWpBC3cgGmoiFCAdQX9zciAhc2pB\
8/3A6wZqQQl3IBJqIhIgFEF/c3IgH3NqQfP9wOsGakEHdyAhaiIaIBJBf3NyIBRBCnciFHNqQfP9wO\
sGakEPdyAfaiIQIBpBf3NyIBJBCnciEnNqQfP9wOsGakELdyAUaiIdQQp3Ih5qIAsgEEEKdyIfaiAK\
IBpBCnciGmogDiASaiAEIBRqIB0gEEF/c3IgGnNqQfP9wOsGakEIdyASaiISIB1Bf3NyIB9zakHz/c\
DrBmpBBncgGmoiFCASQX9zciAec2pB8/3A6wZqQQZ3IB9qIhogFEF/c3IgEkEKdyISc2pB8/3A6wZq\
QQ53IB5qIhAgGkF/c3IgFEEKdyIUc2pB8/3A6wZqQQx3IBJqIh1BCnciHmogDCAQQQp3Ih9qIAggGk\
EKdyIaaiANIBRqIAMgEmogHSAQQX9zciAac2pB8/3A6wZqQQ13IBRqIhIgHUF/c3IgH3NqQfP9wOsG\
akEFdyAaaiIUIBJBf3NyIB5zakHz/cDrBmpBDncgH2oiGiAUQX9zciASQQp3IhJzakHz/cDrBmpBDX\
cgHmoiECAaQX9zciAUQQp3IhRzakHz/cDrBmpBDXcgEmoiHUEKdyIeaiAGIBRqIAkgEmogHSAQQX9z\
ciAaQQp3IhpzakHz/cDrBmpBB3cgFGoiFCAdQX9zciAQQQp3IhBzakHz/cDrBmpBBXcgGmoiEkEKdy\
IdIAogEGogFEEKdyIfIAMgGmogHiASQX9zcWogEiAUcWpB6e210wdqQQ93IBBqIhRBf3NxaiAUIBJx\
akHp7bXTB2pBBXcgHmoiEkF/c3FqIBIgFHFqQenttdMHakEIdyAfaiIaQQp3IhBqIAIgHWogEkEKdy\
IeIA8gH2ogFEEKdyIfIBpBf3NxaiAaIBJxakHp7bXTB2pBC3cgHWoiEkF/c3FqIBIgGnFqQenttdMH\
akEOdyAfaiIUQQp3Ih0gASAeaiASQQp3IiEgByAfaiAQIBRBf3NxaiAUIBJxakHp7bXTB2pBDncgHm\
oiEkF/c3FqIBIgFHFqQenttdMHakEGdyAQaiIUQX9zcWogFCAScWpB6e210wdqQQ53ICFqIhpBCnci\
EGogDSAdaiAUQQp3Ih4gBSAhaiASQQp3Ih8gGkF/c3FqIBogFHFqQenttdMHakEGdyAdaiISQX9zcW\
ogEiAacWpB6e210wdqQQl3IB9qIhRBCnciHSAGIB5qIBJBCnciISAIIB9qIBAgFEF/c3FqIBQgEnFq\
QenttdMHakEMdyAeaiISQX9zcWogEiAUcWpB6e210wdqQQl3IBBqIhRBf3NxaiAUIBJxakHp7bXTB2\
pBDHcgIWoiGkEKdyIQaiAOIBJBCnciHmogECAMIB1qIBRBCnciHyAEICFqIB4gGkF/c3FqIBogFHFq\
QenttdMHakEFdyAdaiISQX9zcWogEiAacWpB6e210wdqQQ93IB5qIhRBf3NxaiAUIBJxakHp7bXTB2\
pBCHcgH2oiGiAUQQp3Ih1zIB8gDWogFCASQQp3Ig1zIBpzakEIdyAQaiISc2pBBXcgDWoiFEEKdyIQ\
aiAaQQp3IgMgD2ogDSAMaiASIANzIBRzakEMdyAdaiIMIBBzIB0gCWogFCASQQp3Ig1zIAxzakEJdy\
ADaiIDc2pBDHcgDWoiDyADQQp3IglzIA0gBWogAyAMQQp3IgxzIA9zakEFdyAQaiIDc2pBDncgDGoi\
DUEKdyIFaiAPQQp3Ig4gCGogDCAEaiADIA5zIA1zakEGdyAJaiIEIAVzIAkgCmogDSADQQp3IgNzIA\
RzakEIdyAOaiIMc2pBDXcgA2oiDSAMQQp3Ig5zIAMgBmogDCAEQQp3IgNzIA1zakEGdyAFaiIEc2pB\
BXcgA2oiDEEKdyIFajYCCCAAIBEgCiAXaiAcIBsgGUEKdyIKQX9zcnNqQc76z8p6akEIdyAYaiIPQQ\
p3aiADIBZqIAQgDUEKdyIDcyAMc2pBD3cgDmoiDUEKdyIWajYCBCAAIBMgASAYaiAPIBwgG0EKdyIB\
QX9zcnNqQc76z8p6akEFdyAKaiIJaiAOIAJqIAwgBEEKdyICcyANc2pBDXcgA2oiBEEKd2o2AgAgAC\
gCECEMIAAgASAVaiAGIApqIAkgDyAgQX9zcnNqQc76z8p6akEGd2ogAyALaiANIAVzIARzakELdyAC\
aiIKajYCECAAIAEgDGogBWogAiAHaiAEIBZzIApzakELd2o2AgwLhCgCMH8BfiMAQcAAayIDQRhqIg\
RCADcDACADQSBqIgVCADcDACADQThqIgZCADcDACADQTBqIgdCADcDACADQShqIghCADcDACADQQhq\
IgkgASkACDcDACADQRBqIgogASkAEDcDACAEIAEoABgiCzYCACAFIAEoACAiBDYCACADIAEpAAA3Aw\
AgAyABKAAcIgU2AhwgAyABKAAkIgw2AiQgCCABKAAoIg02AgAgAyABKAAsIgg2AiwgByABKAAwIg42\
AgAgAyABKAA0Igc2AjQgBiABKAA4Ig82AgAgAyABKAA8IgE2AjwgACAIIAEgBCAFIAcgCCALIAQgDC\
AMIA0gDyABIAQgBCALIAEgDSAPIAggBSAHIAEgBSAIIAsgByAHIA4gBSALIABBJGoiECgCACIRIABB\
FGoiEigCACITamoiBkGZmoPfBXNBEHciFEG66r+qemoiFSARc0EUdyIWIAZqaiIXIBRzQRh3IhggFW\
oiGSAWc0EZdyIaIABBIGoiGygCACIVIABBEGoiHCgCACIdaiAKKAIAIgZqIgogAnNBq7OP/AFzQRB3\
Ih5B8ua74wNqIh8gFXNBFHciICAKaiADKAIUIgJqIiFqaiIiIABBHGoiIygCACIWIABBDGoiJCgCAC\
IlaiAJKAIAIglqIgogACkDACIzQiCIp3NBjNGV2HlzQRB3IhRBhd2e23tqIiYgFnNBFHciJyAKaiAD\
KAIMIgpqIiggFHNBGHciKXNBEHciKiAAQRhqIisoAgAiLCAAKAIIIi1qIAMoAgAiFGoiLiAzp3NB/6\
S5iAVzQRB3Ii9B58yn0AZqIjAgLHNBFHciMSAuaiADKAIEIgNqIi4gL3NBGHciLyAwaiIwaiIyIBpz\
QRR3IhogImpqIiIgKnNBGHciKiAyaiIyIBpzQRl3IhogASAPIBcgMCAxc0EZdyIwamoiFyAhIB5zQR\
h3Ih5zQRB3IiEgKSAmaiImaiIpIDBzQRR3IjAgF2pqIhdqaiIxIAwgBCAmICdzQRl3IiYgLmpqIicg\
GHNBEHciGCAeIB9qIh5qIh8gJnNBFHciJiAnamoiJyAYc0EYdyIYc0EQdyIuIAggDSAeICBzQRl3Ih\
4gKGpqIiAgL3NBEHciKCAZaiIZIB5zQRR3Ih4gIGpqIiAgKHNBGHciKCAZaiIZaiIvIBpzQRR3Ihog\
MWpqIjEgLnNBGHciLiAvaiIvIBpzQRl3IhogASAMICIgGSAec0EZdyIZamoiHiAXICFzQRh3IhdzQR\
B3IiEgGCAfaiIYaiIfIBlzQRR3IhkgHmpqIh5qaiIiIAQgICAYICZzQRl3IhhqIAZqIiAgKnNBEHci\
JiAXIClqIhdqIikgGHNBFHciGCAgamoiICAmc0EYdyImc0EQdyIqIA0gDyAXIDBzQRl3IhcgJ2pqIi\
cgKHNBEHciKCAyaiIwIBdzQRR3IhcgJ2pqIicgKHNBGHciKCAwaiIwaiIyIBpzQRR3IhogImpqIiIg\
KnNBGHciKiAyaiIyIBpzQRl3IhogMSAwIBdzQRl3IhdqIAJqIjAgHiAhc0EYdyIec0EQdyIhICYgKW\
oiJmoiKSAXc0EUdyIXIDBqIApqIjBqaiIxIA4gJiAYc0EZdyIYICdqIANqIiYgLnNBEHciJyAeIB9q\
Ih5qIh8gGHNBFHciGCAmamoiJiAnc0EYdyInc0EQdyIuIB4gGXNBGXciGSAgaiAUaiIeIChzQRB3Ii\
AgL2oiKCAZc0EUdyIZIB5qIAlqIh4gIHNBGHciICAoaiIoaiIvIBpzQRR3IhogMWpqIjEgLnNBGHci\
LiAvaiIvIBpzQRl3IhogIiAoIBlzQRl3IhlqIAJqIiIgMCAhc0EYdyIhc0EQdyIoICcgH2oiH2oiJy\
AZc0EUdyIZICJqIAlqIiJqaiIwIA4gHiAfIBhzQRl3IhhqaiIeICpzQRB3Ih8gISApaiIhaiIpIBhz\
QRR3IhggHmogFGoiHiAfc0EYdyIfc0EQdyIqIAQgCCAhIBdzQRl3IhcgJmpqIiEgIHNBEHciICAyai\
ImIBdzQRR3IhcgIWpqIiEgIHNBGHciICAmaiImaiIyIBpzQRR3IhogMGogA2oiMCAqc0EYdyIqIDJq\
IjIgGnNBGXciGiAMIDEgJiAXc0EZdyIXamoiJiAiIChzQRh3IiJzQRB3IiggHyApaiIfaiIpIBdzQR\
R3IhcgJmogBmoiJmpqIjEgDyANIB8gGHNBGXciGCAhamoiHyAuc0EQdyIhICIgJ2oiImoiJyAYc0EU\
dyIYIB9qaiIfICFzQRh3IiFzQRB3Ii4gCyAiIBlzQRl3IhkgHmogCmoiHiAgc0EQdyIgIC9qIiIgGX\
NBFHciGSAeamoiHiAgc0EYdyIgICJqIiJqIi8gGnNBFHciGiAxamoiMSAuc0EYdyIuIC9qIi8gGnNB\
GXciGiAOIAcgMCAiIBlzQRl3IhlqaiIiICYgKHNBGHciJnNBEHciKCAhICdqIiFqIicgGXNBFHciGS\
AiamoiImogBmoiMCAeICEgGHNBGXciGGogCmoiHiAqc0EQdyIhICYgKWoiJmoiKSAYc0EUdyIYIB5q\
IANqIh4gIXNBGHciIXNBEHciKiAMIAUgJiAXc0EZdyIXIB9qaiIfICBzQRB3IiAgMmoiJiAXc0EUdy\
IXIB9qaiIfICBzQRh3IiAgJmoiJmoiMiAac0EUdyIaIDBqIBRqIjAgKnNBGHciKiAyaiIyIBpzQRl3\
IhogBCABIDEgJiAXc0EZdyIXamoiJiAiIChzQRh3IiJzQRB3IiggISApaiIhaiIpIBdzQRR3IhcgJm\
pqIiZqaiIxIAsgISAYc0EZdyIYIB9qIAlqIh8gLnNBEHciISAiICdqIiJqIicgGHNBFHciGCAfamoi\
HyAhc0EYdyIhc0EQdyIuIA0gIiAZc0EZdyIZIB5qIAJqIh4gIHNBEHciICAvaiIiIBlzQRR3IhkgHm\
pqIh4gIHNBGHciICAiaiIiaiIvIBpzQRR3IhogMWpqIjEgLnNBGHciLiAvaiIvIBpzQRl3IhogMCAi\
IBlzQRl3IhlqIAlqIiIgJiAoc0EYdyImc0EQdyIoICEgJ2oiIWoiJyAZc0EUdyIZICJqIAZqIiJqai\
IwIAUgHiAhIBhzQRl3IhhqIAJqIh4gKnNBEHciISAmIClqIiZqIikgGHNBFHciGCAeamoiHiAhc0EY\
dyIhc0EQdyIqIAwgJiAXc0EZdyIXIB9qaiIfICBzQRB3IiAgMmoiJiAXc0EUdyIXIB9qIBRqIh8gIH\
NBGHciICAmaiImaiIyIBpzQRR3IhogMGpqIjAgKnNBGHciKiAyaiIyIBpzQRl3IhogByAxICYgF3NB\
GXciF2ogCmoiJiAiIChzQRh3IiJzQRB3IiggISApaiIhaiIpIBdzQRR3IhcgJmpqIiZqaiIxIA8gIS\
AYc0EZdyIYIB9qaiIfIC5zQRB3IiEgIiAnaiIiaiInIBhzQRR3IhggH2ogA2oiHyAhc0EYdyIhc0EQ\
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\
ciAJQQh2QYD+A3EgCUEYdnJyNgIQIAMgASgAFCIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQR\
h2cnI2AhQgAyABKAAcIglBGHQgCUEIdEGAgPwHcXIgCUEIdkGA/gNxIAlBGHZyciIKNgIcIAMgASgA\
ICIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2cnIiCzYCICADIAEoABgiCUEYdCAJQQh0QY\
CA/AdxciAJQQh2QYD+A3EgCUEYdnJyIgw2AhggAygCACENIAMoAgQhDiADKAIIIQ8gAygCECEQIAMo\
AgwhESADKAIUIRIgAyABKAAkIglBGHQgCUEIdEGAgPwHcXIgCUEIdkGA/gNxIAlBGHZyciITNgIkIA\
MgASgAKCIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2cnIiFDYCKCADIAEoADAiCUEYdCAJ\
QQh0QYCA/AdxciAJQQh2QYD+A3EgCUEYdnJyIhU2AjAgAyABKAAsIglBGHQgCUEIdEGAgPwHcXIgCU\
EIdkGA/gNxIAlBGHZyciIWNgIsIAMgASgANCIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2\
cnIiCTYCNCADIAEoADgiF0EYdCAXQQh0QYCA/AdxciAXQQh2QYD+A3EgF0EYdnJyIhc2AjggAyABKA\
A8IhhBGHQgGEEIdEGAgPwHcXIgGEEIdkGA/gNxIBhBGHZyciIYNgI8IAUgEyAKcyAYcyAMIBBzIBVz\
IBEgDnMgE3MgF3NBAXciGXNBAXciGnNBAXciGyAKIBJzIAlzIBAgD3MgFHMgGHNBAXciHHNBAXciHX\
MgGCAJcyAdcyAVIBRzIBxzIBtzQQF3Ih5zQQF3Ih9zIBogHHMgHnMgGSAYcyAbcyAXIBVzIBpzIBYg\
E3MgGXMgCyAMcyAXcyASIBFzIBZzIA8gDXMgC3MgCXNBAXciIHNBAXciIXNBAXciInNBAXciI3NBAX\
ciJHNBAXciJXNBAXciJnNBAXciJyAdICFzIAkgFnMgIXMgFCALcyAgcyAdc0EBdyIoc0EBdyIpcyAc\
ICBzIChzIB9zQQF3IipzQQF3IitzIB8gKXMgK3MgHiAocyAqcyAnc0EBdyIsc0EBdyItcyAmICpzIC\
xzICUgH3MgJ3MgJCAecyAmcyAjIBtzICVzICIgGnMgJHMgISAZcyAjcyAgIBdzICJzIClzQQF3Ii5z\
QQF3Ii9zQQF3IjBzQQF3IjFzQQF3IjJzQQF3IjNzQQF3IjRzQQF3IjUgKyAvcyApICNzIC9zICggIn\
MgLnMgK3NBAXciNnNBAXciN3MgKiAucyA2cyAtc0EBdyI4c0EBdyI5cyAtIDdzIDlzICwgNnMgOHMg\
NXNBAXciOnNBAXciO3MgNCA4cyA6cyAzIC1zIDVzIDIgLHMgNHMgMSAncyAzcyAwICZzIDJzIC8gJX\
MgMXMgLiAkcyAwcyA3c0EBdyI8c0EBdyI9c0EBdyI+c0EBdyI/c0EBdyJAc0EBdyJBc0EBdyJCc0EB\
dyJDIDkgPXMgNyAxcyA9cyA2IDBzIDxzIDlzQQF3IkRzQQF3IkVzIDggPHMgRHMgO3NBAXciRnNBAX\
ciR3MgOyBFcyBHcyA6IERzIEZzIENzQQF3IkhzQQF3IklzIEIgRnMgSHMgQSA7cyBDcyBAIDpzIEJz\
ID8gNXMgQXMgPiA0cyBAcyA9IDNzID9zIDwgMnMgPnMgRXNBAXciSnNBAXciS3NBAXciTHNBAXciTX\
NBAXciTnNBAXciT3NBAXciUHNBAXdqIEYgSnMgRCA+cyBKcyBHc0EBdyJRcyBJc0EBdyJSIEUgP3Mg\
S3MgUXNBAXciUyBMIEEgOiA5IDwgMSAmIB8gKCAhIBcgEyAQIAVBHnciVGogDiAHIAZBHnciECACcy\
AFcSACc2pqIA0gCCAFQQV3aiACIAdzIAZxIAdzampBmfOJ1AVqIg5BBXdqQZnzidQFaiJVQR53IgUg\
DkEedyINcyACIA9qIA4gVCAQc3EgEHNqIFVBBXdqQZnzidQFaiIOcSANc2ogECARaiBVIA0gVHNxIF\
RzaiAOQQV3akGZ84nUBWoiEEEFd2pBmfOJ1AVqIhFBHnciD2ogBSAMaiARIBBBHnciEyAOQR53Igxz\
cSAMc2ogDSASaiAMIAVzIBBxIAVzaiARQQV3akGZ84nUBWoiEUEFd2pBmfOJ1AVqIhJBHnciBSARQR\
53IhBzIAogDGogESAPIBNzcSATc2ogEkEFd2pBmfOJ1AVqIgpxIBBzaiALIBNqIBAgD3MgEnEgD3Nq\
IApBBXdqQZnzidQFaiIMQQV3akGZ84nUBWoiD0EedyILaiAVIApBHnciF2ogCyAMQR53IhNzIBQgEG\
ogDCAXIAVzcSAFc2ogD0EFd2pBmfOJ1AVqIhRxIBNzaiAWIAVqIA8gEyAXc3EgF3NqIBRBBXdqQZnz\
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\
AEEAQcgBEJMBQdACakEAOgAADBELIAFBCGooAgBBAEHIARCTAUGwAmpBADoAAAwQCyABQQhqKAIAQQ\
BByAEQkwFBkAJqQQA6AAAMDwsgAUEIaigCACIDQv6568XpjpWZEDcDECADQoHGlLqW8ermbzcDCCAD\
QgA3AwAgA0HYAGpBADoAAAwOCyABQQhqKAIAIgNC/rnrxemOlZkQNwMQIANCgcaUupbx6uZvNwMIIA\
NCADcDACADQdgAakEAOgAADA0LIAFBCGooAgAiA0IANwMAIANBACkDkI1ANwMIIANBEGpBACkDmI1A\
NwMAIANBGGpBACgCoI1ANgIAIANB4ABqQQA6AAAMDAsgAUEIaigCACIDQfDDy558NgIYIANC/rnrxe\
mOlZkQNwMQIANCgcaUupbx6uZvNwMIIANCADcDACADQeAAakEAOgAADAsLIAFBCGooAgBBAEHIARCT\
AUHYAmpBADoAAAwKCyABQQhqKAIAQQBByAEQkwFB0AJqQQA6AAAMCQsgAUEIaigCAEEAQcgBEJMBQb\
ACakEAOgAADAgLIAFBCGooAgBBAEHIARCTAUGQAmpBADoAAAwHCyABQQhqKAIAIgNCADcDACADQQAp\
A8iNQDcDCCADQRBqQQApA9CNQDcDACADQRhqQQApA9iNQDcDACADQSBqQQApA+CNQDcDACADQegAak\
EAOgAADAYLIAFBCGooAgAiA0IANwMAIANBACkDqI1ANwMIIANBEGpBACkDsI1ANwMAIANBGGpBACkD\
uI1ANwMAIANBIGpBACkDwI1ANwMAIANB6ABqQQA6AAAMBQsgAUEIaigCACIDQgA3A0AgA0EAKQOojk\
A3AwAgA0HIAGpCADcDACADQQhqQQApA7COQDcDACADQRBqQQApA7iOQDcDACADQRhqQQApA8COQDcD\
ACADQSBqQQApA8iOQDcDACADQShqQQApA9COQDcDACADQTBqQQApA9iOQDcDACADQThqQQApA+COQD\
cDACADQdABakEAOgAADAQLIAFBCGooAgAiA0IANwNAIANBACkD6I1ANwMAIANByABqQgA3AwAgA0EI\
akEAKQPwjUA3AwAgA0EQakEAKQP4jUA3AwAgA0EYakEAKQOAjkA3AwAgA0EgakEAKQOIjkA3AwAgA0\
EoakEAKQOQjkA3AwAgA0EwakEAKQOYjkA3AwAgA0E4akEAKQOgjkA3AwAgA0HQAWpBADoAAAwDCyAB\
QQhqKAIAQQBByAEQkwFB8AJqQQA6AAAMAgsgAUEIaigCAEEAQcgBEJMBQdACakEAOgAADAELIAFBCG\
ooAgAiA0IANwMAIANBACkD4NFANwMIIANBEGpBACkD6NFANwMAIANBGGpBACkD8NFANwMAIANB4ABq\
QQA6AAALIAFBADYCACAAQgA3AwAgAkGgAWokAA8LEJABAAsQkQEAC4oMAQd/IABBeGoiASAAQXxqKA\
IAIgJBeHEiAGohAwJAAkACQCACQQFxDQAgAkEDcUUNASABKAIAIgIgAGohAAJAIAEgAmsiAUEAKAKE\
1kBHDQAgAygCBEEDcUEDRw0BQQAgADYC/NVAIAMgAygCBEF+cTYCBCABIABBAXI2AgQgASAAaiAANg\
IADwsCQAJAIAJBgAJJDQAgASgCGCEEAkACQCABKAIMIgUgAUcNACABQRRBECABQRRqIgUoAgAiBhtq\
KAIAIgINAUEAIQUMAwsgASgCCCICIAU2AgwgBSACNgIIDAILIAUgAUEQaiAGGyEGA0AgBiEHAkAgAi\
IFQRRqIgYoAgAiAg0AIAVBEGohBiAFKAIQIQILIAINAAsgB0EANgIADAELAkAgAUEMaigCACIFIAFB\
CGooAgAiBkYNACAGIAU2AgwgBSAGNgIIDAILQQBBACgC7NJAQX4gAkEDdndxNgLs0kAMAQsgBEUNAA\
JAAkAgASgCHEECdEH81MAAaiICKAIAIAFGDQAgBEEQQRQgBCgCECABRhtqIAU2AgAgBUUNAgwBCyAC\
IAU2AgAgBQ0AQQBBACgC8NJAQX4gASgCHHdxNgLw0kAMAQsgBSAENgIYAkAgASgCECICRQ0AIAUgAj\
YCECACIAU2AhgLIAFBFGooAgAiAkUNACAFQRRqIAI2AgAgAiAFNgIYCwJAAkAgAygCBCICQQJxRQ0A\
IAMgAkF+cTYCBCABIABBAXI2AgQgASAAaiAANgIADAELAkACQAJAAkACQAJAAkAgA0EAKAKI1kBGDQ\
AgA0EAKAKE1kBHDQFBACABNgKE1kBBAEEAKAL81UAgAGoiADYC/NVAIAEgAEEBcjYCBCABIABqIAA2\
AgAPC0EAIAE2AojWQEEAQQAoAoDWQCAAaiIANgKA1kAgASAAQQFyNgIEIAFBACgChNZARg0BDAULIA\
JBeHEiBSAAaiEAIAVBgAJJDQEgAygCGCEEAkACQCADKAIMIgUgA0cNACADQRRBECADQRRqIgUoAgAi\
BhtqKAIAIgINAUEAIQUMBAsgAygCCCICIAU2AgwgBSACNgIIDAMLIAUgA0EQaiAGGyEGA0AgBiEHAk\
AgAiIFQRRqIgYoAgAiAg0AIAVBEGohBiAFKAIQIQILIAINAAsgB0EANgIADAILQQBBADYC/NVAQQBB\
ADYChNZADAMLAkAgA0EMaigCACIFIANBCGooAgAiA0YNACADIAU2AgwgBSADNgIIDAILQQBBACgC7N\
JAQX4gAkEDdndxNgLs0kAMAQsgBEUNAAJAAkAgAygCHEECdEH81MAAaiICKAIAIANGDQAgBEEQQRQg\
BCgCECADRhtqIAU2AgAgBUUNAgwBCyACIAU2AgAgBQ0AQQBBACgC8NJAQX4gAygCHHdxNgLw0kAMAQ\
sgBSAENgIYAkAgAygCECICRQ0AIAUgAjYCECACIAU2AhgLIANBFGooAgAiA0UNACAFQRRqIAM2AgAg\
AyAFNgIYCyABIABBAXI2AgQgASAAaiAANgIAIAFBACgChNZARw0BQQAgADYC/NVADAILQQAoAqTWQC\
IFIABPDQFBACgCiNZAIgNFDQFBACEBAkBBACgCgNZAIgZBKUkNAEGU1sAAIQADQAJAIAAoAgAiAiAD\
Sw0AIAIgACgCBGogA0sNAgsgACgCCCIADQALCwJAQQAoApzWQCIARQ0AQQAhAQNAIAFBAWohASAAKA\
IIIgANAAsLQQAgAUH/HyABQf8fSxs2AqzWQCAGIAVNDQFBAEF/NgKk1kAPCyAAQYACSQ0BIAEgABBG\
QQAhAUEAQQAoAqzWQEF/aiIANgKs1kAgAA0AAkBBACgCnNZAIgBFDQBBACEBA0AgAUEBaiEBIAAoAg\
giAA0ACwtBACABQf8fIAFB/x9LGzYCrNZADwsPCyAAQXhxQfTSwABqIQMCQAJAQQAoAuzSQCICQQEg\
AEEDdnQiAHFFDQAgAygCCCEADAELQQAgAiAAcjYC7NJAIAMhAAsgAyABNgIIIAAgATYCDCABIAM2Ag\
wgASAANgIIC6UKAgR/Bn4jAEGQA2siAyQAIAEgAS0AgAEiBGoiBUGAAToAACAAKQNAIgdCCoYgBK0i\
CEIDhoQiCUIIiEKAgID4D4MgCUIYiEKAgPwHg4QgCUIoiEKA/gODIAlCOIiEhCEKIAhCO4YgCUIohk\
KAgICAgIDA/wCDhCAHQiKGQoCAgICA4D+DIAdCEoZCgICAgPAfg4SEIQsgAEHIAGopAwAiCEIKhiAH\
QjaIIgeEIglCCIhCgICA+A+DIAlCGIhCgID8B4OEIAlCKIhCgP4DgyAJQjiIhIQhDCAHQjiGIAlCKI\
ZCgICAgICAwP8Ag4QgCEIihkKAgICAgOA/gyAIQhKGQoCAgIDwH4OEhCEJAkAgBEH/AHMiBkUNACAF\
QQFqQQAgBhCTARoLIAsgCoQhByAJIAyEIQkCQAJAIARB8ABxQfAARg0AIAEgCTcAcCABQfgAaiAHNw\
AAIAAgAUEBEA0MAQsgACABQQEQDSADQQA2AoABIANBgAFqIANBgAFqQQRyQQBBgAEQkwFBf3NqQYQB\
akEHSRogA0GAATYCgAEgA0GIAmogA0GAAWpBhAEQlAEaIAMgA0GIAmpBBHJB8AAQlAEiBEH4AGogBz\
cDACAEIAk3A3AgACAEQQEQDQsgAUEAOgCAASACIAApAwAiCUI4hiAJQiiGQoCAgICAgMD/AIOEIAlC\
GIZCgICAgIDgP4MgCUIIhkKAgICA8B+DhIQgCUIIiEKAgID4D4MgCUIYiEKAgPwHg4QgCUIoiEKA/g\
ODIAlCOIiEhIQ3AAAgAiAAKQMIIglCOIYgCUIohkKAgICAgIDA/wCDhCAJQhiGQoCAgICA4D+DIAlC\
CIZCgICAgPAfg4SEIAlCCIhCgICA+A+DIAlCGIhCgID8B4OEIAlCKIhCgP4DgyAJQjiIhISENwAIIA\
IgACkDECIJQjiGIAlCKIZCgICAgICAwP8Ag4QgCUIYhkKAgICAgOA/gyAJQgiGQoCAgIDwH4OEhCAJ\
QgiIQoCAgPgPgyAJQhiIQoCA/AeDhCAJQiiIQoD+A4MgCUI4iISEhDcAECACIAApAxgiCUI4hiAJQi\
iGQoCAgICAgMD/AIOEIAlCGIZCgICAgIDgP4MgCUIIhkKAgICA8B+DhIQgCUIIiEKAgID4D4MgCUIY\
iEKAgPwHg4QgCUIoiEKA/gODIAlCOIiEhIQ3ABggAiAAKQMgIglCOIYgCUIohkKAgICAgIDA/wCDhC\
AJQhiGQoCAgICA4D+DIAlCCIZCgICAgPAfg4SEIAlCCIhCgICA+A+DIAlCGIhCgID8B4OEIAlCKIhC\
gP4DgyAJQjiIhISENwAgIAIgACkDKCIJQjiGIAlCKIZCgICAgICAwP8Ag4QgCUIYhkKAgICAgOA/gy\
AJQgiGQoCAgIDwH4OEhCAJQgiIQoCAgPgPgyAJQhiIQoCA/AeDhCAJQiiIQoD+A4MgCUI4iISEhDcA\
KCACIAApAzAiCUI4hiAJQiiGQoCAgICAgMD/AIOEIAlCGIZCgICAgIDgP4MgCUIIhkKAgICA8B+DhI\
QgCUIIiEKAgID4D4MgCUIYiEKAgPwHg4QgCUIoiEKA/gODIAlCOIiEhIQ3ADAgAiAAKQM4IglCOIYg\
CUIohkKAgICAgIDA/wCDhCAJQhiGQoCAgICA4D+DIAlCCIZCgICAgPAfg4SEIAlCCIhCgICA+A+DIA\
lCGIhCgID8B4OEIAlCKIhCgP4DgyAJQjiIhISENwA4IANBkANqJAAL8wkBBn8gACABaiECAkACQAJA\
IAAoAgQiA0EBcQ0AIANBA3FFDQEgACgCACIDIAFqIQECQCAAIANrIgBBACgChNZARw0AIAIoAgRBA3\
FBA0cNAUEAIAE2AvzVQCACIAIoAgRBfnE2AgQgACABQQFyNgIEIAIgATYCAA8LAkACQCADQYACSQ0A\
IAAoAhghBAJAAkAgACgCDCIFIABHDQAgAEEUQRAgAEEUaiIFKAIAIgYbaigCACIDDQFBACEFDAMLIA\
AoAggiAyAFNgIMIAUgAzYCCAwCCyAFIABBEGogBhshBgNAIAYhBwJAIAMiBUEUaiIGKAIAIgMNACAF\
QRBqIQYgBSgCECEDCyADDQALIAdBADYCAAwBCwJAIABBDGooAgAiBSAAQQhqKAIAIgZGDQAgBiAFNg\
IMIAUgBjYCCAwCC0EAQQAoAuzSQEF+IANBA3Z3cTYC7NJADAELIARFDQACQAJAIAAoAhxBAnRB/NTA\
AGoiAygCACAARg0AIARBEEEUIAQoAhAgAEYbaiAFNgIAIAVFDQIMAQsgAyAFNgIAIAUNAEEAQQAoAv\
DSQEF+IAAoAhx3cTYC8NJADAELIAUgBDYCGAJAIAAoAhAiA0UNACAFIAM2AhAgAyAFNgIYCyAAQRRq\
KAIAIgNFDQAgBUEUaiADNgIAIAMgBTYCGAsCQCACKAIEIgNBAnFFDQAgAiADQX5xNgIEIAAgAUEBcj\
YCBCAAIAFqIAE2AgAMAgsCQAJAIAJBACgCiNZARg0AIAJBACgChNZARw0BQQAgADYChNZAQQBBACgC\
/NVAIAFqIgE2AvzVQCAAIAFBAXI2AgQgACABaiABNgIADwtBACAANgKI1kBBAEEAKAKA1kAgAWoiAT\
YCgNZAIAAgAUEBcjYCBCAAQQAoAoTWQEcNAUEAQQA2AvzVQEEAQQA2AoTWQA8LIANBeHEiBSABaiEB\
AkACQAJAIAVBgAJJDQAgAigCGCEEAkACQCACKAIMIgUgAkcNACACQRRBECACQRRqIgUoAgAiBhtqKA\
IAIgMNAUEAIQUMAwsgAigCCCIDIAU2AgwgBSADNgIIDAILIAUgAkEQaiAGGyEGA0AgBiEHAkAgAyIF\
QRRqIgYoAgAiAw0AIAVBEGohBiAFKAIQIQMLIAMNAAsgB0EANgIADAELAkAgAkEMaigCACIFIAJBCG\
ooAgAiAkYNACACIAU2AgwgBSACNgIIDAILQQBBACgC7NJAQX4gA0EDdndxNgLs0kAMAQsgBEUNAAJA\
AkAgAigCHEECdEH81MAAaiIDKAIAIAJGDQAgBEEQQRQgBCgCECACRhtqIAU2AgAgBUUNAgwBCyADIA\
U2AgAgBQ0AQQBBACgC8NJAQX4gAigCHHdxNgLw0kAMAQsgBSAENgIYAkAgAigCECIDRQ0AIAUgAzYC\
ECADIAU2AhgLIAJBFGooAgAiAkUNACAFQRRqIAI2AgAgAiAFNgIYCyAAIAFBAXI2AgQgACABaiABNg\
IAIABBACgChNZARw0BQQAgATYC/NVACw8LAkAgAUGAAkkNACAAIAEQRg8LIAFBeHFB9NLAAGohAgJA\
AkBBACgC7NJAIgNBASABQQN2dCIBcUUNACACKAIIIQEMAQtBACADIAFyNgLs0kAgAiEBCyACIAA2Ag\
ggASAANgIMIAAgAjYCDCAAIAE2AggLpwgCAX8pfiAAKQPAASECIAApA5gBIQMgACkDcCEEIAApA0gh\
BSAAKQMgIQYgACkDuAEhByAAKQOQASEIIAApA2ghCSAAKQNAIQogACkDGCELIAApA7ABIQwgACkDiA\
EhDSAAKQNgIQ4gACkDOCEPIAApAxAhECAAKQOoASERIAApA4ABIRIgACkDWCETIAApAzAhFCAAKQMI\
IRUgACkDoAEhFiAAKQN4IRcgACkDUCEYIAApAyghGSAAKQMAIRpBwH4hAQNAIAwgDSAOIA8gEIWFhY\
UiG0IBiSAWIBcgGCAZIBqFhYWFIhyFIh0gFIUhHiACIAcgCCAJIAogC4WFhYUiHyAcQgGJhSIchSEg\
IAIgAyAEIAUgBoWFhYUiIUIBiSAbhSIbIAqFQjeJIiIgH0IBiSARIBIgEyAUIBWFhYWFIgqFIh8gEI\
VCPokiI0J/hYMgHSARhUICiSIkhSECICIgISAKQgGJhSIQIBeFQimJIiEgBCAchUIniSIlQn+Fg4Uh\
ESAbIAeFQjiJIiYgHyANhUIPiSIHQn+FgyAdIBOFQgqJIieFIQ0gJyAQIBmFQiSJIihCf4WDIAYgHI\
VCG4kiKYUhFyAQIBaFQhKJIgYgHyAPhUIGiSIWIB0gFYVCAYkiKkJ/hYOFIQQgAyAchUIIiSIDIBsg\
CYVCGYkiCUJ/hYMgFoUhEyAFIByFQhSJIhwgGyALhUIciSILQn+FgyAfIAyFQj2JIg+FIQUgCyAPQn\
+FgyAdIBKFQi2JIh2FIQogECAYhUIDiSIVIA8gHUJ/hYOFIQ8gHSAVQn+FgyAchSEUIAsgFSAcQn+F\
g4UhGSAbIAiFQhWJIh0gECAahSIcICBCDokiG0J/hYOFIQsgGyAdQn+FgyAfIA6FQiuJIh+FIRAgHS\
AfQn+FgyAeQiyJIh2FIRUgAUHYkMAAaikDACAcIB8gHUJ/hYOFhSEaIAkgFkJ/hYMgKoUiHyEYICUg\
IkJ/hYMgI4UiIiEWICggByAnQn+Fg4UiJyESIAkgBiADQn+Fg4UiHiEOICQgIUJ/hYMgJYUiJSEMIC\
ogBkJ/hYMgA4UiKiEJICkgJkJ/hYMgB4UiICEIICEgIyAkQn+Fg4UiIyEHIB0gHEJ/hYMgG4UiHSEG\
ICYgKCApQn+Fg4UiHCEDIAFBCGoiAQ0ACyAAICI3A6ABIAAgFzcDeCAAIB83A1AgACAZNwMoIAAgGj\
cDACAAIBE3A6gBIAAgJzcDgAEgACATNwNYIAAgFDcDMCAAIBU3AwggACAlNwOwASAAIA03A4gBIAAg\
HjcDYCAAIA83AzggACAQNwMQIAAgIzcDuAEgACAgNwOQASAAICo3A2ggACAKNwNAIAAgCzcDGCAAIA\
I3A8ABIAAgHDcDmAEgACAENwNwIAAgBTcDSCAAIB03AyALoAgBCn9BACECAkAgAUHM/3tLDQBBECAB\
QQtqQXhxIAFBC0kbIQMgAEF8aiIEKAIAIgVBeHEhBgJAAkACQAJAAkACQAJAIAVBA3FFDQAgAEF4ai\
EHIAYgA08NASAHIAZqIghBACgCiNZARg0CIAhBACgChNZARg0DIAgoAgQiBUECcQ0GIAVBeHEiCSAG\
aiIKIANPDQQMBgsgA0GAAkkNBSAGIANBBHJJDQUgBiADa0GBgAhPDQUMBAsgBiADayIBQRBJDQMgBC\
AFQQFxIANyQQJyNgIAIAcgA2oiAiABQQNyNgIEIAIgAWoiAyADKAIEQQFyNgIEIAIgARAkDAMLQQAo\
AoDWQCAGaiIGIANNDQMgBCAFQQFxIANyQQJyNgIAIAcgA2oiASAGIANrIgJBAXI2AgRBACACNgKA1k\
BBACABNgKI1kAMAgtBACgC/NVAIAZqIgYgA0kNAgJAAkAgBiADayIBQQ9LDQAgBCAFQQFxIAZyQQJy\
NgIAIAcgBmoiASABKAIEQQFyNgIEQQAhAUEAIQIMAQsgBCAFQQFxIANyQQJyNgIAIAcgA2oiAiABQQ\
FyNgIEIAIgAWoiAyABNgIAIAMgAygCBEF+cTYCBAtBACACNgKE1kBBACABNgL81UAMAQsgCiADayEL\
AkACQAJAIAlBgAJJDQAgCCgCGCEJAkACQCAIKAIMIgIgCEcNACAIQRRBECAIQRRqIgIoAgAiBhtqKA\
IAIgENAUEAIQIMAwsgCCgCCCIBIAI2AgwgAiABNgIIDAILIAIgCEEQaiAGGyEGA0AgBiEFAkAgASIC\
QRRqIgYoAgAiAQ0AIAJBEGohBiACKAIQIQELIAENAAsgBUEANgIADAELAkAgCEEMaigCACIBIAhBCG\
ooAgAiAkYNACACIAE2AgwgASACNgIIDAILQQBBACgC7NJAQX4gBUEDdndxNgLs0kAMAQsgCUUNAAJA\
AkAgCCgCHEECdEH81MAAaiIBKAIAIAhGDQAgCUEQQRQgCSgCECAIRhtqIAI2AgAgAkUNAgwBCyABIA\
I2AgAgAg0AQQBBACgC8NJAQX4gCCgCHHdxNgLw0kAMAQsgAiAJNgIYAkAgCCgCECIBRQ0AIAIgATYC\
ECABIAI2AhgLIAhBFGooAgAiAUUNACACQRRqIAE2AgAgASACNgIYCwJAIAtBEEkNACAEIAQoAgBBAX\
EgA3JBAnI2AgAgByADaiIBIAtBA3I2AgQgASALaiICIAIoAgRBAXI2AgQgASALECQMAQsgBCAEKAIA\
QQFxIApyQQJyNgIAIAcgCmoiASABKAIEQQFyNgIECyAAIQIMAQsgARAZIgNFDQAgAyAAQXxBeCAEKA\
IAIgJBA3EbIAJBeHFqIgIgASACIAFJGxCUASEBIAAQIiABDwsgAgugBwIEfwR+IwBB0AFrIgMkACAB\
IAEtAEAiBGoiBUGAAToAACAAKQMAIgdCCYYgBK0iCEIDhoQiCUIIiEKAgID4D4MgCUIYiEKAgPwHg4\
QgCUIoiEKA/gODIAlCOIiEhCEKIAhCO4YgCUIohkKAgICAgIDA/wCDhCAHQiGGQoCAgICA4D+DIAdC\
EYZCgICAgPAfg4SEIQkCQCAEQT9zIgZFDQAgBUEBakEAIAYQkwEaCyAJIAqEIQkCQAJAIARBOHFBOE\
YNACABIAk3ADggAEEIaiABQQEQDwwBCyAAQQhqIgQgAUEBEA8gA0HAAGpBDGpCADcCACADQcAAakEU\
akIANwIAIANBwABqQRxqQgA3AgAgA0HAAGpBJGpCADcCACADQcAAakEsakIANwIAIANBwABqQTRqQg\
A3AgAgA0H8AGpCADcCACADQgA3AkQgA0EANgJAIANBwABqIANBwABqQQRyQX9zakHEAGpBB0kaIANB\
wAA2AkAgA0GIAWogA0HAAGpBxAAQlAEaIANBMGogA0GIAWpBNGopAgA3AwAgA0EoaiADQYgBakEsai\
kCADcDACADQSBqIANBiAFqQSRqKQIANwMAIANBGGogA0GIAWpBHGopAgA3AwAgA0EQaiADQYgBakEU\
aikCADcDACADQQhqIANBiAFqQQxqKQIANwMAIAMgAykCjAE3AwAgAyAJNwM4IAQgA0EBEA8LIAFBAD\
oAQCACIAAoAggiAUEYdCABQQh0QYCA/AdxciABQQh2QYD+A3EgAUEYdnJyNgAAIAIgAEEMaigCACIB\
QRh0IAFBCHRBgID8B3FyIAFBCHZBgP4DcSABQRh2cnI2AAQgAiAAQRBqKAIAIgFBGHQgAUEIdEGAgP\
wHcXIgAUEIdkGA/gNxIAFBGHZycjYACCACIABBFGooAgAiAUEYdCABQQh0QYCA/AdxciABQQh2QYD+\
A3EgAUEYdnJyNgAMIAIgAEEYaigCACIBQRh0IAFBCHRBgID8B3FyIAFBCHZBgP4DcSABQRh2cnI2AB\
AgAiAAQRxqKAIAIgFBGHQgAUEIdEGAgPwHcXIgAUEIdkGA/gNxIAFBGHZycjYAFCACIABBIGooAgAi\
AUEYdCABQQh0QYCA/AdxciABQQh2QYD+A3EgAUEYdnJyNgAYIAIgAEEkaigCACIAQRh0IABBCHRBgI\
D8B3FyIABBCHZBgP4DcSAAQRh2cnI2ABwgA0HQAWokAAuNBwIMfwJ+IwBBMGsiAiQAIAAoAgAiA60h\
DkEnIQACQAJAIANBkM4ATw0AIA4hDwwBC0EnIQADQCACQQlqIABqIgNBfGogDkKQzgCAIg9C8LEDfi\
AOfKciBEH//wNxQeQAbiIFQQF0QeSIwABqLwAAOwAAIANBfmogBUGcf2wgBGpB//8DcUEBdEHkiMAA\
ai8AADsAACAAQXxqIQAgDkL/wdcvViEDIA8hDiADDQALCwJAIA+nIgNB4wBNDQAgAkEJaiAAQX5qIg\
BqIA+nIgRB//8DcUHkAG4iA0Gcf2wgBGpB//8DcUEBdEHkiMAAai8AADsAAAsCQAJAIANBCkkNACAC\
QQlqIABBfmoiAGogA0EBdEHkiMAAai8AADsAAAwBCyACQQlqIABBf2oiAGogA0EwajoAAAtBJyAAay\
EGQQEhA0ErQYCAxAAgASgCACIEQQFxIgUbIQcgBEEddEEfdUHYkMAAcSEIIAJBCWogAGohCQJAAkAg\
ASgCCA0AIAFBGGooAgAiACABQRxqKAIAIgQgByAIEHUNASAAIAkgBiAEKAIMEQgAIQMMAQsCQAJAAk\
ACQAJAIAFBDGooAgAiCiAGIAVqIgNNDQAgBEEIcQ0EIAogA2siAyEKQQEgAS0AICIAIABBA0YbQQNx\
IgAOAwMBAgMLQQEhAyABQRhqKAIAIgAgAUEcaigCACIEIAcgCBB1DQQgACAJIAYgBCgCDBEIACEDDA\
QLQQAhCiADIQAMAQsgA0EBdiEAIANBAWpBAXYhCgsgAEEBaiEAIAFBHGooAgAhBSABQRhqKAIAIQsg\
ASgCBCEEAkADQCAAQX9qIgBFDQEgCyAEIAUoAhARBgBFDQALQQEhAwwCC0EBIQMgBEGAgMQARg0BIA\
sgBSAHIAgQdQ0BIAsgCSAGIAUoAgwRCAANAUEAIQACQANAAkAgCiAARw0AIAohAAwCCyAAQQFqIQAg\
CyAEIAUoAhARBgBFDQALIABBf2ohAAsgACAKSSEDDAELIAEoAgQhDCABQTA2AgQgAS0AICENQQEhAy\
ABQQE6ACAgAUEYaigCACIEIAFBHGooAgAiCyAHIAgQdQ0AIAAgCmogBWtBWmohAAJAA0AgAEF/aiIA\
RQ0BIARBMCALKAIQEQYARQ0ADAILCyAEIAkgBiALKAIMEQgADQAgASANOgAgIAEgDDYCBEEAIQMLIA\
JBMGokACADC70GAgN/BH4jAEHwAWsiAyQAIAApAwAhBiABIAEtAEAiBGoiBUGAAToAACADQQhqQRBq\
IABBGGooAgA2AgAgA0EQaiAAQRBqKQIANwMAIAMgACkCCDcDCCAGQgmGIAStIgdCA4aEIghCCIhCgI\
CA+A+DIAhCGIhCgID8B4OEIAhCKIhCgP4DgyAIQjiIhIQhCSAHQjuGIAhCKIZCgICAgICAwP8Ag4Qg\
BkIhhkKAgICAgOA/gyAGQhGGQoCAgIDwH4OEhCEIAkAgBEE/cyIARQ0AIAVBAWpBACAAEJMBGgsgCC\
AJhCEIAkACQCAEQThxQThGDQAgASAINwA4IANBCGogAUEBEBUMAQsgA0EIaiABQQEQFSADQeAAakEM\
akIANwIAIANB4ABqQRRqQgA3AgAgA0HgAGpBHGpCADcCACADQeAAakEkakIANwIAIANB4ABqQSxqQg\
A3AgAgA0HgAGpBNGpCADcCACADQZwBakIANwIAIANCADcCZCADQQA2AmAgA0HgAGogA0HgAGpBBHJB\
f3NqQcQAakEHSRogA0HAADYCYCADQagBaiADQeAAakHEABCUARogA0HQAGogA0GoAWpBNGopAgA3Aw\
AgA0HIAGogA0GoAWpBLGopAgA3AwAgA0HAAGogA0GoAWpBJGopAgA3AwAgA0E4aiADQagBakEcaikC\
ADcDACADQTBqIANBqAFqQRRqKQIANwMAIANBKGogA0GoAWpBDGopAgA3AwAgAyADKQKsATcDICADIA\
g3A1ggA0EIaiADQSBqQQEQFQsgAUEAOgBAIAIgAygCCCIBQRh0IAFBCHRBgID8B3FyIAFBCHZBgP4D\
cSABQRh2cnI2AAAgAiADKAIMIgFBGHQgAUEIdEGAgPwHcXIgAUEIdkGA/gNxIAFBGHZycjYABCACIA\
MoAhAiAUEYdCABQQh0QYCA/AdxciABQQh2QYD+A3EgAUEYdnJyNgAIIAIgAygCFCIBQRh0IAFBCHRB\
gID8B3FyIAFBCHZBgP4DcSABQRh2cnI2AAwgAiADKAIYIgFBGHQgAUEIdEGAgPwHcXIgAUEIdkGA/g\
NxIAFBGHZycjYAECADQfABaiQAC/8GARd/IwBB0AFrIgIkAAJAAkACQCAAKAKQASIDIAF7pyIETQ0A\
IANBf2ohBSAAQfAAaiEGIANBBXQgAGpB1ABqIQcgAkEgakEoaiEIIAJBIGpBCGohCSACQZABakEgai\
EKIAJBEGohCyACQRhqIQwgA0F+akE3SSENA0AgACAFNgKQASACQQhqIgMgB0EoaikAADcDACALIAdB\
MGopAAA3AwAgDCAHQThqKQAANwMAIAIgB0EgaikAADcDACAFRQ0CIAAgBUF/aiIONgKQASAALQBqIQ\
8gCiACKQMANwAAIApBCGogAykDADcAACAKQRBqIAspAwA3AAAgCkEYaiAMKQMANwAAIAJBkAFqQRhq\
IgMgB0EYaiIQKQAANwMAIAJBkAFqQRBqIhEgB0EQaiISKQAANwMAIAJBkAFqQQhqIhMgB0EIaiIUKQ\
AANwMAIAkgBikDADcDACAJQQhqIAZBCGoiFSkDADcDACAJQRBqIAZBEGoiFikDADcDACAJQRhqIAZB\
GGoiFykDADcDACACIAcpAAA3A5ABIAhBOGogAkGQAWpBOGopAwA3AAAgCEEwaiACQZABakEwaikDAD\
cAACAIQShqIAJBkAFqQShqKQMANwAAIAhBIGogCikDADcAACAIQRhqIAMpAwA3AAAgCEEQaiARKQMA\
NwAAIAhBCGogEykDADcAACAIIAIpA5ABNwAAIAJBwAA6AIgBIAIgD0EEciIPOgCJASACQgA3AyAgAy\
AXKQIANwMAIBEgFikCADcDACATIBUpAgA3AwAgAiAGKQIANwOQASACQZABaiAIQcAAQgAgDxAYIAMo\
AgAhAyARKAIAIREgEygCACETIAIoAqwBIQ8gAigCpAEhFSACKAKcASEWIAIoApQBIRcgAigCkAEhGC\
ANRQ0DIAcgGDYCACAHQRxqIA82AgAgECADNgIAIAdBFGogFTYCACASIBE2AgAgB0EMaiAWNgIAIBQg\
EzYCACAHQQRqIBc2AgAgACAFNgKQASAHQWBqIQcgDiEFIA4gBE8NAAsLIAJB0AFqJAAPC0HYkMAAQS\
tBwIXAABByAAsgAiAPNgKsASACIAM2AqgBIAIgFTYCpAEgAiARNgKgASACIBY2ApwBIAIgEzYCmAEg\
AiAXNgKUASACIBg2ApABQbCRwAAgAkGQAWpBpIfAAEGUh8AAEGEAC5wFAQp/IwBBMGsiAyQAIANBJG\
ogATYCACADQQM6ACggA0KAgICAgAQ3AwggAyAANgIgQQAhBCADQQA2AhggA0EANgIQAkACQAJAAkAg\
AigCCCIFDQAgAkEUaigCACIARQ0BIAIoAhAhASAAQQN0IQYgAEF/akH/////AXFBAWohBCACKAIAIQ\
ADQAJAIABBBGooAgAiB0UNACADKAIgIAAoAgAgByADKAIkKAIMEQgADQQLIAEoAgAgA0EIaiABQQRq\
KAIAEQYADQMgAUEIaiEBIABBCGohACAGQXhqIgYNAAwCCwsgAkEMaigCACIBRQ0AIAFBBXQhCCABQX\
9qQf///z9xQQFqIQQgAigCACEAQQAhBgNAAkAgAEEEaigCACIBRQ0AIAMoAiAgACgCACABIAMoAiQo\
AgwRCAANAwsgAyAFIAZqIgFBHGotAAA6ACggAyABQQRqKQIAQiCJNwMIIAFBGGooAgAhCSACKAIQIQ\
pBACELQQAhBwJAAkACQCABQRRqKAIADgMBAAIBCyAJQQN0IQxBACEHIAogDGoiDEEEaigCAEEERw0B\
IAwoAgAoAgAhCQtBASEHCyADIAk2AhQgAyAHNgIQIAFBEGooAgAhBwJAAkACQCABQQxqKAIADgMBAA\
IBCyAHQQN0IQkgCiAJaiIJQQRqKAIAQQRHDQEgCSgCACgCACEHC0EBIQsLIAMgBzYCHCADIAs2Ahgg\
CiABKAIAQQN0aiIBKAIAIANBCGogASgCBBEGAA0CIABBCGohACAIIAZBIGoiBkcNAAsLAkAgBCACKA\
IETw0AIAMoAiAgAigCACAEQQN0aiIBKAIAIAEoAgQgAygCJCgCDBEIAA0BC0EAIQEMAQtBASEBCyAD\
QTBqJAAgAQuaBAIDfwJ+IwBB8AFrIgMkACAAKQMAIQYgASABLQBAIgRqIgVBgAE6AAAgA0EIakEQai\
AAQRhqKAIANgIAIANBEGogAEEQaikCADcDACADIAApAgg3AwggBkIJhiEGIAStQgOGIQcCQCAEQT9z\
IgBFDQAgBUEBakEAIAAQkwEaCyAGIAeEIQYCQAJAIARBOHFBOEYNACABIAY3ADggA0EIaiABEBMMAQ\
sgA0EIaiABEBMgA0HgAGpBDGpCADcCACADQeAAakEUakIANwIAIANB4ABqQRxqQgA3AgAgA0HgAGpB\
JGpCADcCACADQeAAakEsakIANwIAIANB4ABqQTRqQgA3AgAgA0GcAWpCADcCACADQgA3AmQgA0EANg\
JgIANB4ABqIANB4ABqQQRyQX9zakHEAGpBB0kaIANBwAA2AmAgA0GoAWogA0HgAGpBxAAQlAEaIANB\
0ABqIANBqAFqQTRqKQIANwMAIANByABqIANBqAFqQSxqKQIANwMAIANBwABqIANBqAFqQSRqKQIANw\
MAIANBOGogA0GoAWpBHGopAgA3AwAgA0EwaiADQagBakEUaikCADcDACADQShqIANBqAFqQQxqKQIA\
NwMAIAMgAykCrAE3AyAgAyAGNwNYIANBCGogA0EgahATCyABQQA6AEAgAiADKAIINgAAIAIgAykCDD\
cABCACIAMpAhQ3AAwgA0HwAWokAAuKBAEKfyMAQTBrIgYkAEEAIQcgBkEANgIIAkAgAUFAcSIIRQ0A\
QQEhByAGQQE2AgggBiAANgIAIAhBwABGDQBBAiEHIAZBAjYCCCAGIABBwABqNgIEIAhBgAFGDQAgBi\
AAQYABajYCEEGwkcAAIAZBEGpBoIbAAEGUh8AAEGEACyABQT9xIQkCQCAHIAVBBXYiASAHIAFJGyIB\
RQ0AIANBBHIhCiABQQV0IQtBACEDIAYhDANAIAwoAgAhASAGQRBqQRhqIg0gAkEYaikCADcDACAGQR\
BqQRBqIg4gAkEQaikCADcDACAGQRBqQQhqIg8gAkEIaikCADcDACAGIAIpAgA3AxAgBkEQaiABQcAA\
QgAgChAYIAQgA2oiAUEYaiANKQMANwAAIAFBEGogDikDADcAACABQQhqIA8pAwA3AAAgASAGKQMQNw\
AAIAxBBGohDCALIANBIGoiA0cNAAsLAkACQAJAAkAgCUUNACAHQQV0IgIgBUsNASAFIAJrIgFBH00N\
AiAJQSBHDQMgBCACaiICIAAgCGoiASkAADcAACACQRhqIAFBGGopAAA3AAAgAkEQaiABQRBqKQAANw\
AAIAJBCGogAUEIaikAADcAACAHQQFqIQcLIAZBMGokACAHDwsgAiAFQcCEwAAQjAEAC0EgIAFBwITA\
ABCLAQALQSAgCUHQhMAAEGoAC/IDAgN/An4jAEHgAWsiAyQAIAApAwAhBiABIAEtAEAiBGoiBUGAAT\
oAACADQQhqIABBEGopAgA3AwAgAyAAKQIINwMAIAZCCYYhBiAErUIDhiEHAkAgBEE/cyIARQ0AIAVB\
AWpBACAAEJMBGgsgBiAHhCEGAkACQCAEQThxQThGDQAgASAGNwA4IAMgARAdDAELIAMgARAdIANB0A\
BqQQxqQgA3AgAgA0HQAGpBFGpCADcCACADQdAAakEcakIANwIAIANB0ABqQSRqQgA3AgAgA0HQAGpB\
LGpCADcCACADQdAAakE0akIANwIAIANBjAFqQgA3AgAgA0IANwJUIANBADYCUCADQdAAaiADQdAAak\
EEckF/c2pBxABqQQdJGiADQcAANgJQIANBmAFqIANB0ABqQcQAEJQBGiADQcAAaiADQZgBakE0aikC\
ADcDACADQThqIANBmAFqQSxqKQIANwMAIANBMGogA0GYAWpBJGopAgA3AwAgA0EoaiADQZgBakEcai\
kCADcDACADQSBqIANBmAFqQRRqKQIANwMAIANBGGogA0GYAWpBDGopAgA3AwAgAyADKQKcATcDECAD\
IAY3A0ggAyADQRBqEB0LIAFBADoAQCACIAMpAwA3AAAgAiADKQMINwAIIANB4AFqJAAL8gMCA38Cfi\
MAQeABayIDJAAgACkDACEGIAEgAS0AQCIEaiIFQYABOgAAIANBCGogAEEQaikCADcDACADIAApAgg3\
AwAgBkIJhiEGIAStQgOGIQcCQCAEQT9zIgBFDQAgBUEBakEAIAAQkwEaCyAGIAeEIQYCQAJAIARBOH\
FBOEYNACABIAY3ADggAyABEBsMAQsgAyABEBsgA0HQAGpBDGpCADcCACADQdAAakEUakIANwIAIANB\
0ABqQRxqQgA3AgAgA0HQAGpBJGpCADcCACADQdAAakEsakIANwIAIANB0ABqQTRqQgA3AgAgA0GMAW\
pCADcCACADQgA3AlQgA0EANgJQIANB0ABqIANB0ABqQQRyQX9zakHEAGpBB0kaIANBwAA2AlAgA0GY\
AWogA0HQAGpBxAAQlAEaIANBwABqIANBmAFqQTRqKQIANwMAIANBOGogA0GYAWpBLGopAgA3AwAgA0\
EwaiADQZgBakEkaikCADcDACADQShqIANBmAFqQRxqKQIANwMAIANBIGogA0GYAWpBFGopAgA3AwAg\
A0EYaiADQZgBakEMaikCADcDACADIAMpApwBNwMQIAMgBjcDSCADIANBEGoQGwsgAUEAOgBAIAIgAy\
kDADcAACACIAMpAwg3AAggA0HgAWokAAvnAwIEfwJ+IwBB0AFrIgMkACABIAEtAEAiBGoiBUEBOgAA\
IAApAwBCCYYhByAErUIDhiEIAkAgBEE/cyIGRQ0AIAVBAWpBACAGEJMBGgsgByAIhCEHAkACQCAEQT\
hxQThGDQAgASAHNwA4IABBCGogARAWDAELIABBCGoiBCABEBYgA0HAAGpBDGpCADcCACADQcAAakEU\
akIANwIAIANBwABqQRxqQgA3AgAgA0HAAGpBJGpCADcCACADQcAAakEsakIANwIAIANBwABqQTRqQg\
A3AgAgA0H8AGpCADcCACADQgA3AkQgA0EANgJAIANBwABqIANBwABqQQRyQX9zakHEAGpBB0kaIANB\
wAA2AkAgA0GIAWogA0HAAGpBxAAQlAEaIANBMGogA0GIAWpBNGopAgA3AwAgA0EoaiADQYgBakEsai\
kCADcDACADQSBqIANBiAFqQSRqKQIANwMAIANBGGogA0GIAWpBHGopAgA3AwAgA0EQaiADQYgBakEU\
aikCADcDACADQQhqIANBiAFqQQxqKQIANwMAIAMgAykCjAE3AwAgAyAHNwM4IAQgAxAWCyABQQA6AE\
AgAiAAKQMINwAAIAIgAEEQaikDADcACCACIABBGGopAwA3ABAgA0HQAWokAAuAAwEFfwJAAkACQCAB\
QQlJDQBBACECQc3/eyABQRAgAUEQSxsiAWsgAE0NASABQRAgAEELakF4cSAAQQtJGyIDakEMahAZIg\
BFDQEgAEF4aiECAkACQCABQX9qIgQgAHENACACIQEMAQsgAEF8aiIFKAIAIgZBeHEgBCAAakEAIAFr\
cUF4aiIAQQAgASAAIAJrQRBLG2oiASACayIAayEEAkAgBkEDcUUNACABIAEoAgRBAXEgBHJBAnI2Ag\
QgASAEaiIEIAQoAgRBAXI2AgQgBSAFKAIAQQFxIAByQQJyNgIAIAIgAGoiBCAEKAIEQQFyNgIEIAIg\
ABAkDAELIAIoAgAhAiABIAQ2AgQgASACIABqNgIACyABKAIEIgBBA3FFDQIgAEF4cSICIANBEGpNDQ\
IgASAAQQFxIANyQQJyNgIEIAEgA2oiACACIANrIgNBA3I2AgQgASACaiICIAIoAgRBAXI2AgQgACAD\
ECQMAgsgABAZIQILIAIPCyABQQhqC4sDAQJ/IwBBkAFrIgAkAAJAQfAAEBkiAUUNACAAQQxqQgA3Ag\
AgAEEUakIANwIAIABBHGpCADcCACAAQSRqQgA3AgAgAEEsakIANwIAIABBNGpCADcCACAAQTxqQgA3\
AgAgAEIANwIEIABBADYCACAAIABBBHJBf3NqQcQAakEHSRogAEHAADYCACAAQcgAaiAAQcQAEJQBGi\
ABQeAAaiAAQcgAakE8aikCADcAACABQdgAaiAAQcgAakE0aikCADcAACABQdAAaiAAQcgAakEsaikC\
ADcAACABQcgAaiAAQcgAakEkaikCADcAACABQcAAaiAAQcgAakEcaikCADcAACABQThqIABByABqQR\
RqKQIANwAAIAFBMGogAEHIAGpBDGopAgA3AAAgASAAKQJMNwAoIAFCADcDACABQegAakEAOgAAIAFB\
ACkDyI1ANwMIIAFBEGpBACkD0I1ANwMAIAFBGGpBACkD2I1ANwMAIAFBIGpBACkD4I1ANwMAIABBkA\
FqJAAgAQ8LAAuLAwECfyMAQZABayIAJAACQEHwABAZIgFFDQAgAEEMakIANwIAIABBFGpCADcCACAA\
QRxqQgA3AgAgAEEkakIANwIAIABBLGpCADcCACAAQTRqQgA3AgAgAEE8akIANwIAIABCADcCBCAAQQ\
A2AgAgACAAQQRyQX9zakHEAGpBB0kaIABBwAA2AgAgAEHIAGogAEHEABCUARogAUHgAGogAEHIAGpB\
PGopAgA3AAAgAUHYAGogAEHIAGpBNGopAgA3AAAgAUHQAGogAEHIAGpBLGopAgA3AAAgAUHIAGogAE\
HIAGpBJGopAgA3AAAgAUHAAGogAEHIAGpBHGopAgA3AAAgAUE4aiAAQcgAakEUaikCADcAACABQTBq\
IABByABqQQxqKQIANwAAIAEgACkCTDcAKCABQgA3AwAgAUHoAGpBADoAACABQQApA6iNQDcDCCABQR\
BqQQApA7CNQDcDACABQRhqQQApA7iNQDcDACABQSBqQQApA8CNQDcDACAAQZABaiQAIAEPCwAL+wIB\
An8jAEGQAWsiACQAAkBB6AAQGSIBRQ0AIABBDGpCADcCACAAQRRqQgA3AgAgAEEcakIANwIAIABBJG\
pCADcCACAAQSxqQgA3AgAgAEE0akIANwIAIABBPGpCADcCACAAQgA3AgQgAEEANgIAIAAgAEEEckF/\
c2pBxABqQQdJGiAAQcAANgIAIABByABqIABBxAAQlAEaIAFB2ABqIABByABqQTxqKQIANwAAIAFB0A\
BqIABByABqQTRqKQIANwAAIAFByABqIABByABqQSxqKQIANwAAIAFBwABqIABByABqQSRqKQIANwAA\
IAFBOGogAEHIAGpBHGopAgA3AAAgAUEwaiAAQcgAakEUaikCADcAACABQShqIABByABqQQxqKQIANw\
AAIAEgACkCTDcAICABQgA3AwAgAUHgAGpBADoAACABQQApA5CNQDcDCCABQRBqQQApA5iNQDcDACAB\
QRhqQQAoAqCNQDYCACAAQZABaiQAIAEPCwAL+wIBAn8jAEGQAWsiACQAAkBB6AAQGSIBRQ0AIAFCAD\
cDACABQQApA+DRQDcDCCABQRBqQQApA+jRQDcDACABQRhqQQApA/DRQDcDACAAQQxqQgA3AgAgAEEU\
akIANwIAIABBHGpCADcCACAAQSRqQgA3AgAgAEEsakIANwIAIABBNGpCADcCACAAQTxqQgA3AgAgAE\
IANwIEIABBADYCACAAIABBBHJBf3NqQcQAakEHSRogAEHAADYCACAAQcgAaiAAQcQAEJQBGiABQdgA\
aiAAQcgAakE8aikCADcAACABQdAAaiAAQcgAakE0aikCADcAACABQcgAaiAAQcgAakEsaikCADcAAC\
ABQcAAaiAAQcgAakEkaikCADcAACABQThqIABByABqQRxqKQIANwAAIAFBMGogAEHIAGpBFGopAgA3\
AAAgAUEoaiAAQcgAakEMaikCADcAACABIAApAkw3ACAgAUHgAGpBADoAACAAQZABaiQAIAEPCwALqQ\
MBAX8gAiACLQCoASIDakEAQagBIANrEJMBIQMgAkEAOgCoASADQR86AAAgAiACLQCnAUGAAXI6AKcB\
IAEgASkDACACKQAAhTcDACABIAEpAwggAikACIU3AwggASABKQMQIAIpABCFNwMQIAEgASkDGCACKQ\
AYhTcDGCABIAEpAyAgAikAIIU3AyAgASABKQMoIAIpACiFNwMoIAEgASkDMCACKQAwhTcDMCABIAEp\
AzggAikAOIU3AzggASABKQNAIAIpAECFNwNAIAEgASkDSCACKQBIhTcDSCABIAEpA1AgAikAUIU3A1\
AgASABKQNYIAIpAFiFNwNYIAEgASkDYCACKQBghTcDYCABIAEpA2ggAikAaIU3A2ggASABKQNwIAIp\
AHCFNwNwIAEgASkDeCACKQB4hTcDeCABIAEpA4ABIAIpAIABhTcDgAEgASABKQOIASACKQCIAYU3A4\
gBIAEgASkDkAEgAikAkAGFNwOQASABIAEpA5gBIAIpAJgBhTcDmAEgASABKQOgASACKQCgAYU3A6AB\
IAEQJSAAIAFByAEQlAEaC+8CAQN/AkACQAJAAkAgAC0AaCIDRQ0AAkAgA0HBAE8NACAAQShqIgQgA2\
ogAUHAACADayIDIAIgAyACSRsiAxCUARogACAALQBoIANqIgU6AGggASADaiEBAkAgAiADayICDQBB\
ACECDAMLIABBCGogBEHAACAAKQMAIAAtAGogAEHpAGoiAy0AAEVyEBggBEEAQcEAEJMBGiADIAMtAA\
BBAWo6AAAMAQsgA0HAAEGghMAAEIwBAAtBACEDIAJBwQBJDQEgAEEIaiEEIABB6QBqIgMtAAAhBQNA\
IAQgAUHAACAAKQMAIAAtAGogBUH/AXFFchAYIAMgAy0AAEEBaiIFOgAAIAFBwABqIQEgAkFAaiICQc\
AASw0ACyAALQBoIQULIAVB/wFxIgNBwQBPDQELIAAgA2pBKGogAUHAACADayIDIAIgAyACSRsiAhCU\
ARogACAALQBoIAJqOgBoIAAPCyADQcAAQaCEwAAQjAEAC50DAQJ/IwBBEGsiAyQAIAEgAS0AkAEiBG\
pBAEGQASAEaxCTASEEIAFBADoAkAEgBEEBOgAAIAEgAS0AjwFBgAFyOgCPASAAIAApAwAgASkAAIU3\
AwAgACAAKQMIIAEpAAiFNwMIIAAgACkDECABKQAQhTcDECAAIAApAxggASkAGIU3AxggACAAKQMgIA\
EpACCFNwMgIAAgACkDKCABKQAohTcDKCAAIAApAzAgASkAMIU3AzAgACAAKQM4IAEpADiFNwM4IAAg\
ACkDQCABKQBAhTcDQCAAIAApA0ggASkASIU3A0ggACAAKQNQIAEpAFCFNwNQIAAgACkDWCABKQBYhT\
cDWCAAIAApA2AgASkAYIU3A2AgACAAKQNoIAEpAGiFNwNoIAAgACkDcCABKQBwhTcDcCAAIAApA3gg\
ASkAeIU3A3ggACAAKQOAASABKQCAAYU3A4ABIAAgACkDiAEgASkAiAGFNwOIASAAECUgAiAAKQMANw\
AAIAIgACkDCDcACCACIAApAxA3ABAgAiAAKQMYPgAYIANBEGokAAudAwECfyMAQRBrIgMkACABIAEt\
AJABIgRqQQBBkAEgBGsQkwEhBCABQQA6AJABIARBBjoAACABIAEtAI8BQYABcjoAjwEgACAAKQMAIA\
EpAACFNwMAIAAgACkDCCABKQAIhTcDCCAAIAApAxAgASkAEIU3AxAgACAAKQMYIAEpABiFNwMYIAAg\
ACkDICABKQAghTcDICAAIAApAyggASkAKIU3AyggACAAKQMwIAEpADCFNwMwIAAgACkDOCABKQA4hT\
cDOCAAIAApA0AgASkAQIU3A0AgACAAKQNIIAEpAEiFNwNIIAAgACkDUCABKQBQhTcDUCAAIAApA1gg\
ASkAWIU3A1ggACAAKQNgIAEpAGCFNwNgIAAgACkDaCABKQBohTcDaCAAIAApA3AgASkAcIU3A3AgAC\
AAKQN4IAEpAHiFNwN4IAAgACkDgAEgASkAgAGFNwOAASAAIAApA4gBIAEpAIgBhTcDiAEgABAlIAIg\
ACkDADcAACACIAApAwg3AAggAiAAKQMQNwAQIAIgACkDGD4AGCADQRBqJAALlgMBBH8jAEGQBGsiAy\
QAAkAgAkUNACACQagBbCEEIANB4AJqQQRyIQUgA0GwAWogA0GwAWpBBHIiBkF/c2pBrAFqQQdJGgNA\
IAAoAgAhAiADQQA2ArABIAZBAEGoARCTARogA0GoATYCsAEgA0HgAmogA0GwAWpBrAEQlAEaIANBCG\
ogBUGoARCUARogAyACKQMANwMIIAMgAikDCDcDECADIAIpAxA3AxggAyACKQMYNwMgIAMgAikDIDcD\
KCADIAIpAyg3AzAgAyACKQMwNwM4IAMgAikDODcDQCADIAIpA0A3A0ggAyACKQNINwNQIAMgAikDUD\
cDWCADIAIpA1g3A2AgAyACKQNgNwNoIAMgAikDaDcDcCADIAIpA3A3A3ggAyACKQN4NwOAASADIAIp\
A4ABNwOIASADIAIpA4gBNwOQASADIAIpA5ABNwOYASADIAIpA5gBNwOgASADIAIpA6ABNwOoASACEC\
UgASADQQhqQagBEJQBGiABQagBaiEBIARB2H5qIgQNAAsLIANBkARqJAAL+gIBAn8jAEGQAWsiACQA\
AkBB6AAQGSIBRQ0AIABBDGpCADcCACAAQRRqQgA3AgAgAEEcakIANwIAIABBJGpCADcCACAAQSxqQg\
A3AgAgAEE0akIANwIAIABBPGpCADcCACAAQgA3AgQgAEEANgIAIAAgAEEEckF/c2pBxABqQQdJGiAA\
QcAANgIAIABByABqIABBxAAQlAEaIAFB2ABqIABByABqQTxqKQIANwAAIAFB0ABqIABByABqQTRqKQ\
IANwAAIAFByABqIABByABqQSxqKQIANwAAIAFBwABqIABByABqQSRqKQIANwAAIAFBOGogAEHIAGpB\
HGopAgA3AAAgAUEwaiAAQcgAakEUaikCADcAACABQShqIABByABqQQxqKQIANwAAIAEgACkCTDcAIC\
ABQfDDy558NgIYIAFC/rnrxemOlZkQNwMQIAFCgcaUupbx6uZvNwMIIAFCADcDACABQeAAakEAOgAA\
IABBkAFqJAAgAQ8LAAvkAgEEfyMAQZAEayIDJAAgAyAANgIEIABByAFqIQQCQAJAAkACQAJAIABB8A\
JqLQAAIgVFDQBBqAEgBWsiBiACSw0BIAEgBCAFaiAGEJQBIAZqIQEgAiAGayECCyACIAJBqAFuIgZB\
qAFsIgVJDQEgA0EEaiABIAYQOgJAIAIgBWsiAg0AQQAhAgwECyADQQA2ArABIANBsAFqIANBsAFqQQ\
RyQQBBqAEQkwFBf3NqQawBakEHSRogA0GoATYCsAEgA0HgAmogA0GwAWpBrAEQlAEaIANBCGogA0Hg\
AmpBBHJBqAEQlAEaIANBBGogA0EIakEBEDogAkGpAU8NAiABIAVqIANBCGogAhCUARogBCADQQhqQa\
gBEJQBGgwDCyABIAQgBWogAhCUARogBSACaiECDAILQeiMwABBI0HIjMAAEHIACyACQagBQdiMwAAQ\
iwEACyAAIAI6APACIANBkARqJAAL5AIBBH8jAEGwA2siAyQAIAMgADYCBCAAQcgBaiEEAkACQAJAAk\
ACQCAAQdACai0AACIFRQ0AQYgBIAVrIgYgAksNASABIAQgBWogBhCUASAGaiEBIAIgBmshAgsgAiAC\
QYgBbiIGQYgBbCIFSQ0BIANBBGogASAGEEMCQCACIAVrIgINAEEAIQIMBAsgA0EANgKQASADQZABai\
ADQZABakEEckEAQYgBEJMBQX9zakGMAWpBB0kaIANBiAE2ApABIANBoAJqIANBkAFqQYwBEJQBGiAD\
QQhqIANBoAJqQQRyQYgBEJQBGiADQQRqIANBCGpBARBDIAJBiQFPDQIgASAFaiADQQhqIAIQlAEaIA\
QgA0EIakGIARCUARoMAwsgASAEIAVqIAIQlAEaIAUgAmohAgwCC0HojMAAQSNByIzAABByAAsgAkGI\
AUHYjMAAEIsBAAsgACACOgDQAiADQbADaiQAC5EDAQF/AkAgAkUNACABIAJBqAFsaiEDIAAoAgAhAg\
NAIAIgAikDACABKQAAhTcDACACIAIpAwggASkACIU3AwggAiACKQMQIAEpABCFNwMQIAIgAikDGCAB\
KQAYhTcDGCACIAIpAyAgASkAIIU3AyAgAiACKQMoIAEpACiFNwMoIAIgAikDMCABKQAwhTcDMCACIA\
IpAzggASkAOIU3AzggAiACKQNAIAEpAECFNwNAIAIgAikDSCABKQBIhTcDSCACIAIpA1AgASkAUIU3\
A1AgAiACKQNYIAEpAFiFNwNYIAIgAikDYCABKQBghTcDYCACIAIpA2ggASkAaIU3A2ggAiACKQNwIA\
EpAHCFNwNwIAIgAikDeCABKQB4hTcDeCACIAIpA4ABIAEpAIABhTcDgAEgAiACKQOIASABKQCIAYU3\
A4gBIAIgAikDkAEgASkAkAGFNwOQASACIAIpA5gBIAEpAJgBhTcDmAEgAiACKQOgASABKQCgAYU3A6\
ABIAIQJSABQagBaiIBIANHDQALCwvuAgECfyMAQZABayIAJAACQEHgABAZIgFFDQAgAEEMakIANwIA\
IABBFGpCADcCACAAQRxqQgA3AgAgAEEkakIANwIAIABBLGpCADcCACAAQTRqQgA3AgAgAEE8akIANw\
IAIABCADcCBCAAQQA2AgAgACAAQQRyQX9zakHEAGpBB0kaIABBwAA2AgAgAEHIAGogAEHEABCUARog\
AUHQAGogAEHIAGpBPGopAgA3AAAgAUHIAGogAEHIAGpBNGopAgA3AAAgAUHAAGogAEHIAGpBLGopAg\
A3AAAgAUE4aiAAQcgAakEkaikCADcAACABQTBqIABByABqQRxqKQIANwAAIAFBKGogAEHIAGpBFGop\
AgA3AAAgAUEgaiAAQcgAakEMaikCADcAACABIAApAkw3ABggAUL+uevF6Y6VmRA3AxAgAUKBxpS6lv\
Hq5m83AwggAUIANwMAIAFB2ABqQQA6AAAgAEGQAWokACABDwsAC7wCAQh/AkACQCACQQ9LDQAgACED\
DAELIABBACAAa0EDcSIEaiEFAkAgBEUNACAAIQMgASEGA0AgAyAGLQAAOgAAIAZBAWohBiADQQFqIg\
MgBUkNAAsLIAUgAiAEayIHQXxxIghqIQMCQAJAIAEgBGoiCUEDcSIGRQ0AIAhBAUgNASAJQXxxIgpB\
BGohAUEAIAZBA3QiAmtBGHEhBCAKKAIAIQYDQCAFIAYgAnYgASgCACIGIAR0cjYCACABQQRqIQEgBU\
EEaiIFIANJDQAMAgsLIAhBAUgNACAJIQEDQCAFIAEoAgA2AgAgAUEEaiEBIAVBBGoiBSADSQ0ACwsg\
B0EDcSECIAkgCGohAQsCQCACRQ0AIAMgAmohBQNAIAMgAS0AADoAACABQQFqIQEgA0EBaiIDIAVJDQ\
ALCyAAC/oCAQF/IAEgAS0AiAEiA2pBAEGIASADaxCTASEDIAFBADoAiAEgA0EBOgAAIAEgAS0AhwFB\
gAFyOgCHASAAIAApAwAgASkAAIU3AwAgACAAKQMIIAEpAAiFNwMIIAAgACkDECABKQAQhTcDECAAIA\
ApAxggASkAGIU3AxggACAAKQMgIAEpACCFNwMgIAAgACkDKCABKQAohTcDKCAAIAApAzAgASkAMIU3\
AzAgACAAKQM4IAEpADiFNwM4IAAgACkDQCABKQBAhTcDQCAAIAApA0ggASkASIU3A0ggACAAKQNQIA\
EpAFCFNwNQIAAgACkDWCABKQBYhTcDWCAAIAApA2AgASkAYIU3A2AgACAAKQNoIAEpAGiFNwNoIAAg\
ACkDcCABKQBwhTcDcCAAIAApA3ggASkAeIU3A3ggACAAKQOAASABKQCAAYU3A4ABIAAQJSACIAApAw\
A3AAAgAiAAKQMINwAIIAIgACkDEDcAECACIAApAxg3ABgL+gIBAX8gASABLQCIASIDakEAQYgBIANr\
EJMBIQMgAUEAOgCIASADQQY6AAAgASABLQCHAUGAAXI6AIcBIAAgACkDACABKQAAhTcDACAAIAApAw\
ggASkACIU3AwggACAAKQMQIAEpABCFNwMQIAAgACkDGCABKQAYhTcDGCAAIAApAyAgASkAIIU3AyAg\
ACAAKQMoIAEpACiFNwMoIAAgACkDMCABKQAwhTcDMCAAIAApAzggASkAOIU3AzggACAAKQNAIAEpAE\
CFNwNAIAAgACkDSCABKQBIhTcDSCAAIAApA1AgASkAUIU3A1AgACAAKQNYIAEpAFiFNwNYIAAgACkD\
YCABKQBghTcDYCAAIAApA2ggASkAaIU3A2ggACAAKQNwIAEpAHCFNwNwIAAgACkDeCABKQB4hTcDeC\
AAIAApA4ABIAEpAIABhTcDgAEgABAlIAIgACkDADcAACACIAApAwg3AAggAiAAKQMQNwAQIAIgACkD\
GDcAGAvmAgEEfyMAQbADayIDJAACQCACRQ0AIAJBiAFsIQQgA0GgAmpBBHIhBSADQZABaiADQZABak\
EEciIGQX9zakGMAWpBB0kaA0AgACgCACECIANBADYCkAEgBkEAQYgBEJMBGiADQYgBNgKQASADQaAC\
aiADQZABakGMARCUARogA0EIaiAFQYgBEJQBGiADIAIpAwA3AwggAyACKQMINwMQIAMgAikDEDcDGC\
ADIAIpAxg3AyAgAyACKQMgNwMoIAMgAikDKDcDMCADIAIpAzA3AzggAyACKQM4NwNAIAMgAikDQDcD\
SCADIAIpA0g3A1AgAyACKQNQNwNYIAMgAikDWDcDYCADIAIpA2A3A2ggAyACKQNoNwNwIAMgAikDcD\
cDeCADIAIpA3g3A4ABIAMgAikDgAE3A4gBIAIQJSABIANBCGpBiAEQlAEaIAFBiAFqIQEgBEH4fmoi\
BA0ACwsgA0GwA2okAAvYAgEBfwJAIAJFDQAgASACQZABbGohAyAAKAIAIQIDQCACIAIpAwAgASkAAI\
U3AwAgAiACKQMIIAEpAAiFNwMIIAIgAikDECABKQAQhTcDECACIAIpAxggASkAGIU3AxggAiACKQMg\
IAEpACCFNwMgIAIgAikDKCABKQAohTcDKCACIAIpAzAgASkAMIU3AzAgAiACKQM4IAEpADiFNwM4IA\
IgAikDQCABKQBAhTcDQCACIAIpA0ggASkASIU3A0ggAiACKQNQIAEpAFCFNwNQIAIgAikDWCABKQBY\
hTcDWCACIAIpA2AgASkAYIU3A2AgAiACKQNoIAEpAGiFNwNoIAIgAikDcCABKQBwhTcDcCACIAIpA3\
ggASkAeIU3A3ggAiACKQOAASABKQCAAYU3A4ABIAIgAikDiAEgASkAiAGFNwOIASACECUgAUGQAWoi\
ASADRw0ACwsL3QIBAX8gAiACLQCIASIDakEAQYgBIANrEJMBIQMgAkEAOgCIASADQR86AAAgAiACLQ\
CHAUGAAXI6AIcBIAEgASkDACACKQAAhTcDACABIAEpAwggAikACIU3AwggASABKQMQIAIpABCFNwMQ\
IAEgASkDGCACKQAYhTcDGCABIAEpAyAgAikAIIU3AyAgASABKQMoIAIpACiFNwMoIAEgASkDMCACKQ\
AwhTcDMCABIAEpAzggAikAOIU3AzggASABKQNAIAIpAECFNwNAIAEgASkDSCACKQBIhTcDSCABIAEp\
A1AgAikAUIU3A1AgASABKQNYIAIpAFiFNwNYIAEgASkDYCACKQBghTcDYCABIAEpA2ggAikAaIU3A2\
ggASABKQNwIAIpAHCFNwNwIAEgASkDeCACKQB4hTcDeCABIAEpA4ABIAIpAIABhTcDgAEgARAlIAAg\
AUHIARCUARoLswIBBH9BHyECAkAgAUH///8HSw0AIAFBBiABQQh2ZyICa3ZBAXEgAkEBdGtBPmohAg\
sgAEIANwIQIAAgAjYCHCACQQJ0QfzUwABqIQMCQAJAAkACQAJAQQAoAvDSQCIEQQEgAnQiBXFFDQAg\
AygCACIEKAIEQXhxIAFHDQEgBCECDAILQQAgBCAFcjYC8NJAIAMgADYCACAAIAM2AhgMAwsgAUEAQR\
kgAkEBdmtBH3EgAkEfRht0IQMDQCAEIANBHXZBBHFqQRBqIgUoAgAiAkUNAiADQQF0IQMgAiEEIAIo\
AgRBeHEgAUcNAAsLIAIoAggiAyAANgIMIAIgADYCCCAAQQA2AhggACACNgIMIAAgAzYCCA8LIAUgAD\
YCACAAIAQ2AhgLIAAgADYCDCAAIAA2AggLugIBBX8gACgCGCEBAkACQAJAIAAoAgwiAiAARw0AIABB\
FEEQIABBFGoiAigCACIDG2ooAgAiBA0BQQAhAgwCCyAAKAIIIgQgAjYCDCACIAQ2AggMAQsgAiAAQR\
BqIAMbIQMDQCADIQUCQCAEIgJBFGoiAygCACIEDQAgAkEQaiEDIAIoAhAhBAsgBA0ACyAFQQA2AgAL\
AkAgAUUNAAJAAkAgACgCHEECdEH81MAAaiIEKAIAIABGDQAgAUEQQRQgASgCECAARhtqIAI2AgAgAg\
0BDAILIAQgAjYCACACDQBBAEEAKALw0kBBfiAAKAIcd3E2AvDSQA8LIAIgATYCGAJAIAAoAhAiBEUN\
ACACIAQ2AhAgBCACNgIYCyAAQRRqKAIAIgRFDQAgAkEUaiAENgIAIAQgAjYCGA8LC8UCAQF/AkAgAk\
UNACABIAJBiAFsaiEDIAAoAgAhAgNAIAIgAikDACABKQAAhTcDACACIAIpAwggASkACIU3AwggAiAC\
KQMQIAEpABCFNwMQIAIgAikDGCABKQAYhTcDGCACIAIpAyAgASkAIIU3AyAgAiACKQMoIAEpACiFNw\
MoIAIgAikDMCABKQAwhTcDMCACIAIpAzggASkAOIU3AzggAiACKQNAIAEpAECFNwNAIAIgAikDSCAB\
KQBIhTcDSCACIAIpA1AgASkAUIU3A1AgAiACKQNYIAEpAFiFNwNYIAIgAikDYCABKQBghTcDYCACIA\
IpA2ggASkAaIU3A2ggAiACKQNwIAEpAHCFNwNwIAIgAikDeCABKQB4hTcDeCACIAIpA4ABIAEpAIAB\
hTcDgAEgAhAlIAFBiAFqIgEgA0cNAAsLC8cCAQF/IAEgAS0AaCIDakEAQegAIANrEJMBIQMgAUEAOg\
BoIANBAToAACABIAEtAGdBgAFyOgBnIAAgACkDACABKQAAhTcDACAAIAApAwggASkACIU3AwggACAA\
KQMQIAEpABCFNwMQIAAgACkDGCABKQAYhTcDGCAAIAApAyAgASkAIIU3AyAgACAAKQMoIAEpACiFNw\
MoIAAgACkDMCABKQAwhTcDMCAAIAApAzggASkAOIU3AzggACAAKQNAIAEpAECFNwNAIAAgACkDSCAB\
KQBIhTcDSCAAIAApA1AgASkAUIU3A1AgACAAKQNYIAEpAFiFNwNYIAAgACkDYCABKQBghTcDYCAAEC\
UgAiAAKQMANwAAIAIgACkDCDcACCACIAApAxA3ABAgAiAAKQMYNwAYIAIgACkDIDcAICACIAApAyg3\
ACgLxwIBAX8gASABLQBoIgNqQQBB6AAgA2sQkwEhAyABQQA6AGggA0EGOgAAIAEgAS0AZ0GAAXI6AG\
cgACAAKQMAIAEpAACFNwMAIAAgACkDCCABKQAIhTcDCCAAIAApAxAgASkAEIU3AxAgACAAKQMYIAEp\
ABiFNwMYIAAgACkDICABKQAghTcDICAAIAApAyggASkAKIU3AyggACAAKQMwIAEpADCFNwMwIAAgAC\
kDOCABKQA4hTcDOCAAIAApA0AgASkAQIU3A0AgACAAKQNIIAEpAEiFNwNIIAAgACkDUCABKQBQhTcD\
UCAAIAApA1ggASkAWIU3A1ggACAAKQNgIAEpAGCFNwNgIAAQJSACIAApAwA3AAAgAiAAKQMINwAIIA\
IgACkDEDcAECACIAApAxg3ABggAiAAKQMgNwAgIAIgACkDKDcAKAubAgEBfyABIAEtAEgiA2pBAEHI\
ACADaxCTASEDIAFBADoASCADQQE6AAAgASABLQBHQYABcjoARyAAIAApAwAgASkAAIU3AwAgACAAKQ\
MIIAEpAAiFNwMIIAAgACkDECABKQAQhTcDECAAIAApAxggASkAGIU3AxggACAAKQMgIAEpACCFNwMg\
IAAgACkDKCABKQAohTcDKCAAIAApAzAgASkAMIU3AzAgACAAKQM4IAEpADiFNwM4IAAgACkDQCABKQ\
BAhTcDQCAAECUgAiAAKQMANwAAIAIgACkDCDcACCACIAApAxA3ABAgAiAAKQMYNwAYIAIgACkDIDcA\
ICACIAApAyg3ACggAiAAKQMwNwAwIAIgACkDODcAOAubAgEBfyABIAEtAEgiA2pBAEHIACADaxCTAS\
EDIAFBADoASCADQQY6AAAgASABLQBHQYABcjoARyAAIAApAwAgASkAAIU3AwAgACAAKQMIIAEpAAiF\
NwMIIAAgACkDECABKQAQhTcDECAAIAApAxggASkAGIU3AxggACAAKQMgIAEpACCFNwMgIAAgACkDKC\
ABKQAohTcDKCAAIAApAzAgASkAMIU3AzAgACAAKQM4IAEpADiFNwM4IAAgACkDQCABKQBAhTcDQCAA\
ECUgAiAAKQMANwAAIAIgACkDCDcACCACIAApAxA3ABAgAiAAKQMYNwAYIAIgACkDIDcAICACIAApAy\
g3ACggAiAAKQMwNwAwIAIgACkDODcAOAuIAgECfyMAQZACayIAJAACQEHYARAZIgFFDQAgAEEANgIA\
IAAgAEEEckEAQYABEJMBQX9zakGEAWpBB0kaIABBgAE2AgAgAEGIAWogAEGEARCUARogAUHQAGogAE\
GIAWpBBHJBgAEQlAEaIAFByABqQgA3AwAgAUIANwNAIAFB0AFqQQA6AAAgAUEAKQPojUA3AwAgAUEI\
akEAKQPwjUA3AwAgAUEQakEAKQP4jUA3AwAgAUEYakEAKQOAjkA3AwAgAUEgakEAKQOIjkA3AwAgAU\
EoakEAKQOQjkA3AwAgAUEwakEAKQOYjkA3AwAgAUE4akEAKQOgjkA3AwAgAEGQAmokACABDwsAC4gC\
AQJ/IwBBkAJrIgAkAAJAQdgBEBkiAUUNACAAQQA2AgAgACAAQQRyQQBBgAEQkwFBf3NqQYQBakEHSR\
ogAEGAATYCACAAQYgBaiAAQYQBEJQBGiABQdAAaiAAQYgBakEEckGAARCUARogAUHIAGpCADcDACAB\
QgA3A0AgAUHQAWpBADoAACABQQApA6iOQDcDACABQQhqQQApA7COQDcDACABQRBqQQApA7iOQDcDAC\
ABQRhqQQApA8COQDcDACABQSBqQQApA8iOQDcDACABQShqQQApA9COQDcDACABQTBqQQApA9iOQDcD\
ACABQThqQQApA+COQDcDACAAQZACaiQAIAEPCwALggIBAX8CQCACRQ0AIAEgAkHoAGxqIQMgACgCAC\
ECA0AgAiACKQMAIAEpAACFNwMAIAIgAikDCCABKQAIhTcDCCACIAIpAxAgASkAEIU3AxAgAiACKQMY\
IAEpABiFNwMYIAIgAikDICABKQAghTcDICACIAIpAyggASkAKIU3AyggAiACKQMwIAEpADCFNwMwIA\
IgAikDOCABKQA4hTcDOCACIAIpA0AgASkAQIU3A0AgAiACKQNIIAEpAEiFNwNIIAIgAikDUCABKQBQ\
hTcDUCACIAIpA1ggASkAWIU3A1ggAiACKQNgIAEpAGCFNwNgIAIQJSABQegAaiIBIANHDQALCwvnAQ\
EHfyMAQRBrIgMkACACEAIhBCACEAMhBSACEAQhBgJAAkAgBEGBgARJDQBBACEHIAQhCANAIAMgBiAF\
IAdqIAhBgIAEIAhBgIAESRsQBSIJEF0CQCAJQSRJDQAgCRABCyAAIAEgAygCACIJIAMoAggQESAHQY\
CABGohBwJAIAMoAgRFDQAgCRAiCyAIQYCAfGohCCAEIAdLDQAMAgsLIAMgAhBdIAAgASADKAIAIgcg\
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\
AiQAQQAhAyACQQA2AgADQCACIANqQQRqIAEgA2ooAAA2AgAgAiADQQRqIgM2AgAgA0GAAUcNAAsgAk\
GIAWogAkGEARCUARogACACQYgBakEEckGAARCUASABLQCAAToAgAEgAkGQAmokAAt1AQJ/IwBBsAJr\
IgIkAEEAIQMgAkEANgIAA0AgAiADakEEaiABIANqKAAANgIAIAIgA0EEaiIDNgIAIANBkAFHDQALIA\
JBmAFqIAJBlAEQlAEaIAAgAkGYAWpBBHJBkAEQlAEgAS0AkAE6AJABIAJBsAJqJAALdQECfyMAQaAC\
ayICJABBACEDIAJBADYCAANAIAIgA2pBBGogASADaigAADYCACACIANBBGoiAzYCACADQYgBRw0ACy\
ACQZABaiACQYwBEJQBGiAAIAJBkAFqQQRyQYgBEJQBIAEtAIgBOgCIASACQaACaiQAC3MBAn8jAEHg\
AWsiAiQAQQAhAyACQQA2AgADQCACIANqQQRqIAEgA2ooAAA2AgAgAiADQQRqIgM2AgAgA0HoAEcNAA\
sgAkHwAGogAkHsABCUARogACACQfAAakEEckHoABCUASABLQBoOgBoIAJB4AFqJAALcwECfyMAQaAB\
ayICJABBACEDIAJBADYCAANAIAIgA2pBBGogASADaigAADYCACACIANBBGoiAzYCACADQcgARw0ACy\
ACQdAAaiACQcwAEJQBGiAAIAJB0ABqQQRyQcgAEJQBIAEtAEg6AEggAkGgAWokAAt1AQJ/IwBB4AJr\
IgIkAEEAIQMgAkEANgIAA0AgAiADakEEaiABIANqKAAANgIAIAIgA0EEaiIDNgIAIANBqAFHDQALIA\
JBsAFqIAJBrAEQlAEaIAAgAkGwAWpBBHJBqAEQlAEgAS0AqAE6AKgBIAJB4AJqJAALewECfyMAQTBr\
IgIkACACQRRqQQI2AgAgAkH0h8AANgIQIAJBAjYCDCACQdSHwAA2AgggAUEcaigCACEDIAEoAhghAS\
ACQQI2AiwgAkICNwIcIAJB1IjAADYCGCACIAJBCGo2AiggASADIAJBGGoQKyEBIAJBMGokACABC3sB\
An8jAEEwayICJAAgAkEUakECNgIAIAJB9IfAADYCECACQQI2AgwgAkHUh8AANgIIIAFBHGooAgAhAy\
ABKAIYIQEgAkECNgIsIAJCAjcCHCACQdSIwAA2AhggAiACQQhqNgIoIAEgAyACQRhqECshASACQTBq\
JAAgAQtsAQF/IwBBMGsiAyQAIAMgATYCBCADIAA2AgAgA0EcakECNgIAIANBLGpBAzYCACADQgM3Ag\
wgA0HQi8AANgIIIANBAzYCJCADIANBIGo2AhggAyADNgIoIAMgA0EEajYCICADQQhqIAIQdwALbAEB\
fyMAQTBrIgMkACADIAE2AgQgAyAANgIAIANBHGpBAjYCACADQSxqQQM2AgAgA0ICNwIMIANBsIjAAD\
YCCCADQQM2AiQgAyADQSBqNgIYIAMgAzYCKCADIANBBGo2AiAgA0EIaiACEHcAC2wBAX8jAEEwayID\
JAAgAyABNgIEIAMgADYCACADQRxqQQI2AgAgA0EsakEDNgIAIANCAjcCDCADQeCKwAA2AgggA0EDNg\
IkIAMgA0EgajYCGCADIANBBGo2AiggAyADNgIgIANBCGogAhB3AAtsAQF/IwBBMGsiAyQAIAMgATYC\
BCADIAA2AgAgA0EcakECNgIAIANBLGpBAzYCACADQgI3AgwgA0GAi8AANgIIIANBAzYCJCADIANBIG\
o2AhggAyADQQRqNgIoIAMgAzYCICADQQhqIAIQdwALVwECfwJAAkAgAEUNACAAKAIADQEgAEEANgIA\
IAAoAgghASAAKAIEIQIgABAiAkAgAkEERw0AIAEoApABRQ0AIAFBADYCkAELIAEQIg8LEJABAAsQkQ\
EAC1gBAn9BAEEAKALo0kAiAUEBajYC6NJAQQBBACgCsNZAQQFqIgI2ArDWQAJAIAFBAEgNACACQQJL\
DQBBACgC5NJAQX9MDQAgAkEBSw0AIABFDQAQlwEACwALSgEDf0EAIQMCQCACRQ0AAkADQCAALQAAIg\
QgAS0AACIFRw0BIABBAWohACABQQFqIQEgAkF/aiICRQ0CDAALCyAEIAVrIQMLIAMLRgACQAJAIAFF\
DQAgASgCAA0BIAFBfzYCACABQQRqKAIAIAFBCGooAgAgAhBQIAFBADYCACAAQgA3AwAPCxCQAQALEJ\
EBAAtHAQF/IwBBIGsiAyQAIANBFGpBADYCACADQdiQwAA2AhAgA0IBNwIEIAMgATYCHCADIAA2Ahgg\
AyADQRhqNgIAIAMgAhB3AAuLAQAgAEIANwNAIABC+cL4m5Gjs/DbADcDOCAAQuv6htq/tfbBHzcDMC\
AAQp/Y+dnCkdqCm383AyggAELRhZrv+s+Uh9EANwMgIABC8e30+KWn/aelfzcDGCAAQqvw0/Sv7ry3\
PDcDECAAQrvOqqbY0Ouzu383AwggACABrUKIkveV/8z5hOoAhTcDAAtFAQJ/IwBBEGsiASQAAkAgAC\
gCCCICDQBB2JDAAEErQaCRwAAQcgALIAEgACgCDDYCCCABIAA2AgQgASACNgIAIAEQewALQgEBfwJA\
AkACQCACQYCAxABGDQBBASEEIAAgAiABKAIQEQYADQELIAMNAUEAIQQLIAQPCyAAIANBACABKAIMEQ\
gACz8BAX8jAEEgayIAJAAgAEEcakEANgIAIABB2JDAADYCGCAAQgE3AgwgAEGUgsAANgIIIABBCGpB\
nILAABB3AAs+AQF/IwBBIGsiAiQAIAJBAToAGCACIAE2AhQgAiAANgIQIAJBwIjAADYCDCACQdiQwA\
A2AgggAkEIahB0AAs9AQJ/IAAoAgAiAUEUaigCACECAkACQCABKAIEDgIAAAELIAINACAAKAIELQAQ\
EG8ACyAAKAIELQAQEG8ACzMAAkAgAEH8////B0sNAAJAIAANAEEEDwsgACAAQf3///8HSUECdBAxIg\
BFDQAgAA8LAAtSACAAQsfMo9jW0Ouzu383AwggAEIANwMAIABBIGpCq7OP/JGjs/DbADcDACAAQRhq\
Qv+kuYjFkdqCm383AwAgAEEQakLy5rvjo6f9p6V/NwMACywBAX8jAEEQayIBJAAgAUEIaiAAQQhqKA\
IANgIAIAEgACkCADcDACABEHgACyYAAkAgAA0AQeiOwABBMBCSAQALIAAgAiADIAQgBSABKAIQEQwA\
CyQAAkAgAA0AQeiOwABBMBCSAQALIAAgAiADIAQgASgCEBEKAAskAAJAIAANAEHojsAAQTAQkgEACy\
AAIAIgAyAEIAEoAhARCQALJAACQCAADQBB6I7AAEEwEJIBAAsgACACIAMgBCABKAIQEQoACyQAAkAg\
AA0AQeiOwABBMBCSAQALIAAgAiADIAQgASgCEBEJAAskAAJAIAANAEHojsAAQTAQkgEACyAAIAIgAy\
AEIAEoAhARCQALJAACQCAADQBB6I7AAEEwEJIBAAsgACACIAMgBCABKAIQERcACyQAAkAgAA0AQeiO\
wABBMBCSAQALIAAgAiADIAQgASgCEBEYAAskAAJAIAANAEHojsAAQTAQkgEACyAAIAIgAyAEIAEoAh\
ARFgALIgACQCAADQBB6I7AAEEwEJIBAAsgACACIAMgASgCEBEHAAsgAAJAAkAgAUH8////B0sNACAA\
IAIQJiIBDQELAAsgAQsgAAJAIAANAEHojsAAQTAQkgEACyAAIAIgASgCEBEGAAsUACAAKAIAIAEgAC\
gCBCgCDBEGAAsQACABIAAoAgAgACgCBBAcCw4AAkAgAUUNACAAECILCwsAIAAgASACEG0ACwsAIAAg\
ASACEGwACxEAQayCwABBL0G4g8AAEHIACw0AIAAoAgAaA38MAAsLCwAgACMAaiQAIwALDQBB+NHAAE\
EbEJIBAAsOAEGT0sAAQc8AEJIBAAsJACAAIAEQCwALCgAgACABIAIQUwsKACAAIAEgAhBACwoAIAAg\
ASACEHALDABCuInPl4nG0fhMCwMAAAsCAAsL7NKAgAABAEGAgMAAC+JS6AUQAF0AAACVAAAACQAAAE\
JMQUtFMkJCTEFLRTJCLTI1NkJMQUtFMkItMzg0QkxBS0UyU0JMQUtFM0tFQ0NBSy0yMjRLRUNDQUst\
MjU2S0VDQ0FLLTM4NEtFQ0NBSy01MTJNRDRNRDVSSVBFTUQtMTYwU0hBLTFTSEEtMjI0U0hBLTI1Nl\
NIQS0zODRTSEEtNTEyVElHRVJ1bnN1cHBvcnRlZCBhbGdvcml0aG1ub24tZGVmYXVsdCBsZW5ndGgg\
c3BlY2lmaWVkIGZvciBub24tZXh0ZW5kYWJsZSBhbGdvcml0aG1saWJyYXJ5L2FsbG9jL3NyYy9yYX\
dfdmVjLnJzY2FwYWNpdHkgb3ZlcmZsb3cAAgEQABEAAADmABAAHAAAAAYCAAAFAAAAQXJyYXlWZWM6\
IGNhcGFjaXR5IGV4Y2VlZGVkIGluIGV4dGVuZC9mcm9tX2l0ZXJDOlxVc2Vyc1xheWFtZVwuY2FyZ2\
9ccmVnaXN0cnlcc3JjXGdpdGh1Yi5jb20tMWVjYzYyOTlkYjllYzgyM1xhcnJheXZlYy0wLjcuMlxz\
cmNcYXJyYXl2ZWMucnNbARAAXQAAAAEEAAAFAAAAQzpcVXNlcnNcYXlhbWVcLmNhcmdvXHJlZ2lzdH\
J5XHNyY1xnaXRodWIuY29tLTFlY2M2Mjk5ZGI5ZWM4MjNcYmxha2UzLTEuMy4xXHNyY1xsaWIucnMA\
AMgBEABWAAAAuQEAAAkAAADIARAAVgAAAF8CAAAKAAAAyAEQAFYAAACNAgAACQAAAMgBEABWAAAAjQ\
IAADQAAADIARAAVgAAALkCAAAfAAAAyAEQAFYAAADdAgAACgAAAMgBEABWAAAA1gIAAAkAAADIARAA\
VgAAAAEDAAAZAAAAyAEQAFYAAAADAwAACQAAAMgBEABWAAAAAwMAADgAAADIARAAVgAAAPgDAAAeAA\
AAyAEQAFYAAACqBAAAFgAAAMgBEABWAAAAvAQAABYAAADIARAAVgAAAO0EAAASAAAAyAEQAFYAAAD3\
BAAAEgAAAMgBEABWAAAAaQUAACEAAAARAAAABAAAAAQAAAASAAAAQzpcVXNlcnNcYXlhbWVcLmNhcm\
dvXHJlZ2lzdHJ5XHNyY1xnaXRodWIuY29tLTFlY2M2Mjk5ZGI5ZWM4MjNcYXJyYXl2ZWMtMC43LjJc\
c3JjXGFycmF5dmVjX2ltcGwucnMAADADEABiAAAAJwAAAAkAAAARAAAAIAAAAAEAAAATAAAAEQAAAA\
QAAAAEAAAAEgAAAENhcGFjaXR5RXJyb3IAAADEAxAADQAAAGluc3VmZmljaWVudCBjYXBhY2l0eQAA\
ANwDEAAVAAAAKWluZGV4IG91dCBvZiBib3VuZHM6IHRoZSBsZW4gaXMgIGJ1dCB0aGUgaW5kZXggaX\
MgAP0DEAAgAAAAHQQQABIAAAARAAAAAAAAAAEAAAAUAAAAOiAAAFgIEAAAAAAAUAQQAAIAAAAwMDAx\
MDIwMzA0MDUwNjA3MDgwOTEwMTExMjEzMTQxNTE2MTcxODE5MjAyMTIyMjMyNDI1MjYyNzI4MjkzMD\
MxMzIzMzM0MzUzNjM3MzgzOTQwNDE0MjQzNDQ0NTQ2NDc0ODQ5NTA1MTUyNTM1NDU1NTY1NzU4NTk2\
MDYxNjI2MzY0NjU2NjY3Njg2OTcwNzE3MjczNzQ3NTc2Nzc3ODc5ODA4MTgyODM4NDg1ODY4Nzg4OD\
k5MDkxOTI5Mzk0OTU5Njk3OTg5OXJhbmdlIHN0YXJ0IGluZGV4ICBvdXQgb2YgcmFuZ2UgZm9yIHNs\
aWNlIG9mIGxlbmd0aCAsBRAAEgAAAD4FEAAiAAAAcmFuZ2UgZW5kIGluZGV4IHAFEAAQAAAAPgUQAC\
IAAABzb3VyY2Ugc2xpY2UgbGVuZ3RoICgpIGRvZXMgbm90IG1hdGNoIGRlc3RpbmF0aW9uIHNsaWNl\
IGxlbmd0aCAokAUQABUAAAClBRAAKwAAAPwDEAABAAAAQzpcVXNlcnNcYXlhbWVcLmNhcmdvXHJlZ2\
lzdHJ5XHNyY1xnaXRodWIuY29tLTFlY2M2Mjk5ZGI5ZWM4MjNcYmxvY2stYnVmZmVyLTAuMTAuMFxz\
cmNcbGliLnJzAAAA6AUQAF0AAAA/AQAAHgAAAOgFEABdAAAA/AAAACcAAABhc3NlcnRpb24gZmFpbG\
VkOiBtaWQgPD0gc2VsZi5sZW4oKQAAAAAAASNFZ4mrze/+3LqYdlQyEPDh0sMAAAAAZ+YJaoWuZ7ty\
8248OvVPpX9SDlGMaAWbq9mDHxnN4FvYngXBB9V8NhfdcDA5WQ73MQvA/xEVWGinj/lkpE/6vgjJvP\
Nn5glqO6fKhIWuZ7sr+JT+cvNuPPE2HV869U+l0YLmrX9SDlEfbD4rjGgFm2u9Qfur2YMfeSF+ExnN\
4FvYngXBXZ27ywfVfDYqKZpiF91wMFoBWZE5WQ732OwvFTELwP9nJjNnERVYaIdKtI6nj/lkDS4M26\
RP+r4dSLVHY2xvc3VyZSBpbnZva2VkIHJlY3Vyc2l2ZWx5IG9yIGRlc3Ryb3llZCBhbHJlYWR5AQAA\
AAAAAACCgAAAAAAAAIqAAAAAAACAAIAAgAAAAICLgAAAAAAAAAEAAIAAAAAAgYAAgAAAAIAJgAAAAA\
AAgIoAAAAAAAAAiAAAAAAAAAAJgACAAAAAAAoAAIAAAAAAi4AAgAAAAACLAAAAAAAAgImAAAAAAACA\
A4AAAAAAAIACgAAAAAAAgIAAAAAAAACACoAAAAAAAAAKAACAAAAAgIGAAIAAAACAgIAAAAAAAIABAA\
CAAAAAAAiAAIAAAACAY2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZWxp\
YnJhcnkvc3RkL3NyYy9wYW5pY2tpbmcucnMAgwgQABwAAABHAgAADwAAAGNhbGxlZCBgUmVzdWx0Oj\
p1bndyYXAoKWAgb24gYW4gYEVycmAgdmFsdWUAAAAAAF4M6fd8saoC7KhD4gNLQqzT/NUN41vNcjp/\
+faTmwFtk5Ef0v94mc3iKYBwyaFzdcODKpJrMmSxcFiRBO4+iEbm7ANxBeOs6lxTowi4aUHFfMTejZ\
FU50wM9A3c3/SiCvq+TacYb7cQaqvRWiO2zMb/4i9XIWFyEx6SnRlvjEgaygcA2vT5yUvHQVLo9ub1\
JrZHWerbeZCFkoyeycWFGE9Lhm+pHnaO133BtVKMQjaOwWMwNydoz2luxbSbPckHtuq1dg52DoJ9Qt\
x/8MacXGTgQjMkeKA4vwR9Lp08NGtfxg4LYOuKwvKsvFRyX9gObOVP26SBIllxn+0Pzmn6ZxnbRWW5\
+JNS/Qtgp/LX6XnIThmTAZJIAoazwJwtO1P5pBN2lRVsg1OQ8Xs1/IrPbdtXDzd6euq+GGaQuVDKF3\
EDNUpCdJcKs2qbJCXjAi/p9OHKHAYH2zl3BSqk7Jy089hzLzhRP75WvSi7sENY7fpFgx+/EVw9gRxp\
oV/XtuTwipmZrYekGO4zEETJseroJjz5IqjAKxAQtTsS5gwx7x4UVLHdWQC5ZfwH5uDFQIYV4M+jwy\
aYB06I/TXFI5UNDZMAK5pOdY1jNdWdRkDP/IVATDrii9J6scQuaj5q/PCyys0/lGsal2AoRgTjEuJu\
3j2uZRfgKvMiYv4Ig0e1C1VdKqLtoI2p76mnDcSGFqdRw4R8hpxtWAURUyii/YXu/9x2714sJtD7zA\
HSkInLlPK6ddn6KvVklOYUPhPfrxOwlFjJIyij0acGGRH2MFH+lW/ABixGTrMq2dJxfIgz3nvtPjkY\
ZW5tdHkpM3FdOBmkW2R1qUi5pht8Z6z9exl8mDECPQVLxCNs3k3WAtD+SRxYcRUmOGNNR91i0HPkw0\
ZFqmD4VZQ0zo+S2ZSryrobFkhobw53MCSRYxxkxgLmpchuK919MxUlKIcbcEsDQmvaLG0Jy4HBNz2w\
bxzHZoJDCOFVslHrx4AxK7yLwJYvuJLfuvMypsDIaFxWBT0chswEVY9rsl/lpL+rtM66swqLhEEyXU\
Sqc6I0s4HYWqjwlqa8bNUotWXs9iRKUvSQLlHhDFrTBlWd151OeZfOxvoFiSUzmxA+WykZIMxUoHOL\
R6n4sH5BNPnyJCnEG21TfTWTOYv/th3CGqg4vxZgffH7xEf142d23aoPHpbri5Ni/7x6yXnBj5Stja\
cN5REpt5gfj5EaEieujuRhCJiFMa33Yk3r6lzvRaPr7M6Elrxess71IWL3twziM/bkk4KrBt8so6Qs\
7qUsIFqYsY+KzEeEC8+jWZiXRFJ2nxcAJKGxFtWoJsdduz661ws522q4VcpL5WOAR2z9Onod3Z5m5w\
jGnlEjqknRohVXDpTxj4RxRX0XIkwBQTJfte7CLm46oVxeD2HD9XV7kimANuTWw6ufE60vQM9MqfFd\
Dcjfpb5I2Ys+fvc/vVfToKVF9nQfJS7RooKggV5Snv1mSXpof86QDC7FO5e6vrzowl90CeW8AQAA1r\
Pa5rt3N0K1bvCufhxm0djPqk01H3ih/K8WK0ooES0fHYn6Z0/88doKkstdwuxzUSahwiIMYa6Kt1bT\
EKjglg+H5y8fOJpaMFVO6e1irdUnFI026OUl0jFGr8dwe5dlT9c53rKJ+JlD0eFUvzA/I5c8ptnTdZ\
aaqPk0809VcFSIVk9KdMtqFq2u5LKqTMdwEk0pb2SR0PDRMUBoiSq4V2sLvmFaWtnvmvLyaekSvS/o\
n//+E3DTmwZaCNYEBJs/Ff5sFvPBQEn73vPNTSxUCeNczYWDIcW0QaZiRNy3Nck/ttOOpvgXNEBbIV\
spWQm4coWMO+/anPldufz4FAaMAfPNOhrNrBQbLXO7APJx1IQW2uiVDhGjwbiCGr8gcgpDDiHfOQ0J\
fredXtA8n730XkSkV37a9k+d+KXUg+FgHdpHjpkXhMOHsoYYsxsS3D7+78sMmMw8/scD/ZsYkLVv5N\
xXTJpG/TI3Za3xfKAA935ZiB2jaETGWfZhW9S0sC92GHcEmdCuWxWmulA9TF51aN+02CJ/TiHp9JWs\
LlO/3SoJAb20CTmuMlA0jrA39U2DjXIgQqidIPr3I/6emx1pnn+NrsSI0kYEW3hp4STFTHuFE8o1AX\
/YIaWKexMPQLvOvpYHWGYrLifesMIlQSYSNrL7Hq29AncF6Uv4rI67utR7xhtkOTFYkSTgNoDgLdyL\
7Wif9FaBPGARUe/b9zbS94Ae0opZxCeX118KZ5YIiqDLqesJQ49Ky6E2cA9LVq+BvZoZeKeaucBS6c\
g/yB6flbmBSnl3UFCM8DhjBY+vyjp4Z3piUD+0B3fM7PVJq0RKmO55tuTWwzuMEBTP0dTAnKDIayAL\
wAZEiS3XyFSIoYIsQzxcs2bjZ/I3KxBh3SO5HSeE2Hknq1avJRX/sOGDvqlJfiHUZXz71OdIbefg22\
ueF9lFh4LfCDS9U92aauoiCiAiVhwUbuPuULeMG12AfzfoWJ+lx+WvPMKxT2qZf+LQ8HUH+32G0xqJ\
iG7ec+bQJWy4r57rOhKVuEXB1dXxMOdpcu4tSkO7OPox+exny3icvzsycgM783ScJ/s2Y9ZSqk77Cq\
wzX1CH4cyimc2l6LswLR6AdElTkG2H1RFXLY2OA7yRKEEaH0hm5YId5+LWtzJ3STpsA3Sr9WFj2X62\
iaIC6vHYle3/PdRkFNY7K+cgSNwLFw8wpnqneO1gh8HrOCGhBVq+puaYfPi0pSKhtZBpCxSJYDxW1V\
0fOS7LRkw0lLfJ260y2fWvFSDkcOoI8YxHPmemZdeZjSerfnX7xJIGbi2GxhHfFjt/DfGE690E6mWm\
BPYub7Pf4PAPD45KUbq8Pfju7aUeN6QOKgpP/CmEs1yoHT7o4hwbuoL4j9wN6FODXlBFzRcH29QAmt\
EYAYHzpe3PoDTyyoeIUX7nCzZRxLM4FDQe+cyJkPSXV+AUHVnynT/S/83FlYUi2j1UMyoFmf2BH2Z2\
ew/bQeY2hwdTjkEldyIV+rIuFkZ/X+L+2RNsErKoSOpu55IXVNyvj4nRxr8S2QMb9YMb+qqxMdm3Ku\
SWJ6zxrOvS/Neno0DFvPsKbRNWEIUMbZrd4Yl4qnR5KnglNdObwIoHCV3ip9DtxuqzOEG9cJ7rcb6/\
CpJcYsJP9dCloqOQEgtr41TAK5P+Yv9Z3fZ9rKgRRTU3NdTc+nKRXoTK3CCdMmAr+IQYL2fN4SzGeS\
xkJNGtogmLJufZGWrpwdAMUKlLm2p4WvNDTGM2AwIOIthm60pHe8HCqpvs4xpzalgChOB6ZiaCpezK\
kXZW1Ge1rXVIXBWUHd8/gVuY/QBtBs10t/xuKFGvRKcfRzSIXi6uYeeuoCz3muDors3kQL5l9hhRuw\
uX6WQZ3zPrS25yYpcZKQcAO3CnMO/1FtgxRr6mBBW1tYC4bEvYfsOTF2SWfen2d+0he3Nr+S4xBmN3\
9PNv6EiJUq74+KOG8tfbU2MQ/Ezn3MoW3cZS+r0ZXADTatRkXY+GaGoYHs8sUZ06rmBWOMJifjbXsd\
x36udZ426+mnRzB2xSS3Of0PnlWnOoi1WKzMc/SUWrQTBTwbmwvVkKR7pYGTKTw0ZfC7AtheWwNtMr\
myCRn/GeZX1PYG4kyyx44oqaucfEFMi2KvXMe3IRvq/ZJ0dNsyEBDA2Vfh9HrXBWQ291SWhaYULUrf\
V6lbmAmeCHTlXjrlDfoc8qVtUv/TommNjWjwzYTZL0yDoXSnU9ypnPPL+Rr6x7R/4twZDW9nFT7ZRw\
aF4oXBqDpKAINwrJ08WAZdAXN5B/D3/y/bgTu/kZQyhQTRtvvbESQP+Poxt2HDsf4uLEMBUNiiw3p2\
nOQ4lmzrX+EU4Y5SFmc72A24thC01Xi9a6KX1b/uYlPmG7gT+RB7wQnBwHly2sCXnrvsdX18U7NY3l\
w+hhj/OSeAHrGsIcm5z779Sr95T0Jn1ymQM+a5WiY+CjMJygSpqLSp20DwkA1bdqP8CKJleg8sCc0U\
K/7S2d7j1yqWB5yEkPM0EbQocCcrLGnDYAfMCexQolNDXLSaxO79gpAe9OJFD0tt70yuVGzIr3Y5KY\
Y6v+L3hFel3+uXyPNUZjTmT32FsAyS2/FXN6QhwmJSGqxNAXUI5Rk2xIkjnD1Nei4P7LtI3dXSwg1n\
V8YWxb49iVwtsZKwMC02mzYDJB5NxfaELOEFb23bnd8wbwSOG1HdKkjm9JzS/m/LAgMe6wWCORGywI\
o/UYuBeDss/SppwYHpyoyNuqalcYawzj+pkSqepdtucnEH9LeSv761s7RH8x5ASm0DlZMi2FS/x/IP\
vua67VdNPHgbKCljB1tMOUoQnjugWftBN7+cOMZzkp+C9CqZh8/3YQsBZLJO5nPWYcV7/4oQ3j7lhn\
DR+3ud562RG2yaJXbHuI1a+34U+Ya4SukGL9pcGs3kzflP86SMXRW4oFNzy6QsFsFmNAb/eyblK4jU\
5tDW8DgAjhHTEdl8kjBZ6R1nzMJCjsRcmCI+ZZg1tXlZmIxA1AnvpoFXJFyz6C0S8IBoI7mP3ay6iG\
IwgpfaqIdbgDRM2fJuDRvSj39ZEb9gECBDmfZuTeSvCMIXwdes7lnNcpPGJlsQvAlpBEaCO6A6Wdh/\
Gbq44FWKSx7CO8zB5AuwHfWJo9FF+oaOhwoJ4j8n0wiPFPgxFkGrRl1RQCFnBSdDMT7gleKD/PPQ6V\
UwnIuVQCk1lt2jCJQJnyO4cTaVM/lFWphIfLqcreXqGg6Ss1JyEUKft6Tv8fN/B2KCJPJ1D0OQKLhl\
4d8DoHu8GWDsFxBci/Iy4iaIUIZ9KwtYCO1KNxloG7k+GK07VVuASLodDiOmlfM9Wt7LRIXMqhFkkZ\
O3T9xJi+NIEBdyWtpFQ86Id557nhM9oUEOEoE6JqIp7FDCdgXxptdV9JcXfvr2D7U+ibvz1E96eGx6\
2CmrJzYUUECV69MsJmerxYssg6Z4xVBvMqd8m2xjn2Qdo12p/p720hFeZ7HMcMZBEnVVxWlDbEkzl4\
d0ZijgPqaSQ+Ws7zq/nSEtMPjXYedMZS1s6DuEQBUoU/o1taC8KdWkPDM5bmGuz9jAikjKKXIPSWHj\
ykJIhGp+5upi9hN1oOz/llsUxrSvuroAYcqkNreWLxb8JNfw+b7VSOzLpsPiW70u//t6ZPnaKwlbwl\
Low48d6LpdaGVPC2dsVK195dgEUrvL0wgImSTelwr4E82wAxntpt/z5HiMzfn8ONs364F41ShTgSQr\
axQNIO2vKp+UvV3PrOROZ+PEMOIBITSMd4Ok/I/J+7doUkch/N8OTPODYFdGnsTE7sDHy2pyvtMs7l\
800vrBFM6iZD0TPLvFh+x0wE6aTv/DTZkzJRX0RU5QZVZMldCuR9MY9B3lBZ4t1pGrOMOIYKglU0qL\
Qt6RpxhB6pEJBxg0mxt/D3TXlxl8CrLirWDlyNqpfA+iKb89rxL8yf9IGS8m/G1X9IP6jc/GcGo+hj\
zvzS40ubLMK7+5NL9z/aZrpw/tJloS/Ukw6XeeIDoXFe5LB37M2+l+SFOXIetM8XUPdeAqoKt+C4QD\
jwCSPUeYWJNdAa/I7Fq7LiC5LGlnKRWjdjQa9m+ydxytyrdCFB/3JKps48s6VmMAgzSUrw9Zoo180K\
l41ewsgx4OiWj0ddh3YiwP7z3ZBhBRDze+yRFA+7rrCt9ZKI1Q+F+FCb6E23WINIdUlhHFOR9k81o+\
7G0oHkuwIHmO3tfQUk+4kC6ZaFE3UwrO1yJxeANS0dDcNrjsKPc+smQwRjj+9UWL473VoyUlyeI0Zc\
Ms9TqpBn0J00UU3SwSSmnqbuz1EgT34uhgoPIhNkSOAElDk5zrf8hnCkLMTZzOcDiiPSWmjb8S+rso\
RkBux5v+9wXZ3+VBhInN25E1utCRXtddTwFVGYxw4GzesL+Lc6GJFnjNXk7vNSUHwY0f+CTuWSEV3J\
omysuUyh7oZdfWdTsb6FNCpJjB94HRnd+euEp7pmCPZ0jNCiO2SPUSJ8COFW6VKIja4QxI3LaKcaju\
y/JncEOKpFO820OHemGd4N7BxpFq0HLkaAkzHUxjgZpgtth6XFQNiPpR/6uRYYT6c8F7GKGB8CnMmY\
L9qrFuhKE6uABT67WmRztwU7X/bydVW+ogElqYt+TgB0LxtT2ehxA1jXHDBOdmKV2G5/PQBvWf8mWb\
G51sWoPSlln0z4kNZN8M5uiK8z/18ngkcBCII/CDMU5LX5GppA/g39aznbLDSjJUNSsgGzYn7nilph\
VWafnm/DCSzTki1aRYWFdEdJqd7H8rqeozPBtM9jYlS8bsxAsIOwJrP9yFSUO4zX/4eeavVWxiv0mQ\
2Uwi0tbglrCd/3mL9S2Doe4KYZC7TU28ucqUJZxelFr5iZpYYx2QfolWI2c/eh+hsYSGsdCnoV4lfs\
H9UaIPZqRGdGdfCwz8rrFeZ4ByloTx/zuB7RIs7WPnEiO8nDLqfBVzAvHz98w6xGyw71qgL9k7jbz5\
8LYC7ZHzPWOupIYfmYpOqDaotuQtio3Fxzt3SyiaARSlIec7P2h0lnycvlCIgRlNObscfkBpkMoiSb\
fn/tr6dENuve6gll3g7v6NPxHmy0j3npQ33JuaMoDHSE1/Kib1aXYUeWhHudBl+25uNbehBvvnjtMG\
P5FWoHeucN5u7Qm4ugSu5LK06JuMc+plZq9P40ulkTEgL8Azco+Jm/TMgwrww1cYA5emgX8Il6p9Bp\
NUKe66nB8ZmB7i0odnmMvXof3aU3F12A+qkJPENTT9mhfN9TDIv6d8tsiLzc2T8gRxupfJFAwN/c0f\
lCAdB9WHs4Tx38doQDZTHzxef4Izlz4+dEIioDS6f1UNelh1wumZg2xEwrCDz2WLjse5Hf2m34W/y4\
cDJ23bUpu3KuECs2AHdOyWpXj/sextoS0RonpPrFDsMbaUNxMswRYyT/BjLlMI42QjGWoyzgMQ44cf\
F2rQqWXI2VNqVtwTD01vjS4ecbP9H/yOHbTQBmrnh1RuZ7BgE/gwVtWP47rbU0u/CXK6HJNF8JqAzW\
JUW2eiTRd3QB88bb3E3Syt7UFC5K6x4Kvtnmtb2rAUN593B+Kv1ABSeKLfTewSJMo8COBwGHY8H0Gl\
He5Qozmr1SOrt+NWR9qld4aXcyTK4DFoNOABLjeK0gEKLn8iC0agynQZ3mQRHqGGzgKChrT5i9jLLS\
g51uRGxftyZ/jUFNjFZHuo49GOa/rQvYRGAWX39tIA4+yssROaRY4rzAHbJGFzpy083X9VSoysecHS\
Y9iDKsfCyUuiNkwpB2uEKARyRV5RefOKJWdke+4KAtq2demyhNMf27j5wrhkRlExSdBMh8tJPHkSs2\
GyyC2N8T+1VGsU57qeIUB7rLHhRf3lydRUNhiazw1fH7qFMAW14c2ATql/Oz/dSogSFiCBIqV0HTvO\
mK5cxDhiURFKTgxqT+xUSRD2LPZWXQMw2hnCGfSI2kVCHIY22sXj7Erw13cjqLcqnvh98ge06T1+WG\
Phq2A1XjBNUZyPsh48qmv2Css1CaEsO2n37qaF7Nx7GDlBmQHLBsN5XC1TzpPROtuSrfLtWuhHigwB\
L1YC7JEGLjo4Y9vM5RORabnSY1+rXN0CpufQwzV3/Yl2LoWeewjYkh8o4pfqql0SkAAFVFGwa14YrA\
izpwkmwrHMPCQu8lr2tZzJRWBFQi23MdCpoXxNn5oLYEYDw9rqKv/e/ElpS0WwfI9+PUHB0Ux8WcNF\
WOITgWvXhqJFD4aBXxsim8ApX6vPrtGwUj2vLlbHl8U5PcsCjhqq4pS+6gPUk615VoQSxr37U3fy0S\
Jb2r/LHEXRBYC4FwkCqI9zfdD+FcP4pRtcpNUlslUYSHhZ484jS9GYGCKUDL7Dxdb1ugdMo+4UIVAh\
C2rOJZL9F5+Q9QzPnkJ9o3YH2E8Q1al5Je/iPm05DhbdZIgFZ7uNYyUG4hNYLOtzaaSkv2JHoqJ4D3\
FmmMi+3vk1UVzkz0v903Jb2ZS13blUvAL4Fpof3TkrYLZpCaShr7srmkRmkZDHNo2kl/qonigV+gsY\
MPmmZki/REln3/syezdbaNXGFrzJW+67y5IE9ngllldYIjMW8Fz0U+cYjkWlcRwlSZn2G/6eqoQGDE\
uurNwcDy6W9MRRxpEmRJ9pxBcA9bJu873NOeilfD9WAObVU8MiaFYA5b9Vkb+qnBRhr6j0x8oUXiqd\
dVKdtZUcplwq81znYK2wVFPRGpfsfqgQ0KrLaK+I5S/+N7WVOinqBWzUiss98NQ2/kXPR6prPEXtDi\
+9jPzk7wNZmzEG/1PsYZ1pyC1iILaSDfdApG/RdA7RCFjsz4bKfKbjq/JMjWSXCBGlg9JGGiY8G7tq\
yLBDLMRH3CiqPZqxD0qlv/3X9LggSoWkltrZSfjC1Pp6bh4+jeNRKF99ST2EBliH9L/dq/pCoEIHwk\
fDLRF8WhbgmFZho2tGZp1X0FIRLDpX0n9886pJOY1ZSBIsDNHMXwZNuJYf/EvDM98WrmTBjLBeDqm7\
kdHc1c/w+YQv6nVLiwn0uNcWpq1HuM/aUizKgP0TG95CuVhBTTRzgky1+X+scHxEZYHu2GSAQLtx55\
280of0Fz9eILsMJ3+IAhRZCVXADrcPP/3Wt6pNbZ1jieUM4Cp39kAA/r6wZvYHbPBswdCv+Goovy2e\
RiwhjJXTBa2FRfIjKHHVtH/rXMaBa1Ty0guivX2bl5pqVDLZENHIRT6KQSv0iqfjvfHS/yRw4eeHMJ\
tQrmDPLvQrf/ndFh0iA5LioGAyuhFpUEZTki62AZuLgO1f4WHCVuASb4MMPAmnF2PpVlJhXtcJU2pp\
Qx1gKHybGUg/B0UOFcspCMWbpw9kKXC4EVSnlsjK/86SVZDU50aNhscWcwG3PX6HewCpFhL8Ra27th\
amcVhfD7PlGT1emDnktylPSNZAlcmOGH6P0MN3XG07E0XSUNvDPkNdzgGxM0Qriq0K9+i7RQKgQINa\
ujRO7El5nQmRcgSXuagkFExbcHgzsmpmxq/fSVL3XlxggsQBdyku7ZladUt4oqPZRyL1X3QqQIEngZ\
TjMxLJFi7up8jalPCbNdZi+Gw1XzsVNdFxAGvSc/QUC4bP5GWfoM35I34D+PXrguNwDnzxjhvK3nKb\
6n3TGE3lzuROU+h/FBGxt4iufw0qB4TMmlKAe2dyguQTkspsmv814mocUGJWoMd8K8Es7h3NVttjo3\
W2dK0JlU5hbSv4E0Uo99ifMV7Pxkbw/IE1uLYb7vdB0+JxS3gtysF50ZA+C/QN34YeDnV5LpN6padw\
RpYlL6+VY9Rjr2u4tkbqJDFT8B8JjInoeffjCozHcBFaQnTMxIMx3KLC9DGxOgb5+PHx3e1t2nR6AC\
ZmDHshzMZKs30tPR/CVyjpObdvQPjnADTuwtwQM92vuy/pqIQ+7SzguuQ0/76yOJyyJtOfc8AQ02aS\
Lg1NICNl6FTHgf0LoFOAdG9VI4E3rhMzi2x4oFdEjfSqGKZ5yykrrNrfpsx5/oDDSeMwgJTp1fuSNZ\
Hynpr/FfJkoP9oA0bhyEm7IqOr/urbSRj6g4GeLD08ZF+O/fV/KqLPYLawAveO51b+959GKpFokc1F\
qlEVPU/oSQ0iny5gCwFnvC8UJ0wCOYdHYfK2BTdMKj7HZLvZEWuWP0mIxq5q3xPMm8FJeDRW0+IYWI\
EUdNJ/B9F45RKT9QtXObtGtr+cNogRYQrrDKYzuWPQ4U26FVVkv8jVzeFG418Yn3wdpRTq9oPmjZD0\
uNnU+oydH5oFI/4JE2gI6H4UZu2F5QcdCZDhpxPBCTTgyyZQhaLmjw5B/8+1ab314Q412N6noYeSOx\
/atxnHvnvuGduS4jRc8z6sDsIaHHBRhS16RZcnyuVuv1ljjcdY+xPY9jqo6A6auNNTmfrHILwJH63r\
eSLUli/UFVa1tNLvno3sZtfuq+xKtXPzXOkFba1mlXc4QUOUKmSiMKnQ34KIBQ+fYV8rN6ohnjuE0a\
NFERnK0xBVjve6UiPHczhpYHGlbHRTa+nSSe2hP5aEymeJstZdrvNMM7f6knTPQXa+YgEmJ2C33Nmo\
lDd5aCZ+3gylvu8/x5yAA2dZ9Atm2StTma0AaIxXoxsK6DbyEfOIZKyuYBJTCf0WI0/2b7O/3dJHwg\
cuvi7OLTtvZK3gjqx75NmZzEi5qwl+WsSbqXB89mR4yzdSp8xXOTGxNYHpNhziyCsQwcugm5VXWd0h\
F9k92vfxLkkm3GrTvaKbzswlRx1cGiJP72gk0TxVhPJ2JbUeM6HCaBywEuyAfpy3/jExkJ7fjJRgDI\
+dhJMmP7iOPtm8+AnvFsEZpTgRhXJNVr9/MDUaj3R6715rcVz5x+1N7G19sauygCQVzlRJlO214l1E\
e2MPyquCuIEV0qIdMpu4sJ9bOWAukU6rWPWgLdVyGUe2e1rJCjwOdY+wFKvYNMZ9OJO7nzS9+kLZ4p\
SKuMMh7E/FIsWLqWjPMDsl3Yf7290cqDroJgwUK0u7Ca2qVr6F+5P6lxN2cELrLYUjFJyVhThB5UtJ\
eGSCq+ZmmO0y3copUrhTySrBEswHuo8g2ZsYgjvjdPG/oIgHwD5VRNyNBwH9RXzn7srZBUOjoG2Sc8\
KwC/ojCAhKOufsADIO1tMgLGhkCpaX0op4OKevUwy196xXnn63nkRGi16bzcBQ+0c6PiDleIbnga16\
D26L3NupyHL6NkwbzRapeL12aWXuIhqzzD5eWqYxCQkI1pSESzGJi7ih4+rodk47TcO4kx+b2vGdW7\
X9ygRWPKZZSbJv4ohuxRnD9gAV0et0lQoQZA5E2xy3b35XBsv+0rVe/yGBJBozZacAgHDMtEYJhPdR\
RN5w4oqA5D2VbNZVBfU9eRJcGW7wpy8SMyyB+lY3NvOaDD782riWdFIwEQMlR2mLrc/ofhssO0pZbw\
bnVsbCBwb2ludGVyIHBhc3NlZCB0byBydXN0cmVjdXJzaXZlIHVzZSBvZiBhbiBvYmplY3QgZGV0ZW\
N0ZWQgd2hpY2ggd291bGQgbGVhZCB0byB1bnNhZmUgYWxpYXNpbmcgaW4gcnVzdADnz4CAAARuYW1l\
AdzPgIAAmQEARWpzX3N5czo6VHlwZUVycm9yOjpuZXc6Ol9fd2JnX25ld19kYjI1NGFlMGExYmIwZm\
Y1OjpoYTI0ZWExODBiNTMzNGVmMAE7d2FzbV9iaW5kZ2VuOjpfX3diaW5kZ2VuX29iamVjdF9kcm9w\
X3JlZjo6aDE5ZDUwMGYzZTBmNDllNTECVWpzX3N5czo6VWludDhBcnJheTo6Ynl0ZV9sZW5ndGg6Ol\
9fd2JnX2J5dGVMZW5ndGhfODdhMDQzNmE3NGFkYzI2Yzo6aDIzYjEzYTM1M2UzNzgwNDIDVWpzX3N5\
czo6VWludDhBcnJheTo6Ynl0ZV9vZmZzZXQ6Ol9fd2JnX2J5dGVPZmZzZXRfNDQ3N2Q1NDcxMGFmNm\
Y5Yjo6aGU4ZWUxMDAwODAyY2Y4ZDQETGpzX3N5czo6VWludDhBcnJheTo6YnVmZmVyOjpfX3diZ19i\
dWZmZXJfMjEzMTBlYTE3MjU3YjBiNDo6aGQyODBkYTQzODQ1ZDc4NGEFeWpzX3N5czo6VWludDhBcn\
JheTo6bmV3X3dpdGhfYnl0ZV9vZmZzZXRfYW5kX2xlbmd0aDo6X193YmdfbmV3d2l0aGJ5dGVvZmZz\
ZXRhbmRsZW5ndGhfZDlhYTI2NjcwM2NiOThiZTo6aDIyMDMxMzZjNzkxZGI0ZWEGTGpzX3N5czo6VW\
ludDhBcnJheTo6bGVuZ3RoOjpfX3diZ19sZW5ndGhfOWUxYWUxOTAwY2IwZmJkNTo6aDFlYmRmMmI3\
NWFkMTNiNWIHMndhc21fYmluZGdlbjo6X193YmluZGdlbl9tZW1vcnk6Omg0ZGMyNzVjOGQxYzk5NT\
cyCFVqc19zeXM6OldlYkFzc2VtYmx5OjpNZW1vcnk6OmJ1ZmZlcjo6X193YmdfYnVmZmVyXzNmM2Q3\
NjRkNDc0N2Q1NjQ6OmhmYjkxMmFkZTU5OTgwMjI5CUZqc19zeXM6OlVpbnQ4QXJyYXk6Om5ldzo6X1\
93YmdfbmV3XzhjM2YwMDUyMjcyYTQ1N2E6Omg3OWM2MDkzMmI0ZGIzMjc4CkZqc19zeXM6OlVpbnQ4\
QXJyYXk6OnNldDo6X193Ymdfc2V0XzgzZGI5NjkwZjkzNTNlNzk6Omg3ODI5MjAwOTM4ODkwMzFkCz\
F3YXNtX2JpbmRnZW46Ol9fd2JpbmRnZW5fdGhyb3c6OmgwY2ExZmFiODliODNiMzgzDEBkZW5vX3N0\
ZF93YXNtX2NyeXB0bzo6ZGlnZXN0OjpDb250ZXh0OjpkaWdlc3Q6OmhmMTg3OTkzNzQ4MmU1ODQ3DS\
xzaGEyOjpzaGE1MTI6OmNvbXByZXNzNTEyOjpoZWM3NGU0Nzc0YTdlMDQwYQ5KZGVub19zdGRfd2Fz\
bV9jcnlwdG86OmRpZ2VzdDo6Q29udGV4dDo6ZGlnZXN0X2FuZF9yZXNldDo6aDZhNGZkMjI1ZjY3ND\
ljMGQPLHNoYTI6OnNoYTI1Njo6Y29tcHJlc3MyNTY6Omg0NjllNDIyNzljM2Y4MmQ1EBNkaWdlc3Rj\
b250ZXh0X2Nsb25lEUBkZW5vX3N0ZF93YXNtX2NyeXB0bzo6ZGlnZXN0OjpDb250ZXh0Ojp1cGRhdG\
U6OmhhNmVkYjg4YTFmMDk0OGYxEjNibGFrZTI6OkJsYWtlMmJWYXJDb3JlOjpjb21wcmVzczo6aGIw\
YmNjYTI1NzQzZTJiZGQTKXJpcGVtZDo6YzE2MDo6Y29tcHJlc3M6OmgwMjMzNjA1NjhlMTc3ZWE5FD\
NibGFrZTI6OkJsYWtlMnNWYXJDb3JlOjpjb21wcmVzczo6aDdhOTlhN2EzMWUwNTc2ZGQVK3NoYTE6\
OmNvbXByZXNzOjpjb21wcmVzczo6aDY3NmE4YzFhODBiMDA2Y2QWLHRpZ2VyOjpjb21wcmVzczo6Y2\
9tcHJlc3M6Omg4ZTkxMGYxOTdiYjdkYjc5Fy1ibGFrZTM6Ok91dHB1dFJlYWRlcjo6ZmlsbDo6aDBm\
NDU2NzBlZDUyOWE3ODgYNmJsYWtlMzo6cG9ydGFibGU6OmNvbXByZXNzX2luX3BsYWNlOjpoODJhND\
gzNWJhNzhhZTk5ORk6ZGxtYWxsb2M6OmRsbWFsbG9jOjpEbG1hbGxvYzxBPjo6bWFsbG9jOjpoYTk2\
ZmNlZmJiNDRkNmRhNRplPGRpZ2VzdDo6Y29yZV9hcGk6OndyYXBwZXI6OkNvcmVXcmFwcGVyPFQ+IG\
FzIGRpZ2VzdDo6VXBkYXRlPjo6dXBkYXRlOjp7e2Nsb3N1cmV9fTo6aDdkOGMwMGE0OWNjNTAyYTkb\
aDxtZDU6Ok1kNUNvcmUgYXMgZGlnZXN0Ojpjb3JlX2FwaTo6Rml4ZWRPdXRwdXRDb3JlPjo6ZmluYW\
xpemVfZml4ZWRfY29yZTo6e3tjbG9zdXJlfX06OmgyZWRlNTY0ZDNiOWQ5YWE1HCxjb3JlOjpmbXQ6\
OkZvcm1hdHRlcjo6cGFkOjpoOGM3NTNlNDk0ZjdiNTY5ZB0gbWQ0Ojpjb21wcmVzczo6aGEwODdhNj\
g2M2E2ZDVkNjceMGJsYWtlMzo6Y29tcHJlc3Nfc3VidHJlZV93aWRlOjpoNGUwOTU3MTJmOGIxNGVj\
NB8vYmxha2UzOjpIYXNoZXI6OmZpbmFsaXplX3hvZjo6aDFkYmIzNWJlN2MzYTViYjMgPWRlbm9fc3\
RkX3dhc21fY3J5cHRvOjpkaWdlc3Q6OkNvbnRleHQ6Om5ldzo6aGMxMDI1YzRlNmI0MDc0YTYhE2Rp\
Z2VzdGNvbnRleHRfcmVzZXQiOGRsbWFsbG9jOjpkbG1hbGxvYzo6RGxtYWxsb2M8QT46OmZyZWU6Om\
hhNDczN2I3Zjg0OTcwYWRkI3I8c2hhMjo6Y29yZV9hcGk6OlNoYTUxMlZhckNvcmUgYXMgZGlnZXN0\
Ojpjb3JlX2FwaTo6VmFyaWFibGVPdXRwdXRDb3JlPjo6ZmluYWxpemVfdmFyaWFibGVfY29yZTo6aD\
k3OGVkYTNlNWJmNGQ4NWMkQWRsbWFsbG9jOjpkbG1hbGxvYzo6RGxtYWxsb2M8QT46OmRpc3Bvc2Vf\
Y2h1bms6OmgzYjZjNGU3NGZhOGFhMDRiJSBrZWNjYWs6OmYxNjAwOjpoZmUyMWFkMGU3YjIxYzU5Zi\
YOX19ydXN0X3JlYWxsb2MncjxzaGEyOjpjb3JlX2FwaTo6U2hhMjU2VmFyQ29yZSBhcyBkaWdlc3Q6\
OmNvcmVfYXBpOjpWYXJpYWJsZU91dHB1dENvcmU+OjpmaW5hbGl6ZV92YXJpYWJsZV9jb3JlOjpoZG\
Y0OWFhZTRhMjkzNDMwMihOY29yZTo6Zm10OjpudW06OmltcDo6PGltcGwgY29yZTo6Zm10OjpEaXNw\
bGF5IGZvciB1MzI+OjpmbXQ6OmhjNTBhMWM5YjgyZWI0NDQ2KV08c2hhMTo6U2hhMUNvcmUgYXMgZG\
lnZXN0Ojpjb3JlX2FwaTo6Rml4ZWRPdXRwdXRDb3JlPjo6ZmluYWxpemVfZml4ZWRfY29yZTo6aDE2\
OGNiNTBiZmNiMDBjMjIqMWJsYWtlMzo6SGFzaGVyOjptZXJnZV9jdl9zdGFjazo6aDBhOWM0YzI2ZT\
NhMjQwNjIrI2NvcmU6OmZtdDo6d3JpdGU6OmhlZDhmZTdkMDk1NDc5ZWEyLGQ8cmlwZW1kOjpSaXBl\
bWQxNjBDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2\
ZpeGVkX2NvcmU6Omg2ZDgyNWIxODgxMDU1NzYxLTRibGFrZTM6OmNvbXByZXNzX3BhcmVudHNfcGFy\
YWxsZWw6OmhiNmY2ZWMwODM2NzU5MTdkLls8bWQ0OjpNZDRDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcG\
k6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6Omg3Y2Q3OTY3ZGQ2NmYzYjE2\
L1s8bWQ1OjpNZDVDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbm\
FsaXplX2ZpeGVkX2NvcmU6OmhkMDc3MjcxM2EyZjQxMjRjMF88dGlnZXI6OlRpZ2VyQ29yZSBhcyBk\
aWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoMT\
MyMDkyM2MxNjg2NDg5NDEwZGxtYWxsb2M6OkRsbWFsbG9jPEE+OjptYWxsb2M6OmgwMDU3MzU2N2Ez\
MzM4ZGY4Mkw8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6ZGVmYXVsdDo6RGVmYXVsdD46Om\
RlZmF1bHQ6OmhmYzgzZjY4NGNmNDdhNDk5M0w8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6\
ZGVmYXVsdDo6RGVmYXVsdD46OmRlZmF1bHQ6OmhkNDBmYWU0Njk0NWI4YmRiNEw8YWxsb2M6OmJveG\
VkOjpCb3g8VD4gYXMgY29yZTo6ZGVmYXVsdDo6RGVmYXVsdD46OmRlZmF1bHQ6Omg3ODlhOGRmODA0\
N2Q5OTI2NUw8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6ZGVmYXVsdDo6RGVmYXVsdD46Om\
RlZmF1bHQ6OmhjZmY3OWViMDgzNzBkN2Q3NmQ8c2hhMzo6U2hha2UxMjhDb3JlIGFzIGRpZ2VzdDo6\
Y29yZV9hcGk6OkV4dGVuZGFibGVPdXRwdXRDb3JlPjo6ZmluYWxpemVfeG9mX2NvcmU6OmhlZTc0Mz\
IyYjBmN2JkZGUzNy1ibGFrZTM6OkNodW5rU3RhdGU6OnVwZGF0ZTo6aDkwMmE0MzQyNTZlMTU2YTg4\
YjxzaGEzOjpLZWNjYWsyMjRDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT\
46OmZpbmFsaXplX2ZpeGVkX2NvcmU6OmhhM2Q0YmJkOTdmMTliNDc0OWE8c2hhMzo6U2hhM18yMjRD\
b3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2\
NvcmU6Omg2YzUxODIxMTA2ZjRkY2I3OnI8ZGlnZXN0Ojpjb3JlX2FwaTo6eG9mX3JlYWRlcjo6WG9m\
UmVhZGVyQ29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpYb2ZSZWFkZXI+OjpyZWFkOjp7e2Nsb3N1cm\
V9fTo6aDA2NGY5YTJkMDBkYTMxYjc7TDxhbGxvYzo6Ym94ZWQ6OkJveDxUPiBhcyBjb3JlOjpkZWZh\
dWx0OjpEZWZhdWx0Pjo6ZGVmYXVsdDo6aGJlOTBmMmE5NTExZmExMjI8ZTxkaWdlc3Q6OmNvcmVfYX\
BpOjp4b2ZfcmVhZGVyOjpYb2ZSZWFkZXJDb3JlV3JhcHBlcjxUPiBhcyBkaWdlc3Q6OlhvZlJlYWRl\
cj46OnJlYWQ6OmgwNmVkNDFlZjliZTlkN2UyPWU8ZGlnZXN0Ojpjb3JlX2FwaTo6eG9mX3JlYWRlcj\
o6WG9mUmVhZGVyQ29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpYb2ZSZWFkZXI+OjpyZWFkOjpoODlk\
ODFhYjFhNzA2ZjM0ZT5lPGRpZ2VzdDo6Y29yZV9hcGk6OndyYXBwZXI6OkNvcmVXcmFwcGVyPFQ+IG\
FzIGRpZ2VzdDo6VXBkYXRlPjo6dXBkYXRlOjp7e2Nsb3N1cmV9fTo6aDVlYzI3NGIxNDg2YmExZDU/\
TDxhbGxvYzo6Ym94ZWQ6OkJveDxUPiBhcyBjb3JlOjpkZWZhdWx0OjpEZWZhdWx0Pjo6ZGVmYXVsdD\
o6aDdmY2U4YTYzZWRhYTJhOWJAMWNvbXBpbGVyX2J1aWx0aW5zOjptZW06Om1lbWNweTo6aDQ1ZWI1\
MzYwMWQ5ZDZiZjBBYjxzaGEzOjpLZWNjYWsyNTZDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeG\
VkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6Omg3ZTJhZGJiN2E5ZDdmYjg5QmE8c2hh\
Mzo6U2hhM18yNTZDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbm\
FsaXplX2ZpeGVkX2NvcmU6OmgyMDg1ZWRlMDE5ZmMzYTBmQ3I8ZGlnZXN0Ojpjb3JlX2FwaTo6eG9m\
X3JlYWRlcjo6WG9mUmVhZGVyQ29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpYb2ZSZWFkZXI+OjpyZW\
FkOjp7e2Nsb3N1cmV9fTo6aGQyM2ExZTdiODUwNTA5ZGFEZTxkaWdlc3Q6OmNvcmVfYXBpOjp3cmFw\
cGVyOjpDb3JlV3JhcHBlcjxUPiBhcyBkaWdlc3Q6OlVwZGF0ZT46OnVwZGF0ZTo6e3tjbG9zdXJlfX\
06OmgzMDMxY2Q2MjU1Mjg0ZjJjRWQ8c2hhMzo6U2hha2UyNTZDb3JlIGFzIGRpZ2VzdDo6Y29yZV9h\
cGk6OkV4dGVuZGFibGVPdXRwdXRDb3JlPjo6ZmluYWxpemVfeG9mX2NvcmU6Omg2NGM2NDQxNjZkZT\
UzOGEwRkZkbG1hbGxvYzo6ZGxtYWxsb2M6OkRsbWFsbG9jPEE+OjppbnNlcnRfbGFyZ2VfY2h1bms6\
OmhiMTI5OTBmOTI1MzhmYmJmR0ZkbG1hbGxvYzo6ZGxtYWxsb2M6OkRsbWFsbG9jPEE+Ojp1bmxpbm\
tfbGFyZ2VfY2h1bms6OmhiZThkMzZhOWY0MDYwY2VlSGU8ZGlnZXN0Ojpjb3JlX2FwaTo6d3JhcHBl\
cjo6Q29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpVcGRhdGU+Ojp1cGRhdGU6Ont7Y2xvc3VyZX19Oj\
poMmViZGVhYWU5NjQ4MjIzNEliPHNoYTM6OktlY2NhazM4NENvcmUgYXMgZGlnZXN0Ojpjb3JlX2Fw\
aTo6Rml4ZWRPdXRwdXRDb3JlPjo6ZmluYWxpemVfZml4ZWRfY29yZTo6aDNhNDNlOTFlYzE3NDQ1OT\
lKYTxzaGEzOjpTaGEzXzM4NENvcmUgYXMgZGlnZXN0Ojpjb3JlX2FwaTo6Rml4ZWRPdXRwdXRDb3Jl\
Pjo6ZmluYWxpemVfZml4ZWRfY29yZTo6aGJhNjUxNDU3MWI2Y2RjNmZLYjxzaGEzOjpLZWNjYWs1MT\
JDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVk\
X2NvcmU6OmhlNzk0NWIzODYxYWMzOTQ1TGE8c2hhMzo6U2hhM181MTJDb3JlIGFzIGRpZ2VzdDo6Y2\
9yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6Omg1YTJlMGFiNjNh\
NWU0ZjdkTUw8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6ZGVmYXVsdDo6RGVmYXVsdD46Om\
RlZmF1bHQ6OmhhODkyMWQ4NTQxNWI0NjFmTkw8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6\
ZGVmYXVsdDo6RGVmYXVsdD46OmRlZmF1bHQ6OmgwOGVmYWY3YTE5NjNlODFkT2U8ZGlnZXN0Ojpjb3\
JlX2FwaTo6d3JhcHBlcjo6Q29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpVcGRhdGU+Ojp1cGRhdGU6\
Ont7Y2xvc3VyZX19OjpoMzdiMDQ1ZmVkZGI1MGJiN1A+ZGVub19zdGRfd2FzbV9jcnlwdG86OkRpZ2\
VzdENvbnRleHQ6OnVwZGF0ZTo6aDc1NWQzNWU2MWE1Nzk4NWJRWzxibG9ja19idWZmZXI6OkJsb2Nr\
QnVmZmVyPEJsb2NrU2l6ZSxLaW5kPiBhcyBjb3JlOjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6aDYzN2\
MxYzYyY2EwMTU4YjZSBmRpZ2VzdFMxY29tcGlsZXJfYnVpbHRpbnM6Om1lbTo6bWVtc2V0OjpoNWI4\
Yjk5OGE0YjJmYjIwNVRlPGRpZ2VzdDo6Y29yZV9hcGk6OndyYXBwZXI6OkNvcmVXcmFwcGVyPFQ+IG\
FzIGRpZ2VzdDo6VXBkYXRlPjo6dXBkYXRlOjp7e2Nsb3N1cmV9fTo6aGNiMzJhYzkzM2VjMjU3NjJV\
FGRpZ2VzdGNvbnRleHRfZGlnZXN0VhFkaWdlc3Rjb250ZXh0X25ld1ccZGlnZXN0Y29udGV4dF9kaW\
dlc3RBbmRSZXNldFhMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1\
bHQ+OjpkZWZhdWx0OjpoN2M1MjFjNjZmY2M1ZjBlMFlMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIG\
NvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoNmNhZTQ4Yzk0ZTYxNTBjMlpMPGFsbG9j\
Ojpib3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoMzMwZj\
QzMmYxYjk4MWI2M1tMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1\
bHQ+OjpkZWZhdWx0OjpoZmI3NmVkNGYzYTc0YmQ4MVxMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIG\
NvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoNzg0ZDY4ZGM2YjUxYzk4YV0tanNfc3lz\
OjpVaW50OEFycmF5Ojp0b192ZWM6Omg3NWRkMjNlM2E1NTk4ZDYwXhtkaWdlc3Rjb250ZXh0X2RpZ2\
VzdEFuZERyb3BfP3dhc21fYmluZGdlbjo6Y29udmVydDo6Y2xvc3VyZXM6Omludm9rZTNfbXV0Ojpo\
YzlhM2Q4ZWUxMDQzNGU1ZGBHZGVub19zdGRfd2FzbV9jcnlwdG86OkRpZ2VzdENvbnRleHQ6OmRpZ2\
VzdF9hbmRfZHJvcDo6aGExMmMwYTFmNzcwYTAyMTNhLmNvcmU6OnJlc3VsdDo6dW53cmFwX2ZhaWxl\
ZDo6aDJkYzcwNmQ5NDhjMjI5NjBiWzxibG9ja19idWZmZXI6OkJsb2NrQnVmZmVyPEJsb2NrU2l6ZS\
xLaW5kPiBhcyBjb3JlOjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6aGVjZWMwNDk3NDVlZDQxNDFjWzxi\
bG9ja19idWZmZXI6OkJsb2NrQnVmZmVyPEJsb2NrU2l6ZSxLaW5kPiBhcyBjb3JlOjpjbG9uZTo6Q2\
xvbmU+OjpjbG9uZTo6aDcxNGFjYzM4NDMzYTExOGRkWzxibG9ja19idWZmZXI6OkJsb2NrQnVmZmVy\
PEJsb2NrU2l6ZSxLaW5kPiBhcyBjb3JlOjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6aDczNjBkYjk1OG\
EzNThjODVlWzxibG9ja19idWZmZXI6OkJsb2NrQnVmZmVyPEJsb2NrU2l6ZSxLaW5kPiBhcyBjb3Jl\
OjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6aDkwZTQwNmVmZjNkZDIxMDRmWzxibG9ja19idWZmZXI6Ok\
Jsb2NrQnVmZmVyPEJsb2NrU2l6ZSxLaW5kPiBhcyBjb3JlOjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6\
aGM3OWM0NTFlMDkyY2I5ZDFnWzxibG9ja19idWZmZXI6OkJsb2NrQnVmZmVyPEJsb2NrU2l6ZSxLaW\
5kPiBhcyBjb3JlOjpjbG9uZTo6Q2xvbmU+OjpjbG9uZTo6aDJmODE4MGNiMDg5YzJmOThoUDxhcnJh\
eXZlYzo6ZXJyb3JzOjpDYXBhY2l0eUVycm9yPFQ+IGFzIGNvcmU6OmZtdDo6RGVidWc+OjpmbXQ6Om\
gxY2JhMzA5MjAwMTQ1OThlaVA8YXJyYXl2ZWM6OmVycm9yczo6Q2FwYWNpdHlFcnJvcjxUPiBhcyBj\
b3JlOjpmbXQ6OkRlYnVnPjo6Zm10OjpoOWMwZWJhZDlkMDgyZTU1OGpOY29yZTo6c2xpY2U6OjxpbX\
BsIFtUXT46OmNvcHlfZnJvbV9zbGljZTo6bGVuX21pc21hdGNoX2ZhaWw6OmhmM2JiYWJjMDIwNDg2\
NGJjazZjb3JlOjpwYW5pY2tpbmc6OnBhbmljX2JvdW5kc19jaGVjazo6aDFmYjdhNmRmMTAzMzEyNz\
lsRGNvcmU6OnNsaWNlOjppbmRleDo6c2xpY2Vfc3RhcnRfaW5kZXhfbGVuX2ZhaWxfcnQ6OmhiMzE3\
Y2E4MzMyMDQ2NWE2bUJjb3JlOjpzbGljZTo6aW5kZXg6OnNsaWNlX2VuZF9pbmRleF9sZW5fZmFpbF\
9ydDo6aGZjZjkzZGQzNWYwMTEyYmRuGF9fd2JnX2RpZ2VzdGNvbnRleHRfZnJlZW83c3RkOjpwYW5p\
Y2tpbmc6OnJ1c3RfcGFuaWNfd2l0aF9ob29rOjpoNzBhMGUxOTVmNGRiMmEyOXAxY29tcGlsZXJfYn\
VpbHRpbnM6Om1lbTo6bWVtY21wOjpoMTI4NWI4NDEyMGRmNWRjZHEUZGlnZXN0Y29udGV4dF91cGRh\
dGVyKWNvcmU6OnBhbmlja2luZzo6cGFuaWM6Omg4YWYwNDYzOTdhMmJmNjVkczpibGFrZTI6OkJsYW\
tlMmJWYXJDb3JlOjpuZXdfd2l0aF9wYXJhbXM6Omg0NGYxNTNlOTYwYjIwOTM5dBFydXN0X2JlZ2lu\
X3Vud2luZHVDY29yZTo6Zm10OjpGb3JtYXR0ZXI6OnBhZF9pbnRlZ3JhbDo6d3JpdGVfcHJlZml4Oj\
poNjBiMWI1MDNlNjZmMzJiMXY0YWxsb2M6OnJhd192ZWM6OmNhcGFjaXR5X292ZXJmbG93OjpoNGIy\
NzVjYjNjMTBiMGE3OHctY29yZTo6cGFuaWNraW5nOjpwYW5pY19mbXQ6Omg3NTFiZTgwNzc5ZDQyYj\
UzeENzdGQ6OnBhbmlja2luZzo6YmVnaW5fcGFuaWNfaGFuZGxlcjo6e3tjbG9zdXJlfX06OmhkY2Zj\
ODE5Y2U4MzY4MjlleRFfX3diaW5kZ2VuX21hbGxvY3o6Ymxha2UyOjpCbGFrZTJzVmFyQ29yZTo6bm\
V3X3dpdGhfcGFyYW1zOjpoMjNlMzIwMWM5ZmYyMzMyOXtJc3RkOjpzeXNfY29tbW9uOjpiYWNrdHJh\
Y2U6Ol9fcnVzdF9lbmRfc2hvcnRfYmFja3RyYWNlOjpoNTNjYWJhZmFiNWIwOWFkYXw/d2FzbV9iaW\
5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlNF9tdXQ6Omg5NjlhZjNlZGJiNzM4YjVmfT93\
YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aDA1OTZjYWRlZDYzNz\
JlYWZ+P3dhc21fYmluZGdlbjo6Y29udmVydDo6Y2xvc3VyZXM6Omludm9rZTNfbXV0OjpoNDIxN2Nj\
NDEwYzk0OWE2YX8/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlM19tdXQ6Om\
hiYzBkZTg4ZTYzNTRlYTJigAE/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tl\
M19tdXQ6OmgxOGYyY2JiNjE4MmUwZmYwgQE/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlcz\
o6aW52b2tlM19tdXQ6Omg0MmUzZjhmYjQzNjIwOGU0ggE/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0Ojpj\
bG9zdXJlczo6aW52b2tlM19tdXQ6OmhjYTZjYzM2N2Y0OWE3MjM2gwE/d2FzbV9iaW5kZ2VuOjpjb2\
52ZXJ0OjpjbG9zdXJlczo6aW52b2tlM19tdXQ6OmgzZjliODQxZjE0MmQ5OGU4hAE/d2FzbV9iaW5k\
Z2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlM19tdXQ6Omg3MDhjYmY5YTQyNWUzMDM5hQE/d2\
FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2tlMl9tdXQ6Omg3ZjAxNzJhNWUyYjY1\
YzY5hgESX193YmluZGdlbl9yZWFsbG9jhwE/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlcz\
o6aW52b2tlMV9tdXQ6OmgxZmMwOTdmZjY0ZTNhOTY5iAEwPCZUIGFzIGNvcmU6OmZtdDo6RGVidWc+\
OjpmbXQ6OmhmZjRhZjFiNGE4MTM5OTZhiQEyPCZUIGFzIGNvcmU6OmZtdDo6RGlzcGxheT46OmZtdD\
o6aDY0ZGQyZjhhMzhjZWIxMDOKAQ9fX3diaW5kZ2VuX2ZyZWWLAT9jb3JlOjpzbGljZTo6aW5kZXg6\
OnNsaWNlX2VuZF9pbmRleF9sZW5fZmFpbDo6aDNkYjQ3NmIwZDA5OTk0ZDKMAUFjb3JlOjpzbGljZT\
o6aW5kZXg6OnNsaWNlX3N0YXJ0X2luZGV4X2xlbl9mYWlsOjpoMTM2Y2NhZDc2NDEzNjgxMI0BM2Fy\
cmF5dmVjOjphcnJheXZlYzo6ZXh0ZW5kX3BhbmljOjpoNjRmY2MxNjMwYmVhY2NhN44BOWNvcmU6Om\
9wczo6ZnVuY3Rpb246OkZuT25jZTo6Y2FsbF9vbmNlOjpoZTAyMWRiYmY2ZmFhYTA2ZI8BH19fd2Jp\
bmRnZW5fYWRkX3RvX3N0YWNrX3BvaW50ZXKQATF3YXNtX2JpbmRnZW46Ol9fcnQ6OnRocm93X251bG\
w6OmgxYWMxZTJjMTFkOWRlMDlikQEyd2FzbV9iaW5kZ2VuOjpfX3J0Ojpib3Jyb3dfZmFpbDo6aDc4\
ZDIwNzFkNmMwNWI5ODSSASp3YXNtX2JpbmRnZW46OnRocm93X3N0cjo6aDNmMjIyOWZlMzAzMjI2OW\
STAQZtZW1zZXSUAQZtZW1jcHmVAQZtZW1jbXCWATE8VCBhcyBjb3JlOjphbnk6OkFueT46OnR5cGVf\
aWQ6OmgxM2M3ODU5NjY4OGY2N2IylwEKcnVzdF9wYW5pY5gBb2NvcmU6OnB0cjo6ZHJvcF9pbl9wbG\
FjZTwmY29yZTo6aXRlcjo6YWRhcHRlcnM6OmNvcGllZDo6Q29waWVkPGNvcmU6OnNsaWNlOjppdGVy\
OjpJdGVyPHU4Pj4+OjpoMDVmYTBmOTcxYjQ2YjBlNwDvgICAAAlwcm9kdWNlcnMCCGxhbmd1YWdlAQ\
RSdXN0AAxwcm9jZXNzZWQtYnkDBXJ1c3RjHTEuNjUuMCAoODk3ZTM3NTUzIDIwMjItMTEtMDIpBndh\
bHJ1cwYwLjE5LjAMd2FzbS1iaW5kZ2VuBjAuMi44Mw==\
");
    const wasmModule = new WebAssembly.Module(wasmBytes);
    return new WebAssembly.Instance(wasmModule, imports);
}
function base64decode(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
const digestAlgorithms = [
    "BLAKE2B-256",
    "BLAKE2B-384",
    "BLAKE2B",
    "BLAKE2S",
    "BLAKE3",
    "KECCAK-224",
    "KECCAK-256",
    "KECCAK-384",
    "KECCAK-512",
    "SHA-384",
    "SHA3-224",
    "SHA3-256",
    "SHA3-384",
    "SHA3-512",
    "SHAKE128",
    "SHAKE256",
    "TIGER",
    "RIPEMD-160",
    "SHA-224",
    "SHA-256",
    "SHA-512",
    "MD4",
    "MD5",
    "SHA-1"
];
function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
    }
    if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i = -1;
    while(++i < length){
        out |= a.getUint8(i) ^ b.getUint8(i);
    }
    return out === 0;
}
function swap32(val) {
    return (val & 0xff) << 24 | (val & 0xff00) << 8 | val >> 8 & 0xff00 | val >> 24 & 0xff;
}
function n16(n) {
    return n & 0xffff;
}
function n32(n) {
    return n >>> 0;
}
function add32WithCarry(a, b) {
    const added = n32(a) + n32(b);
    return [
        n32(added),
        added > 0xffffffff ? 1 : 0
    ];
}
function mul32WithCarry(a, b) {
    const al = n16(a);
    const ah = n16(a >>> 16);
    const bl = n16(b);
    const bh = n16(b >>> 16);
    const [t, tc] = add32WithCarry(al * bh, ah * bl);
    const [n, nc] = add32WithCarry(al * bl, n32(t << 16));
    const carry = nc + (tc << 16) + n16(t >>> 16) + ah * bh;
    return [
        n,
        carry
    ];
}
function mul32(a, b) {
    const al = n16(a);
    const ah = a - al;
    return n32(n32(ah * b) + al * b);
}
function mul64([ah, al], [bh, bl]) {
    const [n, c] = mul32WithCarry(al, bl);
    return [
        n32(mul32(al, bh) + mul32(ah, bl) + c),
        n
    ];
}
const prime32 = 16777619;
const fnv32 = (data)=>{
    let hash = 2166136261;
    data.forEach((c)=>{
        hash = mul32(hash, prime32);
        hash ^= c;
    });
    return Uint32Array.from([
        swap32(hash)
    ]).buffer;
};
const fnv32a = (data)=>{
    let hash = 2166136261;
    data.forEach((c)=>{
        hash ^= c;
        hash = mul32(hash, prime32);
    });
    return Uint32Array.from([
        swap32(hash)
    ]).buffer;
};
const prime64Lo = 435;
const prime64Hi = 256;
const fnv64 = (data)=>{
    let hashLo = 2216829733;
    let hashHi = 3421674724;
    data.forEach((c)=>{
        [hashHi, hashLo] = mul64([
            hashHi,
            hashLo
        ], [
            prime64Hi,
            prime64Lo
        ]);
        hashLo ^= c;
    });
    return new Uint32Array([
        swap32(hashHi >>> 0),
        swap32(hashLo >>> 0)
    ]).buffer;
};
const fnv64a = (data)=>{
    let hashLo = 2216829733;
    let hashHi = 3421674724;
    data.forEach((c)=>{
        hashLo ^= c;
        [hashHi, hashLo] = mul64([
            hashHi,
            hashLo
        ], [
            prime64Hi,
            prime64Lo
        ]);
    });
    return new Uint32Array([
        swap32(hashHi >>> 0),
        swap32(hashLo >>> 0)
    ]).buffer;
};
const fnv = (name, buf)=>{
    if (!buf) {
        throw new TypeError("no data provided for hashing");
    }
    switch(name){
        case "FNV32":
            return fnv32(buf);
        case "FNV64":
            return fnv64(buf);
        case "FNV32A":
            return fnv32a(buf);
        case "FNV64A":
            return fnv64a(buf);
        default:
            throw new TypeError(`unsupported fnv digest: ${name}`);
    }
};
const webCrypto = ((crypto1)=>({
        getRandomValues: crypto1.getRandomValues?.bind(crypto1),
        randomUUID: crypto1.randomUUID?.bind(crypto1),
        subtle: {
            decrypt: crypto1.subtle?.decrypt?.bind(crypto1.subtle),
            deriveBits: crypto1.subtle?.deriveBits?.bind(crypto1.subtle),
            deriveKey: crypto1.subtle?.deriveKey?.bind(crypto1.subtle),
            digest: crypto1.subtle?.digest?.bind(crypto1.subtle),
            encrypt: crypto1.subtle?.encrypt?.bind(crypto1.subtle),
            exportKey: crypto1.subtle?.exportKey?.bind(crypto1.subtle),
            generateKey: crypto1.subtle?.generateKey?.bind(crypto1.subtle),
            importKey: crypto1.subtle?.importKey?.bind(crypto1.subtle),
            sign: crypto1.subtle?.sign?.bind(crypto1.subtle),
            unwrapKey: crypto1.subtle?.unwrapKey?.bind(crypto1.subtle),
            verify: crypto1.subtle?.verify?.bind(crypto1.subtle),
            wrapKey: crypto1.subtle?.wrapKey?.bind(crypto1.subtle)
        }
    }))(globalThis.crypto);
const bufferSourceBytes = (data)=>{
    let bytes;
    if (data instanceof Uint8Array) {
        bytes = data;
    } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    }
    return bytes;
};
const stdCrypto = ((x)=>x)({
    ...webCrypto,
    subtle: {
        ...webCrypto.subtle,
        async digest (algorithm, data) {
            const { name , length  } = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(name)) {
                return fnv(name, bytes);
            }
            if (webCryptoDigestAlgorithms.includes(name) && bytes) {
                return webCrypto.subtle.digest(algorithm, bytes);
            } else if (digestAlgorithms.includes(name)) {
                if (bytes) {
                    return stdCrypto.subtle.digestSync(algorithm, bytes);
                } else if (data[Symbol.iterator]) {
                    return stdCrypto.subtle.digestSync(algorithm, data);
                } else if (data[Symbol.asyncIterator]) {
                    const wasmCrypto = instantiate();
                    const context = new wasmCrypto.DigestContext(name);
                    for await (const chunk of data){
                        const chunkBytes = bufferSourceBytes(chunk);
                        if (!chunkBytes) {
                            throw new TypeError("data contained chunk of the wrong type");
                        }
                        context.update(chunkBytes);
                    }
                    return context.digestAndDrop(length).buffer;
                } else {
                    throw new TypeError("data must be a BufferSource or [Async]Iterable<BufferSource>");
                }
            } else if (webCrypto.subtle?.digest) {
                return webCrypto.subtle.digest(algorithm, data);
            } else {
                throw new TypeError(`unsupported digest algorithm: ${algorithm}`);
            }
        },
        digestSync (algorithm, data) {
            algorithm = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(algorithm.name)) {
                return fnv(algorithm.name, bytes);
            }
            const wasmCrypto = instantiate();
            if (bytes) {
                return wasmCrypto.digest(algorithm.name, bytes, algorithm.length).buffer;
            } else if (data[Symbol.iterator]) {
                const context = new wasmCrypto.DigestContext(algorithm.name);
                for (const chunk of data){
                    const chunkBytes = bufferSourceBytes(chunk);
                    if (!chunkBytes) {
                        throw new TypeError("data contained chunk of the wrong type");
                    }
                    context.update(chunkBytes);
                }
                return context.digestAndDrop(algorithm.length).buffer;
            } else {
                throw new TypeError("data must be a BufferSource or Iterable<BufferSource>");
            }
        },
        timingSafeEqual
    }
});
const FNVAlgorithms = [
    "FNV32",
    "FNV32A",
    "FNV64",
    "FNV64A"
];
const webCryptoDigestAlgorithms = [
    "SHA-384",
    "SHA-256",
    "SHA-512",
    "SHA-1"
];
const normalizeAlgorithm = (algorithm)=>typeof algorithm === "string" ? {
        name: algorithm.toUpperCase()
    } : {
        ...algorithm,
        name: algorithm.name.toUpperCase()
    };
function convertBase64ToBase64url(b64) {
    return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function encode2(data) {
    return convertBase64ToBase64url(encode1(data));
}
const encoder = new TextEncoder();
function importKey(key) {
    if (typeof key === "string") {
        key = encoder.encode(key);
    } else if (Array.isArray(key)) {
        key = new Uint8Array(key);
    }
    return crypto.subtle.importKey("raw", key, {
        name: "HMAC",
        hash: {
            name: "SHA-256"
        }
    }, true, [
        "sign",
        "verify"
    ]);
}
function sign(data, key) {
    if (typeof data === "string") {
        data = encoder.encode(data);
    } else if (Array.isArray(data)) {
        data = Uint8Array.from(data);
    }
    return crypto.subtle.sign("HMAC", key, data);
}
async function compare(a, b) {
    const key = new Uint8Array(32);
    globalThis.crypto.getRandomValues(key);
    const cryptoKey = await importKey(key);
    const ah = await sign(a, cryptoKey);
    const bh = await sign(b, cryptoKey);
    return timingSafeEqual(ah, bh);
}
class KeyStack {
    #cryptoKeys = new Map();
    #keys;
    async #toCryptoKey(key) {
        if (!this.#cryptoKeys.has(key)) {
            this.#cryptoKeys.set(key, await importKey(key));
        }
        return this.#cryptoKeys.get(key);
    }
    get length() {
        return this.#keys.length;
    }
    constructor(keys){
        const values = Array.isArray(keys) ? keys : [
            ...keys
        ];
        if (!values.length) {
            throw new TypeError("keys must contain at least one value");
        }
        this.#keys = values;
    }
    async sign(data) {
        const key = await this.#toCryptoKey(this.#keys[0]);
        return encode2(await sign(data, key));
    }
    async verify(data, digest) {
        return await this.indexOf(data, digest) > -1;
    }
    async indexOf(data, digest) {
        for(let i = 0; i < this.#keys.length; i++){
            const cryptoKey = await this.#toCryptoKey(this.#keys[i]);
            if (await compare(digest, encode2(await sign(data, cryptoKey)))) {
                return i;
            }
        }
        return -1;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        const { length  } = this;
        return `${this.constructor.name} ${inspect({
            length
        })}`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1
        });
        const { length  } = this;
        return `${options.stylize(this.constructor.name, "special")} ${inspect({
            length
        }, newOptions)}`;
    }
}
const encoder1 = new TextEncoder();
async function createHash(algorithm, data) {
    if (typeof data === "string") {
        data = encoder1.encode(data);
    }
    return await stdCrypto.subtle.digest(algorithm, data);
}
const VERSION = "0.173.0";
const importMeta = {
    url: "https://deno.land/std/http/file_server.ts",
    main: import.meta.main
};
const encoder2 = new TextEncoder();
function modeToString(isDir, maybeMode) {
    const modeMap = [
        "---",
        "--x",
        "-w-",
        "-wx",
        "r--",
        "r-x",
        "rw-",
        "rwx"
    ];
    if (maybeMode === null) {
        return "(unknown mode)";
    }
    const mode = maybeMode.toString(8);
    if (mode.length < 3) {
        return "(unknown mode)";
    }
    let output = "";
    mode.split("").reverse().slice(0, 3).forEach((v)=>{
        output = `${modeMap[+v]} ${output}`;
    });
    output = `${isDir ? "d" : "-"} ${output}`;
    return output;
}
function fileLenToString(len) {
    const multiplier = 1024;
    let base = 1;
    const suffix = [
        "B",
        "K",
        "M",
        "G",
        "T"
    ];
    let suffixIndex = 0;
    while(base * 1024 < len){
        if (suffixIndex >= suffix.length - 1) {
            break;
        }
        base *= multiplier;
        suffixIndex++;
    }
    return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}
async function serveFile(req, filePath, { etagAlgorithm , fileInfo  } = {}) {
    try {
        fileInfo ??= await Deno.stat(filePath);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            await req.body?.cancel();
            return createCommonResponse(Status.NotFound);
        } else {
            throw error;
        }
    }
    if (fileInfo.isDirectory) {
        await req.body?.cancel();
        return createCommonResponse(Status.NotFound);
    }
    const file = await Deno.open(filePath);
    const headers = setBaseHeaders();
    const contentTypeValue = contentType(extname2(filePath));
    if (contentTypeValue) {
        headers.set("content-type", contentTypeValue);
    }
    if (fileInfo.atime instanceof Date) {
        const date = new Date(fileInfo.atime);
        headers.set("date", date.toUTCString());
    }
    if (fileInfo.mtime instanceof Date) {
        const lastModified = new Date(fileInfo.mtime);
        headers.set("last-modified", lastModified.toUTCString());
        const etag = toHashString(await createHash(etagAlgorithm ?? "FNV32A", `${lastModified.toJSON()}${fileInfo.size}`));
        headers.set("etag", etag);
        const ifNoneMatch = req.headers.get("if-none-match");
        const ifModifiedSince = req.headers.get("if-modified-since");
        if (ifNoneMatch && compareEtag(ifNoneMatch, etag) || ifNoneMatch === null && ifModifiedSince && fileInfo.mtime.getTime() < new Date(ifModifiedSince).getTime() + 1000) {
            file.close();
            return createCommonResponse(Status.NotModified, null, {
                headers
            });
        }
    }
    const range = req.headers.get("range");
    const rangeRe = /bytes=(\d+)-(\d+)?/;
    const parsed = rangeRe.exec(range);
    const start = parsed && parsed[1] ? +parsed[1] : 0;
    const end = parsed && parsed[2] ? +parsed[2] : fileInfo.size - 1;
    if (range && parsed) {
        headers.set("content-range", `bytes ${start}-${end}/${fileInfo.size}`);
    }
    const maxRange = fileInfo.size - 1;
    if (range && (!parsed || typeof start !== "number" || start > end || start > maxRange || end > maxRange)) {
        file.close();
        return createCommonResponse(Status.RequestedRangeNotSatisfiable, undefined, {
            headers
        });
    }
    const contentLength = end - start + 1;
    headers.set("content-length", `${contentLength}`);
    if (range && parsed) {
        await file.seek(start, Deno.SeekMode.Start);
        return createCommonResponse(Status.PartialContent, file.readable, {
            headers
        });
    }
    return createCommonResponse(Status.OK, file.readable, {
        headers
    });
}
async function serveDirIndex(dirPath, options) {
    const showDotfiles = options.dotfiles;
    const dirUrl = `/${mod1.relative(options.target, dirPath)}`;
    const listEntry = [];
    if (dirUrl !== "/") {
        const prevPath = mod1.join(dirPath, "..");
        const fileInfo = await Deno.stat(prevPath);
        listEntry.push({
            mode: modeToString(true, fileInfo.mode),
            size: "",
            name: "../",
            url: mod1.join(dirUrl, "..")
        });
    }
    for await (const entry of Deno.readDir(dirPath)){
        if (!showDotfiles && entry.name[0] === ".") {
            continue;
        }
        const filePath = mod1.join(dirPath, entry.name);
        const fileUrl = encodeURIComponent(mod1.join(dirUrl, entry.name)).replaceAll("%2F", "/");
        const fileInfo1 = await Deno.stat(filePath);
        listEntry.push({
            mode: modeToString(entry.isDirectory, fileInfo1.mode),
            size: entry.isFile ? fileLenToString(fileInfo1.size ?? 0) : "",
            name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
            url: `${fileUrl}${entry.isDirectory ? "/" : ""}`
        });
    }
    listEntry.sort((a, b)=>a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    const formattedDirUrl = `${dirUrl.replace(/\/$/, "")}/`;
    const page = encoder2.encode(dirViewerTemplate(formattedDirUrl, listEntry));
    const headers = setBaseHeaders();
    headers.set("content-type", "text/html");
    return createCommonResponse(Status.OK, page, {
        headers
    });
}
function serveFallback(_req, e) {
    if (e instanceof URIError) {
        return Promise.resolve(createCommonResponse(Status.BadRequest));
    } else if (e instanceof Deno.errors.NotFound) {
        return Promise.resolve(createCommonResponse(Status.NotFound));
    }
    return Promise.resolve(createCommonResponse(Status.InternalServerError));
}
function serverLog(req, status) {
    const d = new Date().toISOString();
    const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
    const normalizedUrl = normalizeURL(req.url);
    const s = `${dateFmt} [${req.method}] ${normalizedUrl} ${status}`;
    console.debug(s);
}
function setBaseHeaders() {
    const headers = new Headers();
    headers.set("server", "deno");
    headers.set("accept-ranges", "bytes");
    headers.set("date", new Date().toUTCString());
    return headers;
}
function dirViewerTemplate(dirname, entries) {
    const paths = dirname.split("/");
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Deno File Server</title>
        <style>
          :root {
            --background-color: #fafafa;
            --color: rgba(0, 0, 0, 0.87);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #292929;
              --color: #fff;
            }
            thead {
              color: #7f7f7f;
            }
          }
          @media (min-width: 960px) {
            main {
              max-width: 960px;
            }
            body {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          @media (min-width: 600px) {
            main {
              padding-left: 24px;
              padding-right: 24px;
            }
          }
          body {
            background: var(--background-color);
            color: var(--color);
            font-family: "Roboto", "Helvetica", "Arial", sans-serif;
            font-weight: 400;
            line-height: 1.43;
            font-size: 0.875rem;
          }
          a {
            color: #2196f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          thead {
            text-align: left;
          }
          thead th {
            padding-bottom: 12px;
          }
          table td {
            padding: 6px 36px 6px 0px;
          }
          .size {
            text-align: right;
            padding: 6px 12px 6px 24px;
          }
          .mode {
            font-family: monospace, monospace;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Index of
          <a href="/">home</a>${paths.map((path, index, array)=>{
        if (path === "") return "";
        const link = array.slice(0, index + 1).join("/");
        return `<a href="${link}">${path}</a>`;
    }).join("/")}
          </h1>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Size</th>
                <th>Name</th>
              </tr>
            </thead>
            ${entries.map((entry)=>`
                  <tr>
                    <td class="mode">
                      ${entry.mode}
                    </td>
                    <td class="size">
                      ${entry.size}
                    </td>
                    <td>
                      <a href="${entry.url}">${entry.name}</a>
                    </td>
                  </tr>
                `).join("")}
          </table>
        </main>
      </body>
    </html>
  `;
}
async function serveDir(req, opts = {}) {
    let response = undefined;
    const target = opts.fsRoot || ".";
    const urlRoot = opts.urlRoot;
    const showIndex = opts.showIndex ?? true;
    try {
        let normalizedPath = normalizeURL(req.url);
        if (urlRoot) {
            if (normalizedPath.startsWith("/" + urlRoot)) {
                normalizedPath = normalizedPath.replace(urlRoot, "");
            } else {
                throw new Deno.errors.NotFound();
            }
        }
        const fsPath = mod1.join(target, normalizedPath);
        const fileInfo = await Deno.stat(fsPath);
        if (fileInfo.isDirectory) {
            if (showIndex) {
                try {
                    const path = mod1.join(fsPath, "index.html");
                    const indexFileInfo = await Deno.lstat(path);
                    if (indexFileInfo.isFile) {
                        response = await serveFile(req, path, {
                            etagAlgorithm: opts.etagAlgorithm,
                            fileInfo: indexFileInfo
                        });
                    }
                } catch (e) {
                    if (!(e instanceof Deno.errors.NotFound)) {
                        throw e;
                    }
                }
            }
            if (!response && opts.showDirListing) {
                response = await serveDirIndex(fsPath, {
                    dotfiles: opts.showDotfiles || false,
                    target
                });
            }
            if (!response) {
                throw new Deno.errors.NotFound();
            }
        } else {
            response = await serveFile(req, fsPath, {
                etagAlgorithm: opts.etagAlgorithm,
                fileInfo
            });
        }
    } catch (e1) {
        const err = e1 instanceof Error ? e1 : new Error("[non-error thrown]");
        if (!opts.quiet) console.error(red(err.message));
        response = await serveFallback(req, err);
    }
    if (opts.enableCors) {
        assert(response);
        response.headers.append("access-control-allow-origin", "*");
        response.headers.append("access-control-allow-headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
    }
    if (!opts.quiet) serverLog(req, response.status);
    if (opts.headers) {
        for (const header of opts.headers){
            const headerSplit = header.split(":");
            const name = headerSplit[0];
            const value = headerSplit.slice(1).join(":");
            response.headers.append(name, value);
        }
    }
    return response;
}
function normalizeURL(url) {
    return mod1.normalize(decodeURIComponent(new URL(url).pathname));
}
function main() {
    const serverArgs = parse3(Deno.args, {
        string: [
            "port",
            "host",
            "cert",
            "key",
            "header"
        ],
        boolean: [
            "help",
            "dir-listing",
            "dotfiles",
            "cors",
            "verbose",
            "version"
        ],
        negatable: [
            "dir-listing",
            "dotfiles",
            "cors"
        ],
        collect: [
            "header"
        ],
        default: {
            "dir-listing": true,
            dotfiles: true,
            cors: true,
            verbose: false,
            version: false,
            host: "0.0.0.0",
            port: "4507",
            cert: "",
            key: ""
        },
        alias: {
            p: "port",
            c: "cert",
            k: "key",
            h: "help",
            v: "verbose",
            V: "version",
            H: "header"
        }
    });
    const port = Number(serverArgs.port);
    const headers = serverArgs.header || [];
    const host = serverArgs.host;
    const certFile = serverArgs.cert;
    const keyFile = serverArgs.key;
    if (serverArgs.help) {
        printUsage();
        Deno.exit();
    }
    if (serverArgs.version) {
        console.log(`Deno File Server ${VERSION}`);
        Deno.exit();
    }
    if (keyFile || certFile) {
        if (keyFile === "" || certFile === "") {
            console.log("--key and --cert are required for TLS");
            printUsage();
            Deno.exit(1);
        }
    }
    const wild = serverArgs._;
    const target = mod1.resolve(wild[0] ?? "");
    const handler = (req)=>{
        return serveDir(req, {
            fsRoot: target,
            showDirListing: serverArgs["dir-listing"],
            showDotfiles: serverArgs.dotfiles,
            enableCors: serverArgs.cors,
            quiet: !serverArgs.verbose,
            headers
        });
    };
    const useTls = !!(keyFile && certFile);
    if (useTls) {
        serveTls(handler, {
            port,
            hostname: host,
            certFile,
            keyFile
        });
    } else {
        serve(handler, {
            port,
            hostname: host
        });
    }
}
function printUsage() {
    console.log(`Deno File Server ${VERSION}
  Serves a local directory in HTTP.

INSTALL:
  deno install --allow-net --allow-read https://deno.land/std/http/file_server.ts

USAGE:
  file_server [path] [options]

OPTIONS:
  -h, --help            Prints help information
  -p, --port <PORT>     Set port
  --cors                Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>     Hostname (default is 0.0.0.0)
  -c, --cert <FILE>     TLS certificate file (enables TLS)
  -k, --key  <FILE>     TLS key file (enables TLS)
  -H, --header <HEADER> Sets a header on every request.
                        (e.g. --header "Cache-Control: no-cache")
                        This option can be specified multiple times.
  --no-dir-listing      Disable directory listing
  --no-dotfiles         Do not show dotfiles
  --no-cors             Disable cross-origin resource sharing
  -v, --verbose         Print request level logs
  -V, --version         Print version information

  All TLS options are required when one is provided.`);
}
if (importMeta.main) {
    main();
}
export { serveFile as serveFile };
export { serveDir as serveDir };
