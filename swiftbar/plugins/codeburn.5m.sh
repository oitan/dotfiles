#!/bin/bash
# <xbar.title>CodeBurn</xbar.title>
# <xbar.version>v0.1.0</xbar.version>
# <xbar.author>AgentSeal</xbar.author>
# <xbar.author.github>agentseal</xbar.author.github>
# <xbar.desc>See where your AI coding tokens burn. Tracks cost, activity, and model usage across Claude Code, Cursor, and Codex by task type, tool, MCP server, and project.</xbar.desc>
# <xbar.image>file:///Users/oitan/codeburn/assets/logo.png</xbar.image>
# <xbar.abouturl>https://github.com/agentseal/codeburn</xbar.abouturl>
# <xbar.dependencies>node</xbar.dependencies>

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"

/Users/oitan/.local/share/mise/installs/node/24.13.1/bin/codeburn status --format menubar 2>/dev/null || echo "-- | sfimage=flame.fill"
