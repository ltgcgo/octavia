#!/bin/bash
cd test/js
ls -1 ../../dist/*js | while IFS= read -r file; do
	ln -s "$file"
	ln -s "$file".map
done
exit