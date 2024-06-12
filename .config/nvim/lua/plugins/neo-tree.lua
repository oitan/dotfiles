return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-tree/nvim-web-devicons",
    "MunifTanjim/nui.nvim",
  },
  config = function()
    require("neo-tree").setup({
      auto_clean_after_session_restore = true,
      filesystem = {
        filtered_items = {
          visible = true,
          hide_dotfiles = false,
        },
      },
    })
    vim.keymap.set("n", "<C-n>", ":Neotree filesystem reveal left<CR>")
    vim.keymap.set("n", "<C-m>", ":Neotree filesystem toggle left<CR>")
  end,
}
