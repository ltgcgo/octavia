#!/bin/bash
rm test/caches 2>/dev/null
ln -s ../dist/caches test/caches
cd test/js
ls -1 ../../dist/*.mjs | while IFS= read -r file; do
	ln -s "$file" 2>/dev/null
	ln -s "$file".map 2>/dev/null
done
if [ -e "../../dist/entry" ]; then
	ls -1 ../../dist/entry/*.js | while IFS= read -r file; do
		ln -s "$file" 2>/dev/null
		ln -s "$file".map 2>/dev/null
	done
fi
exit