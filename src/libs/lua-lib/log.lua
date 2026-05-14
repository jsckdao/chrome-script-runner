local __handle_msg = function(msg)
  if type(msg) == 'table' then
    return browser.stringifyJSON(msg)
  end
end

log = {
  info = function(msg)
    js.__print("INFO", msg)
  end,
  warn = function(msg)
    js.__print("WARN", msg)
  end,
  error = function(msg)
    js.__print("ERROR", msg)
  end,
  debug = function(msg)
    js.__print("DEBUG", msg)
  end
}
