# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension with Side Panel for running sandboxed scripts. Uses Lua as the scripting language (via Fengari) to bypass CSP restrictions that block `eval` and `new Function()`.

## Build Commands

```bash
pnpm build    # Build extension to dist/
pnpm dev      # Watch mode for development
pnpm test     # Run vitest tests
```

After building, load the `dist/` folder as an unpacked Chrome extension.

## Testing

Unit tests are in `src/**/*.test.ts`. Currently, full integration tests for the Lua executor require a browser environment because Fengari has Node.js compatibility issues with test runners (memory management, WASM). The version info tests run in vitest successfully.

## Architecture

```
src/
├── background/background.ts   # Service worker - executes Lua scripts via Fengari
├── sidepanel/                 # Side Panel UI
│   ├── sidepanel.ts          # Main panel logic
│   ├── editor.ts             # CodeMirror 6 editor wrapper
│   ├── console.ts            # Console output display
│   └── completions.ts        # Chrome API autocomplete
├── content/content.ts        # Minimal content script (message bridge)
├── libs/
│   ├── fengari-web.ts        # Fengari wrapper (Lua VM in browser)
│   └── fengari-interop.ts    # JS-Lua interop (CSP-safe, no Function())
└── utils/message.ts          # Chrome message helpers
```

## Key Technical Decisions

### Why Lua instead of JavaScript?
Chrome MV3's CSP blocks `eval` and `new Function()`. Fengari runs Lua in WebAssembly, avoiding these restrictions.

### CSP-Safe Fengari-Interop
The original `fengari-interop` used `Function()` constructor which violates CSP. The local copy at `src/libs/fengari-interop.ts` was converted from JS to TypeScript and replaced `Function()` calls with safe alternatives:
- `reflectDeleteProperty` uses direct property deletion
- `make_arrow_function` uses arrow function syntax

### Script Execution Flow
1. Side Panel sends script to Background Service Worker
2. Background uses Fengari's `doString()` to execute Lua code
3. Results returned via `chrome.runtime.sendMessage`

### Build Configuration
Vite builds from `src/` root with a custom plugin that copies `manifest.json` to `dist/`. Output uses `[name]/[name].js` pattern for Chrome's required structure.

## Dependencies
- **fengari** / **fengari-web**: Lua VM for browsers
- **codemirror**: Code editor (v6)
- **@codemirror/lang-javascript**: JavaScript syntax highlighting (for display, not execution)
