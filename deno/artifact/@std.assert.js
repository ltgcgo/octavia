var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// https://jsr.io/@std/assert/1.0.19/assertion_error.ts
var AssertionError = class extends Error {
  static {
    __name(this, "AssertionError");
  }
  /** Constructs a new instance.
   *
   * @param message The error message.
   * @param options Additional options. This argument is still unstable. It may change in the future release.
   */
  constructor(message, options) {
    super(message, options);
    this.name = "AssertionError";
  }
};

// https://jsr.io/@std/assert/1.0.19/almost_equals.ts
function assertAlmostEquals(actual, expected, tolerance, msg) {
  if (Object.is(actual, expected)) {
    return;
  }
  const delta = Math.abs(expected - actual);
  if (tolerance === void 0) {
    tolerance = isFinite(expected) ? Math.abs(expected * 1e-7) : 1e-7;
  }
  if (delta <= tolerance) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  const f = /* @__PURE__ */ __name((n) => Number.isInteger(n) ? n : n.toExponential(), "f");
  throw new AssertionError(
    `Expected actual: "${f(actual)}" to be close to "${f(expected)}": delta "${f(delta)}" is greater than "${f(tolerance)}"${msgSuffix}`
  );
}
__name(assertAlmostEquals, "assertAlmostEquals");

