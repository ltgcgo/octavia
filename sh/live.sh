#!/bin/bash
rm -rv proxy/${1:default}*
esbuild --bundle src/${1:-default}/index.js --outfile=proxy/${1:-default}.js --sourcemap ${2:---minify-whitespace --minify-syntax}
cat proxy/${1:-default}.js
exit
