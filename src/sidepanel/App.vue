<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { SplitWrapper, SplitItem } from 'vue3-split';
import CodeEditor from './components/CodeEditor.vue';
import ConsoleOutput from './components/ConsoleOutput.vue';
import ScriptSelector from './components/ScriptSelector.vue';
import { usePortManager, type LogEntry } from './composables/usePortManager';
import { Script, scriptStore } from './script-store';
import { exampleCode } from './editor';

const scripts = ref<Script[]>([]);
const currentScriptId = ref<string>('');
const editorContent = ref<string>('');
const consoleEntries = ref<LogEntry[]>([]);
const isRunning = ref(false);
const currentTabId = ref<number | null>(null);
const currentRequestId = ref<string | null>(null);

const { isConnected, onMessage, postMessage } = usePortManager();

let idCounter = 0;

function addConsoleEntry(level: LogEntry['level'], args: any[]) {
  consoleEntries.value.push({
    id: ++idCounter,
    level,
    args,
    timestamp: new Date(),
  });

  // Limit max entries
  if (consoleEntries.value.length > 500) {
    consoleEntries.value = consoleEntries.value.slice(-500);
  }
}

async function loadScripts() {
  try {
    const allScripts = await scriptStore.getAll();
    scripts.value = allScripts;
  } catch (err) {
    console.error('Failed to load scripts:', err);
  }
}

async function handleScriptSelect(scriptId: string) {
  // Save current script
  if (currentScriptId.value) {
    await saveCurrentScript();
  }

  currentScriptId.value = scriptId;
  const script = scripts.value.find((s) => s.id === scriptId);
  if (script) {
    editorContent.value = script.content;
  }
}

async function handleCreateScript() {
  const name = prompt('Enter script name:');
  if (!name) return;

  const script: Script = {
    id: crypto.randomUUID(),
    name: name.trim(),
    content: exampleCode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await scriptStore.save(script);
  await loadScripts();
  currentScriptId.value = script.id;
  editorContent.value = '';
}

async function handleDeleteScript(scriptId: string) {
  await scriptStore.delete(scriptId);

  if (currentScriptId.value === scriptId) {
    currentScriptId.value = '';
    editorContent.value = '';
  }

  await loadScripts();
}

async function saveCurrentScript() {
  if (!currentScriptId.value) return;

  const script = scripts.value.find((s) => s.id === currentScriptId.value);
  if (!script) return;

  // Create plain object to avoid IDB clone error
  const plainScript: Script = {
    id: script.id,
    name: script.name,
    content: editorContent.value,
    createdAt: script.createdAt,
    updatedAt: Date.now(),
  };
  await scriptStore.save(plainScript);
}

// Watch for script selection changes, update editor content directly
watch(currentScriptId, (newId) => {
  if (newId) {
    const script = scripts.value.find((s) => s.id === newId);
    if (script) {
      editorContent.value = script.content;
    }
  }
});

async function runScript() {
  if (currentTabId.value === null) {
    addConsoleEntry('error', ['No active tab found']);
    return;
  }

  if (!isConnected.value) {
    addConsoleEntry('warn', ['Waiting for connection...']);
    return;
  }

  const script = editorContent.value;
  if (!script.trim()) {
    addConsoleEntry('warn', ['Please enter a script']);
    return;
  }

  isRunning.value = true;
  addConsoleEntry('info', ['--- Start execution ---']);

  const requestId = crypto.randomUUID();
  currentRequestId.value = requestId;

  const sent = postMessage({
    type: 'execute',
    script,
    requestId,
    tabId: currentTabId.value,
  });

  if (!sent) {
    addConsoleEntry('error', ['Failed to send message']);
    isRunning.value = false;
  }
}

function clearConsole() {
  consoleEntries.value = [];
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runScript();
  }
}

async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      currentTabId.value = tab.id;
    }
  } catch (err) {
    addConsoleEntry('error', ['Failed to get current tab:', String(err)]);
  }
}

let unsubscribeMessage: (() => void) | null = null;

onMounted(async () => {
  await loadScripts();
  await getCurrentTab();

  // Auto-select first script if available
  if (scripts.value.length > 0 && !currentScriptId.value) {
    await handleScriptSelect(scripts.value[0].id);
  }

  document.addEventListener('keydown', handleKeydown);

  unsubscribeMessage = onMessage((message) => {
    if (message.requestId === currentRequestId.value) {
      if (message.type === 'executeLog') {
        addConsoleEntry(message.level as LogEntry['level'], [message.message]);
      } else if (message.type === 'executeResult') {
        const { result, error } = message;
        if (error) {
          addConsoleEntry('error', ['Execution error:', error]);
        } else if (result !== undefined) {
          addConsoleEntry('result', [result]);
        }

        isRunning.value = false;
      }
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (unsubscribeMessage) unsubscribeMessage();
});
</script>

<template>
  <div class="flex flex-col h-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans">
    <!-- Toolbar -->
    <div class="bg-[#252526] border-b border-[#3c3c3c] flex items-center gap-2 p-2 flex-shrink-0">
      <span class="font-semibold text-xs text-[#cccccc] mr-4">Script Runner</span>

      <ScriptSelector
        v-model="currentScriptId"
        :scripts="scripts"
        @select="handleScriptSelect"
        @create="handleCreateScript"
        @delete="handleDeleteScript"
      />

      <button
        class="bg-[#0e639c] text-white px-3 py-1.5 border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-[#808080] disabled:cursor-not-allowed"
        :disabled="isRunning"
        @click="runScript"
      >
        ▶ Run
      </button>
      <button
        class="bg-[#3c3c3c] text-[#d4d4d4] px-3 py-1.5 border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-[#4a4a4a]"
        @click="clearConsole"
      >
        Clear
      </button>
    </div>

    <!-- Split Wrapper -->
    <SplitWrapper
      direction="vertical"
      class="flex-1 overflow-hidden"
      :gutter-size="6"
      :min-size="100"
      :sizes="[75, 25]"
    >
      <!-- Editor Container -->
      <SplitItem class="overflow-hidden">
        <CodeEditor
          v-model="editorContent"
          @save="saveCurrentScript"
        />
      </SplitItem>

      <!-- Console Container -->
      <SplitItem class="overflow-hidden flex flex-col">
        <div class="bg-[#252526] border-b border-[#3c3c3c] px-3 py-1.5 flex items-center justify-between flex-shrink-0">
          <span class="text-xs font-medium text-[#808080]">Console</span>
        </div>
        <ConsoleOutput :entries="consoleEntries" />
      </SplitItem>
    </SplitWrapper>
  </div>
</template>
