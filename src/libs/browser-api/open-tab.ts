import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'openTab',
  description: '打开一个新的标签页并导航到指定页面，返回 tab 信息',
  params: z.tuple([
    z.string().describe('目标 URL')
  ]),
  execute: async ([url]) => {
    return new Promise((resolve, reject) => {
      // 监听标签页加载完成
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

      // 创建标签页
      chrome.tabs.create({ url }, (tab) => {
        if (!tab || chrome.runtime.lastError) {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          reject(new Error(chrome.runtime.lastError?.message || '创建标签页失败'));
          return;
        }
      });
    });
  }
});