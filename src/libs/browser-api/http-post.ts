import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'httpPost',
  description: 'Send HTTP POST request and return result text',
  params: z.tuple([
    z.string().describe('Request URL'),
    z.string().describe('Request body text'),
    z.object({
      headers: z.record(z.string(), z.string()).optional().describe('Request headers'),
      timeout: z.number().default(5000).describe('Request timeout in milliseconds'),
      retryCount: z.number().default(3).describe('Number of retries'),
      returnType: z.enum(['text', 'json']).default('text').describe('Format of the returned result'),
    }).optional().describe('Additional configuration options')
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