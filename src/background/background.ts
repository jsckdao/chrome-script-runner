// 配置 side panel 行为：点击扩展图标时打开 side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// 导入 fengari-web (不包含 js interop，避免 eval)
import { doString } from '../libs/fengari-web';

// 内联 message.ts 工具函数
type MessageType =
  | { type: 'execute'; script: string; requestId: string; tabId: number }
  | { type: 'executeResult'; requestId: string; result: unknown; error?: string }
  | { type: 'console'; requestId: string; level: 'log' | 'error' | 'warn' | 'info'; args: unknown[] }
  | { type: 'pageResult'; requestId: string; result: unknown; error?: string };

function onMessage(
  callback: (message: MessageType, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => void
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    callback(message as MessageType, sender, sendResponse);
    return false;
  });
}

onMessage((message, _, sendResponse) => {
  if (message.type === 'execute') {
    const { script, requestId } = message as Extract<MessageType, { type: 'execute' }>;
    console.log('Received execute request:', { script, requestId });

    try {
      const result = doString(script);
      sendResponse({
        type: 'executeResult',
        requestId,
        result: serialize(result),
      });
    } catch (err) {
      sendResponse({
        type: 'executeResult',
        requestId,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
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
