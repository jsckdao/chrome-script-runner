# Chrome Runner

一款带有侧边栏的 Chrome 扩展程序，用于运行沙箱脚本，来自动化一些浏览器操作。采用 Lua 作为脚本语言（通过 Fengari），以绕过阻止 `eval` 和 `new Function()` 的 CSP（内容安全策略）限制。

## 构建

```bash
pnpm install
pnpm build    # 构建到 dist/
pnpm dev      # 开发模式（监视）
```

将 `dist/` 文件夹作为已解压的 Chrome 扩展程序加载。

## 功能特点

- **Lua 脚本**：使用 Lua 编写自动化脚本，通过 WebAssembly 安全执行
- **标签页管理**：查询、打开、关闭和切换标签页
- **DOM 操作**：通过 CSS 选择器选择元素、点击、输入文本
- **HTTP 请求**：GET 和 POST 请求，支持自定义请求头和超时配置
- **内置 AI**：访问 Chrome 内置的 LLM 生成文本
- **实时控制台**：直接在侧边栏查看日志和输出

## 可用 API

所有 API 通过 `browser` 全局对象调用，例如 `browser.wait(5)`。

### 等待

| API | 描述 | 参数 |
|-----|------|------|
| `browser.wait(seconds)` | 等待指定的秒数 | `seconds` (number) |

### 标签页管理

| API | 描述 | 参数 |
|-----|------|------|
| `browser.getCurrentTab()` | 获取当前标签页信息 | 无 |
| `browser.getAllTabs()` | 获取当前窗口所有标签页 | 无 |
| `browser.changeCurrentTab(tabId)` | 切换到指定标签页 | `tabId` (number) |
| `browser.navigateTabUrl(tabId, url)` | 使标签页跳转到指定 URL | `tabId` (number), `url` (string) |
| `browser.openTab(url)` | 打开新标签页并导航 | `url` (string) |
| `browser.closeTab(tabId)` | 关闭标签页 | `tabId` (number) |

### DOM 操作

| API | 描述 | 参数 |
|-----|------|------|
| `browser.querySelector(tabId, selector)` | 查询单个元素 | `tabId` (number), `selector` (string) |
| `browser.querySelectorAll(tabId, selector)` | 查询所有匹配元素 | `tabId` (number), `selector` (string) |
| `browser.click(tabId, selector)` | 点击元素 | `tabId` (number), `selector` (string) |
| `browser.input(tabId, selector, text)` | 向 input 元素输入文本 | `tabId` (number), `selector` (string), `text` (string) |

### HTTP 请求

| API | 描述 | 参数 |
|-----|------|------|
| `browser.httpGet(url)` | 发送 GET 请求 | `url` (string) |
| `browser.httpPost(url, body, options?)` | 发送 POST 请求 | `url` (string), `body` (string), `options` (可选) |

`options` 参数：
- `headers` (record<string, string>)：请求头
- `timeout` (number, 默认 5000)：超时时间（毫秒）
- `retryCount` (number, 默认 3)：重试次数
- `returnType` ("text" | "json", 默认 "text")：返回格式

### JSON 处理

| API | 描述 | 参数 |
|-----|------|------|
| `browser.stringifyJSON(data)` | 序列化为 JSON 字符串 | `data` (any) |
| `browser.parseJSON(json)` | JSON 解析为 Lua 对象 | `json` (string) |

## 使用示例

```lua
-- 获取当前标签页
local tab = browser.getCurrentTab()

-- 等待加载
browser.wait(2)

-- 填写表单
browser.input(tab.id, "#username", "myuser")
browser.input(tab.id, "#password", "mypass")

-- 点击登录按钮
browser.click(tab.id, "#login")

-- 等待页面跳转
browser.wait(3)

-- 打印日志
log.info("登录完成")
```

## 项目结构

```
src/
├── background/           # Service Worker - Lua 执行引擎
├── sidepanel/           # 侧边栏 UI
├── content/             # 内容脚本
├── libs/
│   ├── fengari-interop.ts   # CSP 安全 JS-Lua 互操作
│   ├── async-executor.ts    # Lua 协程执行器
│   └── browser-api/         # 浏览器 API 定义
└── types/               # 类型声明
```

## 许可证

MIT