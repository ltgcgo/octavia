// Fiddle 0.0.1
// Licensed under GNU LGPL 3.0
// The name used to be an acronym of "Fast Inter Division, Direct Linear Expressions", but the library itself is intended to provide more stuff from bit manipulation, soooooo...
// This file is just a simple glue layer, meh. Should probably convert it into a stream-based import however to reduce memory footprint.

"use strict";

const binaryFile; // Placeholder for actual module buffer imports.

export default (new WebAssembly.Instance(binaryFile, {})).exports;
