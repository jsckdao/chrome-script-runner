"use strict";
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  lua,
  lauxlib,
  lualib,
  to_luastring,
  lua_State,
} from 'fengari';

// LuaState type alias
type LuaState = lua_State;

// Extract constants from lua
const {
  LUA_MULTRET,
  LUA_OK,
  LUA_REGISTRYINDEX,
  LUA_RIDX_MAINTHREAD,
  LUA_TBOOLEAN,
  LUA_TFUNCTION,
  LUA_TLIGHTUSERDATA,
  LUA_TNIL,
  LUA_TNONE,
  LUA_TNUMBER,
  LUA_TSTRING,
  LUA_TTABLE,
  LUA_TTHREAD,
  LUA_TUSERDATA,
  lua_atnativeerror,
  lua_call,
  lua_getfield,
  lua_gettable,
  lua_gettop,
  lua_isnil,
  lua_isproxy,
  lua_newuserdata,
  lua_pcall,
  lua_pop,
  lua_pushboolean,
  lua_pushcfunction,
  lua_pushinteger,
  lua_pushlightuserdata,
  lua_pushliteral,
  lua_pushnil,
  lua_pushnumber,
  lua_pushstring,
  lua_pushvalue,
  lua_rawgeti,
  lua_rawgetp,
  lua_rawsetp,
  lua_rotate,
  lua_setfield,
  lua_settable,
  lua_settop,
  lua_toboolean,
  lua_tojsstring,
  lua_tonumber,
  lua_toproxy,
  lua_tothread,
  lua_touserdata,
  lua_type,
} = lua;

// Extract from lauxlib
const {
  luaL_argerror,
  luaL_checkany,
  luaL_checkoption,
  luaL_checkstack,
  luaL_checkudata,
  luaL_error,
  luaL_getmetafield,
  luaL_newlib,
  luaL_newmetatable,
  luaL_requiref,
  luaL_setfuncs,
  luaL_setmetatable,
  luaL_testudata,
  luaL_tolstring,
} = lauxlib;

// Extract from lualib
const {
  luaopen_base,
} = lualib;

// Version info
const FENGARI_INTEROP_VERSION_MAJOR = "0";
const FENGARI_INTEROP_VERSION_MINOR = "1";
const FENGARI_INTEROP_VERSION_NUM = 1;
const FENGARI_INTEROP_VERSION_RELEASE = "4";
const FENGARI_INTEROP_VERSION = FENGARI_INTEROP_VERSION_MAJOR + "." + FENGARI_INTEROP_VERSION_MINOR;
const FENGARI_INTEROP_RELEASE = FENGARI_INTEROP_VERSION + "." + FENGARI_INTEROP_VERSION_RELEASE;

// Custom inspect symbol (only in Node.js) - not needed in browser
const custom_inspect_symbol: symbol | undefined = undefined;

// Global environment - use globalThis with proper typing
const global_env: Record<string, unknown> = typeof globalThis === 'object' && globalThis !== null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? globalThis as any
  : typeof window !== 'undefined' ? window as unknown as Record<string, unknown> : {};

// Apply function - safe implementation without Function constructor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let apply: (target: (...args: any[]) => unknown, thisArg: unknown, args: IArguments | unknown[]) => unknown;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let construct: (target: new (...args: any[]) => unknown, args: unknown[]) => unknown;
let reflectDeleteProperty: (target: unknown, key: string | symbol) => boolean;

if (typeof Reflect !== "undefined" && Reflect.apply) {
  apply = Reflect.apply.bind(Reflect);
} else {
  // Fallback without Function constructor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply = function(target: any, thisArg: unknown, args: IArguments | unknown[]) {
    return Function.apply.call(target, thisArg, args);
  };
}

// Safe construct without Function constructor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
construct = function(target: any, args: unknown[]) {
  switch (args.length) {
    case 0: return new target();
    case 1: return new target(args[0]);
    case 2: return new target(args[0], args[1]);
    case 3: return new target(args[0], args[1], args[2]);
    default: {
      // For more than 3 args, use a workaround
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Factory = (target as any).bind.apply(target, [null].concat(args));
      return new Factory();
    }
  }
};

