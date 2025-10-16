return {
	"dmmulroy/tsc.nvim",
	dependencies = {
		"rcarriga/nvim-notify",
		"folke/trouble.nvim",
	},
	config = function()
		local notify = require("notify")

		vim.notify = function(message, level, opts)
			return notify(message, level, opts) -- <-- Important to return the value from `nvim-notify`
		end

		local tsc = require("tsc")
		tsc.setup({
			use_trouble_qflist = true,
		})
	end,
}
