return {
	"nvim-treesitter/nvim-treesitter",
	branch = "main",
	lazy = false,
	build = ":TSUpdate",
	config = function()
		require("nvim-treesitter").install({
			"jsdoc",
			"python",
			"lua",
			"vim",
			"vimdoc",
			"bash",
			"markdown",
			"markdown_inline",
			"prisma",
			"typescript",
			"tsx",
			"javascript",
			"json",
			"yaml",
			"go",
		})
		vim.api.nvim_create_autocmd("FileType", {
			callback = function(args)
				local lang = vim.treesitter.language.get_lang(vim.bo[args.buf].filetype)
				if lang and pcall(vim.treesitter.start, args.buf, lang) then
					vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
				end
			end,
		})
	end,
}
