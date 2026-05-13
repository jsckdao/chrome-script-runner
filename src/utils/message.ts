export type MessageType =
  | { type: 'execute'; script: string; requestId: string; tabId: number }
  | { type: 'executeResult'; requestId: string; result: unknown; error?: string }
  | { type: 'executeLog'; requestId: string; level: 'log' | 'error' | 'warn' | 'info'; message: string };

export function sendMessage(message: MessageType): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

export function sendMessageToTab(tabId: number, message: MessageType): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ ...message, tabId }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export function onMessage(
  callback: (message: MessageType, sender: chrome.runtime.MessageSender) => void
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    callback(message as MessageType, sender);
    return false;
  });
}
