import { Completion } from '@codemirror/autocomplete';
import { z, ZodTuple } from 'zod';

/**
 * Async function definition with Zod schema validation
 */
export interface AsyncFunctionDef<T extends ZodTuple = any> {
  readonly __type: 'async_function';
  readonly name: string;
  readonly description: string;
  readonly params: T;
  readonly execute: (params: z.infer<T>) => Promise<unknown>;
}

export interface SyncFunctionDef<T extends ZodTuple = any> {
  readonly __type: 'sync_function';
  readonly name: string;
  readonly description: string;
  readonly params: T;
  readonly execute: (params: z.infer<T>) => unknown;
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
export function defineAsyncFunction<T extends ZodTuple>(
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
export function defineSyncFunction<T extends ZodTuple>(
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
export function getParamDescriptions(
  schema: ZodTuple | undefined
): Record<string, { type: string; description: string; required: boolean }> {
  const result: Record<string, { type: string; description: string; required: boolean }> = {};

  if (!schema || typeof schema !== 'object' || !('shape' in schema)) {
    return result;
  }

  const shape = (schema as any).shape;

  // The shape of a tuple is an array, using index as key
  shape.forEach((field: any, index: number) => {
    const zodField = field as any;
    result[String(index)] = {
      type: zodField._def?.typeName || 'unknown',
      description: zodField.description || '',
      required: !zodField.isOptional?.()
    };
  });

  return result;
}

/**
 * Convert AsyncFunctionDef to completion info for editor integration.
 */
export function toCompletionInfo<T extends ZodTuple<any>>(
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
    params: Object.entries(paramDescriptions).map(([index, info]) => ({
      name: `arg${index}`,
      type: info.type,
      description: info.description,
      required: info.required
    })),
    returnType: 'Promise<unknown>'
  };
}

/**
 * Convert a FunctionDef to a CodeMirror Completion object for code completion.
 */
export function functionDefToCompletion(def: FunctionDef): Completion {
  const paramDescriptions = getParamDescriptions(def.params);
  const params = Object.entries(paramDescriptions).map(([index, info]) => ({
    name: `arg${index}`,
    type: info.type,
    description: info.description,
    required: info.required
  }));

  const infoText = params.length > 0
    ? params.map(p => `  ${p.name}: ${p.description}`).join('\n')
    : '  (no parameters)';

  const fullInfo = `${def.description}\n\nParameters:\n${infoText}`;

  return {
    label: `browser.${def.name}`,
    type: 'function',
    detail: def.description,
    info: fullInfo,
  } as Completion;
}