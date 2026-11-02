#!/bin/bash
binaryPredicate="ende"
if command -v "${binaryPredicate}" >/dev/null 2>&1; then
	echo "Component \"${packageNames}\" is present."
else
	if [ "$GITHUB_PATH" == "" ]; then
		echo "Not inside a CI/CD job."
	else
		mkdir /tmp/ende
		cd /tmp/ende
		curl -Lo ende.zip "https://github.com/theende/ende/releases/latest/download/ende-x86_64-unknown-linux-gnu.zip"
		unzip ende.zip && rm ende.zip
		echo "/tmp/ende" >> "$GITHUB_PATH"
		ls -l /tmp/ende/
		which ende
	fi
fi