import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'llmGenerate',
  description: '调用 Chrome 内置的 Prompt API 使用 LLM 生成文本',
  params: z.tuple([
    z.string().describe('发送给 LLM 的提示文本')
  ]),
  execute: async ([prompt]) => {
    const session = await chrome.ai.gpt4.createSession();
    return await session.prompt(prompt);
  }
});