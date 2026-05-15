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
  name: 'click',
  description: 'Click an element in the specified tab',
  params: z.tuple([
    z.number().describe('Tab ID'),
    z.string().describe('CSS selector')
  ]),
  execute: async ([tabId, selector]) => {
    const result = await sendToContentScript(tabId, 'click', { selector });
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  }
});