return {
	"rmagatti/alternate-toggler",
	config = function()
		local alternate_toggler = require("alternate-toggler")
		alternate_toggler.setup({
			alternates = {
				["=="] = "!=",
			},
		})

		vim.keymap.set("n", "<leader>ta", alternate_toggler.toggleAlternate, { desc = "toggle alternate" })
	end,
	event = { "BufReadPost" },
}
