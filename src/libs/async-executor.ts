"use strict";

import { lua, lauxlib, lualib, to_luastring, to_jsstring, lua_State } from 'fengari';
import { tojs, push, create_luaopen_js, tojsCompletely, pushjs } from './fengari-interop';

const LUA_OK = lua.LUA_OK;
const LUA_YIELD = lua.LUA_YIELD;


export type ResumeResult = { 
  done: boolean; 
  value?: unknown; 
  key?: string | undefined; 
  args?: unknown; 
  error?: Error;
}

export type ExecuteParams = {
  code: string;
  apiName: string;
  apiObject: Record<string, Function>;
  log?: (level: string, message: string) => void;
}

/**
 * Execute a Lua string and return a controller for the coroutine.
 * JavaScript controls execution by calling resume() with optional results.
 *
 * @param code - Lua source code (should define main() function)
 * @param api - Browser API object
 * @returns Object with resume() method to control execution
 */
export function executeAsync(params: ExecuteParams): {
  resume: (result?: unknown) => ResumeResult;
} {
  const { code, apiName, apiObject, log } = params;
  // Store api in closure for resume function
  const apiObj = apiObject;

  // Create a new Lua state for this execution
  const L = lauxlib.luaL_newstate();

  // Open standard libraries
  lualib.luaL_openlibs(L);

  // Open js interop library with our API
  const luaopen_js = create_luaopen_js({
    __print: (level: string, message: string) => {
      if (log) log(level, message);
    }
  });
  lauxlib.luaL_requiref(L, to_luastring("js") as unknown as string, luaopen_js, 1);
  lua.lua_pop(L, 1);

  // Wrap code to create coroutine
  const wrappedCode = wrapInCoroutine(code);

  // Load the wrapped code
  const loadResult = lauxlib.luaL_dostring(L, to_luastring(wrappedCode) as unknown as string);
  if (loadResult !== LUA_OK) {
    const luastr = lua.lua_tostring(L, -1);
    const err = luastr ? to_jsstring(luastr) : 'Load error';
    lua.lua_pop(L, 1);
    return {
      resume: () => {
        throw new Error(`Load error: ${err}`);
      }
    };
  }

  const co = lua.lua_newthread(L);

  // Get the main function from the global scope of the new thread
  const r = lua.lua_getglobal(co, 'main');
  if (r !== lua.LUA_TFUNCTION) {
    throw Error('Lua code must define a main() function');
  }

  // Return controller object
  return {
    /**
     * Resume the coroutine with optional result from async call.
     * @param result The result from JavaScript async function (or undefined for first resume)
     */
    resume: (result?: unknown): ResumeResult => {
      // Push result onto stack if provided
      if (result !== undefined) {
        push(co, result);
      }

      // Resume the coroutine
      const resumeStatus = lua.lua_resume(co, L, result !== undefined ? 1 : 0);

      if (resumeStatus === lua.LUA_YIELD) {
        // Coroutine yielded - extract key and args from stack
        const top = lua.lua_gettop(co);
        let key: string | undefined;
        let args: unknown;

        if (top >= 2) {
          key = tojs(co, -2) as string;
          args = tojs(co, -1);
          lua.lua_pop(co, 2);
        } else if (top === 1) {
          args = tojs(co, -1);
          lua.lua_pop(co, 1);
        }

        if (typeof key !== 'string') {
          return {
            done: true,
            error: new Error('Yielded key must be a string')
          };
        }

        return {
          done: false,
          key,
          args: tojsCompletely(args),
        };
      } else if (resumeStatus === lua.LUA_OK) {
        // Coroutine finished - get return value
        const top = lua.lua_gettop(co);
        const value = top > 0 ? tojs(co, 1) : undefined;
        if (top > 0) lua.lua_pop(co, 1);

        return {
          done: true,
          value: tojsCompletely(value)
        };
      } else if (resumeStatus === lua.LUA_ERRSYNTAX) {
        return {
          done: true,
          error: new SyntaxError(`Syntax error: ${to_jsstring(lua.lua_tostring(co, -1))}`)
        }
      } else if (resumeStatus === lua.LUA_ERRMEM) {
        return {
          done: true,
          error: new Error('Memory error')
        }
      }
      else if (resumeStatus === lua.LUA_ERRERR) {
        return {
          done: true,
          error: new Error(`Error during execution: ${to_jsstring(lua.lua_tostring(co, -1))}`)
        }
      }
      else if (resumeStatus === lua.LUA_ERRRUN) {
        return {
          done: true,
          error: new Error(`Runtime error: ${to_jsstring(lua.lua_tostring(co, -1))}`)
        };
      }
      else {
        // Error
        const err = tojs(co, -1);
        lua.lua_pop(co, 1);
        return {
          done: true,
          error: err instanceof Error ? err : new Error(String(err))
        };
      }
    }
  };
}

/**
 * 
 * @param code 
 * @param api 
 * @returns 
 */
export async function executeAsyncUntilDone(params: ExecuteParams): Promise<unknown> {
  const controller = executeAsync(params);
  let call_result: any = undefined;
  while (true) {
    const { done, value, key, args = [], error } = controller.resume(call_result);

    if (done) {
      // Execution finished
      if (error) {
        throw error;
      }
      // Final result
      return value; 
    }
    if (key) {
      const fn = params.apiObject[key];
      if (fn) { 
        call_result = await fn(args)
      }
    } else {
      throw new Error('Unexpected yield')
    }
  }
}

/**
 * Wrap user script to return a coroutine for external control.
 */
function wrapInCoroutine(code: string): string {
  return `${code}

function yield_call(key, args)
  return coroutine.yield(key, args)
end

log = {
  info = function(msg) __print("INFO", msg) end,
  warn = function(msg) __print("WARN", msg) end,
  error = function(msg) __print("ERROR", msg) end,
  debug = function(msg) __print("DEBUG", msg) end,
}

`;
}

// Re-export for convenience
export { tojs, push };