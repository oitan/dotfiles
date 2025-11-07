return {
	"johnseth97/codex.nvim",
	event = "VeryLazy",
	dependencies = { "nvim-lua/plenary.nvim" },
	opts = {
		keymaps = {
			toggle = "<leader>cc",
			quit = "<C-q>",
		},
	},
}
