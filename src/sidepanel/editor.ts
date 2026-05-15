import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, cursorLineStart, cursorLineEnd, cursorCharRight, cursorCharLeft, cursorLineDown, cursorLineUp, deleteLine, cursorSubwordForward, cursorSubwordBackward } from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { toggleComment } from '@codemirror/commands';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { chromeAPICompletions } from './completions';
import { tags as t } from '@lezer/highlight';

// VS Code style dark theme code highlighting
const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#569cd6' },                    // keyword - blue
  { tag: [t.name, t.deleted, t.character, t.propertyName], color: '#9cdcfe' },  // name/property - light blue
  { tag: [t.function(t.variableName), t.labelName], color: '#dcdcaa' },         // function - yellow
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#4ec9b0' },  // constant - cyan
  { tag: [t.definition(t.name), t.separator], color: '#d4d4d4' },               // definition/separator
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#4ec9b0' },  // type/class name - cyan
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#d4d4d4' },  // operator
  { tag: [t.meta, t.comment], color: '#6a9955' },                  // comment - green
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#569cd6', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#569cd6' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#569cd6' },  // boolean/atom - blue
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#ce9178' },  // string - orange
  { tag: t.invalid, color: '#f44747' },                        // invalid - red
  { tag: t.number, color: '#b5cea8' },                         // number - light green
]);

// Emacs style keybindings
const emacsKeymap = keymap.of([
  // Cursor movement
  { key: 'C-a', run: cursorLineStart },
  { key: 'C-e', run: cursorLineEnd },
  { key: 'C-f', run: cursorCharRight },
  { key: 'C-b', run: cursorCharLeft },
  { key: 'C-n', run: cursorLineDown },
  { key: 'C-p', run: cursorLineUp },
  // Word movement (M-f, M-b)
  { key: 'Alt-f', run: cursorSubwordForward },
  { key: 'Alt-b', run: cursorSubwordBackward },
  // Delete
  { key: 'C-k', run: deleteLine },
  // Comment (M-;)
  { key: 'Alt-;', run: toggleComment },
]);

export const exampleCode = `
-- Example script

-- This is the main function
function main()
  -- log
  log.info('Hello World')
  -- Open new tab
  local tab = browser.openTab('https://www.google.com/')
  -- Input something
  browser.input(tab.id, 'textarea', 'Chrome Script Runner')
  return 100
end
`

export class Editor {
  private view: EditorView;
  private container: HTMLElement;
  private changeCallback: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.view = this.createView();
    this.setupTabIntercept();
  }

  private setupTabIntercept(): void {
    // Intercept Tab key to prevent focus loss
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.view.dispatch(this.view.state.replaceSelection('  '));
      }
    });
  }

  private createView(): EditorView {
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      syntaxHighlighting(darkHighlightStyle),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      emacsKeymap,
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
      EditorView.updateListener.of((update) => {
        if (update.docChanged && this.changeCallback) {
          this.changeCallback();
        }
      }),
    ];

    const state = EditorState.create({
      doc: '',
      extensions,
    });

    return new EditorView({
      state,
      parent: this.container,
    });
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

  onchange(callback: () => void): void {
    this.changeCallback = callback;
  }
}
