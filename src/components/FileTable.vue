<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TorrentFileItem } from '../lib/types'
import { formatSize } from '../lib/format'

const props = defineProps<{ files: TorrentFileItem[]; totalSize: number }>()

const PAGE_SIZE = 50
const query = ref('')
const sort = ref<'index' | 'name' | 'size-desc' | 'size-asc'>('index')
const page = ref(0)

const visibleFiles = computed(() => {
  const q = query.value.toLowerCase()
  let list = props.files.filter((f) => !q || f.path.toLowerCase().includes(q))
  list = [...list].sort((a, b) => {
    if (sort.value === 'name') return a.path.localeCompare(b.path)
    if (sort.value === 'size-desc') return b.length - a.length
    if (sort.value === 'size-asc') return a.length - b.length
    return a.index - b.index
  })
  return list
})

const totalPages = computed(() => Math.ceil(visibleFiles.value.length / PAGE_SIZE) || 1)

const pageFiles = computed(() => {
  const start = page.value * PAGE_SIZE
  return visibleFiles.value.slice(start, start + PAGE_SIZE)
})

const rangeStart = computed(() => page.value * PAGE_SIZE)
const rangeEnd = computed(() => Math.min(rangeStart.value + PAGE_SIZE, visibleFiles.value.length))

function setSort(s: typeof sort.value) {
  sort.value = s
  page.value = 0
}

function onSearch() {
  page.value = 0
}

function prev() {
  if (page.value > 0) page.value--
}
function next() {
  if (page.value < totalPages.value - 1) page.value++
}

const sortBtns: { key: typeof sort.value; label: string }[] = [
  { key: 'index', label: '序号' },
  { key: 'name', label: '名称' },
  { key: 'size-desc', label: '大小 ↓' },
  { key: 'size-asc', label: '大小 ↑' },
]
</script>

<template>
  <div class="rounded-xl border border-border bg-surface overflow-hidden">
    <div class="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-2">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">文件</span>
      <h2 class="text-sm font-semibold text-text">文件列表</h2>
    </div>
    <div class="p-5">
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          v-model="query"
          type="text"
          placeholder="搜索文件路径..."
          class="flex-1 px-3.5 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          aria-label="搜索文件路径"
          @input="onSearch"
        />
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-xs text-text-muted">排序：</span>
          <button
            v-for="b in sortBtns"
            :key="b.key"
            type="button"
            class="text-xs px-2.5 py-1.5 rounded-md transition-colors"
            :class="sort === b.key
              ? 'bg-accent text-white'
              : 'bg-surface-2 text-text-muted border border-border hover:text-accent'"
            @click="setSort(b.key)"
          >
            {{ b.label }}
          </button>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-border">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-2 text-text-muted text-xs">
              <th scope="col" class="px-3 py-2.5 text-left font-medium w-12">#</th>
              <th scope="col" class="px-3 py-2.5 text-left font-medium">路径</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium w-40">大小</th>
              <th scope="col" class="px-3 py-2.5 text-left font-medium w-40">占比</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-if="pageFiles.length === 0">
              <td colspan="4" class="px-3 py-8 text-center text-text-muted">
                {{ files.length === 0 ? '无文件信息' : '没有匹配的文件' }}
              </td>
            </tr>
            <tr
              v-for="f in pageFiles"
              :key="f.index"
              class="hover:bg-surface-2 transition-colors"
            >
              <td class="px-3 py-2 text-text-muted font-mono text-xs">{{ f.index }}</td>
              <td class="px-3 py-2 text-text break-all">{{ f.path }}</td>
              <td class="px-3 py-2 text-right text-text-muted font-mono text-xs whitespace-nowrap">{{ formatSize(f.length) }}</td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden min-w-[40px]">
                    <div
                      class="h-full bg-accent rounded-full"
                      :style="{ width: (totalSize > 0 ? (f.length / totalSize * 100).toFixed(1) : 0) + '%' }"
                    />
                  </div>
                  <span class="text-xs text-text-muted font-mono w-10 text-right">
                    {{ totalSize > 0 ? (f.length / totalSize * 100).toFixed(1) : 0 }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="visibleFiles.length > PAGE_SIZE" class="flex items-center justify-center gap-4 mt-4">
        <button
          type="button"
          class="px-3 py-1.5 rounded-md text-sm border border-border bg-surface-2 text-text-muted hover:text-accent hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="page === 0"
          @click="prev"
        >
          ← 上一页
        </button>
        <span class="text-sm text-text-muted font-mono">{{ rangeStart + 1 }}-{{ rangeEnd }} / {{ visibleFiles.length }}</span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-md text-sm border border-border bg-surface-2 text-text-muted hover:text-accent hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="page >= totalPages - 1"
          @click="next"
        >
          下一页 →
        </button>
      </div>
    </div>
  </div>
</template>
