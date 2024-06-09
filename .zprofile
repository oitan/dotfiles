# load aliases
source $HOME/.aliases

# HOMEBREW
eval "$(/opt/homebrew/bin/brew shellenv)"

# VOLTA
VOLTA_HOME=$HOME/.volta
PATH=$VOLTA_HOME/bin:$PATH

# Added by Toolbox App
export PATH="$PATH:/Users/oitan/Library/Application Support/JetBrains/Toolbox/scripts"

