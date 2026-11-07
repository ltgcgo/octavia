var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// https://deno.land/x/denoflate@1.2.1/pkg/denoflate.js
var wasm;
var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
var cachegetUint8Memory0 = null;
function getUint8Memory0() {
  if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
    cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachegetUint8Memory0;
}
__name(getUint8Memory0, "getUint8Memory0");
function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
__name(getStringFromWasm0, "getStringFromWasm0");
var heap = new Array(32).fill(void 0);
heap.push(void 0, null, true, false);
var heap_next = heap.length;
function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
__name(addHeapObject, "addHeapObject");
function getObject(idx) {
  return heap[idx];
}
__name(getObject, "getObject");
function dropObject(idx) {
  if (idx < 36) return;
  heap[idx] = heap_next;
  heap_next = idx;
}
__name(dropObject, "dropObject");
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
__name(takeObject, "takeObject");
var WASM_VECTOR_LEN = 0;
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
__name(passArray8ToWasm0, "passArray8ToWasm0");
var cachegetInt32Memory0 = null;
function getInt32Memory0() {
  if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
    cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachegetInt32Memory0;
}
__name(getInt32Memory0, "getInt32Memory0");
function getArrayU8FromWasm0(ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
__name(getArrayU8FromWasm0, "getArrayU8FromWasm0");
function gunzip(input) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    var ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.gunzip(retptr, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var v1 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v1;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
__name(gunzip, "gunzip");
async function load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get("Content-Type") != "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}
__name(load, "load");
async function init(input) {
  if (typeof input === "undefined") {
    input = new URL("denoflate_bg.wasm", import.meta.url);
  }
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
    var ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_rethrow = function(arg0) {
    throw takeObject(arg0);
  };
  if (typeof input === "string" || typeof Request === "function" && input instanceof Request || typeof URL === "function" && input instanceof URL) {
    input = fetch(input);
  }
  const { instance, module } = await load(await input, imports);
  wasm = instance.exports;
  init.__wbindgen_wasm_module = module;
  return wasm;
}
__name(init, "init");
var denoflate_default = init;

// https://deno.land/x/denoflate@1.2.1/pkg/denoflate_bg.wasm.js
var wasmGz = (await Deno.open(`${import.meta.dirname}/denoflate_bg.wasm.gz`)).readable;
var wasmDecomp = new DecompressionStream("gzip");
var wasm2 = await (new Response(wasmGz.pipeThrough(wasmDecomp))).bytes();

// https://deno.land/x/denoflate@1.2.1/mod.ts
await denoflate_default(wasm2);

// https://deno.land/x/esbuild@v0.28.1/mod.js
var __defProp2 = Object.defineProperty;
var __export = /* @__PURE__ */ __name((target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
}, "__export");
var mod_exports2 = {};
__export(mod_exports2, {
  analyzeMetafile: /* @__PURE__ */ __name(() => analyzeMetafile, "analyzeMetafile"),
  analyzeMetafileSync: /* @__PURE__ */ __name(() => analyzeMetafileSync, "analyzeMetafileSync"),
  build: /* @__PURE__ */ __name(() => build, "build"),
  buildSync: /* @__PURE__ */ __name(() => buildSync, "buildSync"),
  context: /* @__PURE__ */ __name(() => context, "context"),
  formatMessages: /* @__PURE__ */ __name(() => formatMessages, "formatMessages"),
  formatMessagesSync: /* @__PURE__ */ __name(() => formatMessagesSync, "formatMessagesSync"),
  initialize: /* @__PURE__ */ __name(() => initialize, "initialize"),
  stop: /* @__PURE__ */ __name(() => stop, "stop"),
  transform: /* @__PURE__ */ __name(() => transform, "transform"),
  transformSync: /* @__PURE__ */ __name(() => transformSync, "transformSync"),
  version: /* @__PURE__ */ __name(() => version, "version")
});
var define_ESBUILD_BINARY_HASHES_default = {
  "@esbuild/aix-ppc64/bin/esbuild": "0dd860154344f94b7a9367e64ffc2bc5b89a4313b4a399e5127cdc4ff5000303",
  "@esbuild/android-arm64/bin/esbuild": "087671da02d323e7915fafc13567c0929192633ed544bd8adee9bc020fddf5b4",
  "@esbuild/darwin-arm64/bin/esbuild": "e2dc9a52440a2a34f09434a2f4843cb1e30f84e40dcf238976ec61ef8cd7f36a",
  "@esbuild/darwin-x64/bin/esbuild": "dd53ccf32f9b5b3ab30d41388ef1fc8f81c44ca57ee7a32a7364a1753308d009",
  "@esbuild/freebsd-arm64/bin/esbuild": "5fef5a5ef24d9660d7711b756be5ddeba1fb3ca8dd62d703682ebb9fab3b68b0",
  "@esbuild/freebsd-x64/bin/esbuild": "4427a8cbfa0661943ccfef2606a65b35f3411ac73e447e86f7732aace61e4609",
  "@esbuild/linux-arm/bin/esbuild": "a2d93f7a8b1c9f91d47beec987888b4765c890501b6274f4bdff4061a5e0d9fd",
  "@esbuild/linux-arm64/bin/esbuild": "51e829ba36f36be6d9aea6e329ddc4f9350302339b16aaca96a3cb97f64a8ebb",
  "@esbuild/linux-ia32/bin/esbuild": "9cd7515a75d6f96b0aa055861cf987498315428088cd6d18de5082f904ae5794",
  "@esbuild/linux-loong64/bin/esbuild": "73fa76af9b13f7a27fdb20673b8c2af927fe1511d14e51edeb4b7b71f7f03d0e",
  "@esbuild/linux-mips64el/bin/esbuild": "d734787abc3c99d95242805047fe32da85a5822f04bf33d766a966bf5fd85488",
  "@esbuild/linux-ppc64/bin/esbuild": "90709144617c2adf8f6c14937f03b114c259de0b9309666e3a9d89a1fb266d04",
  "@esbuild/linux-riscv64/bin/esbuild": "86df35a46bedde8b756edb6565a1df7b5a832ad74dd0e179608cbf6509a2582a",
  "@esbuild/linux-s390x/bin/esbuild": "f8cad0db35132e5ac3065c4345c36e7ffe18fdc98417a61bcf5a95a6c694e57c",
  "@esbuild/linux-x64/bin/esbuild": "0c6588b092a2c291a72bab90659f3c9e0e25e0fe59c9ac12b4dae4d945e5548c",
  "@esbuild/netbsd-arm64/bin/esbuild": "490cfdac2d96d5608d91cf55bdf4052bbde7013dafe87ec7adc7784778ad4d4c",
  "@esbuild/netbsd-x64/bin/esbuild": "c61e0e4c553a4986fd0e9d63a0425e93be831ff7b13bfb8a564368fb7590f85d",
  "@esbuild/openbsd-arm64/bin/esbuild": "f9d814698e26c09c3f90d4c103cbdf3832c9f2c841d64a93889d63d23da9b8cf",
  "@esbuild/openbsd-x64/bin/esbuild": "2e30dce11f7236aa362c1c57212cc696f51472169aa417f30e9b641f3b7dcade",
  "@esbuild/sunos-x64/bin/esbuild": "770e0d2bc930b1a1d19d3f43243ff8f393efddb599e7f5843160feacd253267d",
  "@esbuild/win32-arm64/esbuild.exe": "bfb8798ab678f1ce4a723739f4a3eabab3244d7a04eeb12be2eb9f58095c13ef",
  "@esbuild/win32-ia32/esbuild.exe": "8fa99b6e0945830fce8d7e208fdb21763aa4aea875751f4a0eec7f6e262af1dd",
  "@esbuild/win32-x64/esbuild.exe": "ec02ee9b14ab332416fedd10614dfb80eed5304d94f67745067c011934a8c3c3"
};
function encodePacket(packet) {
  let visit = /* @__PURE__ */ __name((value) => {
    if (value === null) {
      bb.write8(0);
    } else if (typeof value === "boolean") {
      bb.write8(1);
      bb.write8(+value);
    } else if (typeof value === "number") {
      bb.write8(2);
      bb.write32(value | 0);
    } else if (typeof value === "string") {
      bb.write8(3);
      bb.write(encodeUTF8(value));
    } else if (value instanceof Uint8Array) {
      bb.write8(4);
      bb.write(value);
    } else if (value instanceof Array) {
      bb.write8(5);
      bb.write32(value.length);
      for (let item of value) {
        visit(item);
      }
    } else {
      let keys = Object.keys(value);
      bb.write8(6);
      bb.write32(keys.length);
      for (let key of keys) {
        bb.write(encodeUTF8(key));
        visit(value[key]);
      }
    }
  }, "visit");
  let bb = new ByteBuffer();
  bb.write32(0);
  bb.write32(packet.id << 1 | +!packet.isRequest);
  visit(packet.value);
  writeUInt32LE(bb.buf, bb.len - 4, 0);
  return bb.buf.subarray(0, bb.len);
}
__name(encodePacket, "encodePacket");
function decodePacket(bytes) {
  let visit = /* @__PURE__ */ __name(() => {
    switch (bb.read8()) {
      case 0:
        return null;
      case 1:
        return !!bb.read8();
      case 2:
        return bb.read32();
      case 3:
        return decodeUTF8(bb.read());
      case 4:
        return bb.read();
      case 5: {
        let count = bb.read32();
        let value2 = [];
        for (let i = 0; i < count; i++) {
          value2.push(visit());
        }
        return value2;
      }
      case 6: {
        let count = bb.read32();
        let value2 = {};
        for (let i = 0; i < count; i++) {
          value2[decodeUTF8(bb.read())] = visit();
        }
        return value2;
      }
      default:
        throw new Error("Invalid packet");
    }
  }, "visit");
  let bb = new ByteBuffer(bytes);
  let id = bb.read32();
  let isRequest = (id & 1) === 0;
  id >>>= 1;
  let value = visit();
  if (bb.ptr !== bytes.length) {
    throw new Error("Invalid packet");
  }
  return { id, isRequest, value };
}
__name(decodePacket, "decodePacket");
var ByteBuffer = class {
  static {
    __name(this, "ByteBuffer");
  }
  constructor(buf = new Uint8Array(1024)) {
    this.buf = buf;
    this.len = 0;
    this.ptr = 0;
  }
  _write(delta) {
    if (this.len + delta > this.buf.length) {
      let clone = new Uint8Array((this.len + delta) * 2);
      clone.set(this.buf);
      this.buf = clone;
    }
    this.len += delta;
    return this.len - delta;
  }
  write8(value) {
    let offset = this._write(1);
    this.buf[offset] = value;
  }
  write32(value) {
    let offset = this._write(4);
    writeUInt32LE(this.buf, value, offset);
  }
  write(bytes) {
    let offset = this._write(4 + bytes.length);
    writeUInt32LE(this.buf, bytes.length, offset);
    this.buf.set(bytes, offset + 4);
  }
  _read(delta) {
    if (this.ptr + delta > this.buf.length) {
      throw new Error("Invalid packet");
    }
    this.ptr += delta;
    return this.ptr - delta;
  }
  read8() {
    return this.buf[this._read(1)];
  }
  read32() {
    return readUInt32LE(this.buf, this._read(4));
  }
  read() {
    let length = this.read32();
    let bytes = new Uint8Array(length);
    let ptr = this._read(bytes.length);
    bytes.set(this.buf.subarray(ptr, ptr + length));
    return bytes;
  }
};
var encodeUTF8;
var decodeUTF8;
var encodeInvariant;
if (typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined") {
  let encoder = new TextEncoder();
  let decoder = new TextDecoder();
  encodeUTF8 = /* @__PURE__ */ __name((text) => encoder.encode(text), "encodeUTF8");
  decodeUTF8 = /* @__PURE__ */ __name((bytes) => decoder.decode(bytes), "decodeUTF8");
  encodeInvariant = 'new TextEncoder().encode("")';
} else if (typeof Buffer !== "undefined") {
  encodeUTF8 = /* @__PURE__ */ __name((text) => Buffer.from(text), "encodeUTF8");
  decodeUTF8 = /* @__PURE__ */ __name((bytes) => {
    let { buffer, byteOffset, byteLength } = bytes;
    return Buffer.from(buffer, byteOffset, byteLength).toString();
  }, "decodeUTF8");
  encodeInvariant = 'Buffer.from("")';
} else {
  throw new Error("No UTF-8 codec found");
}
if (!(encodeUTF8("") instanceof Uint8Array))
  throw new Error(`Invariant violation: "${encodeInvariant} instanceof Uint8Array" is incorrectly false

This indicates that your JavaScript environment is broken. You cannot use
esbuild in this environment because esbuild relies on this invariant. This
is not a problem with esbuild. You need to fix your environment instead.
`);
function readUInt32LE(buffer, offset) {
  return (buffer[offset++] | buffer[offset++] << 8 | buffer[offset++] << 16 | buffer[offset++] << 24) >>> 0;
}
__name(readUInt32LE, "readUInt32LE");
function writeUInt32LE(buffer, value, offset) {
  buffer[offset++] = value;
  buffer[offset++] = value >> 8;
  buffer[offset++] = value >> 16;
  buffer[offset++] = value >> 24;
}
__name(writeUInt32LE, "writeUInt32LE");
var fromCharCode = String.fromCharCode;
function throwSyntaxError(bytes, index, message) {
  const c = bytes[index];
  let line = 1;
  let column = 0;
  for (let i = 0; i < index; i++) {
    if (bytes[i] === 10) {
      line++;
      column = 0;
    } else {
      column++;
    }
  }
  throw new SyntaxError(
    message ? message : index === bytes.length ? "Unexpected end of input while parsing JSON" : c >= 32 && c <= 126 ? `Unexpected character ${fromCharCode(c)} in JSON at position ${index} (line ${line}, column ${column})` : `Unexpected byte 0x${c.toString(16)} in JSON at position ${index} (line ${line}, column ${column})`
  );
}
__name(throwSyntaxError, "throwSyntaxError");
function JSON_parse(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error(`JSON input must be a Uint8Array`);
  }
  const propertyStack = [];
  const objectStack = [];
  const stateStack = [];
  const length = bytes.length;
  let property = null;
  let state = 0;
  let object;
  let i = 0;
  while (i < length) {
    let c = bytes[i++];
    if (c <= 32) {
      continue;
    }
    let value;
    if (state === 2 && property === null && c !== 34 && c !== 125) {
      throwSyntaxError(bytes, --i);
    }
    switch (c) {
      // True
      case 116: {
        if (bytes[i++] !== 114 || bytes[i++] !== 117 || bytes[i++] !== 101) {
          throwSyntaxError(bytes, --i);
        }
        value = true;
        break;
      }
      // False
      case 102: {
        if (bytes[i++] !== 97 || bytes[i++] !== 108 || bytes[i++] !== 115 || bytes[i++] !== 101) {
          throwSyntaxError(bytes, --i);
        }
        value = false;
        break;
      }
      // Null
      case 110: {
        if (bytes[i++] !== 117 || bytes[i++] !== 108 || bytes[i++] !== 108) {
          throwSyntaxError(bytes, --i);
        }
        value = null;
        break;
      }
      // Number begin
      case 45:
      case 46:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57: {
        let index = i;
        value = fromCharCode(c);
        c = bytes[i];
        while (true) {
          switch (c) {
            case 43:
            case 45:
            case 46:
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
            case 101:
            case 69: {
              value += fromCharCode(c);
              c = bytes[++i];
              continue;
            }
          }
          break;
        }
        value = +value;
        if (isNaN(value)) {
          throwSyntaxError(bytes, --index, "Invalid number");
        }
        break;
      }
      // String begin
      case 34: {
        value = "";
        while (true) {
          if (i >= length) {
            throwSyntaxError(bytes, length);
          }
          c = bytes[i++];
          if (c === 34) {
            break;
          } else if (c === 92) {
            switch (bytes[i++]) {
              // Normal escape sequence
              case 34:
                value += '"';
                break;
              case 47:
                value += "/";
                break;
              case 92:
                value += "\\";
                break;
              case 98:
                value += "\b";
                break;
              case 102:
                value += "\f";
                break;
              case 110:
                value += "\n";
                break;
              case 114:
                value += "\r";
                break;
              case 116:
                value += "	";
                break;
              // Unicode escape sequence
              case 117: {
                let code = 0;
                for (let j = 0; j < 4; j++) {
                  c = bytes[i++];
                  code <<= 4;
                  if (c >= 48 && c <= 57) code |= c - 48;
                  else if (c >= 97 && c <= 102) code |= c + (10 - 97);
                  else if (c >= 65 && c <= 70) code |= c + (10 - 65);
                  else throwSyntaxError(bytes, --i);
                }
                value += fromCharCode(code);
                break;
              }
              // Invalid escape sequence
              default:
                throwSyntaxError(bytes, --i);
                break;
            }
          } else if (c <= 127) {
            value += fromCharCode(c);
          } else if ((c & 224) === 192) {
            value += fromCharCode((c & 31) << 6 | bytes[i++] & 63);
          } else if ((c & 240) === 224) {
            value += fromCharCode((c & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63);
          } else if ((c & 248) == 240) {
            let codePoint = (c & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
            if (codePoint > 65535) {
              codePoint -= 65536;
              value += fromCharCode(codePoint >> 10 & 1023 | 55296);
              codePoint = 56320 | codePoint & 1023;
            }
            value += fromCharCode(codePoint);
          }
        }
        value[0];
        break;
      }
      // Array begin
      case 91: {
        value = [];
        propertyStack.push(property);
        objectStack.push(object);
        stateStack.push(state);
        property = null;
        object = value;
        state = 1;
        continue;
      }
      // Object begin
      case 123: {
        value = {};
        propertyStack.push(property);
        objectStack.push(object);
        stateStack.push(state);
        property = null;
        object = value;
        state = 2;
        continue;
      }
      // Array end
      case 93: {
        if (state !== 1) {
          throwSyntaxError(bytes, --i);
        }
        value = object;
        property = propertyStack.pop();
        object = objectStack.pop();
        state = stateStack.pop();
        break;
      }
      // Object end
      case 125: {
        if (state !== 2) {
          throwSyntaxError(bytes, --i);
        }
        value = object;
        property = propertyStack.pop();
        object = objectStack.pop();
        state = stateStack.pop();
        break;
      }
      default: {
        throwSyntaxError(bytes, --i);
      }
    }
    c = bytes[i];
    while (c <= 32) {
      c = bytes[++i];
    }
    switch (state) {
      case 0: {
        if (i === length) {
          return value;
        }
        break;
      }
      case 1: {
        object.push(value);
        if (c === 44) {
          i++;
          continue;
        }
        if (c === 93) {
          continue;
        }
        break;
      }
      case 2: {
        if (property === null) {
          property = value;
          if (c === 58) {
            i++;
            continue;
          }
        } else {
          object[property] = value;
          property = null;
          if (c === 44) {
            i++;
            continue;
          }
          if (c === 125) {
            continue;
          }
        }
        break;
      }
    }
    break;
  }
  throwSyntaxError(bytes, i);
}
__name(JSON_parse, "JSON_parse");
var quote = JSON.stringify;
var buildLogLevelDefault = "warning";
var transformLogLevelDefault = "silent";
function validateAndJoinStringArray(values, what) {
  const toJoin = [];
  for (const value of values) {
    validateStringValue(value, what);
    if (value.indexOf(",") >= 0) throw new Error(`Invalid ${what}: ${value}`);
    toJoin.push(value);
  }
  return toJoin.join(",");
}
__name(validateAndJoinStringArray, "validateAndJoinStringArray");
var canBeAnything = /* @__PURE__ */ __name(() => null, "canBeAnything");
var mustBeBoolean = /* @__PURE__ */ __name((value) => typeof value === "boolean" ? null : "a boolean", "mustBeBoolean");
var mustBeString = /* @__PURE__ */ __name((value) => typeof value === "string" ? null : "a string", "mustBeString");
var mustBeRegExp = /* @__PURE__ */ __name((value) => value instanceof RegExp ? null : "a RegExp object", "mustBeRegExp");
var mustBeInteger = /* @__PURE__ */ __name((value) => typeof value === "number" && value === (value | 0) ? null : "an integer", "mustBeInteger");
var mustBeValidPortNumber = /* @__PURE__ */ __name((value) => typeof value === "number" && value === (value | 0) && value >= 0 && value <= 65535 ? null : "a valid port number", "mustBeValidPortNumber");
var mustBeFunction = /* @__PURE__ */ __name((value) => typeof value === "function" ? null : "a function", "mustBeFunction");
var mustBeArray = /* @__PURE__ */ __name((value) => Array.isArray(value) ? null : "an array", "mustBeArray");
var mustBeArrayOfStrings = /* @__PURE__ */ __name((value) => Array.isArray(value) && value.every((x) => typeof x === "string") ? null : "an array of strings", "mustBeArrayOfStrings");
var mustBeObject = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null && !Array.isArray(value) ? null : "an object", "mustBeObject");
var mustBeEntryPoints = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null ? null : "an array or an object", "mustBeEntryPoints");
var mustBeWebAssemblyModule = /* @__PURE__ */ __name((value) => value instanceof WebAssembly.Module ? null : "a WebAssembly.Module", "mustBeWebAssemblyModule");
var mustBeObjectOrNull = /* @__PURE__ */ __name((value) => typeof value === "object" && !Array.isArray(value) ? null : "an object or null", "mustBeObjectOrNull");
var mustBeStringOrBoolean = /* @__PURE__ */ __name((value) => typeof value === "string" || typeof value === "boolean" ? null : "a string or a boolean", "mustBeStringOrBoolean");
var mustBeStringOrObject = /* @__PURE__ */ __name((value) => typeof value === "string" || typeof value === "object" && value !== null && !Array.isArray(value) ? null : "a string or an object", "mustBeStringOrObject");
var mustBeStringOrArrayOfStrings = /* @__PURE__ */ __name((value) => typeof value === "string" || Array.isArray(value) && value.every((x) => typeof x === "string") ? null : "a string or an array of strings", "mustBeStringOrArrayOfStrings");
var mustBeStringOrUint8Array = /* @__PURE__ */ __name((value) => typeof value === "string" || value instanceof Uint8Array ? null : "a string or a Uint8Array", "mustBeStringOrUint8Array");
var mustBeStringOrURL = /* @__PURE__ */ __name((value) => typeof value === "string" || value instanceof URL ? null : "a string or a URL", "mustBeStringOrURL");
function getFlag(object, keys, key, mustBeFn) {
  let value = object[key];
  keys[key + ""] = true;
  if (value === void 0) return void 0;
  let mustBe = mustBeFn(value);
  if (mustBe !== null) throw new Error(`${quote(key)} must be ${mustBe}`);
  return value;
}
__name(getFlag, "getFlag");
function checkForInvalidFlags(object, keys, where) {
  for (let key in object) {
    if (!(key in keys)) {
      throw new Error(`Invalid option ${where}: ${quote(key)}`);
    }
  }
}
__name(checkForInvalidFlags, "checkForInvalidFlags");
function validateInitializeOptions(options) {
  let keys = /* @__PURE__ */ Object.create(null);
  let wasmURL = getFlag(options, keys, "wasmURL", mustBeStringOrURL);
  let wasmModule = getFlag(options, keys, "wasmModule", mustBeWebAssemblyModule);
  let worker = getFlag(options, keys, "worker", mustBeBoolean);
  checkForInvalidFlags(options, keys, "in initialize() call");
  return {
    wasmURL,
    wasmModule,
    worker
  };
}
__name(validateInitializeOptions, "validateInitializeOptions");
function validateMangleCache(mangleCache) {
  let validated;
  if (mangleCache !== void 0) {
    validated = /* @__PURE__ */ Object.create(null);
    for (let key in mangleCache) {
      let value = mangleCache[key];
      if (typeof value === "string" || value === false) {
        validated[key] = value;
      } else {
        throw new Error(`Expected ${quote(key)} in mangle cache to map to either a string or false`);
      }
    }
  }
  return validated;
}
__name(validateMangleCache, "validateMangleCache");
function pushLogFlags(flags, options, keys, isTTY, logLevelDefault) {
  let color = getFlag(options, keys, "color", mustBeBoolean);
  let logLevel = getFlag(options, keys, "logLevel", mustBeString);
  let logLimit = getFlag(options, keys, "logLimit", mustBeInteger);
  if (color !== void 0) flags.push(`--color=${color}`);
  else if (isTTY) flags.push(`--color=true`);
  flags.push(`--log-level=${logLevel || logLevelDefault}`);
  flags.push(`--log-limit=${logLimit || 0}`);
}
__name(pushLogFlags, "pushLogFlags");
function validateStringValue(value, what, key) {
  if (typeof value !== "string") {
    throw new Error(`Expected value for ${what}${key !== void 0 ? " " + quote(key) : ""} to be a string, got ${typeof value} instead`);
  }
  return value;
}
__name(validateStringValue, "validateStringValue");
function pushCommonFlags(flags, options, keys) {
  let legalComments = getFlag(options, keys, "legalComments", mustBeString);
  let sourceRoot = getFlag(options, keys, "sourceRoot", mustBeString);
  let sourcesContent = getFlag(options, keys, "sourcesContent", mustBeBoolean);
  let target = getFlag(options, keys, "target", mustBeStringOrArrayOfStrings);
  let format = getFlag(options, keys, "format", mustBeString);
  let globalName = getFlag(options, keys, "globalName", mustBeString);
  let mangleProps = getFlag(options, keys, "mangleProps", mustBeRegExp);
  let reserveProps = getFlag(options, keys, "reserveProps", mustBeRegExp);
  let mangleQuoted = getFlag(options, keys, "mangleQuoted", mustBeBoolean);
  let minify = getFlag(options, keys, "minify", mustBeBoolean);
  let minifySyntax = getFlag(options, keys, "minifySyntax", mustBeBoolean);
  let minifyWhitespace = getFlag(options, keys, "minifyWhitespace", mustBeBoolean);
  let minifyIdentifiers = getFlag(options, keys, "minifyIdentifiers", mustBeBoolean);
  let lineLimit = getFlag(options, keys, "lineLimit", mustBeInteger);
  let drop = getFlag(options, keys, "drop", mustBeArrayOfStrings);
  let dropLabels = getFlag(options, keys, "dropLabels", mustBeArrayOfStrings);
  let charset = getFlag(options, keys, "charset", mustBeString);
  let treeShaking = getFlag(options, keys, "treeShaking", mustBeBoolean);
  let ignoreAnnotations = getFlag(options, keys, "ignoreAnnotations", mustBeBoolean);
  let jsx = getFlag(options, keys, "jsx", mustBeString);
  let jsxFactory = getFlag(options, keys, "jsxFactory", mustBeString);
  let jsxFragment = getFlag(options, keys, "jsxFragment", mustBeString);
  let jsxImportSource = getFlag(options, keys, "jsxImportSource", mustBeString);
  let jsxDev = getFlag(options, keys, "jsxDev", mustBeBoolean);
  let jsxSideEffects = getFlag(options, keys, "jsxSideEffects", mustBeBoolean);
  let define = getFlag(options, keys, "define", mustBeObject);
  let logOverride = getFlag(options, keys, "logOverride", mustBeObject);
  let supported = getFlag(options, keys, "supported", mustBeObject);
  let pure = getFlag(options, keys, "pure", mustBeArrayOfStrings);
  let keepNames = getFlag(options, keys, "keepNames", mustBeBoolean);
  let platform = getFlag(options, keys, "platform", mustBeString);
  let tsconfigRaw = getFlag(options, keys, "tsconfigRaw", mustBeStringOrObject);
  let absPaths = getFlag(options, keys, "absPaths", mustBeArrayOfStrings);
  if (legalComments) flags.push(`--legal-comments=${legalComments}`);
  if (sourceRoot !== void 0) flags.push(`--source-root=${sourceRoot}`);
  if (sourcesContent !== void 0) flags.push(`--sources-content=${sourcesContent}`);
  if (target) flags.push(`--target=${validateAndJoinStringArray(Array.isArray(target) ? target : [target], "target")}`);
  if (format) flags.push(`--format=${format}`);
  if (globalName) flags.push(`--global-name=${globalName}`);
  if (platform) flags.push(`--platform=${platform}`);
  if (tsconfigRaw) flags.push(`--tsconfig-raw=${typeof tsconfigRaw === "string" ? tsconfigRaw : JSON.stringify(tsconfigRaw)}`);
  if (minify) flags.push("--minify");
  if (minifySyntax) flags.push("--minify-syntax");
  if (minifyWhitespace) flags.push("--minify-whitespace");
  if (minifyIdentifiers) flags.push("--minify-identifiers");
  if (lineLimit) flags.push(`--line-limit=${lineLimit}`);
  if (charset) flags.push(`--charset=${charset}`);
  if (treeShaking !== void 0) flags.push(`--tree-shaking=${treeShaking}`);
  if (ignoreAnnotations) flags.push(`--ignore-annotations`);
  if (drop) for (let what of drop) flags.push(`--drop:${validateStringValue(what, "drop")}`);
  if (dropLabels) flags.push(`--drop-labels=${validateAndJoinStringArray(dropLabels, "drop label")}`);
  if (absPaths) flags.push(`--abs-paths=${validateAndJoinStringArray(absPaths, "abs paths")}`);
  if (mangleProps) flags.push(`--mangle-props=${jsRegExpToGoRegExp(mangleProps)}`);
  if (reserveProps) flags.push(`--reserve-props=${jsRegExpToGoRegExp(reserveProps)}`);
  if (mangleQuoted !== void 0) flags.push(`--mangle-quoted=${mangleQuoted}`);
  if (jsx) flags.push(`--jsx=${jsx}`);
  if (jsxFactory) flags.push(`--jsx-factory=${jsxFactory}`);
  if (jsxFragment) flags.push(`--jsx-fragment=${jsxFragment}`);
  if (jsxImportSource) flags.push(`--jsx-import-source=${jsxImportSource}`);
  if (jsxDev) flags.push(`--jsx-dev`);
  if (jsxSideEffects) flags.push(`--jsx-side-effects`);
  if (define) {
    for (let key in define) {
      if (key.indexOf("=") >= 0) throw new Error(`Invalid define: ${key}`);
      flags.push(`--define:${key}=${validateStringValue(define[key], "define", key)}`);
    }
  }
  if (logOverride) {
    for (let key in logOverride) {
      if (key.indexOf("=") >= 0) throw new Error(`Invalid log override: ${key}`);
      flags.push(`--log-override:${key}=${validateStringValue(logOverride[key], "log override", key)}`);
    }
  }
  if (supported) {
    for (let key in supported) {
      if (key.indexOf("=") >= 0) throw new Error(`Invalid supported: ${key}`);
      const value = supported[key];
      if (typeof value !== "boolean") throw new Error(`Expected value for supported ${quote(key)} to be a boolean, got ${typeof value} instead`);
      flags.push(`--supported:${key}=${value}`);
    }
  }
  if (pure) for (let fn of pure) flags.push(`--pure:${validateStringValue(fn, "pure")}`);
  if (keepNames) flags.push(`--keep-names`);
}
__name(pushCommonFlags, "pushCommonFlags");
function flagsForBuildOptions(callName, options, isTTY, logLevelDefault, writeDefault) {
  let flags = [];
  let entries = [];
  let keys = /* @__PURE__ */ Object.create(null);
  let stdinContents = null;
  let stdinResolveDir = null;
  pushLogFlags(flags, options, keys, isTTY, logLevelDefault);
  pushCommonFlags(flags, options, keys);
  let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
  let bundle = getFlag(options, keys, "bundle", mustBeBoolean);
  let splitting = getFlag(options, keys, "splitting", mustBeBoolean);
  let preserveSymlinks = getFlag(options, keys, "preserveSymlinks", mustBeBoolean);
  let metafile = getFlag(options, keys, "metafile", mustBeBoolean);
  let outfile = getFlag(options, keys, "outfile", mustBeString);
  let outdir = getFlag(options, keys, "outdir", mustBeString);
  let outbase = getFlag(options, keys, "outbase", mustBeString);
  let tsconfig = getFlag(options, keys, "tsconfig", mustBeString);
  let resolveExtensions = getFlag(options, keys, "resolveExtensions", mustBeArrayOfStrings);
  let nodePathsInput = getFlag(options, keys, "nodePaths", mustBeArrayOfStrings);
  let mainFields = getFlag(options, keys, "mainFields", mustBeArrayOfStrings);
  let conditions = getFlag(options, keys, "conditions", mustBeArrayOfStrings);
  let external = getFlag(options, keys, "external", mustBeArrayOfStrings);
  let packages = getFlag(options, keys, "packages", mustBeString);
  let alias = getFlag(options, keys, "alias", mustBeObject);
  let loader = getFlag(options, keys, "loader", mustBeObject);
  let outExtension = getFlag(options, keys, "outExtension", mustBeObject);
  let publicPath = getFlag(options, keys, "publicPath", mustBeString);
  let entryNames = getFlag(options, keys, "entryNames", mustBeString);
  let chunkNames = getFlag(options, keys, "chunkNames", mustBeString);
  let assetNames = getFlag(options, keys, "assetNames", mustBeString);
  let inject = getFlag(options, keys, "inject", mustBeArrayOfStrings);
  let banner = getFlag(options, keys, "banner", mustBeObject);
  let footer = getFlag(options, keys, "footer", mustBeObject);
  let entryPoints = getFlag(options, keys, "entryPoints", mustBeEntryPoints);
  let absWorkingDir = getFlag(options, keys, "absWorkingDir", mustBeString);
  let stdin = getFlag(options, keys, "stdin", mustBeObject);
  let write = getFlag(options, keys, "write", mustBeBoolean) ?? writeDefault;
  let allowOverwrite = getFlag(options, keys, "allowOverwrite", mustBeBoolean);
  let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
  keys.plugins = true;
  checkForInvalidFlags(options, keys, `in ${callName}() call`);
  if (sourcemap) flags.push(`--sourcemap${sourcemap === true ? "" : `=${sourcemap}`}`);
  if (bundle) flags.push("--bundle");
  if (allowOverwrite) flags.push("--allow-overwrite");
  if (splitting) flags.push("--splitting");
  if (preserveSymlinks) flags.push("--preserve-symlinks");
  if (metafile) flags.push(`--metafile`);
  if (outfile) flags.push(`--outfile=${outfile}`);
  if (outdir) flags.push(`--outdir=${outdir}`);
  if (outbase) flags.push(`--outbase=${outbase}`);
  if (tsconfig) flags.push(`--tsconfig=${tsconfig}`);
  if (packages) flags.push(`--packages=${packages}`);
  if (resolveExtensions) flags.push(`--resolve-extensions=${validateAndJoinStringArray(resolveExtensions, "resolve extension")}`);
  if (publicPath) flags.push(`--public-path=${publicPath}`);
  if (entryNames) flags.push(`--entry-names=${entryNames}`);
  if (chunkNames) flags.push(`--chunk-names=${chunkNames}`);
  if (assetNames) flags.push(`--asset-names=${assetNames}`);
  if (mainFields) flags.push(`--main-fields=${validateAndJoinStringArray(mainFields, "main field")}`);
  if (conditions) flags.push(`--conditions=${validateAndJoinStringArray(conditions, "condition")}`);
  if (external) for (let name of external) flags.push(`--external:${validateStringValue(name, "external")}`);
  if (alias) {
    for (let old in alias) {
      if (old.indexOf("=") >= 0) throw new Error(`Invalid package name in alias: ${old}`);
      flags.push(`--alias:${old}=${validateStringValue(alias[old], "alias", old)}`);
    }
  }
  if (banner) {
    for (let type in banner) {
      if (type.indexOf("=") >= 0) throw new Error(`Invalid banner file type: ${type}`);
      flags.push(`--banner:${type}=${validateStringValue(banner[type], "banner", type)}`);
    }
  }
  if (footer) {
    for (let type in footer) {
      if (type.indexOf("=") >= 0) throw new Error(`Invalid footer file type: ${type}`);
      flags.push(`--footer:${type}=${validateStringValue(footer[type], "footer", type)}`);
    }
  }
  if (inject) for (let path of inject) flags.push(`--inject:${validateStringValue(path, "inject")}`);
  if (loader) {
    for (let ext in loader) {
      if (ext.indexOf("=") >= 0) throw new Error(`Invalid loader extension: ${ext}`);
      flags.push(`--loader:${ext}=${validateStringValue(loader[ext], "loader", ext)}`);
    }
  }
  if (outExtension) {
    for (let ext in outExtension) {
      if (ext.indexOf("=") >= 0) throw new Error(`Invalid out extension: ${ext}`);
      flags.push(`--out-extension:${ext}=${validateStringValue(outExtension[ext], "out extension", ext)}`);
    }
  }
  if (entryPoints) {
    if (Array.isArray(entryPoints)) {
      for (let i = 0, n = entryPoints.length; i < n; i++) {
        let entryPoint = entryPoints[i];
        if (typeof entryPoint === "object" && entryPoint !== null) {
          let entryPointKeys = /* @__PURE__ */ Object.create(null);
          let input = getFlag(entryPoint, entryPointKeys, "in", mustBeString);
          let output = getFlag(entryPoint, entryPointKeys, "out", mustBeString);
          checkForInvalidFlags(entryPoint, entryPointKeys, "in entry point at index " + i);
          if (input === void 0) throw new Error('Missing property "in" for entry point at index ' + i);
          if (output === void 0) throw new Error('Missing property "out" for entry point at index ' + i);
          entries.push([output, input]);
        } else {
          entries.push(["", validateStringValue(entryPoint, "entry point at index " + i)]);
        }
      }
    } else {
      for (let key in entryPoints) {
        entries.push([key, validateStringValue(entryPoints[key], "entry point", key)]);
      }
    }
  }
  if (stdin) {
    let stdinKeys = /* @__PURE__ */ Object.create(null);
    let contents = getFlag(stdin, stdinKeys, "contents", mustBeStringOrUint8Array);
    let resolveDir = getFlag(stdin, stdinKeys, "resolveDir", mustBeString);
    let sourcefile = getFlag(stdin, stdinKeys, "sourcefile", mustBeString);
    let loader2 = getFlag(stdin, stdinKeys, "loader", mustBeString);
    checkForInvalidFlags(stdin, stdinKeys, 'in "stdin" object');
    if (sourcefile) flags.push(`--sourcefile=${sourcefile}`);
    if (loader2) flags.push(`--loader=${loader2}`);
    if (resolveDir) stdinResolveDir = resolveDir;
    if (typeof contents === "string") stdinContents = encodeUTF8(contents);
    else if (contents instanceof Uint8Array) stdinContents = contents;
  }
  let nodePaths = [];
  if (nodePathsInput) {
    for (let value of nodePathsInput) {
      value += "";
      nodePaths.push(value);
    }
  }
  return {
    entries,
    flags,
    write,
    stdinContents,
    stdinResolveDir,
    absWorkingDir,
    nodePaths,
    mangleCache: validateMangleCache(mangleCache)
  };
}
__name(flagsForBuildOptions, "flagsForBuildOptions");
function flagsForTransformOptions(callName, options, isTTY, logLevelDefault) {
  let flags = [];
  let keys = /* @__PURE__ */ Object.create(null);
  pushLogFlags(flags, options, keys, isTTY, logLevelDefault);
  pushCommonFlags(flags, options, keys);
  let sourcemap = getFlag(options, keys, "sourcemap", mustBeStringOrBoolean);
  let sourcefile = getFlag(options, keys, "sourcefile", mustBeString);
  let loader = getFlag(options, keys, "loader", mustBeString);
  let banner = getFlag(options, keys, "banner", mustBeString);
  let footer = getFlag(options, keys, "footer", mustBeString);
  let mangleCache = getFlag(options, keys, "mangleCache", mustBeObject);
  checkForInvalidFlags(options, keys, `in ${callName}() call`);
  if (sourcemap) flags.push(`--sourcemap=${sourcemap === true ? "external" : sourcemap}`);
  if (sourcefile) flags.push(`--sourcefile=${sourcefile}`);
  if (loader) flags.push(`--loader=${loader}`);
  if (banner) flags.push(`--banner=${banner}`);
  if (footer) flags.push(`--footer=${footer}`);
  return {
    flags,
    mangleCache: validateMangleCache(mangleCache)
  };
}
__name(flagsForTransformOptions, "flagsForTransformOptions");
function createChannel(streamIn) {
  const requestCallbacksByKey = {};
  const closeData = { didClose: false, reason: "" };
  let responseCallbacks = {};
  let nextRequestID = 0;
  let nextBuildKey = 0;
  let stdout = new Uint8Array(16 * 1024);
  let stdoutUsed = 0;
  let readFromStdout = /* @__PURE__ */ __name((chunk) => {
    let limit = stdoutUsed + chunk.length;
    if (limit > stdout.length) {
      let swap = new Uint8Array(limit * 2);
      swap.set(stdout);
      stdout = swap;
    }
    stdout.set(chunk, stdoutUsed);
    stdoutUsed += chunk.length;
    let offset = 0;
    while (offset + 4 <= stdoutUsed) {
      let length = readUInt32LE(stdout, offset);
      if (offset + 4 + length > stdoutUsed) {
        break;
      }
      offset += 4;
      handleIncomingPacket(stdout.subarray(offset, offset + length));
      offset += length;
    }
    if (offset > 0) {
      stdout.copyWithin(0, offset, stdoutUsed);
      stdoutUsed -= offset;
    }
  }, "readFromStdout");
  let afterClose = /* @__PURE__ */ __name((error) => {
    closeData.didClose = true;
    if (error) closeData.reason = ": " + (error.message || error);
    const text = "The service was stopped" + closeData.reason;
    for (let id in responseCallbacks) {
      responseCallbacks[id](text, null);
    }
    responseCallbacks = {};
  }, "afterClose");
  let sendRequest = /* @__PURE__ */ __name((refs, value, callback) => {
    if (closeData.didClose) return callback("The service is no longer running" + closeData.reason, null);
    let id = nextRequestID++;
    responseCallbacks[id] = (error, response) => {
      try {
        callback(error, response);
      } finally {
        if (refs) refs.unref();
      }
    };
    if (refs) refs.ref();
    streamIn.writeToStdin(encodePacket({ id, isRequest: true, value }));
  }, "sendRequest");
  let sendResponse = /* @__PURE__ */ __name((id, value) => {
    if (closeData.didClose) throw new Error("The service is no longer running" + closeData.reason);
    streamIn.writeToStdin(encodePacket({ id, isRequest: false, value }));
  }, "sendResponse");
  let handleRequest = /* @__PURE__ */ __name(async (id, request) => {
    try {
      if (request.command === "ping") {
        sendResponse(id, {});
        return;
      }
      if (typeof request.key === "number") {
        const requestCallbacks = requestCallbacksByKey[request.key];
        if (!requestCallbacks) {
          return;
        }
        const callback = requestCallbacks[request.command];
        if (callback) {
          await callback(id, request);
          return;
        }
      }
      throw new Error(`Invalid command: ` + request.command);
    } catch (e) {
      const errors = [extractErrorMessageV8(e, streamIn, null, void 0, "")];
      try {
        sendResponse(id, { errors });
      } catch {
      }
    }
  }, "handleRequest");
  let isFirstPacket = true;
  let handleIncomingPacket = /* @__PURE__ */ __name((bytes) => {
    if (isFirstPacket) {
      isFirstPacket = false;
      let binaryVersion = String.fromCharCode(...bytes);
      if (binaryVersion !== "0.28.1") {
        throw new Error(`Cannot start service: Host version "${"0.28.1"}" does not match binary version ${quote(binaryVersion)}`);
      }
      return;
    }
    let packet = decodePacket(bytes);
    if (packet.isRequest) {
      handleRequest(packet.id, packet.value);
    } else {
      let callback = responseCallbacks[packet.id];
      delete responseCallbacks[packet.id];
      if (packet.value.error) callback(packet.value.error, {});
      else callback(null, packet.value);
    }
  }, "handleIncomingPacket");
  let buildOrContext = /* @__PURE__ */ __name(({ callName, refs, options, isTTY, defaultWD: defaultWD2, callback }) => {
    let refCount = 0;
    const buildKey = nextBuildKey++;
    const requestCallbacks = {};
    const buildRefs = {
      ref() {
        if (++refCount === 1) {
          if (refs) refs.ref();
        }
      },
      unref() {
        if (--refCount === 0) {
          delete requestCallbacksByKey[buildKey];
          if (refs) refs.unref();
        }
      }
    };
    requestCallbacksByKey[buildKey] = requestCallbacks;
    buildRefs.ref();
    buildOrContextImpl(
      callName,
      buildKey,
      sendRequest,
      sendResponse,
      buildRefs,
      streamIn,
      requestCallbacks,
      options,
      isTTY,
      defaultWD2,
      (err, res) => {
        try {
          callback(err, res);
        } finally {
          buildRefs.unref();
        }
      }
    );
  }, "buildOrContext");
  let transform2 = /* @__PURE__ */ __name(({ callName, refs, input, options, isTTY, fs, callback }) => {
    const details = createObjectStash();
    let start = /* @__PURE__ */ __name((inputPath) => {
      try {
        if (typeof input !== "string" && !(input instanceof Uint8Array))
          throw new Error('The input to "transform" must be a string or a Uint8Array');
        let {
          flags,
          mangleCache
        } = flagsForTransformOptions(callName, options, isTTY, transformLogLevelDefault);
        let request = {
          command: "transform",
          flags,
          inputFS: inputPath !== null,
          input: inputPath !== null ? encodeUTF8(inputPath) : typeof input === "string" ? encodeUTF8(input) : input
        };
        if (mangleCache) request.mangleCache = mangleCache;
        sendRequest(refs, request, (error, response) => {
          if (error) return callback(new Error(error), null);
          let errors = replaceDetailsInMessages(response.errors, details);
          let warnings = replaceDetailsInMessages(response.warnings, details);
          let outstanding = 1;
          let next = /* @__PURE__ */ __name(() => {
            if (--outstanding === 0) {
              let result = {
                warnings,
                code: response.code,
                map: response.map,
                mangleCache: void 0,
                legalComments: void 0
              };
              if ("legalComments" in response) result.legalComments = response == null ? void 0 : response.legalComments;
              if (response.mangleCache) result.mangleCache = response == null ? void 0 : response.mangleCache;
              callback(null, result);
            }
          }, "next");
          if (errors.length > 0) return callback(failureErrorWithLog("Transform failed", errors, warnings), null);
          if (response.codeFS) {
            outstanding++;
            fs.readFile(response.code, (err, contents) => {
              if (err !== null) {
                callback(err, null);
              } else {
                response.code = contents;
                next();
              }
            });
          }
          if (response.mapFS) {
            outstanding++;
            fs.readFile(response.map, (err, contents) => {
              if (err !== null) {
                callback(err, null);
              } else {
                response.map = contents;
                next();
              }
            });
          }
          next();
        });
      } catch (e) {
        let flags = [];
        try {
          pushLogFlags(flags, options, {}, isTTY, transformLogLevelDefault);
        } catch {
        }
        const error = extractErrorMessageV8(e, streamIn, details, void 0, "");
        sendRequest(refs, { command: "error", flags, error }, () => {
          error.detail = details.load(error.detail);
          callback(failureErrorWithLog("Transform failed", [error], []), null);
        });
      }
    }, "start");
    if ((typeof input === "string" || input instanceof Uint8Array) && input.length > 1024 * 1024) {
      let next = start;
      start = /* @__PURE__ */ __name(() => fs.writeFile(input, next), "start");
    }
    start(null);
  }, "transform2");
  let formatMessages2 = /* @__PURE__ */ __name(({ callName, refs, messages, options, callback }) => {
    if (!options) throw new Error(`Missing second argument in ${callName}() call`);
    let keys = {};
    let kind = getFlag(options, keys, "kind", mustBeString);
    let color = getFlag(options, keys, "color", mustBeBoolean);
    let terminalWidth = getFlag(options, keys, "terminalWidth", mustBeInteger);
    checkForInvalidFlags(options, keys, `in ${callName}() call`);
    if (kind === void 0) throw new Error(`Missing "kind" in ${callName}() call`);
    if (kind !== "error" && kind !== "warning") throw new Error(`Expected "kind" to be "error" or "warning" in ${callName}() call`);
    let request = {
      command: "format-msgs",
      messages: sanitizeMessages(messages, "messages", null, "", terminalWidth),
      isWarning: kind === "warning"
    };
    if (color !== void 0) request.color = color;
    if (terminalWidth !== void 0) request.terminalWidth = terminalWidth;
    sendRequest(refs, request, (error, response) => {
      if (error) return callback(new Error(error), null);
      callback(null, response.messages);
    });
  }, "formatMessages2");
  let analyzeMetafile2 = /* @__PURE__ */ __name(({ callName, refs, metafile, options, callback }) => {
    if (options === void 0) options = {};
    let keys = {};
    let color = getFlag(options, keys, "color", mustBeBoolean);
    let verbose = getFlag(options, keys, "verbose", mustBeBoolean);
    checkForInvalidFlags(options, keys, `in ${callName}() call`);
    let request = {
      command: "analyze-metafile",
      metafile
    };
    if (color !== void 0) request.color = color;
    if (verbose !== void 0) request.verbose = verbose;
    sendRequest(refs, request, (error, response) => {
      if (error) return callback(new Error(error), null);
      callback(null, response.result);
    });
  }, "analyzeMetafile2");
  return {
    readFromStdout,
    afterClose,
    service: {
      buildOrContext,
      transform: transform2,
      formatMessages: formatMessages2,
      analyzeMetafile: analyzeMetafile2
    }
  };
}
__name(createChannel, "createChannel");
function buildOrContextImpl(callName, buildKey, sendRequest, sendResponse, refs, streamIn, requestCallbacks, options, isTTY, defaultWD2, callback) {
  const details = createObjectStash();
  const isContext = callName === "context";
  const handleError = /* @__PURE__ */ __name((e, pluginName) => {
    const flags = [];
    try {
      pushLogFlags(flags, options, {}, isTTY, buildLogLevelDefault);
    } catch {
    }
    const message = extractErrorMessageV8(e, streamIn, details, void 0, pluginName);
    sendRequest(refs, { command: "error", flags, error: message }, () => {
      message.detail = details.load(message.detail);
      callback(failureErrorWithLog(isContext ? "Context failed" : "Build failed", [message], []), null);
    });
  }, "handleError");
  let plugins;
  if (typeof options === "object") {
    const value = options.plugins;
    if (value !== void 0) {
      if (!Array.isArray(value)) return handleError(new Error(`"plugins" must be an array`), "");
      plugins = value;
    }
  }
  if (plugins && plugins.length > 0) {
    if (streamIn.isSync) return handleError(new Error("Cannot use plugins in synchronous API calls"), "");
    handlePlugins(
      buildKey,
      sendRequest,
      sendResponse,
      refs,
      streamIn,
      requestCallbacks,
      options,
      plugins,
      details
    ).then(
      (result) => {
        if (!result.ok) return handleError(result.error, result.pluginName);
        try {
          buildOrContextContinue(result.requestPlugins, result.runOnEndCallbacks, result.scheduleOnDisposeCallbacks);
        } catch (e) {
          handleError(e, "");
        }
      },
      (e) => handleError(e, "")
    );
    return;
  }
  try {
    buildOrContextContinue(null, (result, done) => done([], []), () => {
    });
  } catch (e) {
    handleError(e, "");
  }
  function buildOrContextContinue(requestPlugins, runOnEndCallbacks, scheduleOnDisposeCallbacks) {
    const writeDefault = streamIn.hasFS;
    const {
      entries,
      flags,
      write,
      stdinContents,
      stdinResolveDir,
      absWorkingDir,
      nodePaths,
      mangleCache
    } = flagsForBuildOptions(callName, options, isTTY, buildLogLevelDefault, writeDefault);
    if (write && !streamIn.hasFS) throw new Error(`The "write" option is unavailable in this environment`);
    const request = {
      command: "build",
      key: buildKey,
      entries,
      flags,
      write,
      stdinContents,
      stdinResolveDir,
      absWorkingDir: absWorkingDir || defaultWD2,
      nodePaths,
      context: isContext
    };
    if (requestPlugins) request.plugins = requestPlugins;
    if (mangleCache) request.mangleCache = mangleCache;
    const buildResponseToResult = /* @__PURE__ */ __name((response, callback2) => {
      const result = {
        errors: replaceDetailsInMessages(response.errors, details),
        warnings: replaceDetailsInMessages(response.warnings, details),
        outputFiles: void 0,
        metafile: void 0,
        mangleCache: void 0
      };
      const originalErrors = result.errors.slice();
      const originalWarnings = result.warnings.slice();
      if (response.outputFiles) result.outputFiles = response.outputFiles.map(convertOutputFiles);
      if (response.metafile && response.metafile.length) result.metafile = parseJSON(response.metafile);
      if (response.mangleCache) result.mangleCache = response.mangleCache;
      if (response.writeToStdout !== void 0) console.log(decodeUTF8(response.writeToStdout).replace(/\n$/, ""));
      runOnEndCallbacks(result, (onEndErrors, onEndWarnings) => {
        if (originalErrors.length > 0 || onEndErrors.length > 0) {
          const error = failureErrorWithLog("Build failed", originalErrors.concat(onEndErrors), originalWarnings.concat(onEndWarnings));
          return callback2(error, null, onEndErrors, onEndWarnings);
        }
        callback2(null, result, onEndErrors, onEndWarnings);
      });
    }, "buildResponseToResult");
    let latestResultPromise;
    let provideLatestResult;
    if (isContext)
      requestCallbacks["on-end"] = (id, request2) => new Promise((resolve) => {
        buildResponseToResult(request2, (err, result, onEndErrors, onEndWarnings) => {
          const response = {
            errors: onEndErrors,
            warnings: onEndWarnings
          };
          if (provideLatestResult) provideLatestResult(err, result);
          latestResultPromise = void 0;
          provideLatestResult = void 0;
          sendResponse(id, response);
          resolve();
        });
      });
    sendRequest(refs, request, (error, response) => {
      if (error) return callback(new Error(error), null);
      if (!isContext) {
        return buildResponseToResult(response, (err, res) => {
          scheduleOnDisposeCallbacks();
          return callback(err, res);
        });
      }
      if (response.errors.length > 0) {
        return callback(failureErrorWithLog("Context failed", response.errors, response.warnings), null);
      }
      let didDispose = false;
      const result = {
        rebuild: /* @__PURE__ */ __name(() => {
          if (!latestResultPromise) latestResultPromise = new Promise((resolve, reject) => {
            let settlePromise;
            provideLatestResult = /* @__PURE__ */ __name((err, result2) => {
              if (!settlePromise) settlePromise = /* @__PURE__ */ __name(() => err ? reject(err) : resolve(result2), "settlePromise");
            }, "provideLatestResult");
            const triggerAnotherBuild = /* @__PURE__ */ __name(() => {
              const request2 = {
                command: "rebuild",
                key: buildKey
              };
              sendRequest(refs, request2, (error2, response2) => {
                if (error2) {
                  reject(new Error(error2));
                } else if (settlePromise) {
                  settlePromise();
                } else {
                  triggerAnotherBuild();
                }
              });
            }, "triggerAnotherBuild");
            triggerAnotherBuild();
          });
          return latestResultPromise;
        }, "rebuild"),
        watch: /* @__PURE__ */ __name((options2 = {}) => new Promise((resolve, reject) => {
          if (!streamIn.hasFS) throw new Error(`Cannot use the "watch" API in this environment`);
          const keys = {};
          const delay = getFlag(options2, keys, "delay", mustBeInteger);
          checkForInvalidFlags(options2, keys, `in watch() call`);
          const request2 = {
            command: "watch",
            key: buildKey
          };
          if (delay) request2.delay = delay;
          sendRequest(refs, request2, (error2) => {
            if (error2) reject(new Error(error2));
            else resolve(void 0);
          });
        }), "watch"),
        serve: /* @__PURE__ */ __name((options2 = {}) => new Promise((resolve, reject) => {
          if (!streamIn.hasFS) throw new Error(`Cannot use the "serve" API in this environment`);
          const keys = {};
          const port = getFlag(options2, keys, "port", mustBeValidPortNumber);
          const host = getFlag(options2, keys, "host", mustBeString);
          const servedir = getFlag(options2, keys, "servedir", mustBeString);
          const keyfile = getFlag(options2, keys, "keyfile", mustBeString);
          const certfile = getFlag(options2, keys, "certfile", mustBeString);
          const fallback = getFlag(options2, keys, "fallback", mustBeString);
          const cors = getFlag(options2, keys, "cors", mustBeObject);
          const onRequest = getFlag(options2, keys, "onRequest", mustBeFunction);
          checkForInvalidFlags(options2, keys, `in serve() call`);
          const request2 = {
            command: "serve",
            key: buildKey,
            onRequest: !!onRequest
          };
          if (port !== void 0) request2.port = port;
          if (host !== void 0) request2.host = host;
          if (servedir !== void 0) request2.servedir = servedir;
          if (keyfile !== void 0) request2.keyfile = keyfile;
          if (certfile !== void 0) request2.certfile = certfile;
          if (fallback !== void 0) request2.fallback = fallback;
          if (cors) {
            const corsKeys = {};
            const origin = getFlag(cors, corsKeys, "origin", mustBeStringOrArrayOfStrings);
            checkForInvalidFlags(cors, corsKeys, `on "cors" object`);
            if (Array.isArray(origin)) request2.corsOrigin = origin;
            else if (origin !== void 0) request2.corsOrigin = [origin];
          }
          sendRequest(refs, request2, (error2, response2) => {
            if (error2) return reject(new Error(error2));
            if (onRequest) {
              requestCallbacks["serve-request"] = (id, request3) => {
                onRequest(request3.args);
                sendResponse(id, {});
              };
            }
            resolve(response2);
          });
        }), "serve"),
        cancel: /* @__PURE__ */ __name(() => new Promise((resolve) => {
          if (didDispose) return resolve();
          const request2 = {
            command: "cancel",
            key: buildKey
          };
          sendRequest(refs, request2, () => {
            resolve();
          });
        }), "cancel"),
        dispose: /* @__PURE__ */ __name(() => new Promise((resolve) => {
          if (didDispose) return resolve();
          didDispose = true;
          const request2 = {
            command: "dispose",
            key: buildKey
          };
          sendRequest(refs, request2, () => {
            resolve();
            scheduleOnDisposeCallbacks();
            refs.unref();
          });
        }), "dispose")
      };
      refs.ref();
      callback(null, result);
    });
  }
  __name(buildOrContextContinue, "buildOrContextContinue");
}
__name(buildOrContextImpl, "buildOrContextImpl");
var handlePlugins = /* @__PURE__ */ __name(async (buildKey, sendRequest, sendResponse, refs, streamIn, requestCallbacks, initialOptions, plugins, details) => {
  let onStartCallbacks = [];
  let onEndCallbacks = [];
  let onResolveCallbacks = {};
  let onLoadCallbacks = {};
  let onDisposeCallbacks = [];
  let nextCallbackID = 0;
  let i = 0;
  let requestPlugins = [];
  let isSetupDone = false;
  plugins = [...plugins];
  for (let item of plugins) {
    let keys = {};
    if (typeof item !== "object") throw new Error(`Plugin at index ${i} must be an object`);
    const name = getFlag(item, keys, "name", mustBeString);
    if (typeof name !== "string" || name === "") throw new Error(`Plugin at index ${i} is missing a name`);
    try {
      let setup = getFlag(item, keys, "setup", mustBeFunction);
      if (typeof setup !== "function") throw new Error(`Plugin is missing a setup function`);
      checkForInvalidFlags(item, keys, `on plugin ${quote(name)}`);
      let plugin = {
        name,
        onStart: false,
        onEnd: false,
        onResolve: [],
        onLoad: []
      };
      i++;
      let resolve = /* @__PURE__ */ __name((path, options = {}) => {
        if (!isSetupDone) throw new Error('Cannot call "resolve" before plugin setup has completed');
        if (typeof path !== "string") throw new Error(`The path to resolve must be a string`);
        let keys2 = /* @__PURE__ */ Object.create(null);
        let pluginName = getFlag(options, keys2, "pluginName", mustBeString);
        let importer = getFlag(options, keys2, "importer", mustBeString);
        let namespace = getFlag(options, keys2, "namespace", mustBeString);
        let resolveDir = getFlag(options, keys2, "resolveDir", mustBeString);
        let kind = getFlag(options, keys2, "kind", mustBeString);
        let pluginData = getFlag(options, keys2, "pluginData", canBeAnything);
        let importAttributes = getFlag(options, keys2, "with", mustBeObject);
        checkForInvalidFlags(options, keys2, "in resolve() call");
        return new Promise((resolve2, reject) => {
          const request = {
            command: "resolve",
            path,
            key: buildKey,
            pluginName: name
          };
          if (pluginName != null) request.pluginName = pluginName;
          if (importer != null) request.importer = importer;
          if (namespace != null) request.namespace = namespace;
          if (resolveDir != null) request.resolveDir = resolveDir;
          if (kind != null) request.kind = kind;
          else throw new Error(`Must specify "kind" when calling "resolve"`);
          if (pluginData != null) request.pluginData = details.store(pluginData);
          if (importAttributes != null) request.with = sanitizeStringMap(importAttributes, "with");
          sendRequest(refs, request, (error, response) => {
            if (error !== null) reject(new Error(error));
            else resolve2({
              errors: replaceDetailsInMessages(response.errors, details),
              warnings: replaceDetailsInMessages(response.warnings, details),
              path: response.path,
              external: response.external,
              sideEffects: response.sideEffects,
              namespace: response.namespace,
              suffix: response.suffix,
              pluginData: details.load(response.pluginData)
            });
          });
        });
      }, "resolve");
      let promise = setup({
        initialOptions,
        resolve,
        onStart(callback) {
          let registeredText = `This error came from the "onStart" callback registered here:`;
          let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onStart");
          onStartCallbacks.push({ name, callback, note: registeredNote });
          plugin.onStart = true;
        },
        onEnd(callback) {
          let registeredText = `This error came from the "onEnd" callback registered here:`;
          let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onEnd");
          onEndCallbacks.push({ name, callback, note: registeredNote });
          plugin.onEnd = true;
        },
        onResolve(options, callback) {
          let registeredText = `This error came from the "onResolve" callback registered here:`;
          let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onResolve");
          let keys2 = {};
          let filter = getFlag(options, keys2, "filter", mustBeRegExp);
          let namespace = getFlag(options, keys2, "namespace", mustBeString);
          checkForInvalidFlags(options, keys2, `in onResolve() call for plugin ${quote(name)}`);
          if (filter == null) throw new Error(`onResolve() call is missing a filter`);
          let id = nextCallbackID++;
          onResolveCallbacks[id] = { name, callback, note: registeredNote };
          plugin.onResolve.push({ id, filter: jsRegExpToGoRegExp(filter), namespace: namespace || "" });
        },
        onLoad(options, callback) {
          let registeredText = `This error came from the "onLoad" callback registered here:`;
          let registeredNote = extractCallerV8(new Error(registeredText), streamIn, "onLoad");
          let keys2 = {};
          let filter = getFlag(options, keys2, "filter", mustBeRegExp);
          let namespace = getFlag(options, keys2, "namespace", mustBeString);
          checkForInvalidFlags(options, keys2, `in onLoad() call for plugin ${quote(name)}`);
          if (filter == null) throw new Error(`onLoad() call is missing a filter`);
          let id = nextCallbackID++;
          onLoadCallbacks[id] = { name, callback, note: registeredNote };
          plugin.onLoad.push({ id, filter: jsRegExpToGoRegExp(filter), namespace: namespace || "" });
        },
        onDispose(callback) {
          onDisposeCallbacks.push(callback);
        },
        esbuild: streamIn.esbuild
      });
      if (promise) await promise;
      requestPlugins.push(plugin);
    } catch (e) {
      return { ok: false, error: e, pluginName: name };
    }
  }
  requestCallbacks["on-start"] = async (id, request) => {
    details.clear();
    let response = { errors: [], warnings: [] };
    await Promise.all(onStartCallbacks.map(async ({ name, callback, note }) => {
      try {
        let result = await callback();
        if (result != null) {
          if (typeof result !== "object") throw new Error(`Expected onStart() callback in plugin ${quote(name)} to return an object`);
          let keys = {};
          let errors = getFlag(result, keys, "errors", mustBeArray);
          let warnings = getFlag(result, keys, "warnings", mustBeArray);
          checkForInvalidFlags(result, keys, `from onStart() callback in plugin ${quote(name)}`);
          if (errors != null) response.errors.push(...sanitizeMessages(errors, "errors", details, name, void 0));
          if (warnings != null) response.warnings.push(...sanitizeMessages(warnings, "warnings", details, name, void 0));
        }
      } catch (e) {
        response.errors.push(extractErrorMessageV8(e, streamIn, details, note && note(), name));
      }
    }));
    sendResponse(id, response);
  };
  requestCallbacks["on-resolve"] = async (id, request) => {
    let response = {}, name = "", callback, note;
    for (let id2 of request.ids) {
      try {
        ({ name, callback, note } = onResolveCallbacks[id2]);
        let result = await callback({
          path: request.path,
          importer: request.importer,
          namespace: request.namespace,
          resolveDir: request.resolveDir,
          kind: request.kind,
          pluginData: details.load(request.pluginData),
          with: request.with
        });
        if (result != null) {
          if (typeof result !== "object") throw new Error(`Expected onResolve() callback in plugin ${quote(name)} to return an object`);
          let keys = {};
          let pluginName = getFlag(result, keys, "pluginName", mustBeString);
          let path = getFlag(result, keys, "path", mustBeString);
          let namespace = getFlag(result, keys, "namespace", mustBeString);
          let suffix = getFlag(result, keys, "suffix", mustBeString);
          let external = getFlag(result, keys, "external", mustBeBoolean);
          let sideEffects = getFlag(result, keys, "sideEffects", mustBeBoolean);
          let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
          let errors = getFlag(result, keys, "errors", mustBeArray);
          let warnings = getFlag(result, keys, "warnings", mustBeArray);
          let watchFiles = getFlag(result, keys, "watchFiles", mustBeArrayOfStrings);
          let watchDirs = getFlag(result, keys, "watchDirs", mustBeArrayOfStrings);
          checkForInvalidFlags(result, keys, `from onResolve() callback in plugin ${quote(name)}`);
          response.id = id2;
          if (pluginName != null) response.pluginName = pluginName;
          if (path != null) response.path = path;
          if (namespace != null) response.namespace = namespace;
          if (suffix != null) response.suffix = suffix;
          if (external != null) response.external = external;
          if (sideEffects != null) response.sideEffects = sideEffects;
          if (pluginData != null) response.pluginData = details.store(pluginData);
          if (errors != null) response.errors = sanitizeMessages(errors, "errors", details, name, void 0);
          if (warnings != null) response.warnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
          if (watchFiles != null) response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
          if (watchDirs != null) response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
          break;
        }
      } catch (e) {
        response = { id: id2, errors: [extractErrorMessageV8(e, streamIn, details, note && note(), name)] };
        break;
      }
    }
    sendResponse(id, response);
  };
  requestCallbacks["on-load"] = async (id, request) => {
    let response = {}, name = "", callback, note;
    for (let id2 of request.ids) {
      try {
        ({ name, callback, note } = onLoadCallbacks[id2]);
        let result = await callback({
          path: request.path,
          namespace: request.namespace,
          suffix: request.suffix,
          pluginData: details.load(request.pluginData),
          with: request.with
        });
        if (result != null) {
          if (typeof result !== "object") throw new Error(`Expected onLoad() callback in plugin ${quote(name)} to return an object`);
          let keys = {};
          let pluginName = getFlag(result, keys, "pluginName", mustBeString);
          let contents = getFlag(result, keys, "contents", mustBeStringOrUint8Array);
          let resolveDir = getFlag(result, keys, "resolveDir", mustBeString);
          let pluginData = getFlag(result, keys, "pluginData", canBeAnything);
          let loader = getFlag(result, keys, "loader", mustBeString);
          let errors = getFlag(result, keys, "errors", mustBeArray);
          let warnings = getFlag(result, keys, "warnings", mustBeArray);
          let watchFiles = getFlag(result, keys, "watchFiles", mustBeArrayOfStrings);
          let watchDirs = getFlag(result, keys, "watchDirs", mustBeArrayOfStrings);
          checkForInvalidFlags(result, keys, `from onLoad() callback in plugin ${quote(name)}`);
          response.id = id2;
          if (pluginName != null) response.pluginName = pluginName;
          if (contents instanceof Uint8Array) response.contents = contents;
          else if (contents != null) response.contents = encodeUTF8(contents);
          if (resolveDir != null) response.resolveDir = resolveDir;
          if (pluginData != null) response.pluginData = details.store(pluginData);
          if (loader != null) response.loader = loader;
          if (errors != null) response.errors = sanitizeMessages(errors, "errors", details, name, void 0);
          if (warnings != null) response.warnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
          if (watchFiles != null) response.watchFiles = sanitizeStringArray(watchFiles, "watchFiles");
          if (watchDirs != null) response.watchDirs = sanitizeStringArray(watchDirs, "watchDirs");
          break;
        }
      } catch (e) {
        response = { id: id2, errors: [extractErrorMessageV8(e, streamIn, details, note && note(), name)] };
        break;
      }
    }
    sendResponse(id, response);
  };
  let runOnEndCallbacks = /* @__PURE__ */ __name((result, done) => done([], []), "runOnEndCallbacks");
  if (onEndCallbacks.length > 0) {
    runOnEndCallbacks = /* @__PURE__ */ __name((result, done) => {
      (async () => {
        const onEndErrors = [];
        const onEndWarnings = [];
        for (const { name, callback, note } of onEndCallbacks) {
          let newErrors;
          let newWarnings;
          try {
            const value = await callback(result);
            if (value != null) {
              if (typeof value !== "object") throw new Error(`Expected onEnd() callback in plugin ${quote(name)} to return an object`);
              let keys = {};
              let errors = getFlag(value, keys, "errors", mustBeArray);
              let warnings = getFlag(value, keys, "warnings", mustBeArray);
              checkForInvalidFlags(value, keys, `from onEnd() callback in plugin ${quote(name)}`);
              if (errors != null) newErrors = sanitizeMessages(errors, "errors", details, name, void 0);
              if (warnings != null) newWarnings = sanitizeMessages(warnings, "warnings", details, name, void 0);
            }
          } catch (e) {
            newErrors = [extractErrorMessageV8(e, streamIn, details, note && note(), name)];
          }
          if (newErrors) {
            onEndErrors.push(...newErrors);
            try {
              result.errors.push(...newErrors);
            } catch {
            }
          }
          if (newWarnings) {
            onEndWarnings.push(...newWarnings);
            try {
              result.warnings.push(...newWarnings);
            } catch {
            }
          }
        }
        done(onEndErrors, onEndWarnings);
      })();
    }, "runOnEndCallbacks");
  }
  let scheduleOnDisposeCallbacks = /* @__PURE__ */ __name(() => {
    for (const cb of onDisposeCallbacks) {
      setTimeout(() => cb(), 0);
    }
  }, "scheduleOnDisposeCallbacks");
  isSetupDone = true;
  return {
    ok: true,
    requestPlugins,
    runOnEndCallbacks,
    scheduleOnDisposeCallbacks
  };
}, "handlePlugins");
function createObjectStash() {
  const map = /* @__PURE__ */ new Map();
  let nextID = 0;
  return {
    clear() {
      map.clear();
    },
    load(id) {
      return map.get(id);
    },
    store(value) {
      if (value === void 0) return -1;
      const id = nextID++;
      map.set(id, value);
      return id;
    }
  };
}
__name(createObjectStash, "createObjectStash");
function extractCallerV8(e, streamIn, ident) {
  let note;
  let tried = false;
  return () => {
    if (tried) return note;
    tried = true;
    try {
      let lines = (e.stack + "").split("\n");
      lines.splice(1, 1);
      let location = parseStackLinesV8(streamIn, lines, ident);
      if (location) {
        note = { text: e.message, location };
        return note;
      }
    } catch {
    }
  };
}
__name(extractCallerV8, "extractCallerV8");
function extractErrorMessageV8(e, streamIn, stash, note, pluginName) {
  let text = "Internal error";
  let location = null;
  try {
    text = (e && e.message || e) + "";
  } catch {
  }
  try {
    location = parseStackLinesV8(streamIn, (e.stack + "").split("\n"), "");
  } catch {
  }
  return { id: "", pluginName, text, location, notes: note ? [note] : [], detail: stash ? stash.store(e) : -1 };
}
__name(extractErrorMessageV8, "extractErrorMessageV8");
function parseStackLinesV8(streamIn, lines, ident) {
  let at = "    at ";
  if (streamIn.readFileSync && !lines[0].startsWith(at) && lines[1].startsWith(at)) {
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      if (!line.startsWith(at)) continue;
      line = line.slice(at.length);
      while (true) {
        let match = /^(?:new |async )?\S+ \((.*)\)$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^(\S+):(\d+):(\d+)$/.exec(line);
        if (match) {
          let contents;
          try {
            contents = streamIn.readFileSync(match[1], "utf8");
          } catch {
            break;
          }
          let lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2] - 1] || "";
          let column = +match[3] - 1;
          let length = lineText.slice(column, column + ident.length) === ident ? ident.length : 0;
          return {
            file: match[1],
            namespace: "file",
            line: +match[2],
            column: encodeUTF8(lineText.slice(0, column)).length,
            length: encodeUTF8(lineText.slice(column, column + length)).length,
            lineText: lineText + "\n" + lines.slice(1).join("\n"),
            suggestion: ""
          };
        }
        break;
      }
    }
  }
  return null;
}
__name(parseStackLinesV8, "parseStackLinesV8");
function failureErrorWithLog(text, errors, warnings) {
  let limit = 5;
  text += errors.length < 1 ? "" : ` with ${errors.length} error${errors.length < 2 ? "" : "s"}:` + errors.slice(0, limit + 1).map((e, i) => {
    if (i === limit) return "\n...";
    if (!e.location) return `
error: ${e.text}`;
    let { file, line, column } = e.location;
    let pluginText = e.pluginName ? `[plugin: ${e.pluginName}] ` : "";
    return `
${file}:${line}:${column}: ERROR: ${pluginText}${e.text}`;
  }).join("");
  let error = new Error(text);
  for (const [key, value] of [["errors", errors], ["warnings", warnings]]) {
    Object.defineProperty(error, key, {
      configurable: true,
      enumerable: true,
      get: /* @__PURE__ */ __name(() => value, "get"),
      set: /* @__PURE__ */ __name((value2) => Object.defineProperty(error, key, {
        configurable: true,
        enumerable: true,
        value: value2
      }), "set")
    });
  }
  return error;
}
__name(failureErrorWithLog, "failureErrorWithLog");
function replaceDetailsInMessages(messages, stash) {
  for (const message of messages) {
    message.detail = stash.load(message.detail);
  }
  return messages;
}
__name(replaceDetailsInMessages, "replaceDetailsInMessages");
function sanitizeLocation(location, where, terminalWidth) {
  if (location == null) return null;
  let keys = {};
  let file = getFlag(location, keys, "file", mustBeString);
  let namespace = getFlag(location, keys, "namespace", mustBeString);
  let line = getFlag(location, keys, "line", mustBeInteger);
  let column = getFlag(location, keys, "column", mustBeInteger);
  let length = getFlag(location, keys, "length", mustBeInteger);
  let lineText = getFlag(location, keys, "lineText", mustBeString);
  let suggestion = getFlag(location, keys, "suggestion", mustBeString);
  checkForInvalidFlags(location, keys, where);
  if (lineText) {
    const relevantASCII = lineText.slice(
      0,
      (column && column > 0 ? column : 0) + (length && length > 0 ? length : 0) + (terminalWidth && terminalWidth > 0 ? terminalWidth : 80)
    );
    if (!/[\x7F-\uFFFF]/.test(relevantASCII) && !/\n/.test(lineText)) {
      lineText = relevantASCII;
    }
  }
  return {
    file: file || "",
    namespace: namespace || "",
    line: line || 0,
    column: column || 0,
    length: length || 0,
    lineText: lineText || "",
    suggestion: suggestion || ""
  };
}
__name(sanitizeLocation, "sanitizeLocation");
function sanitizeMessages(messages, property, stash, fallbackPluginName, terminalWidth) {
  let messagesClone = [];
  let index = 0;
  for (const message of messages) {
    let keys = {};
    let id = getFlag(message, keys, "id", mustBeString);
    let pluginName = getFlag(message, keys, "pluginName", mustBeString);
    let text = getFlag(message, keys, "text", mustBeString);
    let location = getFlag(message, keys, "location", mustBeObjectOrNull);
    let notes = getFlag(message, keys, "notes", mustBeArray);
    let detail = getFlag(message, keys, "detail", canBeAnything);
    let where = `in element ${index} of "${property}"`;
    checkForInvalidFlags(message, keys, where);
    let notesClone = [];
    if (notes) {
      for (const note of notes) {
        let noteKeys = {};
        let noteText = getFlag(note, noteKeys, "text", mustBeString);
        let noteLocation = getFlag(note, noteKeys, "location", mustBeObjectOrNull);
        checkForInvalidFlags(note, noteKeys, where);
        notesClone.push({
          text: noteText || "",
          location: sanitizeLocation(noteLocation, where, terminalWidth)
        });
      }
    }
    messagesClone.push({
      id: id || "",
      pluginName: pluginName || fallbackPluginName,
      text: text || "",
      location: sanitizeLocation(location, where, terminalWidth),
      notes: notesClone,
      detail: stash ? stash.store(detail) : -1
    });
    index++;
  }
  return messagesClone;
}
__name(sanitizeMessages, "sanitizeMessages");
function sanitizeStringArray(values, property) {
  const result = [];
  for (const value of values) {
    if (typeof value !== "string") throw new Error(`${quote(property)} must be an array of strings`);
    result.push(value);
  }
  return result;
}
__name(sanitizeStringArray, "sanitizeStringArray");
function sanitizeStringMap(map, property) {
  const result = /* @__PURE__ */ Object.create(null);
  for (const key in map) {
    const value = map[key];
    if (typeof value !== "string") throw new Error(`key ${quote(key)} in object ${quote(property)} must be a string`);
    result[key] = value;
  }
  return result;
}
__name(sanitizeStringMap, "sanitizeStringMap");
function convertOutputFiles({ path, contents, hash }) {
  let text = null;
  return {
    path,
    contents,
    hash,
    get text() {
      const binary = this.contents;
      if (text === null || binary !== contents) {
        contents = binary;
        text = decodeUTF8(binary);
      }
      return text;
    }
  };
}
__name(convertOutputFiles, "convertOutputFiles");
function jsRegExpToGoRegExp(regexp) {
  let result = regexp.source;
  if (regexp.flags) result = `(?${regexp.flags})${result}`;
  return result;
}
__name(jsRegExpToGoRegExp, "jsRegExpToGoRegExp");
function parseJSON(bytes) {
  let text;
  try {
    text = decodeUTF8(bytes);
  } catch {
    return JSON_parse(bytes);
  }
  return JSON.parse(text);
}
__name(parseJSON, "parseJSON");
var version = "0.28.1";
var build = /* @__PURE__ */ __name((options) => ensureServiceIsRunning().then((service) => service.build(options)), "build");
var context = /* @__PURE__ */ __name((options) => ensureServiceIsRunning().then((service) => service.context(options)), "context");
var transform = /* @__PURE__ */ __name((input, options) => ensureServiceIsRunning().then((service) => service.transform(input, options)), "transform");
var formatMessages = /* @__PURE__ */ __name((messages, options) => ensureServiceIsRunning().then((service) => service.formatMessages(messages, options)), "formatMessages");
var analyzeMetafile = /* @__PURE__ */ __name((metafile, options) => ensureServiceIsRunning().then((service) => service.analyzeMetafile(metafile, options)), "analyzeMetafile");
var buildSync = /* @__PURE__ */ __name(() => {
  throw new Error(`The "buildSync" API does not work in Deno`);
}, "buildSync");
var transformSync = /* @__PURE__ */ __name(() => {
  throw new Error(`The "transformSync" API does not work in Deno`);
}, "transformSync");
var formatMessagesSync = /* @__PURE__ */ __name(() => {
  throw new Error(`The "formatMessagesSync" API does not work in Deno`);
}, "formatMessagesSync");
var analyzeMetafileSync = /* @__PURE__ */ __name(() => {
  throw new Error(`The "analyzeMetafileSync" API does not work in Deno`);
}, "analyzeMetafileSync");
var stop = /* @__PURE__ */ __name(async () => {
  if (stopService) await stopService();
}, "stop");
var initializeWasCalled = false;
var initialize = /* @__PURE__ */ __name(async (options) => {
  options = validateInitializeOptions(options || {});
  if (options.wasmURL) throw new Error(`The "wasmURL" option only works in the browser`);
  if (options.wasmModule) throw new Error(`The "wasmModule" option only works in the browser`);
  if (options.worker) throw new Error(`The "worker" option only works in the browser`);
  if (initializeWasCalled) throw new Error('Cannot call "initialize" more than once');
  await ensureServiceIsRunning();
  initializeWasCalled = true;
}, "initialize");
async function binaryIntegrityCheck(pkg, subpath, bytes) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const key = `${pkg}/${subpath}`;
  const expected = define_ESBUILD_BINARY_HASHES_default[key];
  if (!expected) throw new Error(`Missing hash for "${key}"`);
  if (hash !== expected) throw new Error(`"${hash.slice(0, 8)}..." doesn't match "${expected.slice(0, 8)}..." for "${pkg}"`);
}
__name(binaryIntegrityCheck, "binaryIntegrityCheck");
async function installFromNPM(name, subpath) {
  const { finalPath, finalDir } = getCachePath(name);
  try {
    await Deno.stat(finalPath);
    return finalPath;
  } catch (e) {
  }
  const npmRegistry = Deno.env.get("NPM_CONFIG_REGISTRY") || "https://registry.npmjs.org";
  const url = `${npmRegistry}/${name}/-/${name.replace("@esbuild/", "")}-${version}.tgz`;
  const buffer = await fetch(url).then((r) => r.arrayBuffer());
  const executable = extractFileFromTarGzip(new Uint8Array(buffer), subpath);
  await binaryIntegrityCheck(name, subpath, executable);
  await Deno.mkdir(finalDir, {
    recursive: true,
    mode: 448
    // https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
  });
  await Deno.writeFile(finalPath, executable, { mode: 493 });
  return finalPath;
}
__name(installFromNPM, "installFromNPM");
function getCachePath(name) {
  let baseDir;
  switch (Deno.build.os) {
    case "darwin":
      baseDir = Deno.env.get("HOME");
      if (baseDir) baseDir += "/Library/Caches";
      break;
    case "windows":
      baseDir = Deno.env.get("LOCALAPPDATA");
      if (!baseDir) {
        baseDir = Deno.env.get("USERPROFILE");
        if (baseDir) baseDir += "/AppData/Local";
      }
      if (baseDir) baseDir += "/Cache";
      break;
    case "linux":
      const xdg = Deno.env.get("XDG_CACHE_HOME");
      if (xdg && xdg[0] === "/") baseDir = xdg;
      break;
  }
  if (!baseDir) {
    baseDir = Deno.env.get("HOME");
    if (baseDir) baseDir += "/.cache";
  }
  if (!baseDir) throw new Error("Failed to find cache directory");
  const finalDir = baseDir + `/esbuild/bin`;
  const finalPath = finalDir + `/${name.replace("/", "-")}@${version}`;
  return { finalPath, finalDir };
}
__name(getCachePath, "getCachePath");
function extractFileFromTarGzip(buffer, file) {
  try {
    buffer = gunzip(buffer);
  } catch (err) {
    throw new Error(`Invalid gzip data in archive: ${err && err.message || err}`);
  }
  let str = /* @__PURE__ */ __name((i, n) => String.fromCharCode(...buffer.subarray(i, i + n)).replace(/\0.*$/, ""), "str");
  let offset = 0;
  file = `package/${file}`;
  while (offset < buffer.length) {
    let name = str(offset, 100);
    let size = parseInt(str(offset + 124, 12), 8);
    offset += 512;
    if (!isNaN(size) && size >= 0) {
      if (name === file) return buffer.subarray(offset, offset + size);
      offset += size + 511 & ~511;
    }
  }
  throw new Error(`Could not find ${JSON.stringify(file)} in archive`);
}
__name(extractFileFromTarGzip, "extractFileFromTarGzip");
async function install() {
  const overridePath = Deno.env.get("ESBUILD_BINARY_PATH");
  if (overridePath) return overridePath;
  const platformKey = Deno.build.target;
  const knownWindowsPackages = {
    "x86_64-pc-windows-msvc": "@esbuild/win32-x64"
  };
  const knownUnixlikePackages = {
    // These are the only platforms that Deno supports
    "aarch64-apple-darwin": "@esbuild/darwin-arm64",
    "aarch64-unknown-linux-gnu": "@esbuild/linux-arm64",
    "x86_64-apple-darwin": "@esbuild/darwin-x64",
    "x86_64-unknown-linux-gnu": "@esbuild/linux-x64",
    // These platforms are not supported by Deno
    "aarch64-linux-android": "@esbuild/android-arm64",
    "x86_64-unknown-freebsd": "@esbuild/freebsd-x64",
    "x86_64-alpine-linux-musl": "@esbuild/linux-x64"
  };
  if (platformKey in knownWindowsPackages) {
    return await installFromNPM(knownWindowsPackages[platformKey], "esbuild.exe");
  } else if (platformKey in knownUnixlikePackages) {
    return await installFromNPM(knownUnixlikePackages[platformKey], "bin/esbuild");
  } else {
    throw new Error(`Unsupported platform: ${platformKey}`);
  }
}
__name(install, "install");
var defaultWD = Deno.cwd();
var longLivedService;
var stopService;
var spawnNew = /* @__PURE__ */ __name((cmd, { args, stdin, stdout, stderr }) => {
  const child = new Deno.Command(cmd, {
    args,
    cwd: defaultWD,
    stdin,
    stdout,
    stderr
  }).spawn();
  const writer = stdin === "piped" ? child.stdin.getWriter() : null;
  const reader = stdout === "piped" ? child.stdout.getReader() : null;
  return {
    write: writer ? (bytes) => writer.write(bytes) : () => Promise.resolve(),
    read: reader ? () => reader.read().then((x) => x.value || null) : () => Promise.resolve(null),
    close: /* @__PURE__ */ __name(async () => {
      if (writer) await writer.close();
      if (reader) await reader.cancel();
      await child.status;
    }, "close"),
    status: /* @__PURE__ */ __name(() => child.status, "status")
  };
}, "spawnNew");
var spawnOld = /* @__PURE__ */ __name((cmd, { args, stdin, stdout, stderr }) => {
  const child = Deno.run({
    cmd: [cmd].concat(args),
    cwd: defaultWD,
    stdin,
    stdout,
    stderr
  });
  const stdoutBuffer = new Uint8Array(4 * 1024 * 1024);
  let writeQueue = [];
  let isQueueLocked = false;
  const startWriteFromQueueWorker = /* @__PURE__ */ __name(() => {
    if (isQueueLocked || writeQueue.length === 0) return;
    isQueueLocked = true;
    child.stdin.write(writeQueue[0]).then((bytesWritten) => {
      isQueueLocked = false;
      if (bytesWritten === writeQueue[0].length) writeQueue.shift();
      else writeQueue[0] = writeQueue[0].subarray(bytesWritten);
      startWriteFromQueueWorker();
    });
  }, "startWriteFromQueueWorker");
  return {
    write: /* @__PURE__ */ __name((bytes) => {
      writeQueue.push(bytes);
      startWriteFromQueueWorker();
    }, "write"),
    read: /* @__PURE__ */ __name(() => child.stdout.read(stdoutBuffer).then((n) => n === null ? null : stdoutBuffer.subarray(0, n)), "read"),
    close: /* @__PURE__ */ __name(() => {
      child.stdin.close();
      child.stdout.close();
      child.close();
    }, "close"),
    status: /* @__PURE__ */ __name(() => child.status(), "status")
  };
}, "spawnOld");
var spawn = Deno.Command ? spawnNew : spawnOld;
var ensureServiceIsRunning = /* @__PURE__ */ __name(() => {
  if (!longLivedService) {
    longLivedService = (async () => {
      const binPath = await install();
      const isTTY = Deno.stderr.isTerminal ? Deno.stderr.isTerminal() : Deno.isatty(Deno.stderr.rid);
      const child = spawn(binPath, {
        args: [`--service=${version}`],
        stdin: "piped",
        stdout: "piped",
        stderr: "inherit"
      });
      stopService = /* @__PURE__ */ __name(async () => {
        await child.close();
        initializeWasCalled = false;
        longLivedService = void 0;
        stopService = void 0;
      }, "stopService");
      const { readFromStdout, afterClose, service } = createChannel({
        writeToStdin(bytes) {
          child.write(bytes);
        },
        isSync: false,
        hasFS: true,
        esbuild: mod_exports2
      });
      const readMoreStdout = /* @__PURE__ */ __name(() => child.read().then((buffer) => {
        if (buffer === null) {
          afterClose(null);
        } else {
          readFromStdout(buffer);
          readMoreStdout();
        }
      }).catch((e) => {
        if (e instanceof Deno.errors.Interrupted || e instanceof Deno.errors.BadResource) {
          afterClose(e);
        } else {
          throw e;
        }
      }), "readMoreStdout");
      readMoreStdout();
      return {
        build: /* @__PURE__ */ __name((options) => new Promise((resolve, reject) => {
          service.buildOrContext({
            callName: "build",
            refs: null,
            options,
            isTTY,
            defaultWD,
            callback: /* @__PURE__ */ __name((err, res) => err ? reject(err) : resolve(res), "callback")
          });
        }), "build"),
        context: /* @__PURE__ */ __name((options) => new Promise((resolve, reject) => service.buildOrContext({
          callName: "context",
          refs: null,
          options,
          isTTY,
          defaultWD,
          callback: /* @__PURE__ */ __name((err, res) => err ? reject(err) : resolve(res), "callback")
        })), "context"),
        transform: /* @__PURE__ */ __name((input, options) => new Promise((resolve, reject) => service.transform({
          callName: "transform",
          refs: null,
          input,
          options: options || {},
          isTTY,
          fs: {
            readFile(tempFile, callback) {
              Deno.readFile(tempFile).then(
                (bytes) => {
                  let text = new TextDecoder().decode(bytes);
                  try {
                    Deno.remove(tempFile);
                  } catch (e) {
                  }
                  callback(null, text);
                },
                (err) => callback(err, null)
              );
            },
            writeFile(contents, callback) {
              Deno.makeTempFile().then(
                (tempFile) => Deno.writeFile(tempFile, typeof contents === "string" ? new TextEncoder().encode(contents) : contents).then(
                  () => callback(tempFile),
                  () => callback(null)
                ),
                () => callback(null)
              );
            }
          },
          callback: /* @__PURE__ */ __name((err, res) => err ? reject(err) : resolve(res), "callback")
        })), "transform"),
        formatMessages: /* @__PURE__ */ __name((messages, options) => new Promise((resolve, reject) => service.formatMessages({
          callName: "formatMessages",
          refs: null,
          messages,
          options,
          callback: /* @__PURE__ */ __name((err, res) => err ? reject(err) : resolve(res), "callback")
        })), "formatMessages"),
        analyzeMetafile: /* @__PURE__ */ __name((metafile, options) => new Promise((resolve, reject) => service.analyzeMetafile({
          callName: "analyzeMetafile",
          refs: null,
          metafile: typeof metafile === "string" ? metafile : JSON.stringify(metafile),
          options,
          callback: /* @__PURE__ */ __name((err, res) => err ? reject(err) : resolve(res), "callback")
        })), "analyzeMetafile")
      };
    })();
  }
  return longLivedService;
}, "ensureServiceIsRunning");
if (import.meta.main) {
  spawn(await install(), {
    args: Deno.args,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  }).status().then(({ code }) => {
    Deno.exit(code);
  });
}
export {
  analyzeMetafile,
  analyzeMetafileSync,
  build,
  buildSync,
  context,
  formatMessages,
  formatMessagesSync,
  initialize,
  stop,
  transform,
  transformSync,
  version
};
