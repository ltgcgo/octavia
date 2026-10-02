#!/bin/bash
#echo "Building..."
#shx build
echo "Constructing isolates..."
ln -s ../../dist isolated/midi-parser-ecosystem/dist
ln -s ../../libs isolated/midi-parser-ecosystem/libs
echo "Publishing to JSR..."
deno publish --allow-dirty --config isolated/midi-parser-ecosystem/deno.json
echo "Publishing to NPM..."
cd isolated/midi-parser-ecosystem
cd ../..
exit