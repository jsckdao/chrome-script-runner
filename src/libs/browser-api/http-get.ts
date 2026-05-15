import z from "zod";
import { defineAsyncFunction } from "./base";

export default defineAsyncFunction({
  name: 'httpGet',
  description: 'Send HTTP GET request and return result text',
  params: z.tuple([
    z.string().describe('Request URL')
  ]),
  execute: async ([url]) => {
    const response = await fetch(url, {
      method: 'GET',
    });
    return await response.text();
  }
});