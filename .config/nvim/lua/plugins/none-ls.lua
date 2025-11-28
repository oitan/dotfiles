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
        null_ls.builtins.formatting.prettierd,
        -- Go
        null_ls.builtins.formatting.goimports,
        null_ls.builtins.formatting.gofumpt,
        null_ls.builtins.diagnostics.golangci_lint,
        -- Python
        null_ls.builtins.formatting.black,
        null_ls.builtins.formatting.isort,
        require("none-ls.diagnostics.ruff"),
        null_ls.builtins.diagnostics.mypy,
        require("none-ls.diagnostics.eslint_d"),
        require("none-ls.code_actions.eslint_d"),
        null_ls.builtins.code_actions.gitsigns,
        null_ls.builtins.code_actions.refactoring,
      },
      on_attach = function(_client, bufnr)
        require("lsp_signature").on_attach({}, bufnr)
      end,
    })

    vim.keymap.set("n", "<leader>fm", vim.lsp.buf.format, { desc = "format" })

    -- Restart prettierd on prettier config changes because of prettierd caching bug
    vim.api.nvim_create_autocmd({ "BufWritePost" }, {
      group = vim.api.nvim_create_augroup("RestartPrettierd", { clear = true }),
      pattern = "*prettier*",
      callback = function()
        vim.fn.system("prettierd restart")
      end,
    })
  end,
}
