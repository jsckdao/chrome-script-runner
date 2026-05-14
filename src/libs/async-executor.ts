import { lua, lauxlib, lualib, to_luastring, to_jsstring, lua_State } from 'fengari';
import { tojs, push, create_luaopen_js, tojsCompletely } from './fengari-interop';

import browserLuaCode from './lua-lib/browser.lua?raw';
import logLuaCode from './lua-lib/log.lua?raw';
import stringLuaCode from './lua-lib/string.lua?raw';
import tableLuaCode from './lua-lib/table.lua?raw';

const LUA_OK = lua.LUA_OK;


export type ResumeResult = {
  done: boolean;
  value?: unknown;
  key?: string | undefined;
  args?: any[];
  error?: Error;
}

export type ExecuteParams = {
  code: string;
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
  const { code, apiObject, log } = params;
  // Store api in closure for resume function
  const apiObj = apiObject;

  // Create a new Lua state for this execution
  const L = lauxlib.luaL_newstate();

  // Open standard libraries
  lualib.luaL_openlibs(L);

  // Open js interop library with our API
  const { luaopen_js, luaopen_cleanup } = create_luaopen_js({
    // This function will be called from Lua to print logs, forwarding to provided log function
    __print: (L: lua_State) => {
      const level = lua.lua_tojsstring(L, 1);
      const msg = lua.lua_tojsstring(L, 2);
      if (log) log(level, msg);
      push(L, null);
      return 1;
    },

    __get_browser_api: (L: lua_State) => {
      const apiKeys = Object.keys(apiObj);
      lua.lua_createtable(L, apiKeys.length, 0);
      for (let k = 0; k < apiKeys.length; k++) {
        lua.lua_pushstring(L, apiKeys[k]);
        lua.lua_rawseti(L, -2, k + 1);
      }
      return 1;
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
        lauxlib.luaL_traceback(L, L, '', 0);
        const tracebackStr = to_jsstring(lua.lua_tostring(L, -1));;
        lua.lua_pop(L, 1);
        throw new Error(`Scripts Load error: ${err} \n ${tracebackStr}`);
      }
    };
  }

  const co = lua.lua_newthread(L);

  // Get the main function from the global scope of the new thread
  const r = lua.lua_getglobal(co, 'main');
  if (r !== lua.LUA_TFUNCTION) {
    throw Error('Lua code must define a main() function');
  }

  let isDone = false;

  const cleanup = () => {
    luaopen_cleanup();
  }

  const doneWithError = (err: Error): ResumeResult => {
    isDone = true
    cleanup();
    return {
      done: true,
      error: err
    }
  }

  const doneWithResult = (result: unknown): ResumeResult => {
    isDone = true;
    cleanup();
    return {
      done: true,
      value: result
    }
  }

  // Return controller object
  return {
    /**
     * Resume the coroutine with optional result from async call.
     * @param result The result from JavaScript async function (or undefined for first resume)
     */
    resume: (result?: unknown): ResumeResult => {
      if (isDone) {
        throw new Error('Coroutine is already done');
      }

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

        args = tojsCompletely(args)

        if (typeof key !== 'string') {
          return doneWithError(new Error('Yielded key must be a string'));
        }

        if (!Array.isArray(args)) {
          return doneWithError(new Error('Yielded value must be an array of arguments'));
        }

        return {
          done: false,
          key,
          args,
        };
      } else if (resumeStatus === lua.LUA_OK) {
        // Coroutine finished - get return value
        const top = lua.lua_gettop(co);
        const value = top > 0 ? tojs(co, 1) : undefined;
        if (top > 0) lua.lua_pop(co, 1);

        return doneWithResult(tojsCompletely(value));
      } else if (resumeStatus === lua.LUA_ERRSYNTAX) {
        return doneWithError(new SyntaxError(`Syntax error: ${to_jsstring(lua.lua_tostring(co, -1))}`));
      } else if (resumeStatus === lua.LUA_ERRMEM) {
        return doneWithError(new Error('Memory error'));
      }
      else if (resumeStatus === lua.LUA_ERRERR) {
        return doneWithError(new Error(`Error during execution: ${to_jsstring(lua.lua_tostring(co, -1))}`));
      }
      else if (resumeStatus === lua.LUA_ERRRUN) {
        return doneWithError(new Error(`Runtime error: ${to_jsstring(lua.lua_tostring(co, -1))}`));
      }
      else {
        // Error
        const err = tojs(co, -1);
        lua.lua_pop(co, 1);
        return doneWithError(err instanceof Error ? err : new Error(String(err)));
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
export async function executeAsyncUntilDone(params: ExecuteParams): Promise<any> {
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
        call_result = await fn(...args)
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
  return [code, browserLuaCode, logLuaCode, stringLuaCode, tableLuaCode].join('\n\n');
}

// Re-export for convenience
export { tojs, push };