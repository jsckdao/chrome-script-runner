import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'navigateTabUrl',
  description: '使指定标签页跳转到指定 URL',
  params: z.tuple([
    z.number().describe('标签页 ID'),
    z.string().describe('目标 URL')
  ]),
  execute: async ([tabId, url]) => {
    await chrome.tabs.update(tabId, { url });
    return true;
  }
});