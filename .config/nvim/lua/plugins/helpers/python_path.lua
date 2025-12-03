local M = {}

function M.get(workspace)
	if vim.env.VIRTUAL_ENV and vim.env.VIRTUAL_ENV ~= "" then
		return vim.env.VIRTUAL_ENV .. "/bin/python"
	end

	local candidates = {
		workspace .. "/.venv/bin/python",
		workspace .. "/venv/bin/python",
	}

	for _, path in ipairs(candidates) do
		if vim.fn.executable(path) == 1 then
			return path
		end
	end

	return "python"
end

return M
