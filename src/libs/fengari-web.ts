"use strict";

import {
  FENGARI_AUTHORS,
  FENGARI_COPYRIGHT,
  FENGARI_RELEASE,
  FENGARI_VERSION,
  FENGARI_VERSION_MAJOR,
  FENGARI_VERSION_MINOR,
  FENGARI_VERSION_NUM,
  FENGARI_VERSION_RELEASE,

  lua,
  lauxlib,
  lualib,
  to_jsstring,
  to_luastring
} from 'fengari';

import { luaopen_js, push, tojs } from './fengari-interop';

const LUA_ERRSYNTAX = lua.LUA_ERRSYNTAX;
const LUA_OK = lua.LUA_OK;

// Lua state
const L = lauxlib.luaL_newstate();

/* open standard libraries */
lualib.luaL_openlibs(L);

/* open js interop library */
lauxlib.luaL_requiref(L, "js", luaopen_js, 1);
lua.lua_pop(L, 1); /* remove lib */

lua.lua_pushstring(L, FENGARI_COPYRIGHT);
lua.lua_setglobal(L, "_COPYRIGHT");

/**
 * Execute a Lua string using lua_pcall
 * Note: Requires a browser environment (or Node.js with proper fengari setup)
 * @param code - Lua source code string
 * @returns The result of execution
 */
export function doString(code: string): unknown {
  const luaCode = to_luastring(code);
  // fengari 的 luaL_loadstring 实际接受 Uint8Array (luastring)，类型声明有误
  const ok = lauxlib.luaL_loadstring(L, luaCode as unknown as string);

  if (ok === LUA_ERRSYNTAX) {
    const luastr = lua.lua_tostring(L, -1);
    const err = luastr ? to_jsstring(luastr) : 'Syntax error in Lua code';
    lua.lua_pop(L, 1);
    throw new SyntaxError(err);
  }

  if (ok !== LUA_OK) {
    const luastr = lua.lua_tostring(L, -1);
    const err = luastr ? to_jsstring(luastr) : 'Error loading Lua code';
    lua.lua_pop(L, 1);
    throw new Error(err);
  }

  // Use pcall to execute safely
  const status = lua.lua_pcall(L, 0, -1, 0);

  if (status === LUA_OK) {
    const top = lua.lua_gettop(L);
    if (top > 0) {
      const result = tojs(L, top);
      lua.lua_pop(L, 1);
      return result;
    }
    return undefined;
  } else {
    const err = tojs(L, -1);
    lua.lua_pop(L, 1);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Push a JS value to Lua stack
 */
export { push, tojs };

// Export metadata
export const version = {
  FENGARI_AUTHORS,
  FENGARI_COPYRIGHT,
  FENGARI_RELEASE,
  FENGARI_VERSION,
  FENGARI_VERSION_MAJOR,
  FENGARI_VERSION_MINOR,
  FENGARI_VERSION_NUM,
  FENGARI_VERSION_RELEASE,
};

// Export Lua state for advanced usage
export { L, lua, lauxlib, lualib };
