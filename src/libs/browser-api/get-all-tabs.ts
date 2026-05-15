import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'getAllTabs',
  description: 'Get all tab information in the current window where the sidepanel is located',
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