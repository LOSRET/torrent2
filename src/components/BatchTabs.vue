<script setup lang="ts">
import type { ParsedTorrent } from '../lib/types'

defineProps<{
  results: ParsedTorrent[]
  activeIndex: number
}>()

defineEmits<{ select: [index: number] }>()
</script>

<template>
  <div v-if="results.length > 1" class="flex flex-wrap gap-2" role="tablist">
    <button
      v-for="(item, index) in results"
      :key="index"
      type="button"
      role="tab"
      :aria-selected="index === activeIndex"
      class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border"
      :class="index === activeIndex
        ? 'bg-accent text-white border-accent'
        : 'bg-surface text-text-muted border-border hover:text-accent hover:border-accent'"
      @click="$emit('select', index)"
    >
      {{ item.filepath || item.name || '文件 ' + (index + 1) }}
    </button>
  </div>
</template>
