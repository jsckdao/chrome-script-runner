import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeAsyncUntilDone } from './async-executor';

describe('async-executor - basic Lua execution', () => {

  it('should execute simple Lua code without async', async () => {
    const api = {};
    const code = `
     function main()
       return 42
     end
    `;

    const result = await executeAsyncUntilDone({ code, apiObject: api,  });
    expect(result).toBe(42)
  });

  it('should execute Lua code with basic arithmetic', async () => {
    const api = {};
    const code = `
    function main()
      local a = 10
      local b = 20
      return a + b
    end
    `;

    const result = await executeAsyncUntilDone({ code, apiObject: api,  });
    expect(result).toBe(30)
  });

  it('should execute Lua code with table return', async () => {
    const api = {};
    const code = `
    function main()
      return { x = 1, y = 2 }
    end`;

    const result = await executeAsyncUntilDone({ code, apiObject: api,  });
    expect(result).toEqual({ x: 1, y: 2 });
  });
});

describe('async-executor - simple async function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should call async function and return result', async () => {
    const api = {
      test_yield: vi.fn(async (arg: any) => {
        console.log('getValue called with:', arg);
        return { value: 42 };
      })
    };
    const code = `
      function main()
        local r = yield_call('test_yield', {{ name = 'test' }})
        return r
      end
    `;

    const promise = executeAsyncUntilDone({ code, apiObject: api,  });

    // Wait for the async operation
    await vi.advanceTimersByTimeAsync(10);

    const result = await promise;
    console.log('Result:', result);
    expect(api.test_yield).toHaveBeenCalledWith({ name: 'test'});
    expect(result).toEqual({ value: 42 });
  });

  it ('should handle multiple async calls in sequence', async () => {
    const api = {
      test_yield: vi.fn(async (arg: any) => {
        console.log('test_yield called with:', arg);
        if (arg.step === 1) return { value: 'first' };
        if (arg.step === 2) return { value: 'second' };
        return { value: 'unknown' };
      })
    };
    const code = `
      function main()
        local r1 = yield_call('test_yield', {{ step = 1 }})
        local r2 = yield_call('test_yield', {{ step = 2 }})
        return { r1 = r1, r2 = r2 }
      end
    `;

    const promise = executeAsyncUntilDone({ code, apiObject: api,  });

    // Wait for the async operations
    await vi.advanceTimersByTimeAsync(10);

    const result: any = await promise;
    console.log('Result:', result);
    expect(api.test_yield).toHaveBeenCalledTimes(2);
    expect(result.r1.value).toBe('first');
    expect(result.r2.value).toBe('second'); 
  });

});


describe('async-executor lib test', () => {

  it('log test', async () => {
    const log = vi.fn();
    const api = {};
    const code = `
      function main()
        log.info("This is an info message")
        log.warn("This is a warning")
        log.error("This is an error")
        return "done"
      end
    `;
    const promise = executeAsyncUntilDone({ code, apiObject: api, log });
    // Wait for the async operations
    await vi.advanceTimersByTimeAsync(10)
    const result = await promise;
    expect(log).toHaveBeenCalledWith('INFO', 'This is an info message');
    expect(log).toHaveBeenCalledWith('WARN', 'This is a warning');
    expect(log).toHaveBeenCalledWith('ERROR', 'This is an error');
    expect(result).toBe('done');
  })

  it('browser api test', async () => {

    const browserApi = {
      calcAdd: vi.fn(async (a: number, b: number) => {
        console.log('calcAdd called with:', a, b);
        return a + b;
      }),
    }

    const code = `
      function main()
        return browser.calcAdd(5, 7)
      end
    `

    const promise = executeAsyncUntilDone({ code, apiObject: browserApi,  });
    
    // Wait for the async operations
    await vi.advanceTimersByTimeAsync(10);
    
    const result = await promise;
    expect(browserApi.calcAdd).toHaveBeenCalledWith(5, 7);
    expect(result).toBe(12);
  });
});