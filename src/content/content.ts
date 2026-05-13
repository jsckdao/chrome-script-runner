// Content Script - 作为桥梁接收来自 background 的消息
// 但实际脚本执行逻辑在 background.ts 的 sandbox 函数中

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ ready: true });
    return false;
  }

  if (message.type === 'querySelector') {
    try {
      const el = document.querySelector(message.selector);
      if (!el) {
        sendResponse({ error: `Element not found: ${message.selector}` });
        return false;
      }
      const rect = el.getBoundingClientRect();
      sendResponse({
        tagName: el.tagName,
        textContent: el.textContent?.slice(0, 200),
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      });
    } catch (e) {
      sendResponse({ error: String(e) });
    }
    return false;
  }

  if (message.type === 'querySelectorAll') {
    try {
      const elements = document.querySelectorAll(message.selector);
      const result = [];
      for (let i = 0; i < Math.min(elements.length, 100); i++) {
        const el = elements[i];
        const rect = el.getBoundingClientRect();
        result.push({
          tagName: el.tagName,
          textContent: el.textContent?.slice(0, 200),
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        });
      }
      sendResponse(result);
    } catch (e) {
      sendResponse({ error: String(e) });
    }
    return false;
  }

  if (message.type === 'click') {
    try {
      const el = document.querySelector(message.selector);
      if (!el) {
        sendResponse({ error: `Element not found: ${message.selector}` });
        return false;
      }
      (el as HTMLElement).click();
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ error: String(e) });
    }
    return false;
  }

  if (message.type === 'input') {
    try {
      const el = document.querySelector(message.selector);
      if (!el) {
        sendResponse({ error: `Element not found: ${message.selector}` });
        return false;
      }
      const target = el as HTMLInputElement | HTMLTextAreaElement;
      if ('value' in target) {
        target.value = message.value;
        // Dispatch input event
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'Element does not support input value' });
      }
    } catch (e) {
      sendResponse({ error: String(e) });
    }
    return false;
  }

  return false;
});