// Safe deleteProperty without Function constructor
reflectDeleteProperty = function(target, key) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (target as Record<string | symbol, unknown>)[key as string];
    return true;
  } catch {
    return false;
  }
};

// String.concat coerces to string with correct hint for Symbol.toPrimitive
const toString = String.prototype.concat.bind("");

const isobject = function(o: unknown): boolean {
  return typeof o === "object" ? o !== null : typeof o === "function";
};

const js_tname = to_luastring("js object");
const js_library_not_loaded = "js library not loaded into lua_State";

// Userdata type
interface LuaUserdata {
  data: unknown;
}

const testjs = function(L: LuaState, idx: number): unknown {
  const u = luaL_testudata(L, idx, js_tname as unknown as string) as LuaUserdata | null;
  if (u) return u.data;
  return undefined;
};

const checkjs = function(L: LuaState, idx: number): unknown {
  return (luaL_checkudata(L, idx, js_tname as unknown as string) as LuaUserdata).data;
};

const pushjs = function(L: LuaState, v: unknown): void {
  const b = lua_newuserdata(L) as LuaUserdata;
  b.data = v;
  luaL_setmetatable(L, js_tname as unknown as string);
};

const getmainthread = function(L: LuaState): LuaState {
  lua_rawgeti(L, LUA_REGISTRYINDEX, LUA_RIDX_MAINTHREAD);
  const mainL = lua_tothread(L, -1);
  lua_pop(L, 1);
  return mainL!;
};

/* weak map from states to proxy objects (for each object) in that state */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const states = new WeakMap<LuaState, Map<any, any>>();

const push = function(L: LuaState, v: unknown): void {
  switch (typeof v) {
    case "undefined":
      lua_pushnil(L);
      break;
    case "number":
      lua_pushnumber(L, v);
      break;
    case "string":
      lua_pushstring(L, v);
      break;
    case "boolean":
      lua_pushboolean(L, v ? 1 : 0);
      break;
    case "symbol":
      lua_pushlightuserdata(L, v);
      break;
    case "function":
      if (lua_isproxy(v as LuaState, L)) {
        (v as (L: LuaState) => void)(L);
        break;
      }
    /* falls through */
    case "object":
      if (v === null) {
        /* can't use null in a WeakMap; grab from registry */
        if (lua_rawgetp(L, LUA_REGISTRYINDEX, null) !== LUA_TUSERDATA)
          throw new Error(js_library_not_loaded);
        break;
      }
    /* falls through */
    default: {
      /* Try and push same object again */
      const objects_seen = states.get(getmainthread(L));
      if (!objects_seen) throw new Error(js_library_not_loaded);
      const p = objects_seen.get(v);
      if (p) {
        (p as (L: LuaState) => void)(L);
      } else {
        pushjs(L, v);
        const proxy = lua_toproxy(L, -1);
        objects_seen.set(v, proxy);
      }
    }
  }
};

const atnativeerror = function(L: LuaState): number {
  const u = lua_touserdata(L, 1);
  push(L, u);
  return 1;
};

const tojs = function(L: LuaState, idx: number): unknown {
  const type = lua_type(L, idx)
  switch (type) {
    case LUA_TNONE:
    case LUA_TNIL:
      return undefined;
    case LUA_TBOOLEAN:
      return lua_toboolean(L, idx) !== 0;
    case LUA_TLIGHTUSERDATA:
      return lua_touserdata(L, idx);
    case LUA_TNUMBER:
      return lua_tonumber(L, idx);
    case LUA_TSTRING:
      return lua_tojsstring(L, idx);
    case LUA_TUSERDATA: {
      const u = testjs(L, idx);
      if (u !== undefined) return u;
    }
    /* falls through */
    case LUA_TTABLE:
    case LUA_TFUNCTION:
    case LUA_TTHREAD:
    /* falls through */
    default:
      return wrap(L, lua_toproxy(L, idx), type);
  }
};

