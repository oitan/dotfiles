return {
	"rmagatti/goto-preview",
	config = function()
		local goto_preview = require("goto-preview")
		goto_preview.setup({})

		vim.keymap.set("n", "gpd", goto_preview.goto_preview_definition, {})
		vim.keymap.set("n", "gpt", goto_preview.goto_preview_type_definition, {})
		vim.keymap.set("n", "gpi", goto_preview.goto_preview_implementation, {})
		vim.keymap.set("n", "gpD", goto_preview.goto_preview_declaration, {})
		vim.keymap.set("n", "gP", goto_preview.close_all_win, {})
		vim.keymap.set("n", "gpr", goto_preview.goto_preview_references, {})
	end,
}
