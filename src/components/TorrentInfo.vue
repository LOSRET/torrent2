<script setup lang="ts">
import type { ParsedTorrent } from '../lib/types'
import CopyButton from './CopyButton.vue'

defineProps<{ data: ParsedTorrent }>()
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-accent-soft text-accent font-mono">基础</span>
      <h2 class="text-sm font-semibold text-text">种子信息</h2>
    </div>
    <div class="flex flex-col divide-y divide-border">
      <div class="info-row">
        <span class="info-key">名称</span>
        <span class="info-val">{{ data.name || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">协议版本</span>
        <span class="info-val">
          <span
            class="inline-block text-xs px-2 py-0.5 rounded-md font-mono"
            :class="data.is_hybrid
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
              : data.meta_version === 2
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'bg-surface-2 text-text-muted'"
          >
            {{ data.is_hybrid ? 'Hybrid (v1 + v2)' : data.meta_version === 2 ? 'BitTorrent v2' : 'BitTorrent v1' }}
          </span>
        </span>
      </div>
      <div v-if="data.info_hash_v1" class="info-row">
        <span class="info-key">Info Hash <span class="hash-badge">v1</span></span>
        <span class="info-val mono">{{ data.info_hash_v1 }}</span>
        <CopyButton :text="data.info_hash_v1 || ''" />
      </div>
      <div v-if="data.info_hash_v2" class="info-row">
        <span class="info-key">Info Hash <span class="hash-badge hash-badge-v2">v2</span></span>
        <span class="info-val mono">{{ data.info_hash_v2 }}</span>
        <CopyButton :text="data.info_hash_v2 || ''" />
      </div>
      <div class="info-row">
        <span class="info-key">Magnet</span>
        <span class="info-val mono break-all text-xs">{{ data.magnet_link || '—' }}</span>
        <CopyButton :text="data.magnet_link || ''" />
      </div>
      <div class="info-row">
        <span class="info-key">私有种子</span>
        <span class="info-val">{{ data.is_private ? '是' : '否' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">编码</span>
        <span class="info-val">{{ data.encoding || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">创建程序</span>
        <span class="info-val">{{ data.created_by || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">创建时间</span>
        <span class="info-val">{{ data.creation_date_str || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">注释</span>
        <span class="info-val">{{ data.comment || '—' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0;
}
.info-key {
  flex-shrink: 0;
  width: 7rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.info-val {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text);
  min-width: 0;
}
.mono {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  word-break: break-all;
}
.hash-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.25rem;
  background: rgba(8, 145, 178, 0.1);
  color: var(--color-accent);
}
.hash-badge-v2 {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}
</style>
