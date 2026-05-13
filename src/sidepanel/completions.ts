import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

// 缓存补全结果
let cachedCompletions: Completion[] | null = null;
let completionsPort: chrome.runtime.Port | null = null;

// 建立 port 连接
function getCompletionsPort(): chrome.runtime.Port {
  if (!completionsPort) {
    completionsPort = chrome.runtime.connect({ name: 'sidepanel-to-background' });
    completionsPort.onMessage.addListener((message) => {
      if (message.type === 'completionsResponse' && cachedCompletions === null) {
        cachedCompletions = message.completions || [];
      }
    });
  }
  return completionsPort;
}

// 从 background 请求补全信息
function fetchCompletions(): void {
  const requestId = crypto.randomUUID();
  getCompletionsPort().postMessage({ type: 'getCompletions', requestId });
}

// 初始化时请求补全
fetchCompletions();

export async function chromeAPICompletions(context: CompletionContext): Promise<CompletionResult | null> {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  // 如果还没收到响应，等待一下
  if (!cachedCompletions) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    from: word.from,
    options: cachedCompletions || [],
  };
}
