import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'getAllTabs',
  description: '获取当前 sidepanel 所在的 window 下的所有标签页信息',
  params: z.tuple([]),
  execute: async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      windowId: tab.windowId,
    }));
  }
});