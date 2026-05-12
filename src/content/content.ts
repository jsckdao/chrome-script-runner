// Content Script - 作为桥梁接收来自 background 的消息
// 但实际脚本执行逻辑在 background.ts 的 sandbox 函数中

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ ready: true });
  }
  return false;
});
