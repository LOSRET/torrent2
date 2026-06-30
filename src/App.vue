<script setup lang="ts">
import { useTorrentParser } from './composables/useTorrentParser'
import AppHeader from './components/AppHeader.vue'
import UploadZone from './components/UploadZone.vue'
import BatchTabs from './components/BatchTabs.vue'
import ResultsSection from './components/ResultsSection.vue'

const {
  viewState,
  errorMsg,
  results,
  activeIndex,
  current,
  currentRaw,
  hasBatch,
  parseFiles,
  parseMagnet,
  handleInput,
  selectBatch,
  reset,
  exportJson,
} = useTorrentParser()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg text-text">
    <AppHeader />

    <main class="flex-1 max-w-6xl w-full mx-auto px-5 py-8">
      <!-- 英雄区 -->
      <section v-if="viewState === 'idle'" class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
          在线解析 Torrent 文件
        </h1>
        <p class="text-text-muted max-w-2xl mx-auto leading-relaxed">
          纯前端 BitTorrent 解析器，上传 .torrent 文件或输入磁力链接，即时查看 Bencode 编码的全部元数据。所有数据仅在本地处理，不上传到任何服务器。
        </p>
      </section>

      <!-- 上传区 -->
      <UploadZone
        v-if="viewState === 'idle'"
        @files="parseFiles"
        @magnet="parseMagnet"
        @input="handleInput"
      />

      <!-- 加载状态 -->
      <div v-if="viewState === 'loading'" class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="w-48 h-1 rounded-full bg-surface-2 overflow-hidden">
          <div class="h-full w-1/3 bg-accent rounded-full" style="animation: loading-slide 1.2s linear infinite" />
        </div>
        <p class="text-text-muted text-sm">正在解析文件…</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="viewState === 'error'" class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="rounded-xl border border-danger/30 bg-danger/5 px-6 py-4 flex items-center gap-3 max-w-md">
          <span class="text-danger text-xl" aria-hidden="true">✕</span>
          <span class="text-text text-sm">{{ errorMsg }}</span>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright transition-colors"
          @click="reset"
        >
          重新开始
        </button>
      </div>

      <!-- 结果区 -->
      <template v-if="viewState === 'results' && current">
        <BatchTabs
          v-if="hasBatch"
          :results="results"
          :active-index="activeIndex"
          class="mb-5"
          @select="selectBatch"
        />
        <ResultsSection
          :data="current"
          :raw="currentRaw"
          @export="current && exportJson(current)"
          @reset="reset"
        />
      </template>
    </main>

    <footer class="border-t border-border py-5">
      <div class="max-w-6xl mx-auto px-5 text-center text-sm text-text-muted">
        Torrent Parser © 2025 ·
        <a href="https://7471.top/" target="_blank" rel="noopener" class="text-accent hover:underline">7471.top</a>
      </div>
    </footer>

    <noscript>
      <div class="p-4 text-center text-danger">
        <strong>⚠️ 您的浏览器未启用 JavaScript。</strong> Torrent Parser 需要 JavaScript 才能在浏览器端解析种子文件。
      </div>
    </noscript>
  </div>
</template>
