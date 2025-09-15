vim.g.mapleader = " "

-- indentation
vim.opt.expandtab = true
vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2

-- UI
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.colorcolumn = "81"

-- quickfix navigation
vim.keymap.set("n", "<leader>f,", ":cprev<CR>", { desc = "previous qf item" })
vim.keymap.set("n", "<leader>f.", ":cnext<CR>", { desc = "next qf item" })
vim.keymap.set("n", "<leader>fo", ":copen<CR>", { desc = "open qf list" })
vim.keymap.set("n", "<leader>fc", ":cclose<CR>", { desc = "close qf list" })

-- colors and search
vim.opt.termguicolors = true
vim.opt.ignorecase = true
vim.opt.smartcase = true
