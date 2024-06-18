return {
	{
		"nvim-telescope/telescope.nvim",
		tag = "0.1.6",
		dependencies = { "nvim-lua/plenary.nvim" },

		config = function()
			local telescope = require("telescope")
			local telescope_config = require("telescope.config")

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
					preview = {
						mime_hook = function(filepath, bufnr, opts)
							local is_image = function(filepath_to_check)
								local image_extensions = { "png", "jpg", "jpeg", "gif" } -- Supported image formats
								local split_path = vim.split(filepath_to_check:lower(), ".", { plain = true })
								local extension = split_path[#split_path]
								return vim.tbl_contains(image_extensions, extension)
							end
							if is_image(filepath) then
								local term = vim.api.nvim_open_term(bufnr, {})
								local function send_output(_, data, _)
									for _, d in ipairs(data) do
										vim.api.nvim_chan_send(term, d .. "\r\n")
									end
								end
								vim.fn.jobstart({
									"catimg",
									filepath, -- Terminal image viewer command
								}, { on_stdout = send_output, stdout_buffered = true, pty = true })
							else
								require("telescope.previewers.utils").set_preview_message(
									bufnr,
									opts.winid,
									"Binary cannot be previewed"
								)
							end
						end,
					},
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
			vim.keymap.set("n", "<C-p>", builtin.find_files, {})
			vim.keymap.set("n", "<leader>fg", builtin.live_grep, {})
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
