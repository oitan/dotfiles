return {
  {
    "nvim-telescope/telescope.nvim",
    tag = "0.1.6",
    dependencies = { "nvim-lua/plenary.nvim" },

    config = function()
      local telescope = require("telescope")
      local telescope_config = require("telescope.config")
      local grapple = telescope.load_extension("grapple")

      -- Clone the default Telescope configuration
      local vimgrep_arguments = { unpack(telescope_config.values.vimgrep_arguments) }

      -- I want to search in hidden/dot files.
      table.insert(vimgrep_arguments, "--hidden")
      -- I don't want to search in the `.git` directory.
      table.insert(vimgrep_arguments, "--glob")
      table.insert(vimgrep_arguments, "!**/.git/*")

      -- I want to follow symbolic links
      table.insert(vimgrep_arguments, "-L")

      telescope.setup({
        defaults = {
          -- `hidden = true` is not supported in text grep commands.
          hidden = true,
          vimgrep_arguments = vimgrep_arguments,
        },
        pickers = {
          find_files = {
            -- `hidden = true` will still show the inside of `.git/` as it's not `.gitignore`d.
            find_command = { "rg", "--files", "--hidden", "--glob", "!**/.git/*", "-L" },
          },
          live_grep = {
            additional_args = function(_ts)
              return { "--hidden" }
            end,
          },
        },
      })

      local builtin = require("telescope.builtin")
      vim.keymap.set("n", "<C-p>", builtin.find_files, { desc = "find files" })
      vim.keymap.set("n", "<leader>fg", builtin.live_grep, { desc = "live grep" })
      vim.keymap.set("n", "<leader>ft", grapple.tags, { desc = "find grapple tags" })
    end,
  },
  {
    "nvim-telescope/telescope-ui-select.nvim",
    config = function()
      local telescope = require("telescope")
      telescope.setup({
        extensions = {
          ["ui-select"] = {
            require("telescope.themes").get_dropdown({}),
          },
        },
      })

      telescope.load_extension("ui-select")
    end,
  },
}
