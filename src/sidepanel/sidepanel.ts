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
  private backgroundPort: chrome.runtime.Port | null = null;

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
    this.backgroundPort = chrome.runtime.connect({ name: 'sidepanel-to-background' });
    this.backgroundPort.onMessage.addListener((message) => {
      if (message.requestId === this.currentRequestId) {
        if (message.type === 'executeLog') {
          const { level, message: msg } = message;
          this.console[level.toLowerCase()](msg);
        }
        else if (message.type === 'executeResult') {
          const { result, error } = message;
          if (error) {
            this.console.error('执行错误:', error);
          } else if (result) {
            // 处理执行
            this.console.result(result);
          }

          this.runBtn.disabled = false;
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

    chrome.runtime.sendMessage({
        type: 'execute',
        script,
        requestId,
        tabId: this.currentTabId,
    }).catch(console.error);
  }

  private clearConsole(): void {
    this.console.clear();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});
