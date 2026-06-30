import { ref, computed, shallowRef } from 'vue'
import { TorrentFile } from '../lib/torrent-file'
import { MagnetLink, isMagnetLink } from '../lib/magnet'
import { bytesToHex } from '../lib/bencode'
import type { BencodeDict, ParsedTorrent } from '../lib/types'

export type ViewState = 'idle' | 'loading' | 'error' | 'results'

export function useTorrentParser() {
  const viewState = ref<ViewState>('idle')
  const errorMsg = ref('')
  const results = ref<ParsedTorrent[]>([])
  const rawDicts = shallowRef<(BencodeDict | null)[]>([])
  const activeIndex = ref(0)

  const current = computed(() => results.value[activeIndex.value] || null)
  const currentRaw = computed(() => rawDicts.value[activeIndex.value] || null)
  const hasBatch = computed(() => results.value.length > 1)

  let parsing = false

  async function parseFiles(files: File[]) {
    if (parsing) return
    parsing = true
    viewState.value = 'loading'
    errorMsg.value = ''

    try {
      const valid = files.filter((f) => f.name.toLowerCase().endsWith('.torrent'))
      if (valid.length === 0) {
        throw new Error('请选择 .torrent 文件')
      }

      const parsed: ParsedTorrent[] = []
      const dicts: (BencodeDict | null)[] = []
      for (const file of valid) {
        const buffer = await file.arrayBuffer()
        const torrent = new TorrentFile(buffer, file.name)
        dicts.push(torrent.raw)
        const data = torrent.toDict()
        data.info_hash_v1 = await torrent.infoHashV1()
        data.info_hash_v2 = await torrent.infoHashV2()
        data.info_hash = data.info_hash_v1 || data.info_hash_v2
        data.magnet_link = torrent.magnetLink({
          v1: data.info_hash_v1,
          v2: data.info_hash_v2,
        })
        parsed.push(data)
      }

      results.value = parsed
      rawDicts.value = dicts
      activeIndex.value = 0
      viewState.value = 'results'
    } catch (err) {
      errorMsg.value = err instanceof Error ? err.message : '解析失败'
      viewState.value = 'error'
    } finally {
      parsing = false
    }
  }

  async function parseMagnet(text: string) {
    if (parsing) return
    parsing = true
    viewState.value = 'loading'
    errorMsg.value = ''

    try {
      const magnet = new MagnetLink(text)
      const data = magnet.toDict()
      results.value = [data]
      rawDicts.value = [null]
      activeIndex.value = 0
      viewState.value = 'results'
    } catch (err) {
      errorMsg.value = err instanceof Error ? err.message : 'Magnet 链接解析失败'
      viewState.value = 'error'
    } finally {
      parsing = false
    }
  }

  function handleInput(text: string) {
    if (isMagnetLink(text)) {
      parseMagnet(text)
    } else {
      errorMsg.value = '请输入有效的 magnet 链接'
      viewState.value = 'error'
    }
  }

  function selectBatch(index: number) {
    activeIndex.value = index
  }

  function reset() {
    results.value = []
    rawDicts.value = []
    activeIndex.value = 0
    errorMsg.value = ''
    viewState.value = 'idle'
  }

  function exportJson(data: ParsedTorrent) {
    const replacer = (_key: string, value: unknown) => {
      if (value instanceof Uint8Array) return bytesToHex(value)
      return value
    }
    const json = JSON.stringify(data, replacer, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const name = (data.name || data.filepath || 'torrent').replace(
      /[\\/:*?"<>|]+/g,
      '_'
    )
    a.href = url
    a.download = name + '.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
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
  }
}
