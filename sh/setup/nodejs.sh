#!/bin/bash
binaryPredicate="node"
packageNames="nodejs npm"
if command -v "${binaryPredicate}" >/dev/null 2>&1; then
	echo "Component \"${packageNames}\" is present."
else
	apt install ${packageNames} -y
fi