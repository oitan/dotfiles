return {
	{
		"nvim-telescope/telescope.nvim",
		tag = "0.1.8",
		dependencies = {
			"nvim-lua/plenary.nvim",
			{
				"nvim-telescope/telescope-fzf-native.nvim",
				build = "make",
				cond = function()
					return vim.fn.executable("make") == 1
				end,
			},
		},

		config = function()
			local telescope = require("telescope")
			local telescope_config = require("telescope.config")
			local actions = require("telescope.actions")
			local grapple = telescope.load_extension("grapple")

			-- Clone the default Telescope configuration
			local vimgrep_arguments = { unpack(telescope_config.values.vimgrep_arguments) }

			-- Keep hidden files out by default; expose via a separate mapping.
			-- I don't want to search in the `.git` directory.
			table.insert(vimgrep_arguments, "--glob")
			table.insert(vimgrep_arguments, "!**/.git/*")

			-- I want to follow symbolic links
			table.insert(vimgrep_arguments, "-L")

			telescope.setup({
				defaults = {
					-- Keep default visibility for pickers; control per-mapping instead.
					vimgrep_arguments = vimgrep_arguments,
					mappings = {
						i = {
							["<C-q>"] = function(prompt_bufnr)
								actions.smart_send_to_qflist(prompt_bufnr)
								actions.open_qflist(prompt_bufnr)
							end,
						},
						n = {
							["<C-q>"] = function(prompt_bufnr)
								actions.smart_send_to_qflist(prompt_bufnr)
								actions.open_qflist(prompt_bufnr)
							end,
						},
					},
				},
				pickers = {},
				extensions = {
					fzf = {
						fuzzy = true,
						override_generic_sorter = true,
						override_file_sorter = true,
						case_mode = "smart_case",
					},
				},
			})

			local builtin = require("telescope.builtin")
			-- Normal search: respect .gitignore, no dotfiles
			vim.keymap.set("n", "<C-p>", function()
				builtin.find_files({ hidden = false, no_ignore = false })
			end, { desc = "find files" })
			-- Hidden search: include dotfiles, ignore VCS ignores; exclude .git, node_modules, dist
			vim.keymap.set("n", "<leader>fh", function()
				builtin.find_files({
					hidden = true,
					no_ignore = true,
					no_ignore_parent = true,
					file_ignore_patterns = { "%.git/", "node_modules/", "dist/", "%.yarn/", "%.adminjs/" },
					follow = true,
				})
			end, { desc = "find files (hidden)" })
			-- Normal grep: respect .gitignore, no dotfiles
			vim.keymap.set("n", "<leader>fg", function()
				builtin.live_grep({})
			end, { desc = "live grep" })
			-- Hidden grep: include dotfiles, ignore VCS ignores; exclude .git, node_modules, dist
			vim.keymap.set("n", "<leader>fG", function()
				builtin.live_grep({
					-- additional_args must be a function returning a list
					-- Use --glob with a separate value (or combined with =)
					additional_args = function()
						return {
							"--hidden",
							"--no-ignore-vcs",
							"--glob", "!**/node_modules/**",
							"--glob", "!**/dist/**",
							"--glob", "!**/.yarn/**",
							"--glob", "!**/.adminjs/**",
						}
					end,
				})
			end, { desc = "live grep (hidden)" })
			vim.keymap.set("n", "<leader>ft", grapple.tags, { desc = "find grapple tags" })

			-- Load extensions
			telescope.load_extension("fzf")
		end,
	},
	{
		"nvim-telescope/telescope-ui-select.nvim",
		config = function()
			local telescope = require("telescope")
			telescope.setup({
				extensions = {
					["ui-select"] = {
						require("telescope.themes").get_dropdown({}),
					},
				},
			})

			telescope.load_extension("ui-select")
		end,
	},
}
