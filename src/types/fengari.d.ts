declare module 'fengari' {
  // Lua state type - pointer to Lua VM state
  // In Fengari, this is an opaque pointer used for all Lua C API calls
  export type lua_State = unknown;

  // lua constants - status codes returned by Lua VM
  export const lua: {
    // ========== Status code constants ==========
    // Lua operation completed successfully
    LUA_OK: number;
    // Lua coroutine yield (yield execution control)
    LUA_YIELD: number;
    // Runtime error
    LUA_ERRRUN: number;
    // Syntax error
    LUA_ERRSYNTAX: number;
    // Memory allocation error
    LUA_ERRMEM: number;
    // Runtime error (for luaL_error)
    LUA_ERRERR: number;
    // File error
    LUA_ERRFILE: number;
    // Multiple return value marker (indicates return all variadic parameters)
    LUA_MULTRET: number;

    // ========== Registry indices ==========
    // Registry is a special Lua table for C code to store data
    // Negative indices are calculated from the top of the stack
    LUA_REGISTRYINDEX: number;
    // Main thread index in registry
    LUA_RIDX_MAINTHREAD: number;

    // ========== Lua type constants (lua_type return values) ==========
    LUA_TBOOLEAN: number;          // boolean type
    LUA_TFUNCTION: number;        // function type (C function or Lua function)
    LUA_TLIGHTUSERDATA: number;   // light userdata (pointer)
    LUA_TNIL: number;             // nil value
    LUA_TNONE: number;            // invalid index (lighter than any type)
    LUA_TNUMBER: number;          // number type
    LUA_TSTRING: number;          // string type
    LUA_TTABLE: number;           // table (associative array)
    LUA_TTHREAD: number;          // coroutine/thread
    LUA_TUSERDATA: number;        // userdata (pointer with metatable)

    // ========== Stack operations ==========
    // Get stack top index (i.e., number of elements on stack)
    lua_gettop(L: lua_State): number;
    // Set stack top (can be positive or negative)
    lua_settop(L: lua_State, idx: number): void;
    // Pop n elements
    lua_pop(L: lua_State, n: number): void;
    // Copy value at index idx to top of stack
    lua_pushvalue(L: lua_State, idx: number): void;
    // Rotate stack elements (positive = clockwise, negative = counterclockwise)
    lua_rotate(L: lua_State, idx: number, n: number): void;
    // Remove element at index idx from stack
    lua_remove(L: lua_State, idx: number): void;
    // Get type of value at index idx on stack
    lua_type(L: lua_State, idx: number): number;
    // Get type name string
    lua_typename(L: lua_State, t: number): string;

    // ========== Push elements to stack ==========
    // Push nil value
    lua_pushnil(L: lua_State): void;
    // Push number
    lua_pushnumber(L: lua_State, n: number): void;
    // Push boolean (non-zero = true, zero = false)
    lua_pushboolean(L: lua_State, b: number): void;
    // Push string (C string)
    lua_pushstring(L: lua_State, s: string): void;
    // Push string (literal)
    lua_pushliteral(L: lua_State, s: string): void;
    // Push C function
    // C function signature: receives lua_State, returns number of return values
    lua_pushcfunction(L: lua_State, f: (L: lua_State) => number): void;
    // Push integer
    lua_pushinteger(L: lua_State, n: number): void;
    // Push light userdata (pointer)
    lua_pushlightuserdata(L: lua_State, p: unknown): void;

    // ========== Create tables ==========
    lua_createtable(L: lua_State, n: number, k: number): void;

    // ========== Read values from stack ==========
    // Get value from global table
    lua_gettable(L: lua_State, idx: number): number;
    // Get field value from table/global space
    // Equivalent to push L[idx].k
    lua_getfield(L: lua_State, idx: number, k: string): number;
    // Get global variable
    lua_getglobal(L: lua_State, name: string): number;
    // Get raw value from table (raw get, does not call metamethods)
    // Get value at table[idx][n]
    lua_rawgeti(L: lua_State, idx: number, n: number): number;
    // Get raw value from table (via pointer key)
    lua_rawgetp(L: lua_State, idx: number, p: unknown): number;
    // Get stack top element count again (repeated definition)
    lua_rawseti(L: lua_State, idx: number, n: number): void;
    // Set raw value in table (via pointer key)
    lua_rawsetp(L: lua_State, idx: number, p: unknown): void;
    // Get metatable
    lua_gettop(L: lua_State): number;
    // Check if is table
    lua_istable(L: lua_State, idx: number): boolean;

    // ========== Set values on stack ==========
    // Set field in table/global space
    // Pops key and value, sets L[idx].key = value
    lua_settable(L: lua_State, idx: number): void;
    // Set field in table/global space (explicit key)
    lua_setfield(L: lua_State, idx: number, k: string): void;
    // Set global variable
    lua_setglobal(L: lua_State, s: string): void;
    // Set raw value in table (via pointer key)
    lua_rawsetp(L: lua_State, idx: number, p: unknown): void;

    // ========== Type conversion (from stack) ==========
    // Convert to boolean (non-zero = true, zero = false)
    lua_toboolean(L: lua_State, idx: number): number;
    // Convert to number
    lua_tonumber(L: lua_State, idx: number): number;
    // Convert to integer
    lua_tointeger(L: lua_State, idx: number): number;
    // Convert to Lua string (C style, null-terminated)
    // Returns Uint8Array (fengari specific), use to_jsstring to convert
    lua_tostring(L: lua_State, idx: number): Uint8Array | null;
    // Convert to userdata pointer
    lua_touserdata(L: lua_State, idx: number): unknown;
    // Convert to thread/coroutine
    lua_tothread(L: lua_State, idx: number): lua_State | null;
    // Check if is nil
    lua_isnil(L: lua_State, idx: number): number;
    // Check if is C function
    lua_iscfunction(L: lua_State, idx: number): number;
    // Check if is function
    lua_isfunction(L: lua_State, idx: number): number;
    // Check if is light userdata
    lua_islightuserdata(L: lua_State, idx: number): number;
    // Check if is table
    lua_istable(L: lua_State, idx: number): number;
    // Check if is thread/coroutine
    lua_isthread(L: lua_State, idx: number): number;
    // Check if is string
    lua_isstring(L: lua_State, idx: number): number;
    // Check if is number
    lua_isnumber(L: lua_State, idx: number): number;
    // Check if is boolean
    lua_isboolean(L: lua_State, idx: number): number;

    // ========== Call and execution ==========
    // Call function
    // nargs: number of arguments, nresults: number of return values (-1 means all)
    lua_call(L: lua_State, nargs: number, nresults: number): void;
    // Protected call (pcall)
    // errfunc=0 means no error handler function
    // Returns LUA_OK on success, other values indicate error
    lua_pcall(L: lua_State, nargs: number, nresults: number, errfunc: number): number;
    // Coroutine yield (yield execution control)
    // nresults: number of results to pass to resume
    lua_yield(L: lua_State, nresults: number): number;
    // Resume coroutine execution
    // from=null means resume from main thread
    // nresults: number of arguments from yield
    // Returns LUA_OK (completed) or LUA_YIELD (yield again)
    lua_resume(L: lua_State, from: lua_State | null, nresults: number): number;

    // Create new thread/coroutine
    lua_newthread(L: lua_State): lua_State;

    // ========== Fengari-specific functions ==========
    // Convert Lua value to JS string
    lua_tojsstring(L: lua_State, idx: number): string;
    // Convert Lua value to JS proxy object
    lua_toproxy(L: lua_State, idx: number): (L: lua_State) => void;
    // Check if is JS proxy object
    lua_isproxy(L: lua_State, value: unknown): boolean;
    // Set native error handler
    lua_atnativeerror(L: lua_State, f: (L: lua_State) => number): void;
    // Allocate new userdata block
    lua_newuserdata(L: lua_State): unknown;
  };

  export const lauxlib: {
    // ========== State management ==========
    // Create new Lua state (VM instance)
    luaL_newstate(): lua_State;
    // Open all standard libraries (base, table, string, math, io, os, debug, package)
    luaL_openlibs(L: lua_State): void;

    // ========== Load and compile ==========
    // Load Lua code string
    // Returns LUA_OK on success, LUA_ERRSYNTAX on syntax error, other error codes on other errors
    luaL_loadstring(L: lua_State, s: string): number;
    // Execute Lua code string (equivalent to load + pcall)
    luaL_dostring(L: lua_State, s: string): number;
    // Load Lua code from buffer
    luaL_loadbuffer(L: lua_State, s: string, sz: number, name: string): number;
    // Read string argument (index n)
    luaL_checkstring(L: lua_State, n: number): Uint8Array;
    // Read number argument
    luaL_checknumber(L: lua_State, n: number): number;
    // Read integer argument
    luaL_checkinteger(L: lua_State, n: number): number;
    // Read any type argument (throws error if not specified type)
    luaL_checkany(L: lua_State, n: number): void;
    // Read option argument (for luaL_checkoption)
    luaL_checkoption(L: lua_State, n: number, def: string, list: string[]): number;
    // Ensure enough stack space
    luaL_checkstack(L: lua_State, n: number, msg: string | null): void;
    // Check if userdata is of specified type
    luaL_checkudata(L: lua_State, n: number, tname: string): unknown;
    // Argument error (triggers Lua error)
    luaL_argerror(L: lua_State, n: number, msg: string): number;
    // Generate error (functions using luaL_error should return error code)
    luaL_error(L: lua_State, msg: string): number;
    // Get metatable field
    // If object has metatable and metatable has field e, return 1 and push value, otherwise return 0
    luaL_getmetafield(L: lua_State, obj: number, e: string): number;

    // ========== Table/module utilities ==========
    // Create a new table and register as module (for luaL_newlib)
    luaL_newlib(L: lua_State, l: Record<string, (L: lua_State) => number>): void;
    // Create new metatable
    // Returns 1 on success, 0 if table already exists
    luaL_newmetatable(L: lua_State, tname: string): number;
    // Load module (requiref)
    // glb=1 means also set as global variable
    luaL_requiref(L: lua_State, modname: string, fn: (L: lua_State) => number, glb: number): void;
    // Register a group of C functions (for library definition)
    luaL_setfuncs(L: lua_State, l: Record<string, (L: lua_State) => number>, nup: number): void;
    // Set metatable
    luaL_setmetatable(L: lua_State, tname: string): void;
    // Test userdata type (non-error version)
    luaL_testudata(L: lua_State, n: number, tname: string): unknown;
    // Get string representation of object
    luaL_tolstring(L: lua_State, idx: number): Uint8Array;


    luaL_traceback(L: lua_State, L1: lua_State, msg: string | null, level: number): void;
  };

  export const lualib: {
    // Open all standard libraries
    luaL_openlibs(L: lua_State): void;
    // Open base library (print, error, pairs, etc.)
    luaopen_base(L: lua_State): number;
    // Open math library
    luaopen_math(L: lua_State): number;
    // Open string library
    luaopen_string(L: lua_State): number;
    // Open table library
    luaopen_table(L: lua_State): number;
    // Open IO library
    luaopen_io(L: lua_State): number;
    // Open OS library
    luaopen_os(L: lua_State): number;
    // Open package library
    luaopen_package(L: lua_State): number;
    // Open debug library
    luaopen_debug(L: lua_State): number;
    // Open coroutine library
    luaopen_coroutine(L: lua_State): number;
  };

  // ========== Utility functions ==========
  // Convert JS string to Lua string (Uint8Array)
  // Lua internally uses UTF-8 encoded Uint8Array
  export function to_luastring(s: string): Uint8Array;
  // Convert Lua string (Uint8Array) to JS string
  export function to_jsstring(s: Uint8Array | null): string;
  // Convert Lua string to URI-encoded JS string
  export function to_uristring(s: Uint8Array | null): string;
  // Get Uint8Array of Lua string
  export function luastring_of(s: Uint8Array): Uint8Array;

  // ========== Version info ==========
  export const FENGARI_AUTHORS: string;
  export const FENGARI_COPYRIGHT: string;
  export const FENGARI_RELEASE: string;
  export const FENGARI_VERSION: string;
  export const FENGARI_VERSION_MAJOR: string;
  export const FENGARI_VERSION_MINOR: string;
  export const FENGARI_VERSION_NUM: number;
  export const FENGARI_VERSION_RELEASE: string;
}
