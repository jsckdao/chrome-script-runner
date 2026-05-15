import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'openTab',
  description: 'Open a new tab and navigate to the specified page, returns tab information',
  params: z.tuple([
    z.string().describe('Target URL')
  ]),
  execute: async ([url]) => {
    return new Promise((resolve, reject) => {
      // Listen for tab load completion
      const onUpdated = (tabId: number, changeInfo: { status?: string }) => {
        if (changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          chrome.tabs.get(tabId, (tab) => {
            resolve({
              id: tab.id,
              title: tab.title,
              url: tab.url,
              active: tab.active,
              windowId: tab.windowId,
            });
          });
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      // Create tab
      chrome.tabs.create({ url }, (tab) => {
        if (!tab || chrome.runtime.lastError) {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          reject(new Error(chrome.runtime.lastError?.message || 'Failed to create tab'));
          return;
        }
      });
    });
  }
});