import { z, ZodTypeAny, ZodObject, ZodAny } from 'zod';

/**
 * Async function definition with Zod schema validation
 */
export interface AsyncFunctionDef<T extends ZodTypeAny = any> {
  readonly __type: 'async_function';
  readonly name: string;
  readonly description: string;
  readonly params: T;
  readonly execute: (params: z.infer<T>) => Promise<unknown>;
}

export interface SyncFunctionDef<T extends ZodTypeAny = any> {
  readonly __type: 'sync_function';
  readonly name: string;
  readonly description: string;
  readonly params?: T;
  readonly execute: (params?: z.infer<T>) => unknown;
}

export type FunctionDef = AsyncFunctionDef | SyncFunctionDef;

export type BrowserApi = Record<string, FunctionDef>;

/**
 * Define an async function with Zod schema for parameter validation.
 * Generates metadata for code completion and documentation.
 *
 * @example
 * const sendMessage = defineAsyncFunction({
 *   name: "sendMessage",
 *   description: "Send a message to the active tab",
 *   params: z.object({
 *     message: z.string().describe("The message content"),
 *     tabId: z.number().optional()
 *   }),
 *   execute: async (params) => {
 *     // implementation
 *   }
 * })
 */
export function defineAsyncFunction<T extends ZodAny>(
  def: {
    name: string;
    description: string;
    params: T;
    execute: (params: z.infer<T>) => Promise<unknown>;
  }
): AsyncFunctionDef<T> {
  return {
    __type: 'async_function',
    name: def.name,
    description: def.description,
    params: def.params,
    execute: def.execute
  } as AsyncFunctionDef<T>;
}


/**
 * Define a synchronous function with optional Zod schema for parameter validation.
 * @param def 
 * @returns 
 */
export function defineSyncFunction<T extends ZodAny>(
  def: {
    name: string;
    description: string;
    params: T;
    execute: (params?: z.infer<T>) => unknown;
  }
): SyncFunctionDef<T> {
  return {
    __type: 'sync_function',
    name: def.name,
    description: def.description,
    params: def.params,
    execute: def.execute
  }
}


/**
 * Extract parameter descriptions from Zod schema for code completion.
 */
export function getParamDescriptions<T extends ZodObject<any>>(
  schema: T
): Record<string, { type: string; description: string; required: boolean }> {
  const shape = schema.shape;
  const result: Record<string, { type: string; description: string; required: boolean }> = {};

  for (const [key, field] of Object.entries(shape)) {
    const zodField = field as any;
    result[key] = {
      type: zodField._def?.typeName || 'unknown',
      description: zodField.description || '',
      required: !zodField.isOptional?.()
    };
  }

  return result;
}

/**
 * Convert AsyncFunctionDef to completion info for editor integration.
 */
export function toCompletionInfo<T extends ZodObject<any>>(
  def: AsyncFunctionDef<T>
): {
  name: string;
  description: string;
  params: { name: string; type: string; description: string; required: boolean }[];
  returnType: string;
} {
  const paramDescriptions = getParamDescriptions(def.params);

  return {
    name: def.name,
    description: def.description,
    params: Object.entries(paramDescriptions).map(([name, info]) => ({
      name,
      type: info.type,
      description: info.description,
      required: info.required
    })),
    returnType: 'Promise<unknown>'
  };
}