const tojsCompletely = function(obj: any): any {
  if (obj === null || 
    obj === undefined || 
    typeof obj === 'string' || 
    typeof obj === 'number' ||
    typeof obj === 'boolean' ||
    typeof obj === 'symbol' ||
    typeof obj === 'bigint') {
    return obj;
  }
  else if (Array.isArray(obj)) {
    return obj.map(tojsCompletely);
  }
  else if (typeof obj === 'object') {
    const res: any = {};
    Object.keys(obj).forEach(key => {
      res[key] = tojsCompletely(obj[key]);
    })
    return res;
  }
  else if (typeof obj === 'function') {
    // 如果是一个 proxy, 可能是 lua 的 table 或 function， 需要特殊处理
    if (obj.isProxy === true) {
      const proxyObj = obj as ProxyFunction;
      // 如果是table，转化为普通object
      if (proxyObj.type === LUA_TTABLE) {
        const res: any = {};
        for (const [k, v] of proxyObj) {
          const v2 = tojsCompletely(v);
          res[k] = v2;
        }

        // 判断是否可以转化为数组
        const keys = Object.keys(res);
        const sortedKeys = keys.map((v: string) => parseInt(v, 10)).sort((a, b) => a - b);
        let isArray = keys.every((v: string) => /^\d+$/.test(v)) &&
          (sortedKeys.join(',') === Array(keys.length).fill(0).map((_, i) => i + 1).join(','));

        return isArray ? sortedKeys.map((k) => res[k]) : res;
      } else if (proxyObj.type === LUA_TFUNCTION) {
        return (args: unknown[]) => {
          return proxyObj.apply(null, args);
        }
      } 
    }
    else {
      return obj;
    }
  }

  // 其他类型暂时没啥意义
  return {};
};

/* Calls function on the stack with `nargs` from the stack.
   On lua error, re-throws as javascript error
   On success, returns single return value */
const jscall = function(L: LuaState, nargs: number): unknown {
  const status = lua_pcall(L, nargs, 1, 0);
  const r = tojs(L, -1);
  lua_pop(L, 1);
  switch (status) {
    case LUA_OK:
      return r;
    default:
      throw r;
  }
};

const invoke = function(
  L: LuaState,
  p: (L: LuaState) => void,
  thisarg: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: { length: number; [index: number]: any },
  n_results: number
): unknown[] {
  if (!isobject(args)) throw new TypeError("`args` argument must be an object");
  let length = +args.length;
  if (!(length >= 0)) length = 0;
  luaL_checkstack(L, 2 + length, null);
  const base = lua_gettop(L);
  p(L);
  push(L, thisarg);
  for (let i = 0; i < length; i++) {
    push(L, args[i]);
  }
  switch (lua_pcall(L, 1 + length, n_results, 0)) {
    case LUA_OK: {
      const nres = lua_gettop(L) - base;
      const res: unknown[] = new Array(nres);
      for (let i = 0; i < nres; i++) {
        res[i] = tojs(L, base + i + 1);
      }
      lua_settop(L, base);
      return res;
    }
    default: {
      const r = tojs(L, -1);
      lua_settop(L, base);
      throw r;
    }
  }
};

const gettable = function(L: LuaState): number {
  lua_gettable(L, 1);
  return 1;
};

const get = function(L: LuaState, p: (L: LuaState) => void, prop: unknown): unknown {
  luaL_checkstack(L, 3, null);
  lua_pushcfunction(L, gettable);
  p(L);
  push(L, prop);
  return jscall(L, 2);
};

const has = function(L: LuaState, p: (L: LuaState) => void, prop: unknown): boolean {
  luaL_checkstack(L, 3, null);
  lua_pushcfunction(L, gettable);
  p(L);
  push(L, prop);
  const status = lua_pcall(L, 2, 1, 0);
  switch (status) {
    case LUA_OK: {
      const r = lua_isnil(L, -1);
      lua_pop(L, 1);
      return !r;
    }
    default: {
      const r = tojs(L, -1);
      lua_pop(L, 1);
      throw r;
    }
  }
};

const set = function(L: LuaState, p: (L: LuaState) => void, prop: unknown, value: unknown): void {
  luaL_checkstack(L, 4, null);
  lua_pushcfunction(L, function(L: LuaState): number {
    lua_settable(L, 1);
    return 0;
  });
  p(L);
  push(L, prop);
  push(L, value);
  switch (lua_pcall(L, 3, 0, 0)) {
    case LUA_OK:
      return;
    default: {
      const r = tojs(L, -1);
      lua_pop(L, 1);
      throw r;
    }
  }
};

const deleteProperty = function(L: LuaState, p: (L: LuaState) => void, prop: unknown): void {
  luaL_checkstack(L, 4, null);
  lua_pushcfunction(L, function(L: LuaState): number {
    lua_settable(L, 1);
    return 0;
  });
  p(L);
  push(L, prop);
  lua_pushnil(L);
  switch (lua_pcall(L, 3, 0, 0)) {
    case LUA_OK:
      return;
    default: {
      const r = tojs(L, -1);
      lua_pop(L, 1);
      throw r;
    }
  }
};

const tostring = function(L: LuaState, p: (L: LuaState) => void): unknown {
  luaL_checkstack(L, 2, null);
  lua_pushcfunction(L, function(L: LuaState): number {
    luaL_tolstring(L, 1);
    return 1;
  });
  p(L);
  return jscall(L, 1);
};

/* implements lua's "Generic For" protocol */
interface IteratorState {
  L: LuaState;
  iter: (L: LuaState) => void;
  state: (L: LuaState) => void;
  last: (L: LuaState) => void;
  next: () => { done: boolean; value: unknown };
}

const iter_next = function(this: IteratorState): { done: boolean; value: unknown } {
  const L = this.L;
  luaL_checkstack(L, 3, null);
  const top = lua_gettop(L);
  this.iter(L);
  this.state(L);
  this.last(L);
  switch (lua_pcall(L, 2, LUA_MULTRET, 0)) {
    case LUA_OK: {
      this.last = lua_toproxy(L, top + 1);
      let r: { done: boolean; value: unknown };
      if (lua_isnil(L, -1)) {
        r = { done: true, value: undefined };
      } else {
        const n_results = lua_gettop(L) - top;
        const result = new Array(n_results);
        for (let i = 0; i < n_results; i++) {
          result[i] = tojs(L, top + i + 1);
        }
        r = { done: false, value: result };
      }
      lua_settop(L, top);
      return r;
    }
    default: {
      const e = tojs(L, -1);
      lua_pop(L, 1);
      throw e;
    }
  }
};

/* make iteration use pairs() */
const jsiterator = function(L: LuaState, p: (L: LuaState) => void): IteratorState {
  luaL_checkstack(L, 1, null);
  lua_pushcfunction(L, function(L: LuaState): number {
    luaL_requiref(L, "_G", luaopen_base, 0);
    lua_getfield(L, -1, "pairs");
    p(L);
    lua_call(L, 1, 3);
    return 3;
  });
  switch (lua_pcall(L, 0, 3, 0)) {
    case LUA_OK: {
      const iter = lua_toproxy(L, -3);
      const state = lua_toproxy(L, -2);
      const last = lua_toproxy(L, -1);
      lua_pop(L, 3);
      return {
        L: L,
        iter: iter,
        state: state,
        last: last,
        next: iter_next,
      };
    }
    default: {
      const r = tojs(L, -1);
      lua_pop(L, 1);
      throw r;
    }
  }
};

// Proxy function type
export interface ProxyFunction {
  (): unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply: (thisArg: unknown, args: any[]) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: (thisArg: unknown, args: any[]) => unknown;
  get: (k: unknown) => unknown;
  has: (k: unknown) => boolean;
  set: (k: unknown, v: unknown) => void;
  delete: (k: unknown) => void;
  type: number;
  isProxy: boolean;
  toString: () => string;
  [Symbol.toStringTag]: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [Symbol.iterator]: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [Symbol.toPrimitive]?: (hint: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: symbol]: any;
}

const wrap = function(L1: LuaState, p: (L: LuaState) => void, type: number): ProxyFunction {
  const L = getmainthread(L1);
  /* we need `typeof js_proxy` to be "function" so that it's acceptable to native apis */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const js_proxy: ProxyFunction = function(this: any): unknown {
    /* only get one result */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return invoke(L, p, this, arguments as any, 1)[0];
  } as ProxyFunction;

  js_proxy.isProxy = true;

  js_proxy.type = type;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  js_proxy.apply = function(thisArg: unknown, args: any[]): unknown {
    /* only get one result */
    return invoke(L, p, thisArg, args, 1)[0];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  js_proxy.invoke = function(thisArg: unknown, args: any[]): unknown {
    return invoke(L, p, thisArg, args, LUA_MULTRET)[0];
  };

  js_proxy.get = function(k: unknown): unknown {
    return get(L, p, k);
  };

  js_proxy.has = function(k: unknown): boolean {
    return has(L, p, k);
  };

  js_proxy.set = function(k: unknown, v: unknown): void {
    set(L, p, k, v);
  };

  js_proxy.delete = function(k: unknown): void {
    deleteProperty(L, p, k);
  };

  js_proxy.toString = function(): string {
    return tostring(L, p) as string;
  };

  if (typeof Symbol === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (js_proxy as any)[Symbol.toStringTag] = "Fengari object";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (js_proxy as any)[Symbol.iterator] = function(): IteratorState {
      return jsiterator(L, p);
    };
    if (Symbol.toPrimitive) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (js_proxy as any)[Symbol.toPrimitive] = function(hint: string): unknown {
        if (hint === "string") {
          return tostring(L, p);
        }
      };
    }
  }

  if (custom_inspect_symbol) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (js_proxy as any)[custom_inspect_symbol] = js_proxy.toString;
  }

  const objects_seen = states.get(L);
  if (!objects_seen) throw new Error(js_library_not_loaded);
  objects_seen.set(js_proxy, p);
  return js_proxy;
};

// Lua library functions exposed to Lua
const jslib: Record<string, (L: LuaState) => number> = {
  "new": function(L: LuaState): number {
    const u = tojs(L, 1);
    const nargs = lua_gettop(L) - 1;
    const args: unknown[] = new Array(nargs);
    for (let i = 0; i < nargs; i++) {
      args[i] = tojs(L, i + 2);
    }
    push(L, construct(u as new (...args: unknown[]) => unknown, args));
    return 1;
  },
  "tonumber": function(L: LuaState): number {
    const u = tojs(L, 1);
    lua_pushnumber(L, Number(u));
    return 1;
  },
  "tostring": function(L: LuaState): number {
    const u = tojs(L, 1);
    lua_pushliteral(L, toString(u));
    return 1;
  },
  "instanceof": function(L: LuaState): number {
    const u1 = tojs(L, 1);
    const u2 = tojs(L, 2);
    lua_pushboolean(L, u1 instanceof (u2 as any) ? 1 : 0);
    return 1;
  },
  "typeof": function(L: LuaState): number {
    const u = tojs(L, 1);
    lua_pushliteral(L, typeof u);
    return 1;
  }
};

if (typeof Symbol === "function" && Symbol.iterator) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const get_iterator = function(L: LuaState, idx: number): Iterator<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = checkjs(L, idx) as Record<symbol, () => Iterator<any>>;
    const getiter = u[Symbol.iterator];
    if (!getiter)
      luaL_argerror(L, idx, to_luastring("object not iterable") as unknown as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iter = apply(getiter, u, [] as any);
    if (!isobject(iter))
      luaL_argerror(L, idx, to_luastring("Result of the Symbol.iterator method is not an object") as unknown as string);
    return iter as Iterator<unknown>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const next = function(L: LuaState): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iter = tojs(L, 1) as Iterator<any>;
    const r = iter.next();
    if (r.done) {
      return 0;
    } else {
      push(L, r.value);
      return 1;
    }
  };

  jslib["of"] = function(L: LuaState): number {
    const iter = get_iterator(L, 1);
    lua_pushcfunction(L, next);
    push(L, iter);
    return 2;
  };
}

if (typeof Proxy === "function" && typeof Symbol === "function") {
  const L_symbol = Symbol("lua_State");
  const p_symbol = Symbol("fengari-proxy");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proxy_handlers: ProxyHandler<Record<string | symbol, any>> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "apply": function(target: Record<string | symbol, any>, thisarg: unknown, args: any[]) {
      return invoke(target[L_symbol] as LuaState, target[p_symbol] as (L: LuaState) => void, thisarg, args, 1)[0];
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "construct": function(target: Record<string | symbol, any>, argumentsList: any[]) {
      const L = target[L_symbol] as LuaState;
      const p = target[p_symbol] as (L: LuaState) => void;
      const arg_length = argumentsList.length;
      luaL_checkstack(L, 2 + arg_length, null);
      p(L);
      const idx = lua_gettop(L);
      if (luaL_getmetafield(L, idx, "construct") === LUA_TNIL) {
        lua_pop(L, 1);
        throw new TypeError("not a constructor");
      }
      lua_rotate(L, idx, 1);
      for (let i = 0; i < arg_length; i++) {
        push(L, argumentsList[i]);
      }
      return jscall(L, 1 + arg_length);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "defineProperty": function(target: Record<string | symbol, any>, prop: string | symbol, desc: PropertyDescriptor) {
      const L = target[L_symbol] as LuaState;
      const p = target[p_symbol] as (L: LuaState) => void;
      luaL_checkstack(L, 4, null);
      p(L);
      if (luaL_getmetafield(L, -1, "defineProperty") === LUA_TNIL) {
        lua_pop(L, 1);
        return false;
      }
      lua_rotate(L, -2, 1);
      push(L, prop);
      push(L, desc);
      return jscall(L, 3) !== undefined;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "deleteProperty": function(target: Record<string | symbol, any>, k: string | symbol) {
      return deleteProperty(target[L_symbol] as LuaState, target[p_symbol] as (L: LuaState) => void, k);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "get": function(target: Record<string | symbol, any>, k: string | symbol) {
      return get(target[L_symbol] as LuaState, target[p_symbol] as (L: LuaState) => void, k);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "getOwnPropertyDescriptor": function(target: Record<string | symbol, any>, prop: string | symbol) {
      const L = target[L_symbol] as LuaState;
      const p = target[p_symbol] as (L: LuaState) => void;
      luaL_checkstack(L, 3, null);
      p(L);
      if (luaL_getmetafield(L, -1, "getOwnPropertyDescriptor") === LUA_TNIL) {
        lua_pop(L, 1);
        return undefined;
      }
      lua_rotate(L, -2, 1);
      push(L, prop);
      return jscall(L, 2);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "getPrototypeOf": function(target: Record<string | symbol, any>) {
      const L = target[L_symbol] as LuaState;
      const p = target[p_symbol] as (L: LuaState) => void;
      luaL_checkstack(L, 2, null);
      p(L);
      if (luaL_getmetafield(L, -1, "getPrototypeOf") === LUA_TNIL) {
        lua_pop(L, 1);
        return null;
      }
      lua_rotate(L, -2, 1);
      return jscall(L, 1);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "has": function(target: Record<string | symbol, any>, k: string | symbol) {
      return has(target[L_symbol] as LuaState, target[p_symbol] as (L: LuaState) => void, k);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "ownKeys": function(target: Record<string | symbol, any>) {
      const L = target[L_symbol] as LuaState;
      const p = target[p_symbol] as (L: LuaState) => void;
      luaL_checkstack(L, 2, null);
      p(L);
      if (luaL_getmetafield(L, -1, "ownKeys") === LUA_TNIL) {
        lua_pop(L, 1);
        throw new Error("ownKeys unknown for fengari object");
      }
      lua_rotate(L, -2, 1);
      return jscall(L, 1);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "set": function(target: Record<string | symbol, any>, k: string | symbol, v: unknown) {
      set(target[L_symbol] as LuaState, target[p_symbol] as (L: LuaState) => void, k, v);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "setPrototypeOf": function(target: Record<string | symbol, any>, prototype: object | null) {
      const L = target[L_symbol] as LuaState;
      const p = target[p_symbol] as (L: LuaState) => void;
      luaL_checkstack(L, 3, null);
      p(L);
      if (luaL_getmetafield(L, -1, "setPrototypeOf") === LUA_TNIL) {
        lua_pop(L, 1);
        return false;
      }
      lua_rotate(L, -2, 1);
      push(L, prototype);
      return jscall(L, 2) !== undefined;
    }
  };

  /*
  Functions created with `function(){}` have a non-configurable .prototype
  field. This causes issues with the .ownKeys and .getOwnPropertyDescriptor
  traps.
  However using `.bind()` returns a function without the .prototype property.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw_function = function(): (...args: any[]) => unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (function() {}).bind() as (...args: any[]) => unknown;
    delete (f as Record<string, unknown>).length;
    delete (f as Record<string, unknown>).name;
    return f;
  };

  /*
  We replaced Function() with arrow function directly.
  CSP-safe implementation.
  */
  const make_arrow_function = function(): () => void {
    return () => { return; };
  };

  const raw_arrow_function = function(): () => void {
    const f = make_arrow_function();
    delete (f as Record<string, unknown>).length;
    delete (f as Record<string, unknown>).name;
    return f;
  };

  /*
  Arrow functions do not have a .prototype field
  However they cannot be used as a constructor
  */
  const createproxy = function(L1: LuaState, p: (L: LuaState) => void, type: string): unknown {
    const L = getmainthread(L1);
    let target: Record<string | symbol, unknown>;
    switch (type) {
      case "function":
        target = raw_function();
        break;
      case "arrow_function":
        target = raw_arrow_function();
        break;
      case "object":
        target = {};
        break;
      default:
        throw new TypeError("invalid type to createproxy");
    }
    target[p_symbol] = p;
    target[L_symbol] = L;
    return new Proxy(target, proxy_handlers);
  };

  const valid_types = ["function", "arrow_function", "object"];
  const valid_types_as_luastring = valid_types.map((v) => to_luastring(v));

  jslib["createproxy"] = function(L: LuaState): number {
    luaL_checkany(L, 1);
    const type = valid_types[luaL_checkoption(L, 2, valid_types_as_luastring[0] as unknown as string, valid_types_as_luastring as unknown as string[]) as number];
    const fengariProxy = createproxy(L, lua_toproxy(L, 1), type);
    push(L, fengariProxy);
    return 1;
  };
}

const jsmt: Record<string, (L: LuaState) => number> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "__index": function(L: LuaState): number {
    const u = checkjs(L, 1);
    const k = tojs(L, 2);
    push(L, (u as Record<string, unknown>)[k as string]);
    return 1;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "__newindex": function(L: LuaState): number {
    const u = checkjs(L, 1);
    const k = tojs(L, 2);
    const v = tojs(L, 3);
    if (v === undefined)
      reflectDeleteProperty(u, k as string | symbol);
    else
      (u as Record<string, unknown>)[k as string] = v;
    return 0;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "__tostring": function(L: LuaState): number {
    const u = checkjs(L, 1);
    const s = toString(u);
    lua_pushstring(L, s);
    return 1;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "__call": function(L: LuaState): number {
    const u = checkjs(L, 1);
    const nargs = lua_gettop(L) - 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any[] = new Array(Math.max(0, nargs - 1));
    let thisarg: unknown;
    if (nargs > 0) {
      thisarg = tojs(L, 2);
      let remaining = nargs;
      let argIdx = 3;
      while (remaining-- > 0 && argIdx <= lua_gettop(L)) {
        args[remaining] = tojs(L, argIdx++);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push(L, apply(u as (...args: unknown[]) => unknown, thisarg, args as any));
    return 1;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "__pairs": function(L: LuaState): number {
    const u = checkjs(L, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let f: (state: unknown) => { done?: boolean; value?: unknown; iter: (s: unknown, k: unknown) => unknown; state: unknown; first?: unknown } | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let iter: (s: unknown, k: unknown) => unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let state: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let first: unknown;
    if (typeof Symbol !== "function" || (f = (u as Record<string | symbol, unknown>)[Symbol.for("__pairs")] as typeof f) === undefined) {
      /* By default, iterate over Object.keys */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iter = function(state: any, last: any) {
        if (state.index >= state.keys.length)
          return;
        const key = state.keys[state.index++];
        return [key, state.object[key]];
      };
      state = {
        object: u,
        keys: Object.keys(u as object),
        index: 0,
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = apply(f as any, u, [] as any);
      if (r === undefined)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        luaL_error(L, to_luastring("bad '__pairs' result (object with keys 'iter', 'state', 'first' expected)") as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iter = (r as any).iter;
      if (iter === undefined)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        luaL_error(L, to_luastring("bad '__pairs' result (object.iter is missing)") as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state = (r as any).state;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      first = (r as any).first;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lua_pushcfunction(L, function(L: LuaState): number {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateArg = tojs(L, 1) as any;
      const last = tojs(L, 2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = apply(iter as any, stateArg, [last]);
      /* returning undefined indicates end of iteration */
      if (r === undefined)
        return 0;
      /* otherwise it should return an array of results */
      if (!Array.isArray(r))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        luaL_error(L, to_luastring("bad iterator result (Array or undefined expected)") as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stateArg as any).L;
      luaL_checkstack(L, r.length, null);
      for (let i = 0; i < r.length; i++) {
        push(L, r[i]);
      }
      return r.length;
    });
    push(L, state);
    push(L, first);
    return 3;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  "__len": function(L: LuaState): number {
    const u = checkjs(L, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let r: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof Symbol !== "function" || (f = (u as Record<string | symbol, unknown>)[Symbol.for("__len")] as () => unknown) === undefined) {
      /* by default use .length field */
      r = (u as { length: unknown }).length;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r = apply(f as any, u, [] as any);
    }
    push(L, r);
    return 1;
  }
};

const create_luaopen_js = function(browserApi: any) {
  let mainthread = null as unknown | null;
  const luaopen_js = (L: LuaState) => {
    /* Add weak map to track objects seen */
    mainthread = getmainthread(L)
    states.set(mainthread, new Map());

    lua_atnativeerror(L, atnativeerror);

    luaL_newlib(L, {
      ...browserApi,
      ...jslib,
    });
    lua_pushliteral(L, FENGARI_INTEROP_VERSION);
    lua_setfield(L, -2, "_VERSION");
    lua_pushinteger(L, FENGARI_INTEROP_VERSION_NUM);
    lua_setfield(L, -2, "_VERSION_NUM");
    lua_pushliteral(L, FENGARI_INTEROP_RELEASE);
    lua_setfield(L, -2, "_RELEASE");

    luaL_newmetatable(L, js_tname as unknown as string);
    luaL_setfuncs(L, jsmt, 0);
    lua_pop(L, 1);

    pushjs(L, null);
    /* Store null object in registry under lightuserdata null */
    lua_pushvalue(L, -1);
    lua_rawsetp(L, LUA_REGISTRYINDEX, null);
    lua_setfield(L, -2, "null");

    return 1;
  }

  const luaopen_cleanup = () => {
    if (mainthread) {
      states.delete(mainthread as LuaState);
    }
  };

  return { luaopen_js, luaopen_cleanup };
}

// Export functions
export {
  create_luaopen_js,
  checkjs,
  testjs,
  pushjs,
  push,
  tojs,
  tojsCompletely,
  FENGARI_INTEROP_VERSION,
  FENGARI_INTEROP_VERSION_NUM,
  FENGARI_INTEROP_RELEASE,
};
