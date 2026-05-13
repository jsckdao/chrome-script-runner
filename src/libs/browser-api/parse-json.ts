import z from "zod";
import { defineSyncFunction } from "./base";

export const parseJSON = defineSyncFunction({
  name: 'parseJSON',
  description: '将 JSON 字符串转换为 Lua 相应类型',
  params: z.tuple([
    z.string().describe('JSON 字符串')
  ]),
  execute: ([text]) => {
    return JSON.parse(text);
  }
});