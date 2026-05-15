import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'httpPost',
  description: '发送 HTTP POST 请求并返回结果文本',
  params: z.tuple([
    z.string().describe('请求 URL'),
    z.string().describe('请求体文本'),
    z.object({
      headers: z.record(z.string(), z.string()).optional().describe('请求头信息'),
      timeout: z.number().default(5000).describe('请求超时时间（毫秒）'),
      retryCount: z.number().default(3).describe('重试次数'),
      returnType: z.enum(['text', 'json']).default('text').describe('返回结果的格式'),
    }).optional().describe('其他配置信息')
  ]),
  execute: async ([url, bodyText, options]) => {
    const { headers = {}, timeout = 5000, retryCount = 3, returnType = 'text' } = options || {};

    const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ms);
      try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          body: bodyText,
          headers,
        }, timeout);

        if (returnType === 'json') {
          const res = await response.json();
          console.log('json request', res)
          return res
        }
        return await response.text();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }
});