import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { portManager } from './port-manager';

const defaultCompletions: Completion[] = [
  // Lua keywords
  { label: 'and', type: 'keyword', detail: 'logical AND' },
  { label: 'break', type: 'keyword', detail: 'exit loop' },
  { label: 'do', type: 'keyword', detail: 'begin block' },
  { label: 'else', type: 'keyword', detail: 'else branch' },
  { label: 'elseif', type: 'keyword', detail: 'else if' },
  { label: 'end', type: 'keyword', detail: 'end block' },
  { label: 'false', type: 'keyword', detail: 'boolean false' },
  { label: 'for', type: 'keyword', detail: 'for loop' },
  { label: 'function', type: 'keyword', detail: 'function definition' },
  { label: 'if', type: 'keyword', detail: 'conditional' },
  { label: 'in', type: 'keyword', detail: 'iterator with for loop' },
  { label: 'local', type: 'keyword', detail: 'local variable' },
  { label: 'nil', type: 'keyword', detail: 'null value' },
  { label: 'not', type: 'keyword', detail: 'logical NOT' },
  { label: 'or', type: 'keyword', detail: 'logical OR' },
  { label: 'repeat', type: 'keyword', detail: 'repeat loop' },
  { label: 'return', type: 'keyword', detail: 'return value' },
  { label: 'then', type: 'keyword', detail: 'conditional branch' },
  { label: 'true', type: 'keyword', detail: 'boolean true' },
  { label: 'until', type: 'keyword', detail: 'loop end condition' },
  { label: 'while', type: 'keyword', detail: 'while loop' },

  // Lua global functions
  { label: 'print', type: 'function', detail: 'print output' },
  { label: 'pairs', type: 'function', detail: 'key-value iteration (for k,v in pairs(t))' },
  { label: 'ipairs', type: 'function', detail: 'array iteration (for i,v in ipairs(t))' },
  { label: 'type', type: 'function', detail: 'get variable type' },
  { label: 'tostring', type: 'function', detail: 'convert to string' },
  { label: 'tonumber', type: 'function', detail: 'convert to number' },
  { label: 'pcall', type: 'function', detail: 'safe call function' },
  { label: 'error', type: 'function', detail: 'throw error' },
  { label: 'assert', type: 'function', detail: 'assertion check' },
  { label: 'select', type: 'function', detail: 'vararg operation' },
  { label: 'next', type: 'function', detail: 'table iterator' },

  // String library (string.*)
  { label: 'string.sub', type: 'method', detail: 'substring s:sub(i, j)' },
  { label: 'string.len', type: 'method', detail: 'string length' },
  { label: 'string.find', type: 'method', detail: 'find substring string.find(s, pattern)' },
  { label: 'string.match', type: 'method', detail: 'match capture string.match(s, pattern)' },
  { label: 'string.gmatch', type: 'method', detail: 'global match iteration' },
  { label: 'string.gsub', type: 'method', detail: 'global replace' },
  { label: 'string.rep', type: 'method', detail: 'repeat string string.rep(s, n)' },
  { label: 'string.reverse', type: 'method', detail: 'reverse string' },
  { label: 'string.lower', type: 'method', detail: 'to lowercase' },
  { label: 'string.upper', type: 'method', detail: 'to uppercase' },
  { label: 'string.format', type: 'method', detail: 'format string' },
  { label: 'string.char', type: 'method', detail: 'number to character' },
  { label: 'string.byte', type: 'method', detail: 'character to number' },

  // Table library (table.*)
  { label: 'table.insert', type: 'method', detail: 'insert element table.insert(t, pos, val)' },
  { label: 'table.remove', type: 'method', detail: 'remove element table.remove(t, pos)' },
  { label: 'table.concat', type: 'method', detail: 'concat table elements table.concat(t, sep)' },
  { label: 'table.sort', type: 'method', detail: 'sort table.sort(t, comp)' },
  { label: 'table.pack', type: 'method', detail: 'pack to table table.pack(...args)' },
  { label: 'table.unpack', type: 'method', detail: 'unpack table table.unpack(t, i, j)' },

  // Math library (math.*)
  { label: 'math.abs', type: 'method', detail: 'absolute value' },
  { label: 'math.floor', type: 'method', detail: 'floor' },
  { label: 'math.ceil', type: 'method', detail: 'ceiling' },
  { label: 'math.max', type: 'method', detail: 'maximum math.max(a, b, ...)' },
  { label: 'math.min', type: 'method', detail: 'minimum math.min(a, b, ...)' },
  { label: 'math.random', type: 'method', detail: 'random number math.random(m, n)' },
  { label: 'math.sqrt', type: 'method', detail: 'square root' },
  { label: 'math.pow', type: 'method', detail: 'power math.pow(x, y)' },
  { label: 'math.log', type: 'method', detail: 'logarithm' },
  { label: 'math.sin', type: 'method', detail: 'sine' },
  { label: 'math.cos', type: 'method', detail: 'cosine' },
  { label: 'math.tan', type: 'method', detail: 'tangent' },
  { label: 'math.pi', type: 'constant', detail: 'pi 3.14159...' },
  { label: 'math.huge', type: 'constant', detail: 'infinity' },

  // Common API prefix hints
  { label: 'browser.', type: 'namespace', detail: 'browser API namespace' },
  { label: 'log.', type: 'namespace', detail: 'log API namespace' },
];

// Cache completion results
let cachedCompletions: Completion[] | null = null;
let cachedCompletionsLoaded = false;

// Request completion data
function fetchCompletions(): void {
  if (!portManager.isConnected()) return;

  const sent = portManager.postMessage({ type: 'getCompletions', requestId: crypto.randomUUID() });
  if (!sent) {
    // Connection not ready, retry with delay
    setTimeout(fetchCompletions, 1000);
  }
}

// Use portManager message listener
portManager.onMessage((message) => {
  if (message.type === 'completionsResponse') {
    cachedCompletions = message.completions || [];
    cachedCompletionsLoaded = true;
  }
});

// Initialize connection and request completions
portManager.connect();
fetchCompletions();

export async function chromeAPICompletions(context: CompletionContext): Promise<CompletionResult | null> {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  // Wait for response if not yet received
  if (!cachedCompletionsLoaded) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    from: word.from,
    options: [
      ...cachedCompletions || [],
      ...defaultCompletions
    ],
  };
}