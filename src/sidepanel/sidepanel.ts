import './sidepanel.css';
import { Editor } from './editor';
import { Console } from './console';
import { onMessage, sendMessage } from '../utils/message';

class SidePanel {
  private editor: Editor;
  private console: Console;
  private runBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private currentTabId: number | null = null;
  private currentRequestId: string | null = null;

  constructor() {
    this.initUI();
    this.editor = new Editor(document.getElementById('editor')!);
    this.console = new Console(document.getElementById('console-output')!);
    this.runBtn = document.getElementById('run-btn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
    this.setupEventListeners();
    this.setupMessageHandler();
    this.getCurrentTab();
  }

  private initUI(): void {
    // 确保 DOM 结构存在
    const editorContainer = document.getElementById('editor');
    const consoleOutput = document.getElementById('console-output');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');

    if (!editorContainer || !consoleOutput || !runBtn || !clearBtn) {
      throw new Error('Required DOM elements not found');
    }
  }

  private setupEventListeners(): void {
    this.runBtn.addEventListener('click', () => this.runScript());
    this.clearBtn.addEventListener('click', () => this.clearConsole());

    // 快捷键支持
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter 运行脚本
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runScript();
      }
    });
  }

  private setupMessageHandler(): void {
    onMessage((message) => {
      if (message.requestId === this.currentRequestId) {
        if (message.type === 'executeLog') {
          const { level, message: msg } = message;
          this.console[level](msg);
        }
      }
    });
  }

  private async getCurrentTab(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        this.currentTabId = tab.id;
      }
    } catch (err) {
      this.console.error('获取当前标签页失败:', err);
    }
  }

  private async runScript(): Promise<void> {
    if (this.currentTabId === null) {
      this.console.error('未找到活动标签页');
      return;
    }

    const script = this.editor.getValue();
    if (!script.trim()) {
      this.console.warn('请输入脚本');
      return;
    }

    this.runBtn.disabled = true;
    this.console.info('--- 开始执行 ---');

    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    try {
      const result: any = await sendMessage({
        type: 'execute',
        script,
        requestId,
        tabId: this.currentTabId,
      });
      if (result && typeof result === 'object' && 'error' in result) {
        throw new Error(result.error as string);
      }
      this.console.result(result.result as any);
    } catch (err) {
      this.console.error('执行失败:', err);
      this.runBtn.disabled = false;
    }
  }

  private clearConsole(): void {
    this.console.clear();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});
