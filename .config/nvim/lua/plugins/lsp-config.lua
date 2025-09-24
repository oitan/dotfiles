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
      local capabilities = require("cmp_nvim_lsp").default_capabilities()
      local lspconfig = require("lspconfig")

      local function with_defaults(extra)
        return vim.tbl_deep_extend("force", { capabilities = capabilities }, extra or {})
      end

      lspconfig.lua_ls.setup(with_defaults())
      lspconfig.ts_ls.setup(with_defaults({
        on_attach = function(client, _bufnr)
          -- Disable ts_ls's formatter if you want to use prettierd
          client.server_capabilities.documentFormattingProvider = false
        end,
      }))
      lspconfig.html.setup(with_defaults())
      lspconfig.cssls.setup(with_defaults())
      lspconfig.bashls.setup(with_defaults({ filetypes = { "zsh", "sh" } }))
      lspconfig.prismals.setup(with_defaults())

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
