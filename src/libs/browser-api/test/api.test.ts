import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserApi } from '../base';

// Mock chrome global
const mockTabs = [
  { id: 1, title: 'Tab 1', url: 'https://example.com', active: true, windowId: 1 },
  { id: 2, title: 'Tab 2', url: 'https://test.com', active: false, windowId: 1 },
];

vi.stubGlobal('chrome', {
  tabs: {
    query: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    get: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null,
  },
});

vi.stubGlobal('fetch', vi.fn());

// Import all API definitions
import { createBrowserApi } from '../index';

describe('browser-api - API Definitions', () => {
  it('should have all expected APIs defined', () => {
    const api = createBrowserApi();

    const expectedApis = [
      'wait',
      'getCurrentTab',
      'changeCurrentTab',
      'getAllTabs',
      'navigateTabUrl',
      'openTab',
      'closeTab',
      'querySelector',
      'querySelectorAll',
      'click',
      'input',
      'httpGet',
      'httpPost',
      'stringifyJSON',
      'parseJSON',
    ];

    for (const name of expectedApis) {
      expect(api).toHaveProperty(name);
      expect(api[name]).toHaveProperty('name', name);
    }
  });

  it('should have correct function types', () => {
    const api = createBrowserApi() as BrowserApi;

    expect(api.getCurrentTab.__type).toBe('async_function');
    expect(api.changeCurrentTab.__type).toBe('async_function');
    expect(api.stringifyJSON.__type).toBe('sync_function');
    expect(api.parseJSON.__type).toBe('sync_function');
  });

  it('should have descriptions for all APIs', () => {
    const api = createBrowserApi() as BrowserApi;

    for (const key of Object.keys(api)) {
      expect(api[key as keyof BrowserApi].description).toBeTruthy();
    }
  });
});

describe('browser-api - Tab API Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentTab', () => {
    it('should return current tab info when query succeeds', async () => {
      (chrome.tabs.query as any).mockResolvedValue([mockTabs[0]]);

      const api = createBrowserApi() as BrowserApi;
      const result = await api.getCurrentTab.execute([]);
      expect(result).toEqual({
        id: 1,
        title: 'Tab 1',
        url: 'https://example.com',
        active: true,
        windowId: 1,
      });
    });

    it('should throw when no active tab', async () => {
      (chrome.tabs.query as any).mockResolvedValue([]);

      const api = createBrowserApi() as BrowserApi;
      await expect(api.getCurrentTab.execute([])).rejects.toThrow('No active tab found');
    });
  });

  describe('changeCurrentTab', () => {
    it('should switch to specified tab', async () => {
      (chrome.tabs.update as any).mockResolvedValue({ id: 2, active: true });

      const api = createBrowserApi() as BrowserApi;
      const result = await api.changeCurrentTab.execute([2]);
      expect(result).toBe(true);
      expect(chrome.tabs.update).toHaveBeenCalledWith(2, { active: true });
    });
  });

  describe('getAllTabs', () => {
    it('should return all tabs in current window', async () => {
      (chrome.tabs.query as any).mockResolvedValue(mockTabs);

      const api = createBrowserApi() as BrowserApi;
      const result = await api.getAllTabs.execute([]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Tab 1',
        url: 'https://example.com',
        active: true,
        windowId: 1,
      });
      expect(result[1]).toEqual({
        id: 2,
        title: 'Tab 2',
        url: 'https://test.com',
        active: false,
        windowId: 1,
      });
    });
  });

  describe('navigateTabUrl', () => {
    it('should navigate tab to specified URL', async () => {
      (chrome.tabs.update as any).mockResolvedValue({ id: 1, url: 'https://newurl.com' });

      const api = createBrowserApi() as BrowserApi;
      const result = await api.navigateTabUrl.execute([1, 'https://newurl.com']);
      expect(result).toBe(true);
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, { url: 'https://newurl.com' });
    });
  });

  describe('openTab', () => {
    it('should open a new tab with specified URL and wait for load complete', async () => {
      const mockNewTab = { id: 3, title: 'New Tab', url: 'https://newtab.com', active: true, windowId: 1 };
      (chrome.tabs.create as any).mockImplementation((_options: any, callback: Function) => {
        callback(mockNewTab);
      });

      (chrome.tabs.get as any).mockImplementation((_tabId: number, callback: Function) => {
        callback(mockNewTab);
      });

      let onUpdatedCallback: Function | null = null;
      (chrome.tabs.onUpdated.addListener as any).mockImplementation((cb: Function) => {
        onUpdatedCallback = cb;
      });

      const api = createBrowserApi() as BrowserApi;
      const resultPromise = api.openTab.execute(['https://newtab.com']);

      // Simulate page load complete
      onUpdatedCallback!(3, { status: 'complete' });

      const result = await resultPromise;
      expect(result).toEqual({
        id: 3,
        title: 'New Tab',
        url: 'https://newtab.com',
        active: true,
        windowId: 1,
      });
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://newtab.com' }, expect.any(Function));
    });

    it('should reject when tab creation fails', async () => {
      (chrome.tabs.create as any).mockImplementation((_options: any, callback: Function) => {
        chrome.runtime.lastError = { message: 'Failed to create tab' };
        callback(null);
      });

      let onUpdatedCallback: Function | null = null;
      (chrome.tabs.onUpdated.addListener as any).mockImplementation((cb: Function) => {
        onUpdatedCallback = cb;
      });

      const api = createBrowserApi() as BrowserApi;
      await expect(api.openTab.execute(['https://example.com'])).rejects.toThrow('Failed to create tab');
    });
  });

  describe('closeTab', () => {
    it('should close the specified tab', async () => {
      (chrome.tabs.remove as any).mockResolvedValue(undefined);

      const api = createBrowserApi() as BrowserApi;
      const result = await api.closeTab.execute([1]);

      expect(result).toBe(true);
      expect(chrome.tabs.remove).toHaveBeenCalledWith(1);
    });

    it('should close multiple tabs', async () => {
      (chrome.tabs.remove as any).mockResolvedValue(undefined);

      const api = createBrowserApi() as BrowserApi;
      await api.closeTab.execute([1]);
      await api.closeTab.execute([2]);

      expect(chrome.tabs.remove).toHaveBeenCalledWith(1);
      expect(chrome.tabs.remove).toHaveBeenCalledWith(2);
    });
  });
});

