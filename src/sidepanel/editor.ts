import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { chromeAPICompletions } from './completions';
import { tags as t } from '@lezer/highlight';

// VS Code 风格黑暗主题代码高亮
const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#569cd6' },                    // 关键字 - 蓝色
  { tag: [t.name, t.deleted, t.character, t.propertyName], color: '#9cdcfe' },  // 名称/属性 - 浅蓝
  { tag: [t.function(t.variableName), t.labelName], color: '#dcdcaa' },         // 函数 - 黄色
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#4ec9b0' },  // 常量 - 青色
  { tag: [t.definition(t.name), t.separator], color: '#d4d4d4' },               // 定义/分隔符
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#4ec9b0' },  // 类型/类名 - 青色
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#d4d4d4' },  // 操作符
  { tag: [t.meta, t.comment], color: '#6a9955' },                  // 注释 - 绿色
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#569cd6', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#569cd6' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#569cd6' },  // 布尔值/原子 - 蓝色
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#ce9178' },  // 字符串 - 橙色
  { tag: t.invalid, color: '#f44747' },                        // 无效 - 红色
  { tag: t.number, color: '#b5cea8' },                         // 数字 - 浅绿
]);

export class Editor {
  private view: EditorView;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.view = this.createView();
  }

  private createView(): EditorView {
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      syntaxHighlighting(darkHighlightStyle),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      StreamLanguage.define(lua),
      autocompletion({
        override: [(ctx: CompletionContext) => chromeAPICompletions(ctx)],
      }),
      EditorView.theme({
        '&': {
          height: '100%',
        },
        '.cm-scroller': {
          overflow: 'auto',
        },
      }),
    ];

    const state = EditorState.create({
      doc: this.getDefaultCode(),
      extensions,
    });

    return new EditorView({
      state,
      parent: this.container,
    });
  }

  private getDefaultCode(): string {
    return `return 1 + 3`;
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(code: string): void {
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: code,
      },
    });
  }

  clear(): void {
    this.setValue('');
  }

  focus(): void {
    this.view.focus();
  }
}
