#!/bin/bash
# shx Standard Utility
# Push to a single remote
git stage -A && git commit --amend && git push --force $1
# Push to all remotes
#git stage -A && git commit --amend && git remote | xargs -L1 git push --force
exit
