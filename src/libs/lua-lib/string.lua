function string:split(sep)
  local res = {}
  for v in string.gmatch(self, "[^" .. sep .. "]+") do
    table.insert(res, v)
  end
  return res
end

function string:trim()
  return string.gsub(self, "^%s+%s+$", "")
end
