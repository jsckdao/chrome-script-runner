import './sidepanel.css';
import { Editor } from './editor';
import { Console } from './console';
import { Script, scriptStore } from './script-store';
import { portManager } from './port-manager';

class SidePanel {
  private editor: Editor;
  private console: Console;
  private runBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private scriptSelect: HTMLSelectElement;
  private newScriptBtn: HTMLButtonElement;
  private currentTabId: number | null = null;
  private currentRequestId: string | null = null;
  private scripts: Map<string, Script> = new Map();
  private currentScriptId: string | null = null;

  constructor() {
    this.editor = new Editor(document.getElementById('editor')!);
    this.console = new Console(document.getElementById('console-output')!);
    this.runBtn = document.getElementById('run-btn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
    this.scriptSelect = document.getElementById('script-select') as HTMLSelectElement;
    this.newScriptBtn = document.getElementById('new-script-btn') as HTMLButtonElement;
    this.initUI();
    this.setupEventListeners();
    this.setupMessageHandler();
    this.getCurrentTab();
    this.loadScripts();
  }

  private initUI(): void {
    const editorContainer = document.getElementById('editor');
    const consoleOutput = document.getElementById('console-output');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const scriptSelect = document.getElementById('script-select');
    const newScriptBtn = document.getElementById('new-script-btn');

    if (!editorContainer || !consoleOutput || !runBtn || !clearBtn || !scriptSelect || !newScriptBtn) {
      throw new Error('Required DOM elements not found');
    }
  }

  private async loadScripts(): Promise<void> {
    try {
      const scripts = await scriptStore.getAll();
      this.scripts.clear();
      this.scriptSelect.innerHTML = '<option value="">-- 选择或新建脚本 --</option>';

      for (const script of scripts) {
        this.scripts.set(script.id, script);
        const option = document.createElement('option');
        option.value = script.id;
        option.textContent = script.name;
        this.scriptSelect.appendChild(option);
      }

      // 绑定右键菜单用于删除
      this.scriptSelect.addEventListener('contextmenu', (e) => {
        this.handleScriptRightClick(e);
      });
    } catch (err) {
      console.error('加载脚本失败:', err);
    }
  }

  private handleScriptRightClick(e: MouseEvent): void {
    e.preventDefault();
    const target = e.target as HTMLOptionElement;
    if (!target.value || target.tagName !== 'OPTION') return;

    const scriptId = target.value;
    const script = this.scripts.get(scriptId);
    if (!script) return;

    const confirmed = confirm(`确定要删除脚本 "${script.name}" 吗？`);
    if (confirmed) {
      this.deleteScript(scriptId);
    }
  }

  private setupEventListeners(): void {
    this.runBtn.addEventListener('click', () => this.runScript());
    this.clearBtn.addEventListener('click', () => this.clearConsole());
    this.newScriptBtn.addEventListener('click', () => this.createNewScript());

    this.scriptSelect.addEventListener('change', () => {
      const scriptId = this.scriptSelect.value;
      if (scriptId) {
        this.switchScript(scriptId);
      }
    });

    // 快捷键支持
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runScript();
      }
    });

    // 编辑器内容变化时保存
    this.editor.onchange(() => {
      this.saveCurrentScript();
    });
  }

  private setupMessageHandler(): void {
    // 使用共享的 portManager
    portManager.onMessage((message) => {
      if (message.requestId === this.currentRequestId) {
        if (message.type === 'executeLog') {
          const { level, message: msg } = message;
          this.console.logLevel(level, msg);
        }
        else if (message.type === 'executeResult') {
          const { result, error } = message;
          if (error) {
            this.console.error('执行错误:', error);
          } else if (result) {
            this.console.result(result);
          }

          this.runBtn.disabled = false;
        }
      }
    });

    portManager.onDisconnect(() => {
      console.warn('Port 断开连接');
    });

    // 初始化连接
    portManager.connect();
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

    if (!portManager.isConnected()) {
      this.console.warn('正在等待连接...');
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

    const sent = portManager.postMessage({
      type: 'execute',
      script,
      requestId,
      tabId: this.currentTabId,
    });

    if (!sent) {
      this.console.error('发送消息失败');
      this.runBtn.disabled = false;
    }
  }

  private clearConsole(): void {
    this.console.clear();
  }

  private async createNewScript(): Promise<void> {
    const name = prompt('请输入脚本名称：');
    if (!name) return;

    const script: Script = {
      id: crypto.randomUUID(),
      name: name.trim(),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await scriptStore.save(script);
    await this.loadScripts();
    this.scriptSelect.value = script.id;
    this.currentScriptId = script.id;
    this.editor.setValue('');
  }

  private async switchScript(scriptId: string): Promise<void> {
    // 保存当前脚本
    if (this.currentScriptId) {
      await this.saveCurrentScript();
    }

    const script = this.scripts.get(scriptId);
    if (script) {
      this.currentScriptId = scriptId;
      this.editor.setValue(script.content);
    }
  }

  private async saveCurrentScript(): Promise<void> {
    if (!this.currentScriptId) return;

    const script = this.scripts.get(this.currentScriptId);
    if (!script) return;

    script.content = this.editor.getValue();
    script.updatedAt = Date.now();
    await scriptStore.save(script);
  }

  private async deleteScript(scriptId: string): Promise<void> {
    await scriptStore.delete(scriptId);

    if (this.currentScriptId === scriptId) {
      this.currentScriptId = null;
      this.editor.setValue('');
    }

    await this.loadScripts();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});