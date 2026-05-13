# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本代码库中工作时提供指导。

## 项目概述

一款带有侧边栏的 Chrome 扩展程序，用于运行沙箱脚本。采用 Lua 作为脚本语言（通过 Fengari），以绕过阻止 `eval` 和 `new Function()` 的 CSP（内容安全策略）限制。

## 构建命令

```bash
pnpm build    # 构建扩展到 dist/
pnpm dev      # 开发模式（监视）
pnpm test     # 运行 vitest 测试
```

构建后，将 `dist/` 文件夹作为已解压的 Chrome 扩展程序加载。

## 测试

单元测试位于 `src/**/*.test.ts`。目前，Lua 执行器的完整集成测试需要浏览器环境，因为 Fengari 与测试运行器存在 Node.js 兼容性问题（内存管理、WASM）。版本信息测试可在 vitest 中成功运行。

## 架构

```
src/
├── background/
│   └── background.ts           # Service Worker - 通过 Fengari 执行 Lua 脚本
├── sidepanel/                  # 侧边栏 UI
│   ├── sidepanel.ts           # 主面板逻辑
│   ├── sidepanel.html         # HTML 模板
│   ├── sidepanel.css          # 样式
│   ├── editor.ts              # CodeMirror 6 编辑器封装
│   ├── console.ts             # 控制台输出显示
│   └── completions.ts         # Chrome API 自动补全
├── content/
│   └── content.ts              # 轻量级内容脚本（消息桥接）
├── libs/
│   ├── fengari-interop.ts      # CSP 安全 JS-Lua 互操作层
│   ├── async-executor.ts       # Lua 协程执行器（支持异步调用）
│   ├── async-executor.test.ts  # 单元测试
│   └── browser-api/            # 浏览器 API 定义
├── utils/
│   └── message.ts              # Chrome 消息辅助函数
└── types/
    └── fengari.d.ts             # Fengari TypeScript 声明
```

## 核心执行流程

### 消息通信架构

```
侧边栏                              后台 Service Worker
    │                                        │
    │--- chrome.runtime.connect() --------->│  (端口: sidepanel-to-background)
    │                                        │
    │--- chrome.runtime.sendMessage() ------>│  { type: 'execute', script, requestId, tabId }
    │                                        │
    │                                        │--- async-executor 执行 Lua
    │                                        │
    |<-- port.postMessage() -----------------│  { type: 'executeLog', requestId, level, message }
    |<-- port.postMessage() -----------------│  { type: 'executeResult', requestId, result, error? }
```

### 脚本执行流程

1. 侧边栏通过 `chrome.runtime.sendMessage` 发送脚本到后台 Service Worker
2. 后台使用 `async-executor` 创建 Lua 协程执行脚本
3. 当脚本调用 `browser.xxx()` 时，协程 yield 到 JS
4. JS 处理异步调用（如 `wait()`），resume 协程继续执行
5. 日志和结果通过端口实时推送回侧边栏

## 关键技术与设计模式

### 为什么选择 Lua 而非 JavaScript？

Chrome MV3 的 CSP 阻止 `eval` 和 `new Function()`。Fengari 通过 WebAssembly 运行 Lua，绕过这些限制。

### CSP 安全的 Fengari-Interop

原始 `fengari-interop` 使用了 `Function()` 构造器，违反 CSP。`src/libs/fengari-interop.ts` 从 JS 转换为 TypeScript，并替换了 `Function()` 调用为安全替代方案：
- `reflectDeleteProperty` 使用直接属性删除
- `make_arrow_function` 使用箭头函数语法
- `raw_function` 使用 `.bind()` 方法

### 协程异步桥接

Lua 协程机制实现了同步风格的异步调用：
```lua
-- 用户代码被包装为：
function yield_call(key, args)
  return coroutine.yield(key, args)
end
browser.wait = function(seconds) return yield_call("wait", {seconds}) end
```

当 `browser.wait()` 被调用时，协程 yield 控制权给 JS；JS 执行完后 resume 协程。

### Zod Schema 用于 API 定义

浏览器 API 函数使用 Zod schema 定义，用于：
- 运行时参数验证
- 代码补全类型信息
- 文档生成

### 自动 API 封装

API 函数在 `browser-api/` 中定义一次，通过 `createBrowserApi()` 创建 API 对象，`wrapBrowserApi()` 封装后供 Lua 调用。

## 依赖

- **fengari** / **fengari-web**: 浏览器端 Lua VM
- **codemirror**: 代码编辑器 (v6)
- **@codemirror/lang-javascript**: JavaScript 语法高亮（仅用于显示，非执行）
- **zod**: API 参数验证 schema

## 文件职责表

| 文件 | 职责 |
|------|------|
| `background.ts` | Service Worker - Lua 执行引擎，消息路由 |
| `sidepanel.ts` | UI 控制器，编辑器/控制台管理，用户输入 |
| `editor.ts` | CodeMirror 6 封装，Lua 语法高亮 |
| `console.ts` | 带时间戳的控制台输出渲染 |
| `completions.ts` | log.* API 自动补全 |
| `content.ts` | 轻量级 ping 响应 |
| `fengari-interop.ts` | CSP 安全的 JS-Lua 互操作层 |
| `async-executor.ts` | Lua 协程执行控制器 |
| `browser-api` | 浏览器 API 工厂 |
| `message.ts` | Chrome 消息工具 |
| `fengari.d.ts` | Fengari TypeScript 声明 |

## 如何添加新的浏览器 API

### 概述

浏览器 API 通过 Zod schema 定义参数，Lua 调用时自动处理异步执行。所有 API 分为两类：

- **AsyncFunctionDef**: 异步函数，如 `wait()`
- **SyncFunctionDef**: 同步函数

### 添加步骤

#### 1. 创建函数定义文件

在 `src/libs/browser-api/` 下创建新文件，例如 `myApi.ts`：

```typescript
import z from "zod";
import { defineAsyncFunction } from "./base";

// 异步函数示例
export default defineAsyncFunction({
  name: 'myApi',           // Lua 中调用的名称
  description: '我的 API 描述',
  params: z.tuple([
    z.string().describe('参数1描述'),
    z.number().optional().describe('可选参数')
  ]),
  execute: async ([param1, param2]) => {
    // 实现逻辑
    const result = await someAsyncOperation(param1);
    return result;
  }
});

// 同步函数示例
import { defineSyncFunction } from "./base";

export const syncApi = defineSyncFunction({
  name: 'syncApi',
  description: '同步 API 示例',
  params: z.tuple([
    z.boolean()
  ]),
  execute: ([flag]) => {
    return flag ? "yes" : "no";
  }
});
```

#### 2. 注册到 API 列表

编辑 `src/libs/browser-api/index.ts`：

```typescript
import { BrowserApi, FunctionDef } from './base';
import wait from './wait';
import myApi from './myApi';          // 导入新 API
import { syncApi } from './myApi';    // 导入同步 API

const browserApiFunctions: FunctionDef[] = [
  wait,
  myApi,        // 添加异步函数
  syncApi,      // 添加同步函数
]

export function createBrowserApi(): BrowserApi {
  const api: BrowserApi = {};
  for (const funcDef of browserApiFunctions) {
    api[funcDef.name] = funcDef;
  }
  return api;
}
```

#### 3. 在 Lua 中使用

```lua
-- 调用异步 API（自动 yield/resume）
local result = browser.myApi("hello", 123)

-- 调用同步 API
local flag = browser.syncApi(true)
```

#### 4. 本地单元测试

所有对 api 方法的测试用例写在 `src/libs/browser-api/test` 文件中。

### 参数 schema 说明

| Zod 类型 | Lua 类型 | 说明 |
|----------|----------|------|
| `z.string()` | string | 字符串 |
| `z.number()` | number | 数字 |
| `z.boolean()` | boolean | 布尔值 |
| `z.array(z.string())` | table | 数组 |
| `z.object({...})` | table | 对象 |
| `z.optional()` | - | 可选参数 |
| `.describe('desc')` | - | 参数描述（用于自动补全） |


## 构建配置

Vite 从 `src/` 根目录构建，使用自定义插件复制 `manifest.json` 到 `dist/`。输出使用 `[name]/[name].js` 模式以符合 Chrome 要求。


## 开发注意事项
- 所有代码文件的命名采用中划线”-“对单词进行分隔。