vim.g.mapleader = " "
vim.cmd("set expandtab")
vim.cmd("set tabstop=2")
vim.cmd("set softtabstop=2")
vim.cmd("set shiftwidth=2")
vim.cmd("set number relativenumber")
vim.cmd("set colorcolumn=81")

-- quickfix navigation
vim.keymap.set("n", "<leader>f,", ":cprev<CR>", {})
vim.keymap.set("n", "<leader>f.", ":cnext<CR>", {})
vim.keymap.set("n", "<leader>fo", ":copen<CR>", {})
vim.keymap.set("n", "<leader>fc", ":cclose<CR>", {})

vim.o.termguicolors = true
