import { BrowserApi, FunctionDef } from './base';
import wait from './wait';
import getCurrentTab from './get-current-tab';
import changeCurrentTab from './change-current-tab';
import getAllTabs from './get-all-tabs';
import navigateTabUrl from './navigate-tab-url';
import querySelector from './query-selector';
import querySelectorAll from './query-selector-all';
import click from './click';
import input from './input';
import httpGet from './http-get';
import httpPost from './http-post';
import { stringifyJSON } from './stringify-json';
import { parseJSON } from './parse-json';

// 所有需要暴露到 Lua 环境中的方法都在这里注册
const browserApiFunctions: FunctionDef[] = [
  wait,
  getCurrentTab,
  changeCurrentTab,
  getAllTabs,
  navigateTabUrl,
  querySelector,
  querySelectorAll,
  click,
  input,
  httpGet,
  httpPost,
  stringifyJSON,
  parseJSON,
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