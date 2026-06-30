import type { ParsedTorrent } from './types'

export function parseMagnetUri(uri: string): Record<string, string[]> {
  const qmark = uri.indexOf('?')
  if (qmark === -1) return {}
  const pairs = uri.slice(qmark + 1).split('&')
  const params: Record<string, string[]> = {}
  for (const pair of pairs) {
    const kv = pair.split('=')
    const key = decodeURIComponent(kv[0])
    const val = kv.length > 1 ? decodeURIComponent(kv.slice(1).join('=')) : ''
    if (!params[key]) params[key] = []
    params[key].push(val)
  }
  return params
}

export function isMagnetLink(text: string): boolean {
  return text.trim().toLowerCase().indexOf('magnet:') === 0
}

export function base32ToHex(str: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  str = str.toUpperCase()
  let bits = ''
  for (const char of str) {
    const val = alphabet.indexOf(char)
    if (val === -1) throw new Error(`Invalid base32 character: ${char}`)
    bits += val.toString(2).padStart(5, '0')
  }
  let hex = ''
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8)
    if (byte.length === 8) hex += parseInt(byte, 2).toString(16).padStart(2, '0')
  }
  return hex
}

export class MagnetLink {
  hashV1: string | null
  hashV2: string | null
  hash: string
  name: string
  trackers: string[]

  constructor(uri: string) {
    const params = parseMagnetUri(uri.trim())
    const xts = params['xt'] || []
    if (xts.length === 0) throw new Error('Magnet 链接缺少 xt 参数 (info hash)')

    let v1: string | null = null
    let v2: string | null = null
    for (const xt of xts) {
      const mBtih = xt.match(/^urn:btih:(.+)$/i)
      if (mBtih) {
        let h = mBtih[1]
        if (/^[A-Za-z2-7]{32}$/.test(h)) h = base32ToHex(h)
        else if (!/^[A-Fa-f0-9]{40}$/.test(h)) {
          throw new Error('无效的 btih info hash（应为 40 位 hex 或 32 位 base32）')
        }
        v1 = h.toLowerCase()
        continue
      }
      const mBtmh = xt.match(/^urn:btmh:(.+)$/i)
      if (mBtmh) {
        const mh = mBtmh[1].toLowerCase()
        if (!/^1220[a-f0-9]{64}$/.test(mh)) {
          throw new Error('不支持的 btmh multihash（仅支持 sha2-256 / 0x1220 前缀）')
        }
        v2 = mh.slice(4)
        continue
      }
    }

    if (!v1 && !v2) {
      throw new Error('不支持的 xt 类型，仅支持 btih (v1) 与 btmh sha2-256 (v2)')
    }

    this.hashV1 = v1
    this.hashV2 = v2
    this.hash = v1 || v2!
    this.name = params['dn'] ? params['dn'][0] : ''
    this.trackers = params['tr'] || []
  }

  toDict(): ParsedTorrent {
    return {
      filepath: 'magnet',
      name: this.name || '(磁力链接)',
      info_hash: this.hash,
      info_hash_v1: this.hashV1,
      info_hash_v2: this.hashV2,
      total_size: 0,
      is_single_file: true,
      is_private: false,
      meta_version: this.hashV2 ? 2 : 1,
      is_hybrid: !!(this.hashV1 && this.hashV2),
      announce: this.trackers[0] || '',
      announce_list: this.trackers,
      web_seeds: [],
      comment: '',
      created_by: '',
      creation_date: undefined,
      creation_date_str: 'N/A',
      encoding: '',
      piece_length: 0,
      piece_count: 0,
      piece_hashes: [],
      piece_layers: null,
      files: [],
      extensions: null,
      dht_nodes: [],
      health_score: 0,
      health_reasons: ['仅磁力链接'],
      magnet_link: this.magnetLink(),
    }
  }

  magnetLink(): string {
    const params: string[] = []
    if (this.hashV1) params.push('xt=urn:btih:' + this.hashV1)
    if (this.hashV2) params.push('xt=urn:btmh:1220' + this.hashV2)
    for (const tracker of this.trackers) {
      params.push('tr=' + encodeURIComponent(tracker))
    }
    if (this.name) params.push('dn=' + encodeURIComponent(this.name))
    return 'magnet:?' + params.join('&')
  }
}
