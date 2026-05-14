import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'closeTab',
  description: '关闭一个标签页',
  params: z.tuple([
    z.number().describe('标签页 ID')
  ]),
  execute: async ([tabId]) => {
    await chrome.tabs.remove(tabId);
    return true;
  }
});