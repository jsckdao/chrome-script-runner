import z from "zod";
import { defineSyncFunction } from "./base";

export const stringifyJSON = defineSyncFunction({
  name: 'stringifyJSON',
  description: '将各种数据格式化为 JSON 字符串',
  params: z.tuple([
    z.any().describe('要序列化的数据')
  ]),
  execute: ([data]) => {
    return JSON.stringify(data);
  }
});