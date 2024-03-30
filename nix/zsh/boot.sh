#!/bin/bash
# Entrypoint for Docker containers
cd /data/
echo "Preparing Nix environment..."
export NIX_PATH=nixpkgs=channel:nixos-unstable
all_proxy= HTTPS_PROXY= ALL_PROXY= https_proxy= HTTP_PROXY= http_proxy= NO_PROXY= no_proxy= ftp_proxy= FTP_PROXY= nix-shell "nix/${1}.nix" --quiet --pure --command "bash /data/nix/zsh/shell.sh"
if [ "$?" != "0" ]; then
	echo -e "\n\033[1;31mError\033[0m: Nix environment build error. Opening Bash instead..."
	bash
fi
exit