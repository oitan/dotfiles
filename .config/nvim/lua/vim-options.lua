vim.g.mapleader = " "
vim.cmd("set expandtab")
vim.cmd("set tabstop=2")
vim.cmd("set softtabstop=2")
vim.cmd("set shiftwidth=2")
vim.cmd("set number relativenumber")
vim.cmd("set colorcolumn=81")

-- quickfix navigation
vim.keymap.set("n", "<leader>f,", ":cprev<CR>", { desc = "previous qf item" })
vim.keymap.set("n", "<leader>f.", ":cnext<CR>", { desc = "next qf item" })
vim.keymap.set("n", "<leader>fo", ":copen<CR>", { desc = "open qf list" })
vim.keymap.set("n", "<leader>fc", ":cclose<CR>", { desc = "clode qf list" })

vim.o.termguicolors = true
