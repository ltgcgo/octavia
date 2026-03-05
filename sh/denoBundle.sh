#!/bin/bash
deno run --allow-read --allow-write --allow-net --allow-env "deno/bundle/builder.js" "./deno/bundle/targets.tsv"
exit