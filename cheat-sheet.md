# AeroSpace

- `<alt-shift-;>` -> enter service mode
- `<alt-,>` -> change accordion layout
- `<alt-/>` -> change tile layout
- `<alt-[workspace]>` -> go to workspace
- `<alt-shift-[workspace]>` -> move window to workspace
- `<alt-shift-minus>` -> decrease window size
- `<alt-shift-equal>` -> increase window size
- `<alt-shift-h/j/k/l>` -> move window position
- `<alt-h/j/k/l>` -> focus to another window

- `<alt-tab>` -> go to previous workspace
- `<alt-shift-tab>` -> move workspace to another monitor
- `$ ff` -> fuzzy jump to app

## open applications

- `<alt-enter>` -> open ghostty
- `<alt-q>` -> open reminders
- `<alt-w>` -> open telegram
- `<alt-e>` -> open data grip
- `<alt-r>` -> open notion

## service mode

- `esc` -> reload config
- `r` -> reset layout
- `f` -> toggle window between floating and tiling layout
- `backspace` -> close all windows on the workspace but current

# Ghostty

- `$ ghostty +list-keybinds` -> list keybinds

# Yazi

- `q` -> quit
- `~` -> help
- `yy` -> open yazi
- `h/j/k/l` -> navigate
- `K/J` -> navigate x 5
- `gg` -> to the top
- `G` -> to the bottom
-

https://yazi-rs.github.io/docs/quick-start

# Terminal

## atuin

https://docs.atuin.sh/configuration/key-binding/#atuin-ui-shortcuts

- `$ <up>` -> enter atuin

### inside items list

- `<C-r>` -> cycle filter modes
- `<CR>` -> execute item
- `<tab>` -> pick item to edit
- `<C-s>` -> cycle search modes
- `<C-o>` -> inspect item
- `<C-y>` -> copy item to clipboard

## fzf

search syntax: https://github.com/junegunn/fzf?tab=readme-ov-file#search-syntax

- `<alt-c>` -> fzf in dirs
- `<C-t>` -> fzf in files and dirs
- `<C-r>` -> fzf in commands history
- `$ some command **<tab>` -> fzf trigger in command line (even for `kill` command)
- `<C-n/p>` -> to navigate in the results (or just scroll)

### fzf-git

all shortcuts below can be used as `<C-g><C-<key>>` instead of `<C-g><key>`

- `<C-g>f` - for **F**iles
- `<C-g>b` - for **B**ranches
- `<C-g>t` - for **T**ags
- `<C-g>r` - for **R**emotes
- `<C-g>h` - for commit **H**ashes
- `<C-g>s` - for **S**tashes
- `<C-g>l` - for ref**l**ogs
- `<C-g>w` - for **W**orktrees
- `<C-g>e` - for **E**ach ref (`git for-each-ref`)

### inside fzf

- `<tab>` or `<shift-tab>` to select multiple objects
- `<C-l>` to change preview window layout
- `<C-o>` to open the object in the web browser (in GitHub URL scheme)

### search syntax

Unless otherwise specified, fzf starts in "extended-search mode" where you can type in multiple search terms delimited by spaces. e.g. `^music .mp3$ sbtrkt !fire`

| Token     | Match type                 | Description                          |
| --------- | -------------------------- | ------------------------------------ |
| `sbtrkt`  | fuzzy-match                | Items that match `sbtrkt`            |
| `'wild`   | exact-match (quoted)       | Items that include `wild`            |
| `^music`  | prefix-exact-match         | Items that start with `music`        |
| `.mp3$`   | suffix-exact-match         | Items that end with `.mp3`           |
| `!fire`   | inverse-exact-match        | Items that do not include `fire`     |
| `!^music` | inverse-prefix-exact-match | Items that do not start with `music` |
| `!.mp3$`  | inverse-suffix-exact-match | Items that do not end with `.mp3`    |

## eza

- `$ e -T -L=<number>` -> list tree of files with depth of number

## zoxide

- `$ z -` -> go to previous dir (cd has this as well)
- `$ z <part1> <part2> <part3>` -> can go to `~/part1/something/another-thing/part2/unknown-thing/part3` if trained. Order of parts passed has to be the same as with the dir. Last items must match.
- use `$ z` instead of `$ cd` to train zoxide
- zoxide is case-insensitive
- `$ zi` -> enter interactive mode (with `fzf`)
- `$ z <part1> <tab>` -> enter interactive mode (like autocomplete)
- `$ zoxide edit` -> edit entries in interactive mode

## ripgrep

- `$ rg word path` -> searches for lines that contains `word` in files inside `path`.
  - `word` can be regex.
  - `path` is optional, can also be a regex, default is `./`.
  - `./--hidden` -> search hidden files and directories
  - `L/--follow` -> follow symbolic links while recursively searching.
  - `r new-word` -> replace `word` with `new-word`. also regexable like in find-replace in vscode
  - - `c/--count`: Report a count of total matched lines.

## fd

just like `find` but better.

# NeoVim

## normal mode

