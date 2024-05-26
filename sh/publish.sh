#!/bin/bash
cd jsr
echo "Publishing to JSR..."
deno publish --allow-slow-types
exit