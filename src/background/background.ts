// 配置 side panel 行为：点击扩展图标时打开 side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

import { functionDefToCompletion } from '../libs/browser-api/base';
import { createBrowserApi } from '../libs/browser-api';
// 导入 fengari-web (不包含 js interop，避免 eval)
import { executeAsyncUntilDone } from '../libs/async-executor';
import { BrowserApi } from '../libs/browser-api/base';

// 内联 message.ts 工具函数
type MessageType =
  | { type: 'execute'; script: string; requestId: string; tabId: number }
  | { type: 'executeResult'; requestId: string; result: unknown; error?: string }
  | { type: 'console'; requestId: string; level: 'log' | 'error' | 'warn' | 'info'; args: unknown[] }
  | { type: 'pageResult'; requestId: string; result: unknown; error?: string }
  | { type: 'getCompletions'; requestId: string };

function onMessage(
  callback: (message: MessageType, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => void
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    callback(message as MessageType, sender, sendResponse);
    return false;
  });
}

function wrapBrowserApi(api: BrowserApi) {
  const res: Record<string, Function> = {};
  Object.keys(api).forEach((k) => {
    const v = api[k];
    res[k] = async (...args: any[]) => {
      args = v.params.parse(args);
      return await v.execute(args);
    }
  });
  return res;
}

// 维护来自 sidepanel 的 port
let sidePanelPort: chrome.runtime.Port | null = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel-to-background') {
    sidePanelPort = port;
    port.onDisconnect.addListener(() => {
      sidePanelPort = null;
    });


    port.onMessage.addListener(async (message) => {
  if (message.type === 'execute') {
    const { script, requestId } = message as Extract<MessageType, { type: 'execute' }>;
    console.log('Received execute request:', { script, requestId });

    try {
      const browserApi = wrapBrowserApi(createBrowserApi());
      const result = await executeAsyncUntilDone({
        code: script,
        apiObject: browserApi,
        log: (level, msg) => {
          sidePanelPort?.postMessage({
            type: 'executeLog',
            requestId,
            level,
            message: msg,
          });
        }
      });
      console.log('result', result)
      sidePanelPort?.postMessage({
        type: 'executeResult',
        requestId,
        result,
      });
    } catch (err) {
      console.error(err);
      sidePanelPort?.postMessage({
        type: 'executeResult',
        requestId,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else if (message.type === 'getCompletions') {
    const { requestId } = message as Extract<MessageType, { type: 'getCompletions' }>;
    const api = createBrowserApi();
    if (!api) {
      console.error('createBrowserApi returned undefined');
      return;
    }
    const completions = Object.values(api).map(functionDefToCompletion);
    sidePanelPort?.postMessage({
      type: 'completionsResponse',
      requestId,
      completions,
    });
  }
})
  }
});

function serialize(value: unknown): unknown {
  if (value === undefined) return 'undefined';
  if (value === null) return null;
  if (typeof value === 'function') return value.toString();
  if (value instanceof Error) return { message: value.message, name: value.name };
  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
  return value;
}
