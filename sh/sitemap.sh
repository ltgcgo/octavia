#!/bin/bash
rm ghp/map.txt
domain=$(cat conf/domain.txt)
cat conf/sitemap.txt | while IFS= read -r path ; do
	echo "${domain}${path}" >> ghp/map.txt
done
exit