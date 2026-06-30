<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BencodeDict } from '../lib/types'
import BencodeNode from './BencodeNode.vue'

const props = defineProps<{ raw: BencodeDict | null }>()

const expanded = ref(false)

watch(
  () => props.raw,
  () => { expanded.value = false }
)

function objKeys(v: Record<string, unknown>): string[] {
  return Object.keys(v).filter((k) => k !== '__keyBytes')
}
</script>

<template>
  <div v-if="raw" class="rounded-xl border border-border bg-surface overflow-hidden">
    <div class="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-2">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-300 font-mono">原始</span>
      <h2 class="text-sm font-semibold text-text">Bencode 结构</h2>
      <button
        type="button"
        class="ml-auto text-xs px-2.5 py-1 rounded-md border border-border bg-surface text-text-muted hover:text-accent hover:border-accent transition-colors"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起' : '展开' }}
      </button>
    </div>
    <div v-show="expanded" class="p-5 max-h-[32rem] overflow-auto font-mono text-xs leading-relaxed">
      <BencodeNode
        v-for="key in objKeys(raw)"
        :key="key"
        :value="raw[key]"
        :key-name="key"
        :depth="0"
      />
    </div>
  </div>
</template>
