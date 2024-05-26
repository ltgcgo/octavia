#!/bin/bash
#cd dist
#cp ../deno.json ./
echo "Publishing to JSR..."
deno publish --allow-slow-types --allow-dirty --config ./deno.json
#rm deno.json
exit