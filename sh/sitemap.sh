#!/bin/bash
rm ghp/sitemap.txt
domain=$(cat conf/domain.txt)
cat conf/sitemap.txt | while IFS= read -r path ; do
	echo "${domain}${path}" >> ghp/sitemap.txt
done
exit