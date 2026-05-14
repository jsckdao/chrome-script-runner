// Port 连接管理器 - 单例模式
type MessageHandler = (message: any) => void;
type DisconnectHandler = () => void;

class PortManager {
  private port: chrome.runtime.Port | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private disconnectHandlers: Set<DisconnectHandler> = new Set();
  private reconnectTimer: number | null = null;
  private isConnecting = false;

  connect(): chrome.runtime.Port | null {
    if (this.port) return this.port;
    if (this.isConnecting) return null;

    try {
      this.isConnecting = true;
      this.port = chrome.runtime.connect({ name: 'sidepanel-to-background' });

      this.port.onMessage.addListener((message) => {
        this.messageHandlers.forEach(handler => handler(message));
      });

      this.port.onDisconnect.addListener(() => {
        this.port = null;
        this.isConnecting = false;
        this.disconnectHandlers.forEach(handler => handler());
        this.scheduleReconnect();
      });

      this.isConnecting = false;
      console.info('Port 连接完成');
      return this.port;
    } catch (err) {
      console.info('Port 连接失败:', err);
      this.isConnecting = false;
      this.scheduleReconnect();
      return null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.port = null;
      this.connect();
    }, 1000);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onDisconnect(handler: DisconnectHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  postMessage(message: any): boolean {
    if (!this.port) {
      const connected = this.connect();
      if (!connected) return false;
    }

    try {
      this.port!.postMessage(message);
      return true;
    } catch (err) {
      return false;
    }
  }

  isConnected(): boolean {
    return this.port !== null;
  }
}

// 导出单例
export const portManager = new PortManager();