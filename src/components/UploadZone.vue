<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { isMagnetLink } from '../lib/magnet'

const emit = defineEmits<{
  files: [files: File[]]
  magnet: [text: string]
  input: [text: string]
}>()

const fileInput = ref<HTMLInputElement>()
const magnetInput = ref('')
const magnetHint = ref('')
const isDragging = ref(false)

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files.length) {
    emit('files', Array.from(e.dataTransfer.files))
  } else if (e.dataTransfer?.types.includes('text/plain')) {
    const text = e.dataTransfer.getData('text/plain')
    if (text) emit('input', text)
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) emit('files', Array.from(input.files))
}

function submitMagnet() {
  const val = magnetInput.value.trim()
  if (!val) return
  if (isMagnetLink(val)) {
    emit('magnet', val)
  } else {
    magnetHint.value = '请输入有效的 magnet 链接'
  }
}

function onPaste(e: ClipboardEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
  const text = e.clipboardData?.getData('text')
  if (text && isMagnetLink(text)) {
    e.preventDefault()
    emit('magnet', text)
  }
}

onMounted(() => document.addEventListener('paste', onPaste))
onUnmounted(() => document.removeEventListener('paste', onPaste))
</script>

<template>
  <div
    ref="dropZone"
    role="button"
    tabindex="0"
    aria-label="点击或拖放 .torrent 文件到此处"
    class="relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden group"
    :class="isDragging
      ? 'border-accent bg-accent-soft scale-[1.01]'
      : 'border-border bg-surface hover:border-accent/50'"
    @click="fileInput?.click()"
    @keydown.enter.prevent="fileInput?.click()"
    @keydown.space.prevent="fileInput?.click()"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop="onDrop"
  >
    <!-- 分片网格背景 (签名视觉元素) -->
    <div class="absolute inset-0 grid grid-cols-12 gap-1 p-4 opacity-[0.04] dark:opacity-[0.07] pointer-events-none" aria-hidden="true">
      <div
        v-for="i in 72"
        :key="i"
        class="aspect-square bg-accent rounded-sm"
        :style="{ animation: `piece-pulse ${2 + (i % 5) * 0.3}s ease-in-out ${i * 0.04}s infinite` }"
      />
    </div>

    <div class="relative px-6 py-12 flex flex-col items-center text-center gap-3">
      <div class="text-accent mb-1" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <p class="text-lg font-semibold text-text">拖放 .torrent 文件到此处</p>
      <p class="text-sm text-text-muted">点击选择文件 · 支持批量上传 · 或在下方输入磁力链接</p>

      <input
        ref="fileInput"
        type="file"
        accept=".torrent"
        multiple
        hidden
        @change="onFileChange"
      />

      <!-- 磁力链接输入 -->
      <div class="w-full max-w-2xl mt-4 flex gap-2" @click.stop>
        <input
          v-model="magnetInput"
          type="text"
          placeholder="magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=example&tr=..."
          class="flex-1 px-3.5 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-mono"
          aria-label="磁力链接输入框"
          @keydown.enter.stop="submitMagnet"
        />
        <button
          type="button"
          class="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright transition-colors shrink-0"
          @click.stop="submitMagnet"
        >
          解析
        </button>
      </div>
      <p v-if="magnetHint" class="text-xs text-danger">{{ magnetHint }}</p>
    </div>
  </div>
</template>
