<script setup lang="ts">
import { extName } from '../lib/format'

defineProps<{ ext: Record<string, number> | null }>()
</script>

<template>
  <div v-if="ext && Object.keys(ext).length" class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono">BEP 10</span>
      <h2 class="text-sm font-semibold text-text">扩展协议</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
      <div
        v-for="(val, key) in ext"
        :key="key"
        class="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2"
      >
        <span class="text-sm text-text">{{ extName(String(key)) }}</span>
        <span class="text-xs text-text-muted font-mono">ID: {{ val }}</span>
      </div>
    </div>
  </div>
</template>
