#!/bin/bash
deno run --allow-read --allow-write --allow-net --allow-env --allow-run "deno/bundle/builder.js" "./deno/bundle/targets.tsv"
exit