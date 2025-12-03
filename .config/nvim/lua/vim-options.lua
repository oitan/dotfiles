vim.g.mapleader = " "
vim.o.sessionoptions = "blank,buffers,curdir,folds,help,tabpages,winsize,winpos,terminal,localoptions"

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

-- system clipboard
vim.keymap.set("v", "<leader>y", '"+y', { desc = "yank selection to system clipboard" })
vim.keymap.set("n", "<leader>Y", '"+yg_', { desc = "yank to system clipboard until line end" })
vim.keymap.set("n", "<leader>y", '"+y', { desc = "yank to system clipboard" })
vim.keymap.set("n", "<leader>yy", '"+yy', { desc = "yank line to system clipboard" })
vim.keymap.set("n", "<leader>p", '"+p', { desc = "paste after from system clipboard" })
vim.keymap.set("n", "<leader>P", '"+P', { desc = "paste before from system clipboard" })
vim.keymap.set("v", "<leader>p", '"+p', { desc = "paste after from system clipboard" })
vim.keymap.set("v", "<leader>P", '"+P', { desc = "paste before from system clipboard" })

-- blocks
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = "move block down" })
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = "move block up" })
vim.keymap.set("v", "<", "<gv", { desc = "indent block left" })
vim.keymap.set("v", ">", ">gv", { desc = "indent block right" })

-- windows
vim.keymap.set("n", "<C-Up>", ":resize -2<CR>", { desc = "resize split up" })
vim.keymap.set("n", "<C-Down>", ":resize +2<CR>", { desc = "resize split down" })
vim.keymap.set("n", "<C-Left>", ":vertical resize -2<CR>", { desc = "resize split left" })
vim.keymap.set("n", "<C-Right>", ":vertical resize +2<CR>", { desc = "resize split right" })

-- terminal
vim.keymap.set("t", "<C-Up>", ":resize -2<CR>", { desc = "resize split up" })
vim.keymap.set("t", "<C-Down>", ":resize +2<CR>", { desc = "resize split down" })
vim.keymap.set("t", "<C-Left>", ":vertical resize -2<CR>", { desc = "resize split left" })
vim.keymap.set("t", "<C-Right>", ":vertical resize +2<CR>", { desc = "resize split right" })

-- navigation
vim.keymap.set("n", "<C-h>", "<C-w>h", { desc = "jump to split on the left" })
vim.keymap.set("n", "<C-j>", "<C-w>j", { desc = "jump to split on the bottom" })
vim.keymap.set("n", "<C-k>", "<C-w>k", { desc = "jump to split on the top" })
vim.keymap.set("n", "<C-l>", "<C-w>l", { desc = "jump to split on the right" })

-- colors and search
vim.opt.termguicolors = true
vim.opt.ignorecase = true
vim.opt.smartcase = true

-- clear search highlight
vim.keymap.set("n", "<leader>h", ":nohlsearch<CR>", { desc = "clear search highlight" })

-- notifications
vim.keymap.set("n", "<leader>nd", function()
	local ok, notify = pcall(require, "notify")
	if ok then
		notify.dismiss({ silent = true, pending = true })
	end
end, { desc = "dismiss notifications" })

-- cheat sheet (floating window)
vim.keymap.set("n", "<leader>?", function()
	require("cheatsheet").open()
end, { desc = "open cheat sheet" })
vim.keymap.set("v", "<leader>?", function()
	require("cheatsheet").open()
end, { desc = "open cheat sheet" })
