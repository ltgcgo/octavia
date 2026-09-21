#!/bin/bash
mkdir -p src/data/generated/
deno run --allow-read --allow-write src/data/generate.js
exit