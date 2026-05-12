import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

// Chrome Extension API 补全列表
const chromeAPICompletionsList = [
  // 全局函数
  { label: 'log', type: 'function', detail: '输出日志', info: 'log(...args: unknown[])' },
  { label: 'error', type: 'function', detail: '输出错误', info: 'error(...args: unknown[])' },
  { label: 'warn', type: 'function', detail: '输出警告', info: 'warn(...args: unknown[])' },
  { label: 'info', type: 'function', detail: '输出信息', info: 'info(...args: unknown[])' },
  { label: 'getPageInfo', type: 'function', detail: '获取当前页面信息', info: 'getPageInfo(): { url, title, readyState }' },

  // window 对象常用属性
  { label: 'window.location', type: 'property', detail: '当前 URL 信息' },
  { label: 'window.document', type: 'property', detail: '当前文档对象' },
  { label: 'window.console', type: 'property', detail: '浏览器控制台' },
  { label: 'window.navigator', type: 'property', detail: '浏览器信息' },

  // document 对象常用方法
  { label: 'document.querySelector', type: 'method', detail: '查询单个元素' },
  { label: 'document.querySelectorAll', type: 'method', detail: '查询所有元素' },
  { label: 'document.getElementById', type: 'method', detail: '通过 ID 获取元素' },
  { label: 'document.createElement', type: 'method', detail: '创建元素' },
  { label: 'document.title', type: 'property', detail: '页面标题' },
  { label: 'document.body', type: 'property', detail: 'body 元素' },
  { label: 'document.readyState', type: 'property', detail: '文档状态' },

  // 元素操作
  { label: 'element.textContent', type: 'property', detail: '元素文本内容' },
  { label: 'element.innerHTML', type: 'property', detail: '元素 HTML 内容' },
  { label: 'element.classList', type: 'property', detail: '元素的类列表' },
  { label: 'element.style', type: 'property', detail: '元素样式' },
  { label: 'element.addEventListener', type: 'method', detail: '添加事件监听器' },
  { label: 'element.removeEventListener', type: 'method', detail: '移除事件监听器' },
  { label: 'element.getAttribute', type: 'method', detail: '获取属性' },
  { label: 'element.setAttribute', type: 'method', detail: '设置属性' },
  { label: 'element.appendChild', type: 'method', detail: '添加子元素' },
  { label: 'element.remove', type: 'method', detail: '移除元素' },
  { label: 'element.click', type: 'method', detail: '模拟点击' },
  { label: 'element.focus', type: 'method', detail: '获取焦点' },
  { label: 'element.scrollIntoView', type: 'method', detail: '滚动到视图' },

  // 常用值
  { label: 'null', type: 'constant', detail: '空值' },
  { label: 'undefined', type: 'constant', detail: '未定义' },
  { label: 'true', type: 'constant', detail: '真' },
  { label: 'false', type: 'constant', detail: '假' },

  // 常用类
  { label: 'Array', type: 'class', detail: '数组' },
  { label: 'Object', type: 'class', detail: '对象' },
  { label: 'String', type: 'class', detail: '字符串' },
  { label: 'Number', type: 'class', detail: '数字' },
  { label: 'Boolean', type: 'class', detail: '布尔值' },
  { label: 'JSON', type: 'class', detail: 'JSON 处理' },
  { label: 'Math', type: 'class', detail: '数学运算' },
  { label: 'Date', type: 'class', detail: '日期时间' },
  { label: 'Promise', type: 'class', detail: 'Promise 对象' },
  { label: 'Set', type: 'class', detail: 'Set 集合' },
  { label: 'Map', type: 'class', detail: 'Map 对象' },
  { label: 'RegExp', type: 'class', detail: '正则表达式' },
  { label: 'Error', type: 'class', detail: '错误对象' },

  // 常用方法
  { label: 'console.log', type: 'method', detail: '控制台输出' },
  { label: 'console.error', type: 'method', detail: '控制台错误' },
  { label: 'console.warn', type: 'method', detail: '控制台警告' },
  { label: 'console.info', type: 'method', detail: '控制台信息' },
  { label: 'console.table', type: 'method', detail: '表格形式输出' },
  { label: 'console.dir', type: 'method', detail: '对象形式输出' },
  { label: 'setTimeout', type: 'function', detail: '延迟执行' },
  { label: 'setInterval', type: 'function', detail: '定时执行' },
  { label: 'clearTimeout', type: 'function', detail: '清除延迟' },
  { label: 'clearInterval', type: 'function', detail: '清除定时器' },
  { label: 'fetch', type: 'function', detail: '网络请求' },
  { label: 'alert', type: 'function', detail: '弹窗提示' },
  { label: 'confirm', type: 'function', detail: '确认对话框' },
  { label: 'prompt', type: 'function', detail: '输入对话框' },
];

export function chromeAPICompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  return {
    from: word.from,
    options: chromeAPICompletionsList.map((item) => ({
      label: item.label,
      type: item.type,
      detail: item.detail,
      info: item.info ? () => item.info : undefined,
    })),
  };
}
