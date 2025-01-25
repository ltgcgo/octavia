#!/bin/bash
if [ -f "./conf/domain.txt" ]; then
	domain=$(cat conf/domain.txt)
	printf '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' > ghp/sitemap.xml
	if [ -f "./conf/sitemap.txt" ]; then
		cat conf/sitemap.txt | while IFS= read -r path ; do
			printf "<url><loc>${domain}${path//index.htm/}</loc><lastmod>$(date -u '+%Y-%m-%d %H:%M:%S' -r .${path})</lastmod></url>" >> ghp/sitemap.xml
		done
		printf '</urlset>' >> ghp/sitemap.xml
	else
		echo "Sitemap list not found."
	fi
else
	echo "Domain not found for sitemap file generation."
fi
exit