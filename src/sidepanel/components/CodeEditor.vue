<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Editor } from '../editor';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'save'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
let editor: Editor | null = null;
let saveTimer: number | null = null;
let isInitialized = false;

onMounted(() => {
  if (containerRef.value) {
    editor = new Editor(containerRef.value);
    isInitialized = true;
    editor.onchange(() => {
      const value = editor!.getValue();
      emit('update:modelValue', value);
      emit('change', value);

      // 防抖保存
      if (saveTimer !== null) {
        clearTimeout(saveTimer);
      }
      saveTimer = window.setTimeout(() => {
        saveTimer = null;
        emit('save');
      }, 800);
    });
  }
});

onUnmounted(() => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    // 跳过初始化时的设置，避免覆盖用户数据
    if (!isInitialized) return;
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue);
    }
  }
);

function setValue(value: string) {
  if (editor) {
    editor.setValue(value);
  }
}

function getValue(): string {
  return editor ? editor.getValue() : '';
}

function clear() {
  if (editor) {
    editor.clear();
  }
}

function focus() {
  if (editor) {
    editor.focus();
  }
}

defineExpose({
  setValue,
  getValue,
  clear,
  focus,
});
</script>

<template>
  <div ref="containerRef" class="flex-1 min-h-[200px] overflow-hidden [&_.cm-editor]:h-full"></div>
</template>
