// Content Script - acts as a bridge to receive messages from background
// Actual script execution logic is in sandbox function in background.ts

const defaultAttrs = [
  'id', 'className',  'href', 'src', 'style', 'alt', 'title', 
  'target', 'rel ','type', 'value', 'checked', 'disabled', 'readonly',
  'width', 'height', 'tabindex'
];

function takeElementAttrs(el: HTMLElement): Record<string, string> {
  const attrs = {} as Record<string, string>;
  for (const attr of defaultAttrs) {
    if (el.hasAttribute(attr)) {
      attrs[attr] = el.getAttribute(attr) || '';
    }
  }
  return attrs;
}

function takeElementInfo(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    tagName: el.tagName,
    textContent: el.textContent?.slice(0, 200),
    attrs: takeElementAttrs(el),
    dataset: {
      ...el.dataset
    },
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  }
}

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
      sendResponse(takeElementInfo(el));
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
        result.push(takeElementInfo(el));
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
