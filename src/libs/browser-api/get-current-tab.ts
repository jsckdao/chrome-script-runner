import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'getCurrentTab',
  description: '获取当前用户正在浏览的标签页的信息，包括标题、URL、ID 等',
  params: z.tuple([]),
  execute: async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }
    return {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      windowId: tab.windowId,
    };
  }
});