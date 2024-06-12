return {
	"rmagatti/auto-session",
	config = function()
		require("auto-session").setup({
			pre_save_cmds = { "tabdo Neotree close" },
			post_restore_cmds = { "Neotree" },
		})
	end,
}
