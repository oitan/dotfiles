return {
	"s1n7ax/nvim-window-picker",
	name = "window-picker",
	event = "VeryLazy",
	version = "2.*",
	config = function()
		local picker = require("window-picker")

		picker.setup({
			hint = "statusline-winbar",
			show_prompt = false,
			highlights = {
				statusline = {
					focused = { fg = "#11111b", bg = "#f9e2af", bold = true },
					unfocused = { fg = "#11111b", bg = "#94e2d5", bold = true },
				},
				winbar = {
					focused = { fg = "#11111b", bg = "#f9e2af", bold = true },
					unfocused = { fg = "#11111b", bg = "#94e2d5", bold = true },
				},
			},
			picker_config = {
				statusline_winbar_picker = {
					use_winbar = "smart",
					selection_display = function(char, winid)
						local name = vim.api.nvim_buf_get_name(vim.api.nvim_win_get_buf(winid))
						local short = name ~= "" and vim.fn.fnamemodify(name, ":t") or "[No Name]"
						return string.format(" %s %s ", char, short)
					end,
				},
			},
			filter_rules = {
				include_current_win = false,
				bo = {
					filetype = { "neo-tree", "neo-tree-popup", "notify" },
					buftype = { "terminal", "quickfix" },
				},
			},
		})

		vim.keymap.set("n", "<leader>ww", function()
			local win = picker.pick_window()
			if win then
				vim.api.nvim_set_current_win(win)
			end
		end, { desc = "pick window and focus" })

		vim.keymap.set("n", "<leader>ws", function()
			local win = picker.pick_window()
			if win then
				vim.api.nvim_win_set_buf(win, vim.api.nvim_get_current_buf())
			end
		end, { desc = "pick window and send buffer" })
	end,
}
