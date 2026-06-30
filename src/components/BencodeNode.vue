<script setup lang="ts">
import { bytesToHex } from '../lib/bencode'
import type { BencodeValue } from '../lib/types'

const props = defineProps<{
  value: BencodeValue
  keyName: string
  depth: number
}>()

const MAX_DEPTH = 6

function tryDecodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function isPrintable(str: string): boolean {
  return /^[\x20-\x7e一-鿿　-〿＀-￯]+$/.test(str) && str.length <= 200
}

function isBytes(v: unknown): v is Uint8Array {
  return v instanceof Uint8Array
}

function isNum(v: unknown): v is number {
  return typeof v === 'number'
}

function isArr(v: unknown): v is BencodeValue[] {
  return Array.isArray(v)
}

function isObj(v: unknown): v is Record<string, BencodeValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Uint8Array)
}

function objKeys(v: Record<string, BencodeValue>): string[] {
  return Object.keys(v).filter((k) => k !== '__keyBytes')
}

function hexPreview(bytes: Uint8Array): { preview: string; full: string } {
  const hex = bytesToHex(bytes)
  return { preview: hex.length > 64 ? hex.slice(0, 64) + '…' : hex, full: hex }
}

function decodedStr(bytes: Uint8Array): string | null {
  const s = tryDecodeUtf8(bytes)
  return s !== null && isPrintable(s) ? s : null
}
</script>

<template>
  <div>
    <template v-if="depth > MAX_DEPTH">
      <span class="text-text-muted/50">… (深度限制)</span>
    </template>

    <!-- Bytes -->
    <template v-else-if="isBytes(value)">
      <div class="flex gap-2 py-0.5">
        <span class="text-accent shrink-0">{{ keyName }}</span>
        <span class="text-text-muted shrink-0">:</span>
        <span v-if="decodedStr(value)" class="text-emerald-600 dark:text-emerald-400 break-all">"{{ decodedStr(value) }}"</span>
        <span v-else class="text-text-muted break-all" :title="hexPreview(value).full">
          0x{{ hexPreview(value).preview }} ({{ value.length }} B)
        </span>
      </div>
    </template>

    <!-- Number -->
    <template v-else-if="isNum(value)">
      <div class="flex gap-2 py-0.5">
        <span class="text-accent shrink-0">{{ keyName }}</span>
        <span class="text-text-muted shrink-0">:</span>
        <span class="text-cyan-600 dark:text-cyan-400">{{ value }}</span>
      </div>
    </template>

    <!-- List -->
    <template v-else-if="isArr(value)">
      <div class="py-0.5">
        <div class="flex gap-2">
          <span class="text-accent shrink-0">{{ keyName }}</span>
          <span class="text-text-muted shrink-0">: [ {{ value.length }} 项</span>
        </div>
        <div class="pl-4">
          <BencodeNode
            v-for="(item, i) in value"
            :key="i"
            :value="item"
            :key-name="String(i)"
            :depth="depth + 1"
          />
        </div>
        <span class="text-text-muted">]</span>
      </div>
    </template>

    <!-- Dict -->
    <template v-else-if="isObj(value)">
      <div class="py-0.5">
        <div class="flex gap-2">
          <span class="text-accent shrink-0">{{ keyName }}</span>
          <span class="text-text-muted shrink-0">: { {{ objKeys(value).length }} 键</span>
        </div>
        <div class="pl-4">
          <BencodeNode
            v-for="k in objKeys(value)"
            :key="k"
            :value="value[k]"
            :key-name="k"
            :depth="depth + 1"
          />
        </div>
        <span class="text-text-muted">}</span>
      </div>
    </template>
  </div>
</template>
