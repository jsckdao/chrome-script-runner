<script setup lang="ts">
import type { Script } from '../script-store';

const props = defineProps<{
  scripts: Script[];
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'select', scriptId: string): void;
  (e: 'create'): void;
  (e: 'delete', scriptId: string): void;
}>();

function handleContextMenu(e: MouseEvent, scriptId: string) {
  e.preventDefault();
  const script = props.scripts.find((s) => s.id === scriptId);
  if (!script) return;

  const confirmed = confirm(`Are you sure you want to delete script "${script.name}"?`);
  if (confirmed) {
    emit('delete', scriptId);
  }
}

function handleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
  if (target.value) {
    emit('select', target.value);
  }
}
</script>

<template>
  <div class="flex items-center gap-1">
    <select
      :value="modelValue"
      class="bg-[#3c3c3c] text-[#d4d4d4] border border-[#555] rounded px-2 py-1 text-xs min-w-[160px] cursor-pointer hover:bg-[#4a4a4a] focus:outline-none focus:border-[#0e639c]"
      @change="handleChange"
      @contextmenu="(e) => {
        const target = e.target as HTMLSelectElement;
        if (target.value) handleContextMenu(e, target.value);
      }"
    >
      <option value="">-- Select or create a script --</option>
      <option v-for="script in scripts" :key="script.id" :value="script.id">
        {{ script.name }}
      </option>
    </select>
    <button
      class="flex items-center justify-center w-6 h-6 p-0 bg-[#0e639c] text-white border-none rounded text-base font-bold cursor-pointer transition-colors hover:bg-[#1177bb]"
      title="Create new script"
      @click="emit('create')"
    >
      +
    </button>
  </div>
</template>
