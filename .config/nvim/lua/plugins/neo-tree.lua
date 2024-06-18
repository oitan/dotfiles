return {
	"nvim-neo-tree/neo-tree.nvim",
	branch = "v3.x",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"nvim-tree/nvim-web-devicons",
		"MunifTanjim/nui.nvim",
	},
	config = function()
		local neo_tree = require("neo-tree")
		neo_tree.setup({
			auto_clean_after_session_restore = true,
			filesystem = {
				filtered_items = {
					visible = true,
					hide_dotfiles = false,
				},
				follow_current_file = { enabled = true },
			},
		})

		local neo_tree_command = require("neo-tree.command")

		local toggle_filesystem = function()
			neo_tree_command.execute({ toggle = true })
		end

		local show_git_status = function()
			neo_tree_command.execute({ position = "float", source = "git_status" })
		end

		vim.keymap.set("n", "<C-n>", toggle_filesystem, {})
		vim.keymap.set("n", "<leader>gs", show_git_status, {})
	end,
}
