export interface LogEntry {
  id: number;
  level: 'log' | 'error' | 'warn' | 'info' | 'result';
  args: string[];
  timestamp: Date;
}

export class Console {
  private container: HTMLElement;
  private entries: LogEntry[] = [];
  private idCounter = 0;
  private maxEntries = 500;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderEmpty();
  }

  private renderEmpty(): void {
    this.container.innerHTML = '<div class="console-empty">控制台暂无输出</div>';
  }

  private render(): void {
    if (this.entries.length === 0) {
      this.renderEmpty();
      return;
    }

    const html = this.entries.map((entry) => {
      const time = entry.timestamp.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const argsStr = entry.args.join(' ');
      return `<div class="console-line ${entry.level}">[${time}] ${argsStr}</div>`;
    }).join('');

    this.container.innerHTML = html;
    this.container.scrollTop = this.container.scrollHeight;
  }

  log(...args: unknown[]): void {
    this.addEntry('log', args);
  }

  error(...args: unknown[]): void {
    this.addEntry('error', args);
  }

  warn(...args: unknown[]): void {
    this.addEntry('warn', args);
  }

  info(...args: unknown[]): void {
    this.addEntry('info', args);
  }

  result(value: unknown): void {
    const formatted = this.formatValue(value);
    this.addEntry('result', [formatted]);
  }

  logLevel(level: string, ...args: unknown[]): void {
    const validLevels = ['log', 'error', 'warn', 'info', 'result'] as const;
    if (validLevels.includes(level as typeof validLevels[number])) {
      this.addEntry(level as LogEntry['level'], args);
    } else {
      this.addEntry('log', [level, ...args]);
    }
  }

  private addEntry(level: LogEntry['level'], args: unknown[]): void {
    const entry: LogEntry = {
      id: ++this.idCounter,
      level,
      args: args.map((arg) => this.formatValue(arg)),
      timestamp: new Date(),
    };

    this.entries.push(entry);

    // 限制最大条目数
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    this.render();
  }

  private formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  clear(): void {
    this.entries = [];
    this.renderEmpty();
  }
}
