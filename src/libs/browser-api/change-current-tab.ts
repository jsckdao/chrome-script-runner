import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'changeCurrentTab',
  description: 'Switch to the specified tab',
  params: z.tuple([
    z.number().describe('Tab ID to switch to')
  ]),
  execute: async ([tabId]) => {
    await chrome.tabs.update(tabId, { active: true });
    return true;
  }
});