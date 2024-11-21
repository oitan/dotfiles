return {
	{
		"lewis6991/gitsigns.nvim",
		config = function()
			local gitsigns = require("gitsigns")
			gitsigns.setup({})

			vim.keymap.set("n", "<leader>ph", gitsigns.preview_hunk, { desc = "preview hunk" })
			vim.keymap.set("n", "<leader>gtb", gitsigns.toggle_current_line_blame, { desc = "toggle git blame" })
		end,
	},
}
