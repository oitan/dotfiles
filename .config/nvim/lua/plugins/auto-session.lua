return {
	"rmagatti/auto-session",
	config = function()
		local auto_session = require("auto-session")

		auto_session.setup({
			pre_save_cmds = { "tabdo Neotree close" },
			post_restore_cmds = { "Neotree" },
			session_lens = {},
		})

		vim.keymap.set("n", "<leader>ls", "<cmd>AutoSession search<CR>", { noremap = true, desc = "search sessions" })
	end,
}
