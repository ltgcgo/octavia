#!/bin/bash
emitFile="./proof/summary.tsv"

echo "runtime	method	target	hash" > $emitFile
find proof -type f | while IFS= read -r file; do
	methodName=$(printf "$file" | cut -d'/' -f2)
	runtimeName=$(printf "$file" | cut -d'/' -f3)
	fileName=$(printf "$file" | cut -d'/' -f4 | cut -d'.' -f1,2)
	hashResult=$(sha256sum "$file" | cut -d' ' -f1)
	echo "$runtimeName	$methodName $fileName	$hashResult" >> $emitFile
done