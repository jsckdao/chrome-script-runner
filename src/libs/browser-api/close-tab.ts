import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'closeTab',
  description: 'Close a tab',
  params: z.tuple([
    z.number().describe('Tab ID')
  ]),
  execute: async ([tabId]) => {
    await chrome.tabs.remove(tabId);
    return true;
  }
});