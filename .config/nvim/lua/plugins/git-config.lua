return {
	{
		"lewis6991/gitsigns.nvim",
		config = function()
			local gitsigns = require("gitsigns")
			gitsigns.setup({})

			vim.keymap.set("n", "<leader>gph", gitsigns.preview_hunk, { desc = "preview hunk" })
			vim.keymap.set("n", "<leader>gtb", gitsigns.toggle_current_line_blame, { desc = "toggle git blame" })
		end,
	},
	{
		"sindrets/diffview.nvim",
		dependencies = { "nvim-lua/plenary.nvim" },
		config = function()
			local diffview = require("diffview")
			local actions = require("diffview.actions")
			local lib = require("diffview.lib")

			local function with_view(fn)
				return function()
					local view = lib.get_current_view()
					if view then
						fn()
					else
						vim.notify("Diffview is not active", vim.log.levels.WARN)
					end
				end
			end

			diffview.setup({
				enhanced_diff_hl = true,
				use_icons = true,
				signs = {
					fold_closed = "",
					fold_open = "",
				},
				view = {
					default = { layout = "diff2_horizontal" },
					merge_tool = { layout = "diff3_mixed", disable_diagnostics = true },
					file_history = { layout = "diff2_horizontal" },
				},
				file_panel = {
					listing_style = "tree",
					win_config = { position = "left", width = 35 },
				},
				file_history_panel = {
					win_config = { position = "bottom", height = 16 },
				},
				hooks = {
					view_opened = function()
						pcall(actions.focus_files)
					end,
				},
			})

			vim.keymap.set("n", "<leader>do", function()
				diffview.open({})
			end, { desc = "Diffview: Open" })
			vim.keymap.set("n", "<leader>dc", function()
				diffview.close()
			end, { desc = "Diffview: Close" })

			vim.keymap.set(
				"n",
				"<leader>df",
				with_view(function()
					actions.toggle_files()
				end),
				{ desc = "Diffview: Toggle Files Panel" }
			)
			vim.keymap.set(
				"n",
				"<leader>dr",
				with_view(function()
					actions.refresh_files()
				end),
				{ desc = "Diffview: Refresh Files" }
			)

			vim.keymap.set(
				"n",
				"]d",
				with_view(function()
					actions.select_next_entry()
				end),
				{ desc = "Diffview: Next Entry" }
			)
			vim.keymap.set(
				"n",
				"[d",
				with_view(function()
					actions.select_prev_entry()
				end),
				{ desc = "Diffview: Previous Entry" }
			)

			vim.keymap.set(
				"n",
				"<leader>dF",
				with_view(function()
					actions.focus_files()
				end),
				{ desc = "Diffview: Focus Files Panel" }
			)
			vim.keymap.set(
				"n",
				"<leader>dp",
				with_view(function()
					actions.focus_prev_entry()
				end),
				{ desc = "Diffview: Focus Previous Panel" }
			)
			vim.keymap.set(
				"n",
				"<leader>dn",
				with_view(function()
					actions.focus_next_entry()
				end),
				{ desc = "Diffview: Focus Next Panel" }
			)

			vim.keymap.set(
				"n",
				"<leader>dt",
				with_view(function()
					actions.open_in_new_tab()
				end),
				{ desc = "Diffview: Open Entry In New Tab" }
			)

			vim.keymap.set("n", "<leader>dh", function()
				diffview.file_history()
			end, { desc = "Diffview: File History (cwd)" })
			vim.keymap.set("n", "<leader>dH", function()
				local file = vim.fn.expand("%")
				if file == "" then
					vim.notify("No file in current buffer for history", vim.log.levels.WARN)
					return
				end
				diffview.file_history({ paths = { file } })
			end, { desc = "Diffview: File History (current file)" })

			vim.keymap.set(
				"n",
				"<leader>ds",
				with_view(function()
					actions.toggle_stage_entry()
				end),
				{ desc = "Diffview: Toggle Stage Entry" }
			)

			vim.keymap.set(
				"n",
				"<leader>dX",
				with_view(function()
					actions.collapse_all_folds()
				end),
				{ desc = "Diffview: Collapse All Folds" }
			)
			vim.keymap.set(
				"n",
				"<leader>dE",
				with_view(function()
					actions.expand_all_folds()
				end),
				{ desc = "Diffview: Expand All Folds" }
			)

			-- Example of your style:
			-- vim.keymap.set("n", "<leader>ge", toggle_filesystem, { desc = "open git explorer" })
		end,
	},
	{
		"NeogitOrg/neogit",
		dependencies = {
			"nvim-lua/plenary.nvim",
			"sindrets/diffview.nvim",
			"nvim-telescope/telescope.nvim",
		},
		config = function()
			local neogit = require("neogit")

			neogit.setup()

			local toggle_filesystem = function()
				neogit.open({ kind = "floating" })
			end

			vim.keymap.set("n", "<leader>ge", toggle_filesystem, { desc = "open git explorer" })
		end,
	},
}
