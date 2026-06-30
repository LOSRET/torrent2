<script setup lang="ts">
import type { DhtNode } from '../lib/types'

defineProps<{ nodes: DhtNode[] }>()
</script>

<template>
  <div v-if="nodes.length" class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono">BEP 5</span>
      <h2 class="text-sm font-semibold text-text">DHT 引导节点</h2>
    </div>
    <div class="flex flex-col gap-1.5">
      <div
        v-for="(node, i) in nodes"
        :key="i"
        class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-2 font-mono text-sm"
      >
        <span class="text-text">{{ node.host }}</span>
        <span class="text-text-muted">:</span>
        <span class="text-accent">{{ node.port }}</span>
      </div>
    </div>
  </div>
</template>
