#!/bin/bash
#echo "Building..."
#shx build
#echo "Constructing isolates..."
echo "Publishing to JSR..."
deno publish --allow-dirty --config isolated/midi-parser-ecosystem/deno.json
echo "Publishing to NPM..."
exit