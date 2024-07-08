return {
	"rmagatti/auto-session",
	config = function()
		local auto_session = require("auto-session")
		local session_lens = require("auto-session.session-lens")

		auto_session.setup({
			pre_save_cmds = { "tabdo Neotree close" },
			post_restore_cmds = { "Neotree" },
			session_lens = {},
		})

		vim.keymap.set("n", "<leader>ls", session_lens.search_session, { noremap = true, desc = "search sessions" })
	end,
}
