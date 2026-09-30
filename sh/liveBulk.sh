#!/bin/bash
logLevel="warning"
if [ "$IS_BUILD" == "" ]; then
	logLevel="info"
fi
# Build JS files
#rm -rv dist/${1:default}*
echo "Cleaning up..."
rm dist/*/index.js 2>/dev/null
rm dist/*/index.js.map 2>/dev/null
rm dist/caches-* 2>/dev/null
rm dist/*.js.js 2>/dev/null
rm dist/*.js.js.map 2>/dev/null
rm -r dist/bundle 2>/dev/null
rm -r dist/caches 2>/dev/null
rmdir dist/* 2>/dev/null
ls -1 src | while IFS= read -r entry; do
	if [ -f "src/${entry}/index.mjs" ]; then
		rm "dist/${entry}.js" 2>/dev/null
		rm "dist/${entry}.js.map" 2>/dev/null
	fi
done
sleep 1s
echo "Starting..."
esbuild --log-level=$logLevel --log-limit=0 --format=esm --splitting --bundle src/*/index.js --entry-names="bundle/[dir]" --chunk-names="caches/[hash]" --charset=utf8 --keep-names --preserve-symlinks --loader:.htm=text --loader:.css=text --loader:.svg=text --loader:.wasm=binary --outdir=dist ${2:---minify-whitespace --minify-syntax --sourcemap --watch} $3
#cat proxy/${1:-default}.js
exit
