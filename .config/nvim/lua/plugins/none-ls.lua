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
        require("none-ls.diagnostics.eslint"),
        require("none-ls.code_actions.eslint"),
        null_ls.builtins.code_actions.gitsigns,
        null_ls.builtins.code_actions.refactoring,
      },
      on_attach = function(_client, bufnr)
        require("lsp_signature").on_attach({}, bufnr)
      end,
    })

    vim.keymap.set("n", "<leader>fm", vim.lsp.buf.format, { desc = "format" })
  end,
}
