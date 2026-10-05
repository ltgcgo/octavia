#!/bin/bash
echo "Cleaning up previous links..."
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
echo "Linking split caches..."
rm test/caches 2>/dev/null
ln -s ../dist/caches test/caches
cd test/js
echo "Linking modules..."
ls -1 ../../dist/*.mjs 2>/dev/null | while IFS= read -r file; do
	ln -s "$file" 2>/dev/null
	ln -s "$file".map 2>/dev/null
done
if [ -e "../../dist/bundle" ]; then
	echo "Linking split bundles..."
	ls -1 ../../dist/bundle/*.js 2>/dev/null | while IFS= read -r file; do
		ln -s "$file" 2>/dev/null
		ln -s "$file".map 2>/dev/null
	done
fi
echo "Linking bundles..."
ls -1 ../../dist/*.js 2>/dev/null | while IFS= read -r file; do
	ln -s "$file" 2>/dev/null
	ln -s "$file".map 2>/dev/null
done
echo "Linking finished."
exit