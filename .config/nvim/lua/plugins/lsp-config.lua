return {
	{
		"williamboman/mason.nvim",
		config = function()
			require("mason").setup({
				ui = {
					icons = {
						package_installed = "✓",
						package_pending = "➜",
						package_uninstalled = "✗",
					},
				},
			})
		end,
	},
	{
		"williamboman/mason-lspconfig.nvim",
		config = function()
			require("mason-lspconfig").setup({
				ensure_installed = {
					"lua_ls",
					"ts_ls",
					"html",
					"cssls",
					"bashls",
					"prismals",
				},
			})
		end,
	},
	{
		"WhoIsSethDaniel/mason-tool-installer.nvim",
		config = function()
			local mason_tool_installer = require("mason-tool-installer")
			mason_tool_installer.setup({
				lazy = true,
				ensure_installed = {
					"prettierd",
					"stylua",
					"eslint_d",
					"lua_ls",
				},
			})
		end,
	},
	{

		"neovim/nvim-lspconfig",
		config = function()
			local telescope = require("telescope.builtin")
			local capabilities = require("cmp_nvim_lsp").default_capabilities()

			local function with_defaults(extra)
				return vim.tbl_deep_extend("force", { capabilities = capabilities }, extra or {})
			end

			local function file_diagnostics()
				telescope.diagnostics({ bufnr = 0 })
			end

			-- define/extend configs
			vim.lsp.config("lua_ls", with_defaults())
			vim.lsp.config(
				"ts_ls",
				with_defaults({
					on_attach = function(client, _)
						client.server_capabilities.documentFormattingProvider = false
					end,
				})
			)
			vim.lsp.config("html", with_defaults())
			vim.lsp.config("cssls", with_defaults())
			vim.lsp.config("bashls", with_defaults({ filetypes = { "zsh", "sh" } }))
			vim.lsp.config("prismals", with_defaults())

			-- enable configs (activates for their filetypes)
			vim.lsp.enable("lua_ls")
			vim.lsp.enable("ts_ls")
			vim.lsp.enable("html")
			vim.lsp.enable("cssls")
			vim.lsp.enable("bashls")
			vim.lsp.enable("prismals")

			-- keymaps
			vim.keymap.set("n", "K", vim.lsp.buf.hover, { desc = "see definition" })
			vim.keymap.set("n", "gd", vim.lsp.buf.definition, { desc = "go to definition" })
			vim.keymap.set("n", "gR", vim.lsp.buf.references, { desc = "see references" })
			vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "code actions" })
			vim.keymap.set("v", "<leader>ca", vim.lsp.buf.code_action, { desc = "code actions" })
			vim.keymap.set("x", "<leader>ca", vim.lsp.buf.code_action, { desc = "code actions" })
			vim.keymap.set("n", "<leader>e", vim.diagnostic.open_float, { desc = "diagnostics" })
			vim.keymap.set("n", "<leader>fd", file_diagnostics, { desc = "file diagnostics" })
			vim.keymap.set("n", "<leader>fD", telescope.diagnostics, { desc = "workspace diagnostics" })
			vim.keymap.set("n", "<leader>cr", vim.lsp.buf.rename, { desc = "rename" })
		end,
	},
}
