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
  name: 'input',
  description: '在指定标签页中向指定的 input 元素中输入值',
  params: z.tuple([
    z.number().describe('标签页 ID'),
    z.string().describe('CSS 选择器'),
    z.string().describe('要输入的值')
  ]),
  execute: async ([tabId, selector, value]) => {
    const result = await sendToContentScript(tabId, 'input', { selector, value });
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  }
});