local augroup = vim.api.nvim_create_augroup("LspFormatting", {})

return {
	"nvimtools/none-ls.nvim",
	dependencies = {
		"nvimtools/none-ls-extras.nvim",
	},
	config = function()
		local null_ls = require("null-ls")

		null_ls.setup({
			sources = {
				null_ls.builtins.formatting.stylua,
				null_ls.builtins.formatting.prettier,
				require("none-ls.diagnostics.eslint_d"),
			},
			on_attach = function(client, bufnr)
				if client.supports_method("textDocument/formatting") then
					vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
					vim.api.nvim_create_autocmd("BufWritePre", {
						group = augroup,
						buffer = bufnr,
						callback = function()
							vim.lsp.buf.format({
								async = false,
								bufnr = bufnr,
							})
						end,
					})
				end
			end,
		})

		vim.keymap.set("n", "<leader>fm", vim.lsp.buf.format, {})
	end,
}
