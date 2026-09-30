#!/bin/bash
rm test/caches 2>/dev/null
ln -s ../dist/caches test/caches
mkdir -p test/js
ls -1 src | while IFS= read -r file; do
	if [ -f "src/$file/index.js" ]; then
		rm "test/js/$file.js" 2>/dev/null
		rm "test/js/$file.js.map" 2>/dev/null
	elif [ -f "src/$file/index.mjs" ]; then
		rm "test/js/$file.mjs" 2>/dev/null
		rm "test/js/$file.mjs.map" 2>/dev/null
	fi
done
cd test/js
ls -1 ../../dist/*.mjs | while IFS= read -r file; do
	ln -s "$file" 2>/dev/null
	ln -s "$file".map 2>/dev/null
done
if [ -e "../../dist/bundle" ]; then
	ls -1 ../../dist/bundle/*.js | while IFS= read -r file; do
		ln -s "$file" 2>/dev/null
		ln -s "$file".map 2>/dev/null
	done
fi
ls -1 ../../dist/*.js | while IFS= read -r file; do
	ln -s "$file" 2>/dev/null
	ln -s "$file".map 2>/dev/null
done
exit