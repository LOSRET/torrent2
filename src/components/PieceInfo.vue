<script setup lang="ts">
import type { ParsedTorrent } from '../lib/types'
import { formatSize } from '../lib/format'

defineProps<{ data: ParsedTorrent }>()
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">分片</span>
      <h2 class="text-sm font-semibold text-text">分片信息</h2>
    </div>
    <div class="flex flex-col divide-y divide-border">
      <div class="flex items-center justify-between py-2.5">
        <span class="text-sm text-text-muted">分片大小</span>
        <span class="text-sm text-text font-mono">{{ formatSize(data.piece_length) }}</span>
      </div>
      <div class="flex items-center justify-between py-2.5">
        <span class="text-sm text-text-muted">分片数量</span>
        <span class="text-sm text-text font-mono">{{ data.piece_count }}</span>
      </div>
    </div>
  </div>
</template>
