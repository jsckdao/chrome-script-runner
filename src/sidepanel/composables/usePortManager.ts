import { ref, onMounted, onUnmounted } from 'vue';
import { portManager } from '../port-manager';

export interface LogEntry {
  id: number;
  level: 'log' | 'error' | 'warn' | 'info' | 'result';
  args: any[];
  timestamp: Date;
}

export interface ExecuteMessage {
  type: 'execute';
  script: string;
  requestId: string;
  tabId: number;
}

export interface ExecuteLogMessage {
  type: 'executeLog';
  requestId: string;
  level: string;
  message: string;
}

export interface ExecuteResultMessage {
  type: 'executeResult';
  requestId: string;
  result?: unknown;
  error?: string;
}

export type BackgroundMessage = ExecuteLogMessage | ExecuteResultMessage;

export function usePortManager() {
  const isConnected = ref(portManager.isConnected());

  let unsubscribeMessage: (() => void) | null = null;
  let unsubscribeDisconnect: (() => void) | null = null;

  function connect() {
    portManager.connect();
    isConnected.value = portManager.isConnected();
  }

  function onMessage(handler: (message: BackgroundMessage) => void): () => void {
    const wrappedHandler = (message: unknown) => {
      handler(message as BackgroundMessage);
    };
    return portManager.onMessage(wrappedHandler);
  }

  function onDisconnect(handler: () => void): () => void {
    return portManager.onDisconnect(handler);
  }

  function postMessage(message: ExecuteMessage): boolean {
    return portManager.postMessage(message);
  }

  function checkConnection() {
    isConnected.value = portManager.isConnected();
  }

  onMounted(() => {
    connect();
    unsubscribeDisconnect = portManager.onDisconnect(() => {
      isConnected.value = false;
    });
  });

  onUnmounted(() => {
    if (unsubscribeMessage) unsubscribeMessage();
    if (unsubscribeDisconnect) unsubscribeDisconnect();
  });

  return {
    isConnected,
    connect,
    onMessage,
    onDisconnect,
    postMessage,
    checkConnection,
  };
}
