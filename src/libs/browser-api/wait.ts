import z from "zod";
import { defineAsyncFunction } from "./base";


export default defineAsyncFunction({
  name: 'wait',
  description: 'Wait for the specified number of seconds',
  params: z.tuple([
    z.number().nonnegative().describe('Number of seconds to wait')
  ]),
  execute: async ([seconds]) => {
    return await new Promise(resolve => setTimeout(resolve, seconds * 1000));
   }
});