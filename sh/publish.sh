#!/bin/bash
echo "Building..."
shx build
echo "Publishing to JSR..."
deno publish --allow-slow-types --allow-dirty --config ./deno.json
exit