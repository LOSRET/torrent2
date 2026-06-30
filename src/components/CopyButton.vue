<script setup lang="ts">
import { useCopy } from '../composables/useCopy'

const props = defineProps<{
  text: string
  label?: string
}>()

const { copiedKey, copy } = useCopy()
const key = 'btn-' + Math.random().toString(36).slice(2)

function onClick() {
  if (props.text && props.text !== '—') copy(props.text, key)
}
</script>

<template>
  <button
    type="button"
    :disabled="!text || text === '—'"
    class="shrink-0 text-xs px-2.5 py-1 rounded-md font-medium transition-colors border border-border bg-surface-2 text-text-muted hover:text-accent hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
    @click="onClick"
  >
    {{ copiedKey === key ? '已复制' : (label || '复制') }}
  </button>
</template>
