return {
  {
    "lewis6991/gitsigns.nvim",
    config = function()
      local gitsigns = require("gitsigns")
      gitsigns.setup({})

      vim.keymap.set("n", "<leader>ph", gitsigns.preview_hunk, { desc = "preview hunk" })
      vim.keymap.set("n", "<leader>gtb", gitsigns.toggle_current_line_blame, { desc = "toggle git blame" })
    end,
  },
  {
    "NeogitOrg/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "sindrets/diffview.nvim",
      "nvim-telescope/telescope.nvim",
    },
    config = function()
      local neogit = require('neogit')

      neogit.setup()

      vim.keymap.set("n", "<leader>ge", neogit.open, { desc = "open git explorer" })
    end,
  },
}
