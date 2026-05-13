import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'httpGet',
  description: '发送 HTTP GET 请求并返回结果文本',
  params: z.tuple([
    z.string().describe('请求 URL')
  ]),
  execute: async ([url]) => {
    const response = await fetch(url, {
      method: 'GET',
    });
    return await response.text();
  }
});