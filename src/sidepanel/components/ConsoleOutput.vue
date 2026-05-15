<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { LogEntry } from '../composables/usePortManager';

const props = defineProps<{
  entries: LogEntry[];
}>();

const containerRef = ref<HTMLElement | null>(null);

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatValue(value: unknown): string {
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

function getLevelClass(level: LogEntry['level']): string {
  switch (level) {
    case 'error':
      return 'text-[#f48771] bg-red-900/10 px-1 rounded';
    case 'warn':
      return 'text-[#cca700]';
    case 'info':
      return 'text-[#75beff]';
    case 'result':
      return 'text-[#89d185] italic';
    default:
      return 'text-[#d4d4d4]';
  }
}

watch(
  () => props.entries.length,
  async () => {
    await nextTick();
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  }
);
</script>

<template>
  <div
    ref="containerRef"
    class="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
  >
    <div v-if="entries.length === 0" class="text-[#606060] italic">
      Console is empty
    </div>
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="mb-1 break-all"
      :class="getLevelClass(entry.level)"
    >
      [{{ formatTime(entry.timestamp) }}] {{ entry.args.map(formatValue).join(' ') }}
    </div>
  </div>
</template>
