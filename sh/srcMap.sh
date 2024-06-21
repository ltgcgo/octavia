#!/bin/bash
cd test/js
ls -1 ../../dist/*js | while IFS= read -r file; do
	ln -s "$file" 2>/dev/null
	ln -s "$file".map 2>/dev/null
done
exit