<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ hashes: string[] }>()

const expanded = ref(false)
const visible = computed(() => (expanded.value ? props.hashes : props.hashes.slice(0, 20)))
const canToggle = computed(() => props.hashes.length > 20)
</script>

<template>
  <div v-if="hashes.length" class="rounded-xl border border-border bg-surface overflow-hidden">
    <div class="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-2">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-300 font-mono">分片哈希</span>
      <h2 class="text-sm font-semibold text-text">SHA-1 哈希列表</h2>
      <span class="text-xs text-text-muted ml-auto font-mono">{{ hashes.length }} 个</span>
      <button
        v-if="canToggle"
        type="button"
        class="text-xs px-2.5 py-1 rounded-md border border-border bg-surface text-text-muted hover:text-accent hover:border-accent transition-colors"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起' : '展开' }}
      </button>
    </div>
    <div class="p-5 max-h-96 overflow-y-auto flex flex-col gap-1">
      <div
        v-for="(hash, i) in visible"
        :key="i"
        class="text-xs font-mono text-text-muted px-2 py-1 rounded hover:bg-surface-2"
      >
        <span class="text-text-muted/60">{{ String(i).padStart(4, '0') }}</span>
        <span class="ml-3 text-text">{{ hash }}</span>
      </div>
      <div v-if="!expanded && hashes.length > 20" class="text-xs text-text-muted text-center py-2">
        还有 {{ hashes.length - 20 }} 个，点击展开查看
      </div>
    </div>
  </div>
</template>