- `<leader>fg` -> fuzzy find in files
- `<leader>fG` -> fuzzy find in files (hidden files included)
- `<C-p>` -> fuzzy find by filename
- `<leader>fh` -> fuzzy find by filename (hidden files included)
- `K` -> shows info for current symbol in a floating window. Pressing twice will jump into the floating window
- `<leader>gd` -> go to definition
- `<leader>ca` -> lists available code actions
- `<leader>gR` -> see references
- `<C-n>` -> reveal filesystem
- `<leader>fm` -> format
- `<C-w>s/v` -> open new split window (horizontal/vertical)
- `<C-up/down/left/right>` -> resize split window
- `<C-w>r`/`<C-w><C-r>` -> move window to right or down. Cursor stays in the same window
- `<C-w>R` -> move window to left or up. Cursor stays in the same window
- `<C-w>H/J/K/L` -> move current window to the top left/bottom/top/right position
- `<C-w>T` -> move the current split window to a new tab
- `<C-w> =` -> resize all splits equally
- `<C-w>q`/`<C-w><C-q>` -> close current window
- `<leader>cr` -> rename variable
- `<leader>e` -> open current diagnostics
- `<leader>fd` -> open file diagnostics
- `<leader>fD` -> open workspace diagnostics
- `c<number>t<character>` -> change to number'th character
- `<C-o/i>` -> jump back/forth
- `di<motion>` -> delete inside motion (delete inside brackets for example)
- `da<motion>` -> delete along with motion (delete along with brackets for example)
- `%` -> motion for pairing current buffer pair (like brackets)
- `<leader>f,/.` -> jump to prev/next quick fix
- `<leader>fo/c` -> open/close quick fix list
- `gx` -> open link in browser
- `gv` -> select last visual selection
- `ge` -> prev end of word
- `gi` -> go to last insert

### navigation

- `zt` -> current line to top of window
- `zz` -> current line to center of window
- `zb` -> current line to bottom of window
- `<C-y>` -> scroll window up one line (cursor stays)
- `<C-e>` -> scroll window down one line (cursor stays)
- `H` -> move cursor to top of window
- `M` -> move cursor to middle of window
- `L` -> move cursor to bottom of window

## command mode

- `:wqa` -> write quit all
- `:x` -> save and quit
- `:help key-notation` -> see key notations
- `:h jumplist` -> a lot of good motions to learn about jumps

### replace

- `:$s/pattern/replace_pattern/gc` -> find and replace (g - replace all occurrences on each line), (c - confirm each replacement)
  `y` -> replace this match
  `n` -> skip this match
  `a` -> replace all remaining matches without asking
  `q` -> quit substitution
  `l` -> replace this and quit
  `<C-e/y>` -> scroll up/down

## insert mode

- `<C-x><C-o>` -> autocomplete
- `<C-o>` -> puts in normal mode for one command and puts back to insert
- `<C-i>` -> tab (no need for this, use actual tab)

### autocomplete

- `<C-p/n>` -> go to prev/next suggestion in a suggestion window

## neo-tree

- `a` -> add. If item to be added ends with `/` then directory will be added
- `d` -> delete
- `r` -> rename
- `m` -> move
- `H` -> reveal hidden files
- `P` -> toggle preview
- `?` -> help, lists keys
- `<leader>gs` -> reveal git status explorer

## session-lens

- `<leader>ls` -> list sessions

### inside session picker

- `<CR>` -> source session
- `<C-d>` -> delete session

## goto-preview

- `gpd` -> preview definition
- `gpt` -> preview type definition
- `gpi` -> preview implementation
- `gpD` -> preview declaration
- `gP` -> close all windows
- `gpr` -> preview references

## gitsigns

- `<leader>gph` -> preview git hunk
- `<leader>gtb` -> toggle current line blame

## diffview

- `<leader>do` -> open Diffview
- `<leader>dc` -> close Diffview
- `<leader>df` -> toggle files panel
- `<leader>dF` -> focus files panel
- `]d` -> select next entry
- `[d` -> select previous entry
- `<leader>dn` -> focus next panel
- `<leader>dp` -> focus previous panel
- `<leader>dt` -> open entry in new tab
- `<leader>dr` -> refresh files
- `<leader>dh` -> file history (cwd)
- `<leader>dH` -> file history (current buffer)
- `<leader>ds` -> toggle stage entry
- `<leader>dX` -> collapse all folds
- `<leader>dE` -> expand all folds

## grapple

- `<leader>n/p` -> cycle tags
- `<leader>M` -> toggle
- `<leader>m` -> list tags
- `<leader>ft` -> find tags

### tags window

- `<CR>` -> select tag
- `|` -> select tag in vertical split
- `<C-s>` -> select tag in horizontal split
- `1-9` -> quick select by ID
- `R` -> rename

## nerdy

- `:Nerdy` -> search nerd font glyphs

## neogit

- `<leader>ge` -> git explorer

## comment

- NORMAL mode
  `gcc` -> Toggles the current line using linewise comment
  `gbc` -> Toggles the current line using blockwise comment
  `[count]gcc` -> Toggles the number of line given as a prefix-count using linewise
  `[count]gbc` -> Toggles the number of line given as a prefix-count using blockwise
  `gc[count]{motion}` -> (Op-pending) Toggles the region using linewise comment
  `gb[count]{motion}` -> (Op-pending) Toggles the region using blockwise comment
- VISUAL mode
  `gc` -> Toggles the region using linewise comment
  `gb` -> Toggles the region using blockwise comment

### extra mappings

These mappings are enabled by default. (config: `mappings.extra`)

- NORMAL mode
  `gco` -> Insert comment to the next line and enters INSERT mode
  `gcO` -> Insert comment to the previous line and enters INSERT mode
  `gcA` -> Insert comment to end of the current line and enters INSERT mode

### examples

#### linewise

`gcw` -> Toggle from the current cursor position to the next word
`gc$` -> Toggle from the current cursor position to the end of line
`gc}` -> Toggle until the next blank line
`gc5j` -> Toggle 5 lines after the current cursor position
`gc8k` -> Toggle 8 lines before the current cursor position
`gcip` -> Toggle inside of paragraph
`gca}` -> Toggle around curly brackets

#### blockwise

`gb2}` -> Toggle until the 2 next blank line
`gbaf` -> Toggle comment around a function (w/ LSP/treesitter support)
`gbac` -> Toggle comment around a class (w/ LSP/treesitter support)
