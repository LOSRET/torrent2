<script setup lang="ts">
import { computed } from 'vue'
import type { ParsedTorrent } from '../lib/types'
import { formatSize } from '../lib/format'

const props = defineProps<{ data: ParsedTorrent }>()

const healthClass = computed(() => {
  const s = props.data.health_score
  if (s >= 70) return 'text-success'
  if (s >= 40) return 'text-warning'
  return 'text-danger'
})

const cards = computed(() => [
  { label: '总大小', value: formatSize(props.data.total_size), accent: 'accent' },
  { label: '文件数', value: String(props.data.files.length || '—'), accent: 'accent' },
  { label: '分片数', value: String(props.data.piece_count), accent: 'accent' },
  { label: '类型', value: props.data.is_single_file ? '单文件' : '多文件', accent: 'accent' },
])
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
    <article
      v-for="card in cards"
      :key="card.label"
      class="rounded-xl border border-border bg-surface p-4 flex flex-col gap-1"
    >
      <span class="text-xs text-text-muted">{{ card.label }}</span>
      <span class="text-lg font-semibold text-text break-all">{{ card.value }}</span>
    </article>
    <article class="rounded-xl border border-border bg-surface p-4 flex flex-col gap-1">
      <span class="text-xs text-text-muted">健康度</span>
      <span class="text-lg font-semibold" :class="healthClass">{{ data.health_score }}%</span>
      <span v-if="data.health_reasons.length" class="text-[11px] text-text-muted leading-tight">{{ data.health_reasons.join(' · ') }}</span>
    </article>
  </div>
</template>
