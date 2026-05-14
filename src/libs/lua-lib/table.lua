function ttools(tbl)
  return {
    data = tbl,
    map = function(self, func)
      local result = {}
      for i, v in ipairs(self.data) do
        result[i] = func(v, i)
      end
      self.data = result
      return self
    end,
    filter = function(self, func)
      local result = {}
      for i, v in ipairs(self.data) do
        if func(v, i) then
          table.insert(result, v)
        end
      end
      self.data = result
      return self
    end,
    value = function(self)
      return self.data
    end
  }
end
