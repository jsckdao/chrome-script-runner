local __handle_msg = function(msg)
  if type(msg) == 'table' then
    return browser.stringifyJSON(msg)
  end
  return msg
end

log = {
  info = function(msg)
    js.__print("INFO", __handle_msg(msg))
  end,
  warn = function(msg)
    js.__print("WARN", __handle_msg(msg))
  end,
  error = function(msg)
    js.__print("ERROR", __handle_msg(msg))
  end,
  debug = function(msg)
    js.__print("DEBUG", __handle_msg(msg))
  end
}
