import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

// Chrome Extension API 补全列表
const chromeAPICompletionsList: Completion[] = [
  // 全局函数
  { label: 'log.info', type: 'function', detail: '输出日志', info: 'log.info(message)' },
  { label: 'log.error', type: 'function', detail: '输出错误日志', info: 'log.error(message)' },
  { label: 'log.warn', type: 'function', detail: '输出警告日志', info: 'log.warn(message)' },
];

export function chromeAPICompletions(context: CompletionContext): CompletionResult | null {

  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  console.log('提供补全:', word);

  return {
    from: word.from,
    options: chromeAPICompletionsList.map((item) => ({
      label: item.label,
      type: item.type,
      detail: item.detail,
      info: item.info,
    })),
  };
}