// https://jsr.io/@std/assert/1.0.19/equal.ts
function isKeyedCollection(x) {
  return x instanceof Set || x instanceof Map;
}
__name(isKeyedCollection, "isKeyedCollection");
function prototypesEqual(a, b) {
  const pa = Object.getPrototypeOf(a);
  const pb = Object.getPrototypeOf(b);
  return pa === pb || pa === Object.prototype && pb === null || pa === null && pb === Object.prototype;
}
__name(prototypesEqual, "prototypesEqual");
function isBasicObjectOrArray(obj) {
  const proto = Object.getPrototypeOf(obj);
  return proto === null || proto === Object.prototype || proto === Array.prototype;
}
__name(isBasicObjectOrArray, "isBasicObjectOrArray");
function ownKeys(obj) {
  return [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj)
  ];
}
__name(ownKeys, "ownKeys");
function getKeysDeep(obj) {
  const keys = /* @__PURE__ */ new Set();
  while (obj !== Object.prototype && obj !== Array.prototype && obj != null) {
    for (const key of ownKeys(obj)) {
      keys.add(key);
    }
    obj = Object.getPrototypeOf(obj);
  }
  return keys;
}
__name(getKeysDeep, "getKeysDeep");
var Temporal = globalThis.Temporal ?? /* @__PURE__ */ Object.create(null);
var stringComparablePrototypes = new Set(
  [
    Intl.Locale,
    RegExp,
    Temporal.Duration,
    Temporal.Instant,
    Temporal.PlainDate,
    Temporal.PlainDateTime,
    Temporal.PlainTime,
    Temporal.PlainYearMonth,
    Temporal.PlainMonthDay,
    Temporal.ZonedDateTime,
    URL,
    URLSearchParams
  ].filter((x) => x != null).map((x) => x.prototype)
);
function isPrimitive(x) {
  return typeof x === "string" || typeof x === "number" || typeof x === "boolean" || typeof x === "bigint" || typeof x === "symbol" || x == null;
}
__name(isPrimitive, "isPrimitive");
var TypedArray = Object.getPrototypeOf(Uint8Array);
function compareTypedArrays(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (!sameValueZero(a[i], b[i])) return false;
  }
  return true;
}
__name(compareTypedArrays, "compareTypedArrays");
function sameValueZero(a, b) {
  return a === b || Object.is(a, b);
}
__name(sameValueZero, "sameValueZero");
function equal(a, b) {
  const seen = /* @__PURE__ */ new Map();
  return (/* @__PURE__ */ __name((function compare(a2, b2) {
    if (sameValueZero(a2, b2)) return true;
    if (isPrimitive(a2) || isPrimitive(b2)) return false;
    if (a2 instanceof Date && b2 instanceof Date) {
      return Object.is(a2.getTime(), b2.getTime());
    }
    if (a2 && typeof a2 === "object" && b2 && typeof b2 === "object") {
      if (!prototypesEqual(a2, b2)) {
        return false;
      }
      if (a2 instanceof TypedArray) {
        return compareTypedArrays(a2, b2);
      }
      if (a2 instanceof ArrayBuffer || globalThis.SharedArrayBuffer && a2 instanceof SharedArrayBuffer) {
        return compareTypedArrays(
          new Uint8Array(a2),
          new Uint8Array(b2)
        );
      }
      if (a2 instanceof WeakMap) {
        throw new TypeError("Cannot compare WeakMap instances");
      }
      if (a2 instanceof WeakSet) {
        throw new TypeError("Cannot compare WeakSet instances");
      }
      if (a2 instanceof WeakRef) {
        return compare(a2.deref(), b2.deref());
      }
      if (seen.get(a2) === b2) {
        return true;
      }
      if (Object.keys(a2).length !== Object.keys(b2).length) {
        return false;
      }
      seen.set(a2, b2);
      if (isKeyedCollection(a2) && isKeyedCollection(b2)) {
        if (a2.size !== b2.size) {
          return false;
        }
        const aKeys = [...a2.keys()];
        const primitiveKeysFastPath = aKeys.every(isPrimitive);
        if (primitiveKeysFastPath) {
          if (a2 instanceof Set) {
            return a2.symmetricDifference(b2).size === 0;
          }
          for (const key of aKeys) {
            if (!b2.has(key) || !compare(a2.get(key), b2.get(key))) {
              return false;
            }
          }
          return true;
        }
        let unmatchedEntries = a2.size;
        for (const [aKey, aValue] of a2.entries()) {
          for (const [bKey, bValue] of b2.entries()) {
            if (!compare(aKey, bKey)) continue;
            if (aKey === aValue && bKey === bValue || compare(aValue, bValue)) {
              unmatchedEntries--;
              break;
            }
          }
        }
        return unmatchedEntries === 0;
      }
      let keys;
      if (isBasicObjectOrArray(a2)) {
        keys = ownKeys({ ...a2, ...b2 });
      } else if (stringComparablePrototypes.has(Object.getPrototypeOf(a2))) {
        return String(a2) === String(b2);
      } else {
        keys = getKeysDeep(a2).union(getKeysDeep(b2));
      }
      for (const key of keys) {
        if (!compare(a2[key], b2[key])) {
          return false;
        }
        if (key in a2 && !(key in b2) || key in b2 && !(key in a2)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }), "compare"))(a, b);
}
__name(equal, "equal");

// https://jsr.io/@std/internal/1.0.12/format.ts
function format(v) {
  const { Deno: Deno2, process } = globalThis;
  const inspect = Deno2?.inspect ?? process?.getBuiltinModule?.("node:util")?.inspect;
  return typeof inspect === "function" ? inspect(v, {
    depth: Infinity,
    sorted: true,
    trailingComma: true,
    compact: false,
    iterableLimit: Infinity,
    // getters should be true in assertEquals.
    getters: true,
    strAbbreviateSize: Infinity
  }) : basicInspect(v);
}
__name(format, "format");
var formatters = [
  (v) => {
    if (typeof v === "undefined") return "undefined";
    if (typeof v === "bigint") return `${v}n`;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null || Array.isArray(v) || [null, Object.prototype].includes(Object.getPrototypeOf(v))) {
      return JSON.stringify(v, null, 2);
    }
  },
  (v) => String(v),
  (v) => Object.prototype.toString.call(v)
];
function basicInspect(v) {
  for (const fmt of formatters) {
    try {
      const result = fmt(v);
      if (typeof result === "string") return result;
    } catch {
    }
  }
  return "[[Unable to format value]]";
}
__name(basicInspect, "basicInspect");

// https://jsr.io/@std/assert/1.0.19/array_includes.ts
function isPrimitive2(value) {
  return value === null || typeof value !== "object" && typeof value !== "function";
}
__name(isPrimitive2, "isPrimitive");
function assertArrayIncludes(actual, expected, msg) {
  const missing = [];
  const expectedLen = expected.length;
  const actualLen = actual.length;
  for (let i = 0; i < expectedLen; i++) {
    const item = expected[i];
    let found;
    if (isPrimitive2(item)) {
      found = Array.prototype.includes.call(actual, item);
    } else {
      found = false;
      for (let j = 0; j < actualLen; j++) {
        if (equal(item, actual[j])) {
          found = true;
          break;
        }
      }
    }
    if (!found) {
      missing.push(item);
    }
  }
  if (missing.length === 0) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${format(actual)}" to include: "${format(expected)}"${msgSuffix}
missing: ${format(missing)}`;
  throw new AssertionError(msg);
}
__name(assertArrayIncludes, "assertArrayIncludes");

// https://jsr.io/@std/internal/1.0.12/styles.ts
var { Deno } = globalThis;
var noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : false;
var enabled = !noColor;
function code(open, close) {
  return {
    open: `\x1B[${open.join(";")}m`,
    close: `\x1B[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
__name(code, "code");
function run(str, code2) {
  return enabled ? `${code2.open}${str.replace(code2.regexp, code2.open)}${code2.close}` : str;
}
__name(run, "run");
function bold(str) {
  return run(str, code([1], 22));
}
__name(bold, "bold");
function red(str) {
  return run(str, code([31], 39));
}
__name(red, "red");
function green(str) {
  return run(str, code([32], 39));
}
__name(green, "green");
function white(str) {
  return run(str, code([37], 39));
}
__name(white, "white");
function gray(str) {
  return brightBlack(str);
}
__name(gray, "gray");
function brightBlack(str) {
  return run(str, code([90], 39));
}
__name(brightBlack, "brightBlack");
function bgRed(str) {
  return run(str, code([41], 49));
}
__name(bgRed, "bgRed");
function bgGreen(str) {
  return run(str, code([42], 49));
}
__name(bgGreen, "bgGreen");
var ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))"
  ].join("|"),
  "g"
);
function stripAnsiCode(string) {
  return string.replace(ANSI_PATTERN, "");
}
__name(stripAnsiCode, "stripAnsiCode");

// https://jsr.io/@std/internal/1.0.12/build_message.ts
function createColor(diffType, background = false) {
  switch (diffType) {
    case "added":
      return (s) => background ? bgGreen(white(s)) : green(bold(s));
    case "removed":
      return (s) => background ? bgRed(white(s)) : red(bold(s));
    case "truncation":
      return gray;
    default:
      return white;
  }
}
__name(createColor, "createColor");
function createSign(diffType) {
  switch (diffType) {
    case "added":
      return "+   ";
    case "removed":
      return "-   ";
    default:
      return "    ";
  }
}
__name(createSign, "createSign");
function buildMessage(diffResult, options = {}, truncateDiff) {
  if (truncateDiff != null) {
    diffResult = truncateDiff(diffResult, options.stringDiff ?? false);
  }
  const { stringDiff = false } = options;
  const messages = [
    "",
    "",
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`,
    "",
    ""
  ];
  const diffMessages = diffResult.map((result) => {
    const color = createColor(result.type);
    const line = result.type === "added" || result.type === "removed" ? result.details?.map(
      (detail) => detail.type !== "common" ? createColor(detail.type, true)(detail.value) : detail.value
    ).join("") ?? result.value : result.value;
    return color(`${createSign(result.type)}${line}`);
  });
  messages.push(...stringDiff ? [diffMessages.join("")] : diffMessages, "");
  return messages;
}
__name(buildMessage, "buildMessage");

// https://jsr.io/@std/internal/1.0.12/diff.ts
var REMOVED = 1;
var COMMON = 2;
var ADDED = 3;
function createCommon(A, B) {
  const common = [];
  if (A.length === 0 || B.length === 0) return [];
  for (let i = 0; i < Math.min(A.length, B.length); i += 1) {
    const a = A[i];
    const b = B[i];
    if (a !== void 0 && a === b) {
      common.push(a);
    } else {
      return common;
    }
  }
  return common;
}
__name(createCommon, "createCommon");
function assertFp(value) {
  if (value == null || typeof value !== "object" || typeof value?.y !== "number" || typeof value?.id !== "number") {
    throw new Error(
      `Unexpected value, expected 'FarthestPoint': received ${typeof value}`
    );
  }
}
__name(assertFp, "assertFp");
function backTrace(A, B, current, swapped, routes, diffTypesPtrOffset) {
  const M = A.length;
  const N = B.length;
  const result = [];
  let a = M - 1;
  let b = N - 1;
  let j = routes[current.id];
  let type = routes[current.id + diffTypesPtrOffset];
  while (true) {
    if (!j && !type) break;
    const prev = j;
    if (type === REMOVED) {
      result.unshift({
        type: swapped ? "removed" : "added",
        value: B[b]
      });
      b -= 1;
    } else if (type === ADDED) {
      result.unshift({
        type: swapped ? "added" : "removed",
        value: A[a]
      });
      a -= 1;
    } else {
      result.unshift({ type: "common", value: A[a] });
      a -= 1;
      b -= 1;
    }
    j = routes[prev];
    type = routes[prev + diffTypesPtrOffset];
  }
  return result;
}
__name(backTrace, "backTrace");
function createFp(k, M, routes, diffTypesPtrOffset, ptr, slide, down) {
  if (slide && slide.y === -1 && down && down.y === -1) {
    return { y: 0, id: 0 };
  }
  const isAdding = down?.y === -1 || k === M || (slide?.y ?? 0) > (down?.y ?? 0) + 1;
  if (slide && isAdding) {
    const prev = slide.id;
    ptr++;
    routes[ptr] = prev;
    routes[ptr + diffTypesPtrOffset] = ADDED;
    return { y: slide.y, id: ptr };
  }
  if (down && !isAdding) {
    const prev = down.id;
    ptr++;
    routes[ptr] = prev;
    routes[ptr + diffTypesPtrOffset] = REMOVED;
    return { y: down.y + 1, id: ptr };
  }
  throw new Error("Unexpected missing FarthestPoint");
}
__name(createFp, "createFp");
function diff(A, B) {
  const prefixCommon = createCommon(A, B);
  A = A.slice(prefixCommon.length);
  B = B.slice(prefixCommon.length);
  const swapped = B.length > A.length;
  [A, B] = swapped ? [B, A] : [A, B];
  const M = A.length;
  const N = B.length;
  if (!M && !N && !prefixCommon.length) return [];
  if (!N) {
    return [
      ...prefixCommon.map((value) => ({ type: "common", value })),
      ...A.map((value) => ({ type: swapped ? "added" : "removed", value }))
    ];
  }
  const offset = N;
  const delta = M - N;
  const length = M + N + 1;
  const fp = Array.from({ length }, () => ({ y: -1, id: -1 }));
  const routes = new Uint32Array((M * N + length + 1) * 2);
  const diffTypesPtrOffset = routes.length / 2;
  let ptr = 0;
  function snake(k, A2, B2, slide, down) {
    const M2 = A2.length;
    const N2 = B2.length;
    const fp2 = createFp(k, M2, routes, diffTypesPtrOffset, ptr, slide, down);
    ptr = fp2.id;
    while (fp2.y + k < M2 && fp2.y < N2 && A2[fp2.y + k] === B2[fp2.y]) {
      const prev = fp2.id;
      ptr++;
      fp2.id = ptr;
      fp2.y += 1;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = COMMON;
    }
    return fp2;
  }
  __name(snake, "snake");
  let currentFp = fp[delta + offset];
  assertFp(currentFp);
  let p = -1;
  while (currentFp.y < N) {
    p = p + 1;
    for (let k = -p; k < delta; ++k) {
      const index2 = k + offset;
      fp[index2] = snake(k, A, B, fp[index2 - 1], fp[index2 + 1]);
    }
    for (let k = delta + p; k > delta; --k) {
      const index2 = k + offset;
      fp[index2] = snake(k, A, B, fp[index2 - 1], fp[index2 + 1]);
    }
    const index = delta + offset;
    fp[delta + offset] = snake(delta, A, B, fp[index - 1], fp[index + 1]);
    currentFp = fp[delta + offset];
    assertFp(currentFp);
  }
  return [
    ...prefixCommon.map((value) => ({ type: "common", value })),
    ...backTrace(A, B, currentFp, swapped, routes, diffTypesPtrOffset)
  ];
}
__name(diff, "diff");

// https://jsr.io/@std/internal/1.0.12/diff_str.ts
function unescape(string) {
  return string.replaceAll("\\", "\\\\").replaceAll("\b", "\\b").replaceAll("\f", "\\f").replaceAll("	", "\\t").replaceAll("\v", "\\v").replaceAll(
    /\r\n|\r|\n/g,
    (str) => str === "\r" ? "\\r" : str === "\n" ? "\\n\n" : "\\r\\n\r\n"
  );
}
__name(unescape, "unescape");
var WHITESPACE_SYMBOLS = /((?:\\[bftv]|[^\S\r\n])+|\\[rn\\]|[()[\]{}'"\r\n]|\b)/;
function tokenize(string, wordDiff = false) {
  if (wordDiff) {
    return string.split(WHITESPACE_SYMBOLS).filter((token) => token);
  }
  const tokens = [];
  const lines = string.split(/(\n|\r\n)/).filter((line) => line);
  for (const [i, line] of lines.entries()) {
    if (i % 2) {
      tokens[tokens.length - 1] += line;
    } else {
      tokens.push(line);
    }
  }
  return tokens;
}
__name(tokenize, "tokenize");
function createDetails(line, tokens) {
  return tokens.filter(({ type }) => type === line.type || type === "common").map((result, i, t) => {
    const token = t[i - 1];
    if (result.type === "common" && token && token.type === t[i + 1]?.type && /\s+/.test(result.value)) {
      return {
        ...result,
        type: token.type
      };
    }
    return result;
  });
}
__name(createDetails, "createDetails");
var NON_WHITESPACE_REGEXP = /\S/;
function diffStr(A, B) {
  const diffResult = diff(
    tokenize(`${unescape(A)}
`),
    tokenize(`${unescape(B)}
`)
  );
  const added = [];
  const removed = [];
  for (const result of diffResult) {
    if (result.type === "added") {
      added.push(result);
    }
    if (result.type === "removed") {
      removed.push(result);
    }
  }
  const hasMoreRemovedLines = added.length < removed.length;
  const aLines = hasMoreRemovedLines ? added : removed;
  const bLines = hasMoreRemovedLines ? removed : added;
  for (const a of aLines) {
    let tokens = [];
    let b;
    while (bLines.length) {
      b = bLines.shift();
      const tokenized = [
        tokenize(a.value, true),
        tokenize(b.value, true)
      ];
      if (hasMoreRemovedLines) tokenized.reverse();
      tokens = diff(tokenized[0], tokenized[1]);
      if (tokens.some(
        ({ type, value }) => type === "common" && NON_WHITESPACE_REGEXP.test(value)
      )) {
        break;
      }
    }
    a.details = createDetails(a, tokens);
    if (b) {
      b.details = createDetails(b, tokens);
    }
  }
  return diffResult;
}
__name(diffStr, "diffStr");

// https://jsr.io/@std/assert/1.0.19/equals.ts
function assertEquals(actual, expected, msg) {
  if (equal(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message = `Values are not equal${msgSuffix}`;
  const actualString = format(actual);
  const expectedString = format(expected);
  const stringDiff = typeof actual === "string" && typeof expected === "string";
  const diffResult = stringDiff ? diffStr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
  const diffMsg = buildMessage(diffResult, { stringDiff }, arguments[3]).join("\n");
  message = `${message}
${diffMsg}`;
  throw new AssertionError(message);
}
__name(assertEquals, "assertEquals");

// https://jsr.io/@std/assert/1.0.19/exists.ts
function assertExists(actual, msg) {
  if (actual === void 0 || actual === null) {
    const msgSuffix = msg ? `: ${msg}` : ".";
    msg = `Expected actual: "${actual}" to not be null or undefined${msgSuffix}`;
    throw new AssertionError(msg);
  }
}
__name(assertExists, "assertExists");

// https://jsr.io/@std/assert/1.0.19/false.ts
function assertFalse(expr, msg = "") {
  if (expr) {
    throw new AssertionError(msg);
  }
}
__name(assertFalse, "assertFalse");

// https://jsr.io/@std/assert/1.0.19/greater_or_equal.ts
function assertGreaterOrEqual(actual, expected, msg) {
  if (actual >= expected) return;
  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(
    msg ?? `Expect ${actualString} >= ${expectedString}`
  );
}
__name(assertGreaterOrEqual, "assertGreaterOrEqual");

// https://jsr.io/@std/assert/1.0.19/greater.ts
function assertGreater(actual, expected, msg) {
  if (actual > expected) return;
  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(msg ?? `Expect ${actualString} > ${expectedString}`);
}
__name(assertGreater, "assertGreater");

// https://jsr.io/@std/assert/1.0.19/instance_of.ts
function assertInstanceOf(actual, expectedType, msg = "") {
  if (actual instanceof expectedType) return;
  const msgSuffix = msg ? `: ${msg}` : ".";
  const expectedTypeStr = expectedType.name;
  let actualTypeStr = "";
  if (actual === null) {
    actualTypeStr = "null";
  } else if (actual === void 0) {
    actualTypeStr = "undefined";
  } else if (typeof actual === "object") {
    actualTypeStr = actual.constructor?.name ?? "Object";
  } else {
    actualTypeStr = typeof actual;
  }
  if (expectedTypeStr === actualTypeStr) {
    msg = `Expected object to be an instance of "${expectedTypeStr}"${msgSuffix}`;
  } else if (actualTypeStr === "function") {
    msg = `Expected object to be an instance of "${expectedTypeStr}" but was not an instanced object${msgSuffix}`;
  } else {
    msg = `Expected object to be an instance of "${expectedTypeStr}" but was "${actualTypeStr}"${msgSuffix}`;
  }
  throw new AssertionError(msg);
}
__name(assertInstanceOf, "assertInstanceOf");

// https://jsr.io/@std/assert/1.0.19/is_error.ts
function assertIsError(error, ErrorClass, msgMatches, msg) {
  const msgSuffix = msg ? `: ${msg}` : ".";
  if (!(error instanceof Error)) {
    throw new AssertionError(
      `Expected "error" to be an Error object${msgSuffix}`
    );
  }
  if (ErrorClass && !(error instanceof ErrorClass)) {
    msg = `Expected error to be instance of "${ErrorClass.name}", but was "${error?.constructor?.name}"${msgSuffix}`;
    throw new AssertionError(msg);
  }
  let msgCheck;
  if (typeof msgMatches === "string") {
    msgCheck = stripAnsiCode(error.message).includes(
      stripAnsiCode(msgMatches)
    );
  }
  if (msgMatches instanceof RegExp) {
    msgCheck = msgMatches.test(stripAnsiCode(error.message));
  }
  if (msgMatches && !msgCheck) {
    msg = `Expected error message to include ${msgMatches instanceof RegExp ? msgMatches.toString() : JSON.stringify(msgMatches)}, but got ${JSON.stringify(error?.message)}${msgSuffix}`;
    throw new AssertionError(msg);
  }
}
__name(assertIsError, "assertIsError");

// https://jsr.io/@std/assert/1.0.19/less_or_equal.ts
function assertLessOrEqual(actual, expected, msg) {
  if (actual <= expected) return;
  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(
    msg ?? `Expect ${actualString} <= ${expectedString}`
  );
}
__name(assertLessOrEqual, "assertLessOrEqual");

// https://jsr.io/@std/assert/1.0.19/less.ts
function assertLess(actual, expected, msg) {
  if (actual < expected) return;
  const actualString = format(actual);
  const expectedString = format(expected);
  throw new AssertionError(msg ?? `Expect ${actualString} < ${expectedString}`);
}
__name(assertLess, "assertLess");

// https://jsr.io/@std/assert/1.0.19/match.ts
function assertMatch(actual, expected, msg) {
  if (expected.test(actual)) return;
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${actual}" to match: "${expected}"${msgSuffix}`;
  throw new AssertionError(msg);
}
__name(assertMatch, "assertMatch");

// https://jsr.io/@std/assert/1.0.19/not_equals.ts
function assertNotEquals(actual, expected, msg) {
  if (!equal(actual, expected)) {
    return;
  }
  const actualString = format(actual);
  const expectedString = format(expected);
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(
    `Expected actual: ${actualString} not to be: ${expectedString}${msgSuffix}`
  );
}
__name(assertNotEquals, "assertNotEquals");

// https://jsr.io/@std/assert/1.0.19/not_instance_of.ts
function assertNotInstanceOf(actual, unexpectedType, msg) {
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected object to not be an instance of "${typeof unexpectedType}"${msgSuffix}`;
  assertFalse(actual instanceof unexpectedType, msg);
}
__name(assertNotInstanceOf, "assertNotInstanceOf");

// https://jsr.io/@std/assert/1.0.19/not_match.ts
function assertNotMatch(actual, expected, msg) {
  if (!expected.test(actual)) return;
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${actual}" to not match: "${expected}"${msgSuffix}`;
  throw new AssertionError(msg);
}
__name(assertNotMatch, "assertNotMatch");

// https://jsr.io/@std/assert/1.0.19/not_strict_equals.ts
function assertNotStrictEquals(actual, expected, msg) {
  if (!Object.is(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(
    `Expected "actual" to not be strictly equal to: ${format(actual)}${msgSuffix}
`
  );
}
__name(assertNotStrictEquals, "assertNotStrictEquals");

// https://jsr.io/@std/assert/1.0.19/object_match.ts
function assertObjectMatch(actual, expected, msg) {
  return assertEquals(
    // get the intersection of "actual" and "expected"
    // side effect: all the instances' constructor field is "Object" now.
    filter(actual, expected),
    // set (nested) instances' constructor field to be "Object" without changing expected value.
    // see https://github.com/denoland/std/pull/1419
    filter(expected, expected),
    msg
  );
}
__name(assertObjectMatch, "assertObjectMatch");
function isObject(val) {
  return typeof val === "object" && val !== null;
}
__name(isObject, "isObject");
function defineProperty(target, key, value) {
  return Object.defineProperty(target, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true
  });
}
__name(defineProperty, "defineProperty");
function filter(a, b) {
  const seen = /* @__PURE__ */ new WeakMap();
  return filterObject(a, b);
  function filterObject(a2, b2) {
    const memo = seen.get(a2);
    if (memo && memo === b2) return a2;
    try {
      seen.set(a2, b2);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new TypeError(
          `Cannot assertObjectMatch ${a2 === null ? null : `type ${typeof a2}`}`
        );
      }
    }
    const filtered = {};
    const keysA = Reflect.ownKeys(a2);
    const keysB = Reflect.ownKeys(b2);
    const entries = keysA.filter((key) => keysB.includes(key)).map((key) => [key, a2[key]]);
    if (keysA.length && keysB.length && !entries.length) {
      for (const key of keysA) defineProperty(filtered, key, a2[key]);
      return filtered;
    }
    for (const [key, value] of entries) {
      if (value instanceof RegExp) {
        defineProperty(filtered, key, value);
        continue;
      }
      if (value instanceof Date) {
        defineProperty(filtered, key, value);
        continue;
      }
      const subset = b2[key];
      if (Array.isArray(value) && Array.isArray(subset)) {
        defineProperty(filtered, key, filterArray(value, subset));
        continue;
      }
      if (isObject(value) && isObject(subset)) {
        if (value instanceof Map && subset instanceof Map) {
          defineProperty(
            filtered,
            key,
            new Map(
              [...value].filter(([k]) => subset.has(k)).map(
                ([k, v]) => {
                  const v2 = subset.get(k);
                  if (isObject(v) && isObject(v2)) {
                    return [k, filterObject(v, v2)];
                  }
                  return [k, v];
                }
              )
            )
          );
          continue;
        }
        if (value instanceof Set && subset instanceof Set) {
          defineProperty(filtered, key, value.intersection(subset));
          continue;
        }
        defineProperty(
          filtered,
          key,
          filterObject(value, subset)
        );
        continue;
      }
      defineProperty(filtered, key, value);
    }
    return filtered;
  }
  __name(filterObject, "filterObject");
  function filterArray(a2, b2) {
    const memo = seen.get(a2);
    if (memo && memo === b2) return a2;
    seen.set(a2, b2);
    const filtered = [];
    const count = Math.min(a2.length, b2.length);
    for (let i = 0; i < count; ++i) {
      const value = a2[i];
      const subset = b2[i];
      if (value instanceof RegExp) {
        filtered.push(value);
        continue;
      }
      if (value instanceof Date) {
        filtered.push(value);
        continue;
      }
      if (Array.isArray(value) && Array.isArray(subset)) {
        filtered.push(filterArray(value, subset));
        continue;
      }
      if (isObject(value) && isObject(subset)) {
        if (value instanceof Map && subset instanceof Map) {
          const map = new Map(
            [...value].filter(([k]) => subset.has(k)).map(([k, v]) => {
              const v2 = subset.get(k);
              if (isObject(v) && isObject(v2)) {
                return [k, filterObject(v, v2)];
              }
              return [k, v];
            })
          );
          filtered.push(map);
          continue;
        }
        if (value instanceof Set && subset instanceof Set) {
          filtered.push(value.intersection(subset));
          continue;
        }
        filtered.push(filterObject(value, subset));
        continue;
      }
      filtered.push(value);
    }
    return filtered;
  }
  __name(filterArray, "filterArray");
}
__name(filter, "filter");

// https://jsr.io/@std/assert/1.0.19/rejects.ts
async function assertRejects(fn, errorClassOrMsg, msgIncludesOrMsg, msg) {
  let ErrorClass;
  let msgIncludes;
  let err;
  if (typeof errorClassOrMsg !== "string") {
    if (errorClassOrMsg === void 0 || errorClassOrMsg.prototype instanceof Error || errorClassOrMsg.prototype === Error.prototype) {
      ErrorClass = errorClassOrMsg;
      msgIncludes = msgIncludesOrMsg;
    }
  } else {
    msg = errorClassOrMsg;
  }
  let doesThrow = false;
  let isPromiseReturned = false;
  const msgSuffix = msg ? `: ${msg}` : ".";
  try {
    const possiblePromise = fn();
    if (possiblePromise && typeof possiblePromise === "object" && typeof possiblePromise.then === "function") {
      isPromiseReturned = true;
      await possiblePromise;
    } else {
      throw new Error();
    }
  } catch (error) {
    if (!isPromiseReturned) {
      throw new AssertionError(
        `Function throws when expected to reject${msgSuffix}`
      );
    }
    if (ErrorClass) {
      if (!(error instanceof Error)) {
        throw new AssertionError(`A non-Error object was rejected${msgSuffix}`);
      }
      assertIsError(
        error,
        ErrorClass,
        msgIncludes,
        msg
      );
    }
    err = error;
    doesThrow = true;
  }
  if (!doesThrow) {
    throw new AssertionError(
      `Expected function to reject${msgSuffix}`
    );
  }
  return err;
}
__name(assertRejects, "assertRejects");

// https://jsr.io/@std/assert/1.0.19/strict_equals.ts
function assertStrictEquals(actual, expected, msg) {
  if (Object.is(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message;
  const actualString = format(actual);
  const expectedString = format(expected);
  if (actualString === expectedString) {
    const withOffset = actualString.split("\n").map((l) => `    ${l}`).join("\n");
    message = `Values have the same structure but are not reference-equal${msgSuffix}

${red(withOffset)}
`;
  } else {
    const stringDiff = typeof actual === "string" && typeof expected === "string";
    const diffResult = stringDiff ? diffStr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
    const diffMsg = buildMessage(diffResult, { stringDiff }, arguments[3]).join("\n");
    message = `Values are not strictly equal${msgSuffix}
${diffMsg}`;
  }
  throw new AssertionError(message);
}
__name(assertStrictEquals, "assertStrictEquals");

// https://jsr.io/@std/assert/1.0.19/string_includes.ts
function assertStringIncludes(actual, expected, msg) {
  if (actual.includes(expected)) return;
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected actual: "${actual}" to contain: "${expected}"${msgSuffix}`;
  throw new AssertionError(msg);
}
__name(assertStringIncludes, "assertStringIncludes");

// https://jsr.io/@std/assert/1.0.19/throws.ts
function assertThrows(fn, errorClassOrMsg, msgIncludesOrMsg, msg) {
  let ErrorClass;
  let msgIncludes;
  let err;
  if (typeof errorClassOrMsg !== "string") {
    if (errorClassOrMsg === void 0 || errorClassOrMsg?.prototype instanceof Error || errorClassOrMsg?.prototype === Error.prototype) {
      ErrorClass = errorClassOrMsg;
      msgIncludes = msgIncludesOrMsg;
    } else {
      msg = msgIncludesOrMsg;
    }
  } else {
    msg = errorClassOrMsg;
  }
  let doesThrow = false;
  const msgSuffix = msg ? `: ${msg}` : ".";
  try {
    fn();
  } catch (error) {
    if (ErrorClass) {
      if (error instanceof Error === false) {
        throw new AssertionError(`A non-Error object was thrown${msgSuffix}`);
      }
      assertIsError(
        error,
        ErrorClass,
        msgIncludes,
        msg
      );
    }
    err = error;
    doesThrow = true;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msgSuffix}`;
    throw new AssertionError(msg);
  }
  return err;
}
__name(assertThrows, "assertThrows");

// https://jsr.io/@std/assert/1.0.19/assert.ts
function assert(expr, msg = "") {
  if (!expr) {
    throw new AssertionError(msg);
  }
}
__name(assert, "assert");

// https://jsr.io/@std/assert/1.0.19/fail.ts
function fail(msg) {
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(`Failed assertion${msgSuffix}`);
}
__name(fail, "fail");

// https://jsr.io/@std/assert/1.0.19/unimplemented.ts
function unimplemented(msg) {
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(`Unimplemented${msgSuffix}`);
}
__name(unimplemented, "unimplemented");

// https://jsr.io/@std/assert/1.0.19/unreachable.ts
function unreachable(msg) {
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(`Unreachable${msgSuffix}`);
}
__name(unreachable, "unreachable");
export {
  AssertionError,
  assert,
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertFalse,
  assertGreater,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertIsError,
  assertLess,
  assertLessOrEqual,
  assertMatch,
  assertNotEquals,
  assertNotInstanceOf,
  assertNotMatch,
  assertNotStrictEquals,
  assertObjectMatch,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
  equal,
  fail,
  unimplemented,
  unreachable
};