describe('browser-api - JSON API Execution', () => {
  it('should stringify data to JSON', async () => {
    const api = createBrowserApi() as BrowserApi;
    const result = api.stringifyJSON.execute([{ name: 'test', value: 42 }]);
    expect(result).toBe('{"name":"test","value":42}');
  });

  it('should parse JSON string', async () => {
    const api = createBrowserApi() as BrowserApi;
    const result = api.parseJSON.execute(['{"name":"test","value":42}']);
    expect(result).toEqual({ name: 'test', value: 42 });
  });
});

describe('browser-api - HTTP API Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should perform HTTP GET request', async () => {
    (global.fetch as any).mockResolvedValue({
      text: vi.fn().mockResolvedValue('Hello World'),
    });

    const api = createBrowserApi() as BrowserApi;
    const result = await api.httpGet.execute(['https://example.com']);

    expect(result).toBe('Hello World');
    expect(fetch).toHaveBeenCalledWith('https://example.com', { method: 'GET' });
  });

  it('should perform HTTP POST request', async () => {
    (global.fetch as any).mockResolvedValue({
      text: vi.fn().mockResolvedValue('Created'),
    });

    const api = createBrowserApi() as BrowserApi;
    const result = await api.httpPost.execute(['https://example.com', '{"data":"test"}']);

    expect(result).toBe('Created');
    expect(fetch).toHaveBeenCalledWith('https://example.com', { method: 'POST', body: '{"data":"test"}' });
  });
});

describe('browser-api - Parameter Validation', () => {
  it('should validate params with Zod schema for getCurrentTab', () => {
    const api = createBrowserApi() as BrowserApi;
    // No params required - empty array should pass
    expect(() => api.getCurrentTab.params.parse([])).not.toThrow();
  });

  it('should validate params for changeCurrentTab', () => {
    const api = createBrowserApi() as BrowserApi;
    // Should accept number
    expect(() => api.changeCurrentTab.params.parse([1])).not.toThrow();
    // Should reject non-number
    expect(() => api.changeCurrentTab.params.parse(['not-a-number'])).toThrow();
  });

  it('should validate params for navigateTabUrl', () => {
    const api = createBrowserApi() as BrowserApi;
    expect(() => api.navigateTabUrl.params.parse([1, 'https://example.com'])).not.toThrow();
    expect(() => api.navigateTabUrl.params.parse(['not-a-number', 'https://example.com'])).toThrow();
  });

  it('should validate params for openTab', () => {
    const api = createBrowserApi() as BrowserApi;
    expect(() => api.openTab.params.parse(['https://example.com'])).not.toThrow();
    expect(() => api.openTab.params.parse([123])).toThrow();
  });

  it('should validate params for closeTab', () => {
    const api = createBrowserApi() as BrowserApi;
    expect(() => api.closeTab.params.parse([1])).not.toThrow();
    expect(() => api.closeTab.params.parse(['not-a-number'])).toThrow();
  });

  it('should validate params for stringifyJSON', () => {
    const api = createBrowserApi() as BrowserApi;
    expect(() => api.stringifyJSON.params.parse([{ key: 'value' }])).not.toThrow();
  });

  it('should validate params for parseJSON', () => {
    const api = createBrowserApi() as BrowserApi;
    expect(() => api.parseJSON.params.parse(['{"key":"value"}'])).not.toThrow();
    expect(() => api.parseJSON.params.parse([123])).toThrow();
  });
});