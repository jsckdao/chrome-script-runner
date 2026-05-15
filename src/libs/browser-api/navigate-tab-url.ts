import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'navigateTabUrl',
  description: 'Navigate the specified tab to the given URL',
  params: z.tuple([
    z.number().describe('Tab ID'),
    z.string().describe('Target URL')
  ]),
  execute: async ([tabId, url]) => {
    await chrome.tabs.update(tabId, { url });
    return true;
  }
});