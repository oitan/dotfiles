return {
	"nvim-lualine/lualine.nvim",
	config = function()
		local lualine = require("lualine")

		lualine.setup({
			options = {
				theme = "catppuccin",
				component_separators = "",
				section_separators = { left = "", right = "" },
			},
			sections = {
				lualine_a = { { "mode", separator = { left = "" }, right_padding = 2 } },
				lualine_b = {
					{
						function()
							local grapple = require("grapple")
							return grapple.statusline({ icon = "󰛢" })
							-- return "󰛢[" .. grapple.name_or_index() .. "]"
						end,
						cond = function()
							return package.loaded["grapple"] and require("grapple").exists()
						end,
					},
				},
				lualine_c = {
					require("auto-session.lib").current_session_name,
					"%=",
					"filename",
				},
				lualine_z = {
					{ "location", separator = { right = "" }, left_padding = 2 },
				},
			},
			inactive_sections = {
				lualine_a = { "filename" },
				lualine_b = {},
				lualine_c = {},
				lualine_x = {},
				lualine_y = {},
				lualine_z = { "location" },
			},
		})
	end,
}
