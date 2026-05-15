<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Script } from '../script-store';

const props = defineProps<{
  scripts: Script[];
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'create'): void;
  (e: 'delete', scriptId: string): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedScript = computed(() => {
  return props.scripts.find((s) => s.id === props.modelValue);
});

const displayText = computed(() => {
  return selectedScript.value?.name || '-- Select or create a script --';
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectScript(scriptId: string) {
  emit('update:modelValue', scriptId);
  isOpen.value = false;
}

function handleDelete(e: Event, scriptId: string) {
  e.stopPropagation();
  const script = props.scripts.find((s) => s.id === scriptId);
  if (!script) return;

  const confirmed = confirm(`Are you sure you want to delete script "${script.name}"?`);
  if (confirmed) {
    emit('delete', scriptId);
  }
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="flex items-center gap-1 relative">
    <button
      type="button"
      class="flex items-center justify-between bg-[#3c3c3c] text-[#d4d4d4] border border-[#555] rounded px-2 py-1 text-xs min-w-[160px] cursor-pointer hover:bg-[#4a4a4a] focus:outline-none focus:border-[#0e639c]"
      @click="toggleDropdown"
    >
      <span class="truncate">{{ displayText }}</span>
      <svg class="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <button
      type="button"
      class="flex items-center justify-center w-6 h-6 p-0 bg-[#0e639c] text-white border-none rounded text-base font-bold cursor-pointer transition-colors hover:bg-[#1177bb]"
      title="Create new script"
      @click="emit('create')"
    >
      +
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-1 bg-[#252526] border border-[#3c3c3c] rounded shadow-lg z-50 min-w-full"
    >
      <div v-if="scripts.length === 0" class="px-3 py-2 text-xs text-[#808080]">
        No scripts yet
      </div>
      <div
        v-for="script in scripts"
        :key="script.id"
        class="flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer hover:bg-[#4a4a4a]"
        :class="{ 'bg-[#0e639c] text-white': script.id === modelValue }"
        @click="selectScript(script.id)"
      >
        <span class="truncate mr-2">{{ script.name }}</span>
        <button
          type="button"
          class="flex items-center justify-center w-5 h-5 p-0 text-[#808080] hover:text-[#d4d4d4] bg-transparent border-none rounded cursor-pointer"
          title="Delete script"
          @click="(e) => handleDelete(e, script.id)"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
