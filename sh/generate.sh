#!/bin/bash
mkdir -p src/data/generated/
deno run --allow-read --allow-write src/data/generate.js
if [ -f "./src/data/generateFlyLeaf.js" ]; then
	deno run --allow-read --allow-write src/data/generateFlyLeaf.js
fi
exit