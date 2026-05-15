import z from "zod";
import { defineSyncFunction } from "./base";

export const parseJSON = defineSyncFunction({
  name: 'parseJSON',
  description: 'Convert JSON string to corresponding Lua type',
  params: z.tuple([
    z.string().describe('JSON string')
  ]),
  execute: ([text]) => {
    return JSON.parse(text);
  }
});