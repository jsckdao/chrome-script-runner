-- 
function yield_call(key, args)
  return coroutine.yield(key, args)
end

browser = {}

for _, v in ipairs(js.__get_browser_api()) do
  browser[v] = function(...)
    return yield_call(v, {...})
  end
end
