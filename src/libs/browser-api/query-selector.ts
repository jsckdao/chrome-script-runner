import z from "zod";
import { defineAsyncFunction } from "./base";

// Helper to send message to content script and get response
async function sendToContentScript(tabId: number, type: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

export default defineAsyncFunction({
  name: 'querySelector',
  description: '在指定标签页中查询元素信息',
  params: z.tuple([
    z.number().describe('标签页 ID'),
    z.string().describe('CSS 选择器')
  ]),
  execute: async ([tabId, selector]) => {
    const result = await sendToContentScript(tabId, 'querySelector', { selector });
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  }
});