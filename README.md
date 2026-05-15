# Chrome Runner

A Chrome extension with a sidebar for running sandboxed scripts. Uses Lua as the scripting language (via Fengari) to bypass CSP restrictions that block `eval` and `new Function()`.

<img width="1913" height="980" alt="45b72f7a-f9d7-4634-b801-38b775b8f53e" src="https://github.com/user-attachments/assets/c18964ee-1f13-4e03-a9a8-a7986563cd32" />

## Build

```bash
pnpm install
pnpm build    # Build to dist/
pnpm dev      # Development mode (watch)
```

Load `dist/` as an unpacked Chrome extension.

## Features

- **Lua Scripting**: Write automation scripts in Lua, executed safely via WebAssembly
- **Tab Management**: Query, open, close, and switch between tabs
- **DOM Interaction**: Select elements, click, input text via CSS selectors
- **HTTP Requests**: GET and POST requests with configurable headers and timeouts
- **Built-in AI**: Access Chrome's built-in LLM for text generation
- **Real-time Console**: View logs and output directly in the sidebar

## Available APIs

All APIs are accessed via the `browser` global object, e.g., `browser.wait(5)`.

### Wait

| API | Description | Parameters |
|-----|-------------|------------|
| `browser.wait(seconds)` | Wait for specified seconds | `seconds` (number) |

### Tab Management

| API | Description | Parameters |
|-----|-------------|------------|
| `browser.getCurrentTab()` | Get current tab info | None |
| `browser.getAllTabs()` | Get all tabs in current window | None |
| `browser.changeCurrentTab(tabId)` | Switch to specified tab | `tabId` (number) |
| `browser.navigateTabUrl(tabId, url)` | Navigate tab to URL | `tabId` (number), `url` (string) |
| `browser.openTab(url)` | Open new tab and navigate | `url` (string) |
| `browser.closeTab(tabId)` | Close tab | `tabId` (number) |

### DOM Interaction

| API | Description | Parameters |
|-----|-------------|------------|
| `browser.querySelector(tabId, selector)` | Query single element | `tabId` (number), `selector` (string) |
| `browser.querySelectorAll(tabId, selector)` | Query all matching elements | `tabId` (number), `selector` (string) |
| `browser.click(tabId, selector)` | Click element | `tabId` (number), `selector` (string) |
| `browser.input(tabId, selector, text)` | Input text to element | `tabId` (number), `selector` (string), `text` (string) |

### HTTP Requests

| API | Description | Parameters |
|-----|-------------|------------|
| `browser.httpGet(url)` | Send GET request | `url` (string) |
| `browser.httpPost(url, body, options?)` | Send POST request | `url` (string), `body` (string), `options` (optional) |

`options` parameter:
- `headers` (record<string, string>): Request headers
- `timeout` (number, default 5000): Timeout in ms
- `retryCount` (number, default 3): Retry count
- `returnType` ("text" | "json", default "text"): Return type

### JSON Processing

| API | Description | Parameters |
|-----|-------------|------------|
| `browser.stringifyJSON(data)` | Serialize to JSON string | `data` (any) |
| `browser.parseJSON(json)` | Parse JSON to Lua object | `json` (string) |

## Usage Example

```lua
-- Get current tab
local tab = browser.getCurrentTab()

-- Wait for page load
browser.wait(2)

-- Fill form
browser.input(tab.id, "#username", "myuser")
browser.input(tab.id, "#password", "mypass")

-- Click login button
browser.click(tab.id, "#login")

-- Wait for navigation
browser.wait(3)

-- Log message
log.info("Login complete")
```

## Project Structure

```
src/
├── background/           # Service Worker - Lua execution engine
├── sidepanel/           # Sidebar UI
├── content/             # Content script
├── libs/
│   ├── fengari-interop.ts   # CSP-safe JS-Lua interop
│   ├── async-executor.ts    # Lua coroutine executor
│   └── browser-api/        # Browser API definitions
└── types/               # Type declarations
```

## License

MIT
