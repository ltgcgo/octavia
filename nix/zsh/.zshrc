# Slightly modified test ZSH config
# Set up the prompt
autoload -Uz promptinit
setopt histignorealldups sharehistory
# Use emacs keybindings even if our EDITOR is set to vi
bindkey -e
# Keep 1000 lines of history within the shell and save it to ~/.zsh_history:
HISTSIZE=1000
SAVEHIST=1000
HISTFILE=$SOURCE_DIR/nix/zsh/.zsh_history
# Use modern completion system
autoload -Uz compinit
compinit
zstyle ':completion:*' auto-description 'specify: %d'
zstyle ':completion:*' completer _expand _complete _correct _approximate
zstyle ':completion:*' format 'Completing %d'
zstyle ':completion:*' group-name ''
zstyle ':completion:*' menu select=2
eval "$(dircolors -b)"
zstyle ':completion:*:default' list-colors ${(s.:.)LS_COLORS}
zstyle ':completion:*' list-colors ''
zstyle ':completion:*' list-prompt %SAt %p: Hit TAB for more, or the character to insert%s
zstyle ':completion:*' matcher-list '' 'm:{a-z}={A-Z}' 'm:{a-zA-Z}={A-Za-z}' 'r:|[._-]=* r:|=* l:|=*'
zstyle ':completion:*' menu select=long
zstyle ':completion:*' select-prompt %SScrolling active: current selection at %p%s
zstyle ':completion:*' use-compctl false
zstyle ':completion:*' verbose true

zstyle ':completion:*:*:kill:*:processes' list-colors '=(#b) #([0-9]#)*=0=01;31'
zstyle ':completion:*:kill:*' command 'ps -u $USER -o pid,%cpu,tty,cputime,cmd'

# Load version control information
autoload -Uz vcs_info
precmd() { vcs_info }
# Format the vcs_info_msg_0_ variable
zstyle ':vcs_info:git*' formats '(%b) '

# Custom device name?
if [ -e "./nix/zsh/.zshName" ] ; then
	customDeviceName=" %B%F{yellow}$(cat ./nix/zsh/.zshName)"
fi

# Nested or not?
if [ "$shellCount" != "" ] ; then
	export shellCount=$(($shellCount+1))
else
	export shellCount=0
fi

# Via SSH or not?
termType="term"
if [ "$SSH_CLIENT" != "" ] ; then
	termType="sshd"
fi

# Display current screen
if [ "$STY" != "" ] ; then
	screenSupport="%b%F{white}@%B%F{yellow}$STY"
fi

# Use Proxychains
if [ -e $PREFIX/etc/proxychains.conf ] ; then
	xPC_VER="proxychains.conf"
else
	if [ -e $PREFIX/etc/proxychains4.conf ] ; then
		xPC_VER="proxychains4.conf"
	fi
fi
if [ "$xPC_VER" != "" ] ; then
	if [ "$PROXYCHAINS_CONF_FILE" = "$PREFIX/etc/$xPC_VER" ] ; then
		xPC_PROF="PC:S"
	elif [ "$PROXYCHAINS_CONF_FILE" = "$HOME/.proxychains/proxychains.conf" ] ; then
		xPC_PROF="PC:U"
	elif [ "$PROXYCHAINS_CONF_FILE" = "$PWD/proxychains.conf" ] ; then
		xPC_PROF="PC:D"
	elif [ "$PROXYCHAINS_CONF_FILE" != "" ] ; then
		xPC_PROF="PC:C"
	fi
fi
if [ "$xPC_PROF" != "" ] ; then
	if [ "$PROXYCHAINS_QUIET_MODE" = "1" ] ; then
		xPC_QUIET=" %B%F{green}"
	else
		xPC_QUIET=" %B%F{cyan}"
	fi
fi

# Use sudo
if [ "$SUDO_USER" ] ; then
	sudoInfo="%B%F{blue}$SUDO_USER%b%F{white}>"
fi
# Use doas
if [ "$DOAS_USER" != "" ] ; then
	sudoInfo="%B%F{blue}$DOAS_USER%b%F{white}>"
fi

# Which desktop environment are you using?
if [ "$KDE_SESSION_VERSION" != "" ] ; then
	xDE_TYPE="KDE"
elif [ "$GDMSESSION" != "" ] ; then
	xDE_TYPE="GTK"
elif [ "$TERMUX_VERSION" != "" ] ; then
	xDE_TYPE="TMX"
elif [ "$IN_NIX_SHELL" != "" ] ; then
	xDE_TYPE="Nix"
fi
# Combine DE info
if [ "$xDE_TYPE" != "" ] ; then
	xDE_INFO=" %B%F{green}$xDE_TYPE"
fi

# Use ZSH in screens by default instead
SHELL="$(which zsh)"

# Reconfigure prompt
shellSymbol="#"
if [ "$(whoami)" != "root" ] ; then
	shellSymbol="\$"
fi

PS1="%b%F{white}[%B%F{green}ZSH$screenSupport$customDeviceName$xDE_INFO$xPC_QUIET$xPC_PROF%b%F{white}] %B%F{green}%99<...<%~\
%}%F{white}
${sudoInfo}%B%F{cyan}%n%b%F{white}:%B%F{yellow}$termType%b%F{white}-%B%F{yellow}$shellCount %B%F{white}$shellSymbol %b%f%k"
bindkey "^[[H" beginning-of-line
bindkey "^[[F" end-of-line
bindkey "^[[3~" delete-char
