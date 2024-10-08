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
          "bashls",
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
          "eslint",
        },
      })
    end,
  },
  {
    "neovim/nvim-lspconfig",
    config = function()
      local capabilities = require("cmp_nvim_lsp").default_capabilities()
      local lspconfig = require("lspconfig")

      local default_ls_config = {
        capabilities = capabilities,
      }

      lspconfig.lua_ls.setup(default_ls_config)
      lspconfig.tsserver.setup(default_ls_config)
      lspconfig.html.setup(default_ls_config)
      lspconfig.cssls.setup(default_ls_config)
      lspconfig.bashls.setup({ unpack(default_ls_config), filetypes = { "sh", "zsh" } })

      vim.keymap.set("n", "K", vim.lsp.buf.hover, { desc = "see definition" })
      vim.keymap.set("n", "gd", vim.lsp.buf.definition, { desc = "go to definition" })
      vim.keymap.set("n", "gr", vim.lsp.buf.references, { desc = "see references" })
      vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "code actions" })
      vim.keymap.set("v", "<leader>ca", vim.lsp.buf.code_action, { desc = "code actions" })
      vim.keymap.set("x", "<leader>ca", vim.lsp.buf.code_action, { desc = "code actions" })
      vim.keymap.set("n", "<leader>e", vim.diagnostic.open_float, { desc = "diagnostics" })
      vim.keymap.set("n", "<leader>cr", vim.lsp.buf.rename, { desc = "rename" })
    end,
  },
}
