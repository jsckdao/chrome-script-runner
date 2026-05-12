import z from "zod";
import { defineAsyncFunction } from "./base";


export default defineAsyncFunction({
  name: 'wait',
  description: '等待指定的秒数',
  params: z.object({
    seconds: z.number().nonnegative().describe('要等待的秒数')
   }),
  execute: async ({ seconds }) => {
    return await new Promise(resolve => setTimeout(resolve, seconds * 1000));
   }
});