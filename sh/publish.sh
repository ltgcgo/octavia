#!/bin/bash
cd jsr
rm deno.json
cp ../deno.json ./
echo "Publishing to JSR..."
deno publish --allow-slow-types
exit