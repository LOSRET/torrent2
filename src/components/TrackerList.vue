<script setup lang="ts">
import type { ParsedTorrent } from '../lib/types'
import CopyButton from './CopyButton.vue'

const props = defineProps<{ data: ParsedTorrent }>()

const otherTrackers = props.data.announce_list.filter((u) => u !== props.data.announce)
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono">Tracker</span>
      <h2 class="text-sm font-semibold text-text">Tracker 列表</h2>
    </div>
    <div class="flex items-center gap-2 mb-3 pb-3 border-b border-border">
      <span class="text-xs text-text-muted shrink-0">主 Tracker</span>
      <span class="text-sm text-text font-mono break-all flex-1">{{ data.announce || '—' }}</span>
      <CopyButton v-if="data.announce" :text="data.announce" />
    </div>
    <div v-if="otherTrackers.length" class="flex flex-col gap-1.5">
      <div
        v-for="url in otherTrackers"
        :key="url"
        class="text-sm text-text-muted font-mono break-all px-3 py-1.5 rounded-md bg-surface-2"
      >
        {{ url }}
      </div>
    </div>
  </div>
</template>
