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
					"gopls",
					"pyright",
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
					-- Go tooling
					"gopls",
					"goimports",
					"gofumpt",
					"golangci-lint",
					-- Python tooling
					"pyright",
					"ruff",
				},
			})
		end,
	},
	{

		"neovim/nvim-lspconfig",
		config = function()
			local telescope = require("telescope.builtin")
			local capabilities = require("cmp_nvim_lsp").default_capabilities()

			vim.lsp.handlers["textDocument/signatureHelp"] = vim.lsp.with(
				vim.lsp.handlers.signature_help,
				{ border = "rounded" }
			)

			local function with_defaults(extra)
				return vim.tbl_deep_extend("force", { capabilities = capabilities }, extra or {})
			end

			local function file_diagnostics()
				telescope.diagnostics({ bufnr = 0 })
			end

			local function has_signature_help(bufnr)
				for _, client in ipairs(vim.lsp.get_clients({ bufnr = bufnr })) do
					if client.server_capabilities and client.server_capabilities.signatureHelpProvider then
						return true
					end
				end
				return false
			end

			local signature_group = vim.api.nvim_create_augroup("LspSignatureHelp", { clear = true })
			vim.api.nvim_create_autocmd("LspAttach", {
				group = signature_group,
				callback = function(event)
					local bufnr = event.buf
					if vim.b[bufnr].signature_help_setup then
						return
					end
					if not has_signature_help(bufnr) then
						return
					end
					vim.b[bufnr].signature_help_setup = true

					vim.keymap.set("i", "<C-k>", vim.lsp.buf.signature_help, {
						buffer = bufnr,
						desc = "signature help",
					})

					vim.api.nvim_create_autocmd("CursorHoldI", {
						group = signature_group,
						buffer = bufnr,
						callback = function()
							if vim.fn.pumvisible() == 1 then
								return
							end
							vim.lsp.buf.signature_help()
						end,
					})
				end,
			})

			local function on_attach(client, _)
				if client.name == "ts_ls" or client.name == "gopls" then
					-- Use null-ls for formatting to keep consistency
					client.server_capabilities.documentFormattingProvider = false
				end
			end

			-- define/extend configs
			vim.lsp.config("lua_ls", with_defaults({ on_attach = on_attach }))
			vim.lsp.config("ts_ls", with_defaults({ on_attach = on_attach }))
			vim.lsp.config("html", with_defaults({ on_attach = on_attach }))
			vim.lsp.config("cssls", with_defaults({ on_attach = on_attach }))
			vim.lsp.config("bashls", with_defaults({ filetypes = { "zsh", "sh" }, on_attach = on_attach }))
			vim.lsp.config("prismals", with_defaults({ on_attach = on_attach }))
			vim.lsp.config("gopls", with_defaults({ on_attach = on_attach }))
			local python_path = require("plugins.helpers.python_path")
			vim.lsp.config("pyright", {
				on_attach = on_attach,
				on_init = function(client)
					local root = client.workspace_folders
							and client.workspace_folders[1]
							and client.workspace_folders[1].name
						or client.config.root_dir
						or vim.loop.cwd()

					client.config.settings = client.config.settings or {}
					client.config.settings.python = client.config.settings.python or {}
					client.config.settings.python.pythonPath = python_path.get(root)

					client.notify("workspace/didChangeConfiguration", {
						settings = client.config.settings,
					})
				end,
			})

			-- enable configs (activates for their filetypes)
			vim.lsp.enable("lua_ls")
			vim.lsp.enable("ts_ls")
			vim.lsp.enable("html")
			vim.lsp.enable("cssls")
			vim.lsp.enable("bashls")
			vim.lsp.enable("prismals")
			vim.lsp.enable("gopls")
			vim.lsp.enable("pyright")

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
