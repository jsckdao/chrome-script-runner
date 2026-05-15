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
import openTab from './open-tab';
import closeTab from './close-tab';

// All methods that need to be exposed to the Lua environment are registered here
const browserApiFunctions: FunctionDef[] = [
  wait,
  getCurrentTab,
  changeCurrentTab,
  getAllTabs,
  navigateTabUrl,
  openTab,
  closeTab,
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
 * Create a browser API object containing all methods to be exposed to the Lua environment
 * @returns
 */
export function createBrowserApi(): BrowserApi {
  const api: BrowserApi = {};
  for (const funcDef of browserApiFunctions) {
    api[funcDef.name] = funcDef;
  }
  return api;
}