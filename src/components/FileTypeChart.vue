<script setup lang="ts">
import { computed } from 'vue'
import type { TorrentFileItem } from '../lib/types'
import { categorizeFile, FILE_CATEGORY_ORDER } from '../lib/format'

const props = defineProps<{ files: TorrentFileItem[]; totalSize: number }>()

const groups = computed(() => {
  const map: Record<string, { count: number; size: number }> = {}
  for (const order of FILE_CATEGORY_ORDER) map[order] = { count: 0, size: 0 }
  for (const f of props.files) {
    const cat = categorizeFile(f.path)
    map[cat].count++
    map[cat].size += f.length
  }
  const maxSize = Math.max(...FILE_CATEGORY_ORDER.map((k) => map[k].size), 1)
  return FILE_CATEGORY_ORDER
    .filter((k) => map[k].count > 0)
    .map((k) => ({
      label: k,
      count: map[k].count,
      pct: props.totalSize > 0 ? ((map[k].size / props.totalSize) * 100).toFixed(1) : '0',
      barPct: ((map[k].size / maxSize) * 100).toFixed(1),
    }))
})
</script>

<template>
  <div v-if="groups.length" class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono">类型</span>
      <h2 class="text-sm font-semibold text-text">文件类型分布</h2>
    </div>
    <div class="flex flex-col gap-2.5">
      <div v-for="g in groups" :key="g.label" class="flex items-center gap-3">
        <span class="text-xs text-text-muted w-12 shrink-0">{{ g.label }}</span>
        <div class="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
          <div class="h-full bg-accent rounded-full transition-all" :style="{ width: g.barPct + '%' }" />
        </div>
        <span class="text-xs text-text-muted w-24 text-right shrink-0 font-mono">{{ g.count }} 个 · {{ g.pct }}%</span>
      </div>
    </div>
  </div>
</template>
