<script setup lang="ts">
</script>

<template>
  <header class="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
    <div class="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <span class="text-accent text-xl font-bold leading-none" aria-hidden="true">⬡</span>
        <span class="font-semibold tracking-tight text-text">Torrent Parser</span>
      </div>
      <nav class="flex items-center gap-2" aria-label="功能标签">
        <span class="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-surface-2 border border-border text-text-muted font-mono">Bencode</span>
        <span class="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-surface-2 border border-border text-text-muted font-mono">元数据</span>
        <span class="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-surface-2 border border-border text-text-muted font-mono">文件分析</span>
      </nav>
    </div>
  </header>
</template>
