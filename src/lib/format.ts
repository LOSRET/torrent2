export function formatSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return i === 0
    ? bytes.toLocaleString() + ' B'
    : size.toFixed(2) + ' ' + units[i] + ' (' + bytes.toLocaleString() + ' bytes)'
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface FileCategory {
  label: string
  exts: string[]
}

const FILE_CATEGORIES: FileCategory[] = [
  { label: '视频', exts: ['mp4','mkv','avi','mov','wmv','flv','webm','m4v','ts','rmvb','rm','mpg','mpeg','3gp'] },
  { label: '音频', exts: ['mp3','flac','wav','aac','ogg','wma','m4a','ape','alac','opus','aiff'] },
  { label: '图片', exts: ['jpg','jpeg','png','gif','bmp','webp','svg','tiff','ico','heic','heif','raw','cr2','nef'] },
  { label: '文档', exts: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','epub','mobi','csv','rtf','odt'] },
  { label: '压缩包', exts: ['zip','rar','7z','tar','gz','bz2','xz','zst','cab','iso','dmg'] },
  { label: '程序', exts: ['exe','msi','apk','ipa','deb','rpm','pkg','app','dll','so','dylib','bin'] },
]

export function categorizeFile(filename: string): string {
  const dot = filename.lastIndexOf('.')
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase() : ''
  for (const cat of FILE_CATEGORIES) {
    if (cat.exts.includes(ext)) return cat.label
  }
  return '其他'
}

export const FILE_CATEGORY_ORDER = [
  '视频','音频','图片','文档','压缩包','程序','其他'
]

const EXT_NAMES: Record<string, string> = {
  ut_pex: 'PEX (Peer Exchange)',
  ut_metadata: 'Metadata Exchange',
  ut_holepunch: 'Hole Punch',
  ut_comment: 'Comments',
  upload_only: 'Upload Only',
  lt_donthave: "Don't Have",
  lt_test: 'Test',
  hybrid: 'Hybrid',
  speed: 'Speed',
  share_mode: 'Share Mode',
  xseed: 'LTSeed',
}

export function extName(key: string): string {
  return EXT_NAMES[key] || key
}
