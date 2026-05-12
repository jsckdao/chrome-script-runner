import { BrowserApi, FunctionDef } from './base';
import wait from './wait';

// 所有需要暴露到 Lua 环境中的方法都在这里注册
const browserApiFunctions: FunctionDef[] = [
  wait,
]

/**
 * 创建浏览器 API 对象，包含所有需要暴露到 Lua 环境中的方法
 * @returns 
 */
export function createBrowserApi(): BrowserApi {
  const api: BrowserApi = {};
  for (const funcDef of browserApiFunctions) {
    api[funcDef.name] = funcDef;
  }
  return api;
}