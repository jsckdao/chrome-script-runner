import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const defaultCompletions: Completion[] = [
  // Lua 关键字
  { label: 'and', type: 'keyword', detail: '逻辑与' },
  { label: 'break', type: 'keyword', detail: '跳出循环' },
  { label: 'do', type: 'keyword', detail: '代码块开始' },
  { label: 'else', type: 'keyword', detail: '否则分支' },
  { label: 'elseif', type: 'keyword', detail: '否则如果' },
  { label: 'end', type: 'keyword', detail: '代码块结束' },
  { label: 'false', type: 'keyword', detail: '布尔值假' },
  { label: 'for', type: 'keyword', detail: 'for 循环' },
  { label: 'function', type: 'keyword', detail: '函数定义' },
  { label: 'if', type: 'keyword', detail: '条件判断' },
  { label: 'in', type: 'keyword', detail: '迭代器配合' },
  { label: 'local', type: 'keyword', detail: '局部变量' },
  { label: 'nil', type: 'keyword', detail: '空值' },
  { label: 'not', type: 'keyword', detail: '逻辑非' },
  { label: 'or', type: 'keyword', detail: '逻辑或' },
  { label: 'repeat', type: 'keyword', detail: '重复循环' },
  { label: 'return', type: 'keyword', detail: '返回值' },
  { label: 'then', type: 'keyword', detail: '条件分支' },
  { label: 'true', type: 'keyword', detail: '布尔值真' },
  { label: 'until', type: 'keyword', detail: '循环结束条件' },
  { label: 'while', type: 'keyword', detail: 'while 循环' },

  // Lua 全局函数
  { label: 'print', type: 'function', detail: '打印输出' },
  { label: 'pairs', type: 'function', detail: '键值迭代 (for k,v in pairs(t))' },
  { label: 'ipairs', type: 'function', detail: '数组迭代 (for i,v in ipairs(t))' },
  { label: 'type', type: 'function', detail: '获取变量类型' },
  { label: 'tostring', type: 'function', detail: '转换为字符串' },
  { label: 'tonumber', type: 'function', detail: '转换为数字' },
  { label: 'pcall', type: 'function', detail: '安全调用函数' },
  { label: 'error', type: 'function', detail: '抛出错误' },
  { label: 'assert', type: 'function', detail: '断言检查' },
  { label: 'select', type: 'function', detail: '可变参数操作' },
  { label: 'next', type: 'function', detail: '表迭代器' },

  // 字符串库 (string.*)
  { label: 'string.sub', type: 'method', detail: '字符串截取 s:sub(i, j)' },
  { label: 'string.len', type: 'method', detail: '字符串长度' },
  { label: 'string.find', type: 'method', detail: '查找子串 string.find(s, pattern)' },
  { label: 'string.match', type: 'method', detail: '匹配捕获 string.match(s, pattern)' },
  { label: 'string.gmatch', type: 'method', detail: '全局匹配迭代' },
  { label: 'string.gsub', type: 'method', detail: '全局替换' },
  { label: 'string.rep', type: 'method', detail: '重复字符串 string.rep(s, n)' },
  { label: 'string.reverse', type: 'method', detail: '反转字符串' },
  { label: 'string.lower', type: 'method', detail: '转小写' },
  { label: 'string.upper', type: 'method', detail: '转大写' },
  { label: 'string.format', type: 'method', detail: '格式化字符串' },
  { label: 'string.char', type: 'method', detail: '数字转字符' },
  { label: 'string.byte', type: 'method', detail: '字符转数字' },

  // 表库 (table.*)
  { label: 'table.insert', type: 'method', detail: '插入元素 table.insert(t, pos, val)' },
  { label: 'table.remove', type: 'method', detail: '删除元素 table.remove(t, pos)' },
  { label: 'table.concat', type: 'method', detail: '连接表元素 table.concat(t, sep)' },
  { label: 'table.sort', type: 'method', detail: '排序 table.sort(t, comp)' },
  { label: 'table.pack', type: 'method', detail: '打包为表 table.pack(...args)' },
  { label: 'table.unpack', type: 'method', detail: '解包表 table.unpack(t, i, j)' },

  // 数学库 (math.*)
  { label: 'math.abs', type: 'method', detail: '绝对值' },
  { label: 'math.floor', type: 'method', detail: '向下取整' },
  { label: 'math.ceil', type: 'method', detail: '向上取整' },
  { label: 'math.max', type: 'method', detail: '最大值 math.max(a, b, ...)' },
  { label: 'math.min', type: 'method', detail: '最小值 math.min(a, b, ...)' },
  { label: 'math.random', type: 'method', detail: '随机数 math.random(m, n)' },
  { label: 'math.sqrt', type: 'method', detail: '平方根' },
  { label: 'math.pow', type: 'method', detail: '幂运算 math.pow(x, y)' },
  { label: 'math.log', type: 'method', detail: '对数' },
  { label: 'math.sin', type: 'method', detail: '正弦' },
  { label: 'math.cos', type: 'method', detail: '余弦' },
  { label: 'math.tan', type: 'method', detail: '正切' },
  { label: 'math.pi', type: 'constant', detail: '圆周率 3.14159...' },
  { label: 'math.huge', type: 'constant', detail: '无穷大' },

  // 常见 API 前缀提示
  { label: 'browser.', type: 'namespace', detail: '浏览器 API 命名空间' },
  { label: 'log.', type: 'namespace', detail: '日志 API 命名空间' },
];

// 缓存补全结果
let cachedCompletions: Completion[] | null = null;
let completionsPort: chrome.runtime.Port | null = null;

// 建立 port 连接
function getCompletionsPort(): chrome.runtime.Port {
  if (!completionsPort) {
    completionsPort = chrome.runtime.connect({ name: 'sidepanel-to-background' });
    completionsPort.onMessage.addListener((message) => {
      if (message.type === 'completionsResponse' && cachedCompletions === null) {
        cachedCompletions = message.completions || [];
      }
    });
  }
  return completionsPort;
}

// 从 background 请求补全信息
function fetchCompletions(): void {
  const requestId = crypto.randomUUID();
  getCompletionsPort().postMessage({ type: 'getCompletions', requestId });
}

// 初始化时请求补全
fetchCompletions();

export async function chromeAPICompletions(context: CompletionContext): Promise<CompletionResult | null> {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  // 如果还没收到响应，等待一下
  if (!cachedCompletions) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    from: word.from,
    options: [
      ...cachedCompletions || [],
      ...defaultCompletions || []
    ],
  };
}
