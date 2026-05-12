declare module 'fengari' {
  // Lua state type
  export type lua_State = unknown;

  // lua constants
  export const lua: {
    // Constants
    LUA_OK: number;
    LUA_YIELD: number;
    LUA_ERRRUN: number;
    LUA_ERRSYNTAX: number;
    LUA_ERRMEM: number;
    LUA_ERRERR: number;
    LUA_ERRFILE: number;
    LUA_MULTRET: number;
    LUA_REGISTRYINDEX: number;
    LUA_RIDX_MAINTHREAD: number;
    LUA_TBOOLEAN: number;
    LUA_TFUNCTION: number;
    LUA_TLIGHTUSERDATA: number;
    LUA_TNIL: number;
    LUA_TNONE: number;
    LUA_TNUMBER: number;
    LUA_TSTRING: number;
    LUA_TTABLE: number;
    LUA_TTHREAD: number;
    LUA_TUSERDATA: number;

    // State functions
    lua_gettop(L: lua_State): number;
    lua_settop(L: lua_State, idx: number): void;
    lua_pop(L: lua_State, n: number): void;
    lua_pushvalue(L: lua_State, idx: number): void;
    lua_rotate(L: lua_State, idx: number, n: number): void;
    lua_type(L: lua_State, idx: number): number;
    lua_typename(L: lua_State, t: number): string;

    // Push functions
    lua_pushnil(L: lua_State): void;
    lua_pushnumber(L: lua_State, n: number): void;
    lua_pushboolean(L: lua_State, b: number): void;
    lua_pushstring(L: lua_State, s: string): void;
    lua_pushliteral(L: lua_State, s: string): void;
    lua_pushcfunction(L: lua_State, f: (L: lua_State) => number): void;
    lua_pushinteger(L: lua_State, n: number): void;
    lua_pushlightuserdata(L: lua_State, p: unknown): void;

    // Get functions
    lua_gettable(L: lua_State, idx: number): number;
    lua_getfield(L: lua_State, idx: number, k: string): number;
    lua_rawgeti(L: lua_State, idx: number, n: number): number;
    lua_rawgetp(L: lua_State, idx: number, p: unknown): number;
    lua_gettop(L: lua_State): number;

    // Set functions
    lua_settable(L: lua_State, idx: number): void;
    lua_setfield(L: lua_State, idx: number, k: string): void;
    lua_setglobal(L: lua_State, s: string): void;
    lua_rawsetp(L: lua_State, idx: number, p: unknown): void;

    // Check functions
    lua_toboolean(L: lua_State, idx: number): number;
    lua_tonumber(L: lua_State, idx: number): number;
    lua_tointeger(L: lua_State, idx: number): number;
    lua_tostring(L: lua_State, idx: number): Uint8Array | null;
    lua_touserdata(L: lua_State, idx: number): unknown;
    lua_tothread(L: lua_State, idx: number): lua_State | null;
    lua_isnil(L: lua_State, idx: number): number;
    lua_iscfunction(L: lua_State, idx: number): number;
    lua_isfunction(L: lua_State, idx: number): number;
    lua_islightuserdata(L: lua_State, idx: number): number;
    lua_istable(L: lua_State, idx: number): number;
    lua_isthread(L: lua_State, idx: number): number;
    lua_isstring(L: lua_State, idx: number): number;
    lua_isnumber(L: lua_State, idx: number): number;
    lua_isboolean(L: lua_State, idx: number): number;

    // Call functions
    lua_call(L: lua_State, nargs: number, nresults: number): void;
    lua_pcall(L: lua_State, nargs: number, nresults: number, errfunc: number): number;

    // Fengari-specific functions
    lua_tojsstring(L: lua_State, idx: number): string;
    lua_toproxy(L: lua_State, idx: number): (L: lua_State) => void;
    lua_isproxy(L: lua_State, value: unknown): boolean;
    lua_atnativeerror(L: lua_State, f: (L: lua_State) => number): void;
    lua_newuserdata(L: lua_State): unknown;
  };

  export const lauxlib: {
    luaL_newstate(): lua_State;
    luaL_openlibs(L: lua_State): void;
    luaL_loadstring(L: lua_State, s: string): number;
    luaL_dostring(L: lua_State, s: string): number;
    luaL_loadbuffer(L: lua_State, s: string, sz: number, name: string): number;
    luaL_checkstring(L: lua_State, n: number): Uint8Array;
    luaL_checknumber(L: lua_State, n: number): number;
    luaL_checkinteger(L: lua_State, n: number): number;
    luaL_checkany(L: lua_State, n: number): void;
    luaL_checkoption(L: lua_State, n: number, def: string, list: string[]): number;
    luaL_checkstack(L: lua_State, n: number, msg: string | null): void;
    luaL_checkudata(L: lua_State, n: number, tname: string): unknown;
    luaL_argerror(L: lua_State, n: number, msg: string): number;
    luaL_error(L: lua_State, msg: string): number;
    luaL_getmetafield(L: lua_State, obj: number, e: string): number;
    luaL_newlib(L: lua_State, l: Record<string, (L: lua_State) => number>): void;
    luaL_newmetatable(L: lua_State, tname: string): number;
    luaL_requiref(L: lua_State, modname: string, fn: (L: lua_State) => number, glb: number): void;
    luaL_setfuncs(L: lua_State, l: Record<string, (L: lua_State) => number>, nup: number): void;
    luaL_setmetatable(L: lua_State, tname: string): void;
    luaL_testudata(L: lua_State, n: number, tname: string): unknown;
    luaL_tolstring(L: lua_State, idx: number): Uint8Array;
  };

  export const lualib: {
    luaL_openlibs(L: lua_State): void;
    luaopen_base(L: lua_State): number;
    luaopen_math(L: lua_State): number;
    luaopen_string(L: lua_State): number;
    luaopen_table(L: lua_State): number;
    luaopen_io(L: lua_State): number;
    luaopen_os(L: lua_State): number;
    luaopen_package(L: lua_State): number;
    luaopen_debug(L: lua_State): number;
    luaopen_coroutine(L: lua_State): number;
  };

  // Utility functions
  export function to_luastring(s: string): Uint8Array;
  export function to_jsstring(s: Uint8Array | null): string;
  export function to_uristring(s: Uint8Array | null): string;
  export function luastring_of(s: Uint8Array): Uint8Array;

  // Version info from fengari-web
  export const FENGARI_AUTHORS: string;
  export const FENGARI_COPYRIGHT: string;
  export const FENGARI_RELEASE: string;
  export const FENGARI_VERSION: string;
  export const FENGARI_VERSION_MAJOR: string;
  export const FENGARI_VERSION_MINOR: string;
  export const FENGARI_VERSION_NUM: number;
  export const FENGARI_VERSION_RELEASE: string;
}
