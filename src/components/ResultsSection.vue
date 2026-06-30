<script setup lang="ts">
import type { ParsedTorrent, BencodeDict } from '../lib/types'
import StatCards from './StatCards.vue'
import TorrentInfo from './TorrentInfo.vue'
import PieceInfo from './PieceInfo.vue'
import TrackerList from './TrackerList.vue'
import WebSeedList from './WebSeedList.vue'
import FileTypeChart from './FileTypeChart.vue'
import PieceHashes from './PieceHashes.vue'
import ExtensionsPanel from './ExtensionsPanel.vue'
import DhtNodes from './DhtNodes.vue'
import BencodeTree from './BencodeTree.vue'
import FileTable from './FileTable.vue'

defineProps<{
  data: ParsedTorrent
  raw: BencodeDict | null
}>()

defineEmits<{ export: [] }>()
</script>

<template>
  <div class="flex flex-col gap-4" style="animation: fade-in 0.3s ease-out">
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="text-sm text-text-muted hover:text-accent transition-colors flex items-center gap-1"
        @click="$emit('export')"
      >
        ← 解析新文件
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright transition-colors"
        @click="$emit('export')"
      >
        导出 JSON
      </button>
    </div>

    <StatCards :data="data" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TorrentInfo :data="data" />
      <div class="flex flex-col gap-4">
        <PieceInfo :data="data" />
        <FileTypeChart :files="data.files" :total-size="data.total_size" />
      </div>
    </div>

    <TrackerList :data="data" />
    <WebSeedList :urls="data.web_seeds" />
    <PieceHashes :hashes="data.piece_hashes" />
    <ExtensionsPanel :ext="data.extensions" />
    <DhtNodes :nodes="data.dht_nodes" />
    <BencodeTree :raw="raw" />
    <FileTable :files="data.files" :total-size="data.total_size || 1" />
  </div>
</template>
