return {
	"rmagatti/goto-preview",
	dependencies = { "rmagatti/logger.nvim" },
	config = function()
		local goto_preview = require("goto-preview")
		goto_preview.setup({
			references = {
				provider = "telescope",
				telescope = require("telescope.themes").get_dropdown({ hide_preview = false }),
			},
		})

		vim.keymap.set("n", "gpd", goto_preview.goto_preview_definition, { desc = "preview definition" })
		vim.keymap.set("n", "gpt", goto_preview.goto_preview_type_definition, { desc = "preview type definition" })
		vim.keymap.set("n", "gpi", goto_preview.goto_preview_implementation, { desc = "preview implementation" })
		vim.keymap.set("n", "gpD", goto_preview.goto_preview_declaration, { desc = "preview declaration" })
		vim.keymap.set("n", "gP", goto_preview.close_all_win, { desc = "close all preview windows" })
		vim.keymap.set("n", "gpr", goto_preview.goto_preview_references, { desc = "preview references" })
	end,
}
