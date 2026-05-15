import z from "zod";
import { defineSyncFunction } from "./base";

export const stringifyJSON = defineSyncFunction({
  name: 'stringifyJSON',
  description: 'Format various data into JSON string',
  params: z.tuple([
    z.any().describe('Data to serialize')
  ]),
  execute: ([data]) => {
    return JSON.stringify(data);
  }
});