#!/bin/bash
#echo "Building..."
#shx build
echo "Publishing to JSR..."
deno publish --allow-dirty --config deno.miccCompat.json
echo "Publishing to NPM..."
exit