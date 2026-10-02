#!/bin/bash
#echo "Building..."
#shx build
echo "Constructing isolates..."
ln -s ../../dist isolated/midi-parser-ecosystem/dist
ln -s ../../libs isolated/midi-parser-ecosystem/libs
ln -s ../../dist/miccCompat.mjs isolated/midi-parser-ecosystem/
ln -s ../../dist/miccCompat.d.mts isolated/midi-parser-ecosystem/
echo "Publishing to JSR..."
deno publish --allow-dirty --config isolated/midi-parser-ecosystem/deno.json
echo "Publishing to NPM..."
cd isolated/midi-parser-ecosystem
npm publish --dry-run --provenance --access public
cd ../..
exit