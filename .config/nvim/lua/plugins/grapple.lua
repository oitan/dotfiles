local select = function(grapple, index)
	return function()
		grapple.select({ index = index })
	end
end

local setSelectKeymaps = function(grapple)
	for i = 1, 9 do
		vim.keymap.set("n", "<leader>" .. i, select(grapple, i), { desc = "grapple select #" .. i })
	end
end

local cycle_tags = function(grapple, tag)
	return function()
		grapple.cycle_tags(tag)
	end
end

return {
	"cbochs/grapple.nvim",
	dependencies = {
		{ "nvim-tree/nvim-web-devicons", lazy = true },
	},
	config = function()
		local grapple = require("grapple")
		grapple.setup({ scope = "git_branch" })

		vim.keymap.set("n", "<leader>n", cycle_tags(grapple, "next"), { desc = "grapple select next" })
		vim.keymap.set("n", "<leader>p", cycle_tags(grapple, "prev"), { desc = "grapple select previous" })
		vim.keymap.set("n", "<leader>M", grapple.toggle, { desc = "toggle grapple tag" })
		vim.keymap.set("n", "<leader>m", grapple.toggle_tags, { desc = "see grapple tag" })

		setSelectKeymaps(grapple)
	end,
}
