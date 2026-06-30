<script setup lang="ts">
defineProps<{ urls: string[] }>()
</script>

<template>
  <div v-if="urls.length" class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono">Web</span>
      <h2 class="text-sm font-semibold text-text">Web Seed 列表</h2>
    </div>
    <div class="flex flex-col gap-1.5">
      <div
        v-for="url in urls"
        :key="url"
        class="text-sm text-text-muted font-mono break-all px-3 py-1.5 rounded-md bg-surface-2"
      >
        {{ url }}
      </div>
    </div>
  </div>
</template>
