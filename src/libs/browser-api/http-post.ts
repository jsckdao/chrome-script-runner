import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'httpPost',
  description: '发送 HTTP POST 请求并返回结果文本',
  params: z.tuple([
    z.string().describe('请求 URL'),
    z.string().describe('请求体文本')
  ]),
  execute: async ([url, bodyText]) => {
    const response = await fetch(url, {
      method: 'POST',
      body: bodyText,
    });
    return await response.text();
  }
});