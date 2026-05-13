declare module 'fengari' {
  // Lua state type - 指向 Lua 虚拟机状态的指针
  // 在 Fengari 中，这是一个 opaque pointer，用于所有 Lua C API 调用
  export type lua_State = unknown;

  // lua 常量 - Lua 虚拟机返回状态码
  export const lua: {
    // ========== 状态码常量 ==========
    // Lua 操作成功完成
    LUA_OK: number;
    // Lua 协程 yield（让出执行权）
    LUA_YIELD: number;
    // 运行错误
    LUA_ERRRUN: number;
    // 语法错误
    LUA_ERRSYNTAX: number;
    // 内存分配错误
    LUA_ERRMEM: number;
    // 运行时错误（用于 luaL_error）
    LUA_ERRERR: number;
    // 文件错误
    LUA_ERRFILE: number;
    // 多返回值标记（表示返回所有可变参数）
    LUA_MULTRET: number;

    // ========== 注册表索引 ==========
    // 注册表是一个特殊的 Lua 表，用于 C 代码存储数据
    // 负索引表示从栈顶开始计算
    LUA_REGISTRYINDEX: number;
    // 主线程在注册表中的索引
    LUA_RIDX_MAINTHREAD: number;

    // ========== Lua 类型常量 (lua_type 返回值) ==========
    LUA_TBOOLEAN: number;          // 布尔类型
    LUA_TFUNCTION: number;        // 函数类型（C函数或Lua函数）
    LUA_TLIGHTUSERDATA: number;   // 轻量用户数据（指针）
    LUA_TNIL: number;             // nil 空值
    LUA_TNONE: number;            // 无效索引（比任何类型都"轻"）
    LUA_TNUMBER: number;          // 数字类型
    LUA_TSTRING: number;          // 字符串类型
    LUA_TTABLE: number;           // 表（关联数组）
    LUA_TTHREAD: number;          // 协程/线程
    LUA_TUSERDATA: number;        // 用户数据（有元表的指针）

    // ========== 栈操作函数 ==========
    // 获取栈顶索引（即栈上元素数量）
    lua_gettop(L: lua_State): number;
    // 设置栈顶（可正可负）
    lua_settop(L: lua_State, idx: number): void;
    // 弹出 n 个元素
    lua_pop(L: lua_State, n: number): void;
    // 将索引 idx 处的值复制到栈顶
    lua_pushvalue(L: lua_State, idx: number): void;
    // 旋转栈上元素（正值顺时针，负值逆时针）
    lua_rotate(L: lua_State, idx: number, n: number): void;
    // 从栈中删除索引 idx 处的元素
    lua_remove(L: lua_State, idx: number): void;
    // 获取栈上索引 idx 处值的类型
    lua_type(L: lua_State, idx: number): number;
    // 获取类型名称字符串
    lua_typename(L: lua_State, t: number): string;

    // ========== 推入元素到栈 ==========
    // 推入 nil 值
    lua_pushnil(L: lua_State): void;
    // 推入数字
    lua_pushnumber(L: lua_State, n: number): void;
    // 推入布尔值（非零=true，零=false）
    lua_pushboolean(L: lua_State, b: number): void;
    // 推入字符串（C 字符串）
    lua_pushstring(L: lua_State, s: string): void;
    // 推入字符串（字面量）
    lua_pushliteral(L: lua_State, s: string): void;
    // 推入 C 函数
    // C 函数签名：接收 lua_State，返回返回值个数
    lua_pushcfunction(L: lua_State, f: (L: lua_State) => number): void;
    // 推入整数
    lua_pushinteger(L: lua_State, n: number): void;
    // 推入轻量用户数据（指针）
    lua_pushlightuserdata(L: lua_State, p: unknown): void;

    // ========== 从栈读取值 ==========
    // 获取全局表中的值
    lua_gettable(L: lua_State, idx: number): number;
    // 获取表/全局空间中字段值
    // 等价于 push L[idx].k
    lua_getfield(L: lua_State, idx: number, k: string): number;
    // 获取全局变量
    lua_getglobal(L: lua_State, name: string): number;
    // 从表中获取原始值（raw get，不调用元方法）
    // 获取 table[idx][n] 处的值
    lua_rawgeti(L: lua_State, idx: number, n: number): number;
    // 从表中获取原始值（通过指针 key）
    lua_rawgetp(L: lua_State, idx: number, p: unknown): number;
    // 再次获取栈顶元素数量（重复定义）
    lua_gettop(L: lua_State): number;
    // 判断是否为表
    lua_istable(L: lua_State, idx: number): boolean;

    // ========== 设置栈上的值 ==========
    // 设置表/全局空间中的字段
    // 弹出 key 和 value，设置 L[idx].key = value
    lua_settable(L: lua_State, idx: number): void;
    // 设置表/全局空间中的字段（显式指定 key）
    lua_setfield(L: lua_State, idx: number, k: string): void;
    // 设置全局变量
    lua_setglobal(L: lua_State, s: string): void;
    // 设置表中的原始值（通过指针 key）
    lua_rawsetp(L: lua_State, idx: number, p: unknown): void;

    // ========== 类型转换（从栈读取） ==========
    // 转为布尔值（非零=true，零=false）
    lua_toboolean(L: lua_State, idx: number): number;
    // 转为数字
    lua_tonumber(L: lua_State, idx: number): number;
    // 转为整数
    lua_tointeger(L: lua_State, idx: number): number;
    // 转为 Lua 字符串（C 风格，null 结尾）
    // 返回 Uint8Array（fengari 特有），需用 to_jsstring 转换
    lua_tostring(L: lua_State, idx: number): Uint8Array | null;
    // 转为用户数据指针
    lua_touserdata(L: lua_State, idx: number): unknown;
    // 转为线程/协程
    lua_tothread(L: lua_State, idx: number): lua_State | null;
    // 判断是否为 nil
    lua_isnil(L: lua_State, idx: number): number;
    // 判断是否为 C 函数
    lua_iscfunction(L: lua_State, idx: number): number;
    // 判断是否为函数
    lua_isfunction(L: lua_State, idx: number): number;
    // 判断是否为轻量用户数据
    lua_islightuserdata(L: lua_State, idx: number): number;
    // 判断是否为表
    lua_istable(L: lua_State, idx: number): number;
    // 判断是否为线程/协程
    lua_isthread(L: lua_State, idx: number): number;
    // 判断是否为字符串
    lua_isstring(L: lua_State, idx: number): number;
    // 判断是否为数字
    lua_isnumber(L: lua_State, idx: number): number;
    // 判断是否为布尔值
    lua_isboolean(L: lua_State, idx: number): number;

    // ========== 调用与执行 ==========
    // 调用函数
    // nargs: 参数个数，nresults: 返回值个数（-1 表示全部）
    lua_call(L: lua_State, nargs: number, nresults: number): void;
    // 受保护调用（pcall）
    // errfunc=0 表示无错误处理函数
    // 返回 LUA_OK 表示成功，其他表示错误
    lua_pcall(L: lua_State, nargs: number, nresults: number, errfunc: number): number;
    // 协程 yield（让出执行权）
    // nresults: 向 resume 传递的结果个数
    lua_yield(L: lua_State, nresults: number): number;
    // 恢复协程执行
    // from=null 表示从主线程恢复
    // nresults: yield 传递的参数个数
    // 返回 LUA_OK（完成）或 LUA_YIELD（再次 yield）
    lua_resume(L: lua_State, from: lua_State | null, nresults: number): number;

    // 创建新线程/协程
    lua_newthread(L: lua_State): lua_State;

    // ========== Fengari 特有函数 ==========
    // 将 Lua 值转为 JS 字符串
    lua_tojsstring(L: lua_State, idx: number): string;
    // 将 Lua 值转为 JS 代理对象
    lua_toproxy(L: lua_State, idx: number): (L: lua_State) => void;
    // 判断是否为 JS 代理对象
    lua_isproxy(L: lua_State, value: unknown): boolean;
    // 设置原生错误处理器
    lua_atnativeerror(L: lua_State, f: (L: lua_State) => number): void;
    // 分配新的用户数据块
    lua_newuserdata(L: lua_State): unknown;
  };

  export const lauxlib: {
    // ========== 状态管理 ==========
    // 创建新的 Lua 状态（虚拟机实例）
    luaL_newstate(): lua_State;
    // 打开所有标准库（base, table, string, math, io, os, debug, package）
    luaL_openlibs(L: lua_State): void;

    // ========== 加载与编译 ==========
    // 加载 Lua 代码字符串
    // 成功返回 LUA_OK，语法错误返回 LUA_ERRSYNTAX，其他错误返回对应错误码
    luaL_loadstring(L: lua_State, s: string): number;
    // 执行 Lua 代码字符串（相当于 load + pcall）
    luaL_dostring(L: lua_State, s: string): number;
    // 加载缓冲区中的 Lua 代码
    luaL_loadbuffer(L: lua_State, s: string, sz: number, name: string): number;
    // 读取字符串参数（索引 n）
    luaL_checkstring(L: lua_State, n: number): Uint8Array;
    // 读取数字参数
    luaL_checknumber(L: lua_State, n: number): number;
    // 读取整数参数
    luaL_checkinteger(L: lua_State, n: number): number;
    // 读取任意类型参数（如果不是指定类型则报错）
    luaL_checkany(L: lua_State, n: number): void;
    // 读取选项参数（用于 luaL_checkoption）
    luaL_checkoption(L: lua_State, n: number, def: string, list: string[]): number;
    // 确保栈空间足够
    luaL_checkstack(L: lua_State, n: number, msg: string | null): void;
    // 检查用户数据是否是指定类型
    luaL_checkudata(L: lua_State, n: number, tname: string): unknown;
    // 参数错误（触发 Lua error）
    luaL_argerror(L: lua_State, n: number, msg: string): number;
    // 生成错误（使用 luaL_error 的函数应返回错误码）
    luaL_error(L: lua_State, msg: string): number;
    // 获取元表字段
    // 如果对象有元表且元表有字段 e，返回 1 并推入值，否则返回 0
    luaL_getmetafield(L: lua_State, obj: number, e: string): number;

    // ========== 表/模块工具 ==========
    // 创建一个新表并注册为模块（用于 luaL_newlib）
    luaL_newlib(L: lua_State, l: Record<string, (L: lua_State) => number>): void;
    // 创建新元表
    // 成功返回 1，表中已存在返回 0
    luaL_newmetatable(L: lua_State, tname: string): number;
    // 加载模块（requiref）
    // glb=1 表示同时设置为全局变量
    luaL_requiref(L: lua_State, modname: string, fn: (L: lua_State) => number, glb: number): void;
    // 注册一组 C 函数（用于库定义）
    luaL_setfuncs(L: lua_State, l: Record<string, (L: lua_State) => number>, nup: number): void;
    // 设置元表
    luaL_setmetatable(L: lua_State, tname: string): void;
    // 测试用户数据类型（不报错版本）
    luaL_testudata(L: lua_State, n: number, tname: string): unknown;
    // 获取对象的字符串表示
    luaL_tolstring(L: lua_State, idx: number): Uint8Array;
  };

  export const lualib: {
    // 打开所有标准库
    luaL_openlibs(L: lua_State): void;
    // 打开基础库（print, error, pairs, etc.）
    luaopen_base(L: lua_State): number;
    // 打开数学库
    luaopen_math(L: lua_State): number;
    // 打开字符串库
    luaopen_string(L: lua_State): number;
    // 打开表库
    luaopen_table(L: lua_State): number;
    // 打开 IO 库
    luaopen_io(L: lua_State): number;
    // 打开 OS 库
    luaopen_os(L: lua_State): number;
    // 打开包库
    luaopen_package(L: lua_State): number;
    // 打开调试库
    luaopen_debug(L: lua_State): number;
    // 打开协程库
    luaopen_coroutine(L: lua_State): number;
  };

  // ========== 工具函数 ==========
  // 将 JS 字符串转为 Lua 字符串（Uint8Array）
  // Lua 内部使用 UTF-8 编码的 Uint8Array
  export function to_luastring(s: string): Uint8Array;
  // 将 Lua 字符串（Uint8Array）转为 JS 字符串
  export function to_jsstring(s: Uint8Array | null): string;
  // 将 Lua 字符串转为 URI 编码的 JS 字符串
  export function to_uristring(s: Uint8Array | null): string;
  // 获取 Lua 字符串的 Uint8Array
  export function luastring_of(s: Uint8Array): Uint8Array;

  // ========== 版本信息 ==========
  export const FENGARI_AUTHORS: string;
  export const FENGARI_COPYRIGHT: string;
  export const FENGARI_RELEASE: string;
  export const FENGARI_VERSION: string;
  export const FENGARI_VERSION_MAJOR: string;
  export const FENGARI_VERSION_MINOR: string;
  export const FENGARI_VERSION_NUM: number;
  export const FENGARI_VERSION_RELEASE: string;
}
