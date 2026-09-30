#!/bin/bash
logLevel="warning"
if [ "$IS_BUILD" == "" ]; then
	logLevel="info"
fi
# Build JS files
#rm -rv dist/${1:default}*
esbuild --log-level=$logLevel --log-limit=0 --format=esm --splitting --bundle src/*/index.js --entry-names="[dir].js" --chunk-names="[name]-[hash]" --charset=utf8 --keep-names --preserve-symlinks --loader:.htm=text --loader:.css=text --loader:.svg=text --loader:.wasm=binary --outdir=dist ${2:---minify-whitespace --minify-syntax --sourcemap --watch} $3
#cat proxy/${1:-default}.js
exit
