# AGENTS.md

This repository is a Neovim configuration. Most files are Lua modules under `lua/`
and are loaded via lazy.nvim from `init.lua`.

## Build / Lint / Test Commands

No dedicated build or test scripts were found in this repo.
Use Neovim or the external formatters/linters configured via Mason/none-ls.

### Plugin install / update
- In Neovim: `:Lazy sync`
- Headless: `nvim --headless "+Lazy sync" +qa`

### Formatting (run in Neovim)
- Format current buffer: `<leader>fm` (maps to `vim.lsp.buf.format`)

### Formatting / linting tools configured via Mason/none-ls
These are configured in `lua/plugins/lsp-config.lua` and `lua/plugins/none-ls.lua`:
- Lua: `stylua`
- JS/TS/HTML/CSS/JSON/MD: `prettierd`, `eslint_d`
- Go: `goimports`, `gofumpt`, `golangci-lint`
- Python: `ruff`, `pyright`

If you need to run a formatter manually (examples, adjust paths as needed):
- Lua: `stylua lua` or `stylua lua/plugins/*.lua`
- Go: `gofumpt -w file.go` and `goimports -w file.go`
- JS/TS: `prettierd path/to/file.ts` or `eslint_d path/to/file.ts`
- Python: `ruff format path/to/file.py` and `ruff check path/to/file.py`

### Tests
- No test suite or test runner is present.
- Single-test runs are not applicable in this repo.

### Basic validation (manual)
- Launch Neovim to confirm config loads without errors.
- Run `:checkhealth` inside Neovim if troubleshooting.
- Use `:messages` to check for startup warnings.

## Code Style Guidelines

### General
- Match existing file style and indentation. Lua plugin files currently use tabs.
- Keep module files small and focused; split complex configs into helper modules.
- Prefer local variables and functions; avoid leaking globals.
- Use descriptive names; avoid abbreviations unless common (e.g., `lsp`).

### Imports / requires
- Require dependencies at the top of the `config` function or module.
- Prefer `local name = require("module")` and reuse it.
- For optional plugins, guard with `pcall(require, ...)` or feature checks.

### Formatting
- Keep tables and plugin specs aligned and readable.
- Use trailing commas in multi-line tables for cleaner diffs.
- Prefer one keymap per call for clarity and consistent `desc` strings.
- Favor function callbacks over command strings for keymaps.

### Lua patterns
- Keep `require(...)` calls near the top of each config block.
- Use small local helper functions for shared behavior.
- Prefer `vim.tbl_deep_extend` when merging options.
- Use `pcall` for optional features and plugins.

### Plugin specs
- Plugin modules return a table of specs: `return { ... }`.
- Use `config = function()` blocks for setup and keymaps.
- Add `dependencies = { ... }` instead of manual `require` ordering.
- Use `cond` or `enabled` when a plugin is optional.

### Naming
- Plugin spec files are lower-case with hyphens: `lua/plugins/name.lua`.
- Use `snake_case` for local variables and `PascalCase` only for types/modules.
- Keep keymap `desc` strings short and action-oriented.
- Keep function names verb-based when they perform actions.

### Types / diagnostics
- `.luarc.json` declares globals (`vim`, `describe`, `it`) and LuaJIT runtime.
- Keep new globals registered there if needed for diagnostics.

### Error handling / resilience
- Use `pcall` or `vim.fn.executable` for optional tooling or dependencies.
- Avoid hard failures in startup configs; prefer graceful no-ops.
- When calling external tools, check availability first if possible.

### Neovim-specific conventions
- Use `vim.opt`/`vim.o` for options; keep option changes centralized.
- Use `vim.keymap.set` with `desc` for all mappings.
- For LSP formatting, disable server formatting when null-ls handles it.
- Keep Mason tool lists in one place (`mason-tool-installer.nvim`).

### Autocmds
- Create autocmds via `vim.api.nvim_create_autocmd`.
- Always wrap autocmds in an augroup for easier cleanup.
- Keep patterns specific; avoid broad `*` when unnecessary.

### Keymaps
- Prefer mappings in normal/visual mode instead of command-mode strings.
- Avoid overriding standard motions unless the new behavior is clear.
- Keep mappings grouped by feature (LSP, telescope, UI, etc.).

### LSP / none-ls
- LSP servers are enabled via `vim.lsp.enable` in `lsp-config`.
- Use null-ls for formatting to keep output consistent.
- If adding a formatter, wire it into none-ls and Mason.

### External tools
- Check availability with `vim.fn.executable` where appropriate.
- Do not assume tool installation outside Mason.
- For tools with daemons (like prettierd), handle restarts if needed.

## Repo Structure Notes
- `init.lua` bootstraps lazy.nvim and loads plugins from `lua/plugins/`.
- `lua/plugins/` contains plugin specs and configuration blocks.
- `lua/vim-options.lua` contains editor options and keymaps.
- `lua/plugins/helpers/` holds small helper modules.

## Common entry points
- `lua/plugins/lsp-config.lua` for LSP setup and Mason tooling.
- `lua/plugins/none-ls.lua` for formatters, linters, and code actions.
- `lua/plugins/completions.lua` for completion and snippets.
- `lua/plugins/treesitter.lua` for syntax and highlighting.
- `lua/plugins/telescope.lua` for search and pickers.
- `lua/plugins/git-config.lua` for git-related integrations.

## Cursor / Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Working with this repo
- Prefer minimal, targeted edits; avoid reorganizing unrelated files.
- Keep comments succinct and only where they clarify non-obvious logic.
- Do not introduce new dependencies unless necessary.

## Typical edit workflow
- Update or add a plugin config file under `lua/plugins/`.
- Run `:Lazy sync` if plugins changed.
- Format the file via `<leader>fm` or run `stylua` manually.

## Scope of changes
- Keep changes localized to the feature being edited.
- Avoid refactoring or reorganizing unrelated plugin configs.
- Prefer extending existing modules over creating new ones.
- If adding a plugin, include a short comment explaining why.
- Do not remove plugins unless explicitly requested.

## Additional notes for agents
- This repo is configuration-first; behavior changes are user-facing.
- Watch for keymap conflicts and keep mappings consistent.
- Maintain the existing style of plugin specs (`return { ... }`).
- When adding tooling, update both Mason and none-ls as needed.
