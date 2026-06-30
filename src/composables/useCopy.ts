import { ref } from 'vue'

export function useCopy() {
  const copiedKey = ref<string | null>(null)

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      copiedKey.value = key
      setTimeout(() => {
        if (copiedKey.value === key) copiedKey.value = null
      }, 1500)
    } catch {
      const sel = window.getSelection()
      if (sel) sel.removeAllRanges()
    }
  }

  return { copiedKey, copy }
}
