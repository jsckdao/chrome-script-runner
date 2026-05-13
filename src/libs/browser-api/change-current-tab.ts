import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'changeCurrentTab',
  description: '切换到指定的标签页',
  params: z.tuple([
    z.number().describe('要切换到的标签页 ID')
  ]),
  execute: async ([tabId]) => {
    await chrome.tabs.update(tabId, { active: true });
    return true;
  }
});