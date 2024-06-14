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
          "tsserver",
          "html",
          "cssls",
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
          "prettier",
          "stylua",
          "eslint_d",
        },
      })
    end,
  },
  {
    "neovim/nvim-lspconfig",
    config = function()
      local capabilities = require("cmp_nvim_lsp").default_capabilities()
      local lspconfig = require("lspconfig")
      --local lsp_format = require("lsp-format")

      local default_ls_config = {
        capabilities = capabilities,
        --on_attach = lsp_format.on_attach,
      }

      lspconfig.lua_ls.setup(default_ls_config)
      lspconfig.tsserver.setup(default_ls_config)
      lspconfig.html.setup(default_ls_config)
      lspconfig.cssls.setup(default_ls_config)

      vim.keymap.set("n", "K", vim.lsp.buf.hover, {})
      vim.keymap.set("n", "gd", vim.lsp.buf.definition, {})
      vim.keymap.set("n", "gr", vim.lsp.buf.references, {})
      vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, {})
      vim.keymap.set("n", "<leader>e", vim.diagnostic.open_float, {})
      vim.keymap.set("n", "<leader>cr", vim.lsp.buf.rename, {})
    end,
  },
  --[[{
		"lukas-reineke/lsp-format.nvim",
		config = function()
			local lsp_format = require("lsp-format")
			lsp_format.setup({ sync = false })
		end,
	},--]]
}
