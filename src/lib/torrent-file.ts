import { bytesToHex, bdecode, BencodeDecodeError } from './bencode'
import type {
  BencodeDict,
  BencodeValue,
  DhtNode,
  HealthResult,
  ParsedTorrent,
  TorrentFileItem,
} from './types'

async function _digestHex(algo: string, buf: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algo, buf)
  return bytesToHex(new Uint8Array(hashBuffer))
}

function isDict(v: BencodeValue | undefined): v is BencodeDict {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof Uint8Array)
  )
}

export class TorrentFile {
  private _buffer: ArrayBuffer
  filename: string
  private _decoder: TextDecoder
  raw: BencodeDict
  private _infoBytesCache: ArrayBuffer

  constructor(buffer: ArrayBuffer, filename?: string) {
    this._buffer = buffer
    this.filename = filename || 'unknown'
    this._decoder = new TextDecoder('utf-8')
    this.raw = {} as BencodeDict
    this._infoBytesCache = new ArrayBuffer(0)
    this._parse()
  }

  private _parse(): void {
    const decoded = bdecode(this._buffer)
    if (!isDict(decoded)) {
      throw new BencodeDecodeError('Top-level bencode value must be a dictionary')
    }
    this.raw = decoded
    this._infoBytesCache = this._infoBytes()
  }

  private _str(key: string): string {
    return this._strFromBytes(this.raw[key])
  }

  private _strFromBytes(val: BencodeValue | undefined): string {
    if (val === undefined || val === null) return ''
    if (val instanceof Uint8Array) return this._decoder.decode(val)
    return String(val)
  }

  private _formatTimestamp(ts: number | undefined): string {
    if (ts === undefined || ts === null) return 'N/A'
    try {
      const d = new Date(ts * 1000)
      return d.toISOString().replace('T', ' ').replace('.000Z', ' UTC')
    } catch {
      return String(ts)
    }
  }

  get announce(): string {
    return this._str('announce')
  }

  get announceList(): BencodeValue[] {
    return (this.raw['announce-list'] as BencodeValue[]) || []
  }

  get comment(): string {
    return this._str('comment')
  }

  get createdBy(): string {
    return this._str('created by')
  }

  get creationDate(): number | undefined {
    const val = this.raw['creation-date']
    return typeof val === 'number' ? val : undefined
  }

  get encoding(): string {
    return this._str('encoding')
  }

  get info(): BencodeDict {
    return (this.raw['info'] as BencodeDict) || ({} as BencodeDict)
  }

  get hasV1Markers(): boolean {
    const info = this.info
    return 'pieces' in info || 'length' in info || 'files' in info
  }

  async infoHashV1(): Promise<string | null> {
    if (!this.hasV1Markers) return null
    return _digestHex('SHA-1', this._infoBytesCache)
  }

  async infoHashV2(): Promise<string | null> {
    if (this.metaVersion !== 2) return null
    return _digestHex('SHA-256', this._infoBytesCache)
  }

  async infoHash(): Promise<string> {
    const v1 = await this.infoHashV1()
    if (v1) return v1
    const v2 = await this.infoHashV2()
    if (v2) return v2
    return _digestHex('SHA-1', this._infoBytesCache)
  }

  get pieceLength(): number {
    return (this.info['piece length'] as number) || 0
  }

  get pieces(): Uint8Array {
    const p = this.info['pieces']
    return p instanceof Uint8Array ? p : new Uint8Array(0)
  }

  get pieceHashes(): string[] {
    const p = this.pieces
    const result: string[] = []
    for (let i = 0; i + 20 <= p.length; i += 20) {
      result.push(bytesToHex(p.slice(i, i + 20)))
    }
    return result
  }

  get pieceCount(): number {
    const p = this.pieces
    if (p.length > 0) {
      return Math.floor(p.length / 20)
    }
    if (this.metaVersion === 2) {
      const layers = this.pieceLayers
      const keys = layers ? Object.keys(layers) : []
      let total = 0
      for (const key of keys) {
        const val = layers![key]
        if (val instanceof Uint8Array) total += Math.floor(val.length / 32)
      }
      if (total > 0) return total
      if (this.pieceLength > 0 && this.totalSize > 0) {
        return Math.ceil(this.totalSize / this.pieceLength)
      }
    }
    return 0
  }

  get name(): string {
    const val = this.info['name']
    if (val === undefined || val === null) return ''
    if (val instanceof Uint8Array) return this._decoder.decode(val)
    return String(val)
  }

  get urlList(): string[] {
    const raw = this.raw['url-list']
    if (!raw) return []
    if (raw instanceof Uint8Array) return [this._decoder.decode(raw)]
    if (typeof raw === 'string') return [raw]
    if (Array.isArray(raw)) {
      const result: string[] = []
      for (const u of raw) {
        result.push(u instanceof Uint8Array ? this._decoder.decode(u) : String(u))
      }
      return result
    }
    return []
  }

  get isPrivate(): boolean {
    return !!this.info['private']
  }

  get isSingleFile(): boolean {
    if (this.metaVersion === 2 && this.info['file tree']) {
      return this._v2FileCount(this.info['file tree'] as BencodeDict) <= 1
    }
    return 'length' in this.info
  }

  get totalSize(): number {
    if (this.metaVersion === 2 && this.info['file tree']) {
      return this._v2TotalSize(this.info['file tree'] as BencodeDict)
    }
    if (this.isSingleFile) return (this.info['length'] as number) || 0
    let total = 0
    const files = (this.info['files'] as BencodeDict[]) || []
    for (const f of files) {
      total += (f['length'] as number) || 0
    }
    return total
  }

  private _v2TotalSize(tree: BencodeDict): number {
    let total = 0
    const keys = Object.keys(tree)
    for (const key of keys) {
      const node = tree[key] as BencodeDict
      if (node && '' in node) {
        total += ((node[''] as BencodeDict)['length'] as number) || 0
      } else if (node && typeof node === 'object') {
        total += this._v2TotalSize(node)
      }
    }
    return total
  }

  private _v2FileCount(tree: BencodeDict): number {
    let total = 0
    const keys = Object.keys(tree)
    for (const key of keys) {
      const node = tree[key] as BencodeDict
      if (node && '' in node) {
        total++
      } else if (node && typeof node === 'object') {
        total += this._v2FileCount(node)
      }
    }
    return total
  }

  private _v2WalkFileTree(
    tree: BencodeDict,
    prefix: string,
    result: TorrentFileItem[] = []
  ): TorrentFileItem[] {
    const keys = Object.keys(tree)
    for (const name of keys) {
      const node = tree[name] as BencodeDict
      const currentPath = prefix ? prefix + '/' + name : name
      if (node && '' in node) {
        const leaf = node[''] as BencodeDict
        result.push({
          index: result.length,
          path: currentPath,
          length: (leaf['length'] as number) || 0,
        })
      } else if (node && typeof node === 'object') {
        this._v2WalkFileTree(node, currentPath, result)
      }
    }
    return result
  }

  get files(): TorrentFileItem[] {
    if (this.metaVersion === 2 && this.info['file tree']) {
      const ft = this.info['file tree'] as BencodeDict
      const ftKeys = Object.keys(ft)
      const prefix =
        ftKeys.length === 1 && ftKeys[0] === this.name ? '' : this.name
      return this._v2WalkFileTree(ft, prefix)
    }
    if (this.isSingleFile) {
      return [
        { index: 0, path: this.name, length: (this.info['length'] as number) || 0 },
      ]
    }
    const result: TorrentFileItem[] = []
    const rawFiles = (this.info['files'] as BencodeDict[]) || []
    for (let i = 0; i < rawFiles.length; i++) {
      const finfo = rawFiles[i]
      const parts: string[] = []
      const pathParts = (finfo['path'] as Uint8Array[]) || []
      for (const p of pathParts) {
        parts.push(p instanceof Uint8Array ? this._decoder.decode(p) : String(p))
      }
      result.push({
        index: i,
        path: parts.join('/'),
        length: (finfo['length'] as number) || 0,
      })
    }
    return result
  }

  get metaVersion(): number {
    const v = this.info['meta version']
    if (v === undefined || v === null) return 1
    return v === 2 ? 2 : 1
  }

  get pieceLayers(): Record<string, Uint8Array> | null {
    const pl = this.raw['piece layers']
    if (!pl || typeof pl !== 'object' || Array.isArray(pl)) return null
    const result: Record<string, Uint8Array> = {}
    const dict = pl as BencodeDict
    const keys = Object.keys(dict)
    const keyBytes: Record<string, Uint8Array> = (dict as any).__keyBytes || {}
    for (const key of keys) {
      const rawKey = keyBytes[key]
      const outKey = rawKey instanceof Uint8Array ? bytesToHex(rawKey) : key
      result[outKey] = dict[key] as Uint8Array
    }
    return result
  }

  get isHybrid(): boolean {
    return this.metaVersion === 2 && this.hasV1Markers
  }

  get extensions(): Record<string, number> | null {
    const meta = this.info['metadata']
    if (!meta || typeof meta !== 'object') return null
    const m = (meta as BencodeDict)['m']
    if (!m || typeof m !== 'object') return null
    const result: Record<string, number> = {}
    const mDict = m as BencodeDict
    const keys = Object.keys(mDict)
    for (const key of keys) {
      const v = mDict[key]
      result[key] = typeof v === 'number' ? v : 0
    }
    return result
  }

  get dhtNodes(): DhtNode[] {
    const raw = this.raw['nodes']
    if (!raw) return []
    const result: DhtNode[] = []
    if (Array.isArray(raw)) {
      for (const node of raw) {
        if (Array.isArray(node) && node.length >= 2) {
          const hostVal = node[0]
          const host =
            hostVal instanceof Uint8Array ? this._decoder.decode(hostVal) : String(hostVal)
          result.push({ host, port: node[1] as number })
        }
      }
    }
    return result
  }

  healthScore(): HealthResult {
    let score = 0
    const reasons: string[] = []

    const trackerCount = this._trackerUrls().length
    if (trackerCount >= 5) {
      score += 30
      reasons.push('多个 Tracker')
    } else if (trackerCount >= 2) {
      score += 20
      reasons.push(trackerCount + ' 个 Tracker')
    } else if (trackerCount === 1) {
      score += 10
      reasons.push('1 个 Tracker')
    } else {
      reasons.push('无 Tracker')
    }

    if (this.dhtNodes.length > 0) {
      score += 20
      reasons.push('DHT 节点')
    } else if (!this.isPrivate) {
      score += 10
      reasons.push('公开种子 (可 DHT)')
    }

    const ext = this.extensions
    if (ext) {
      const extCount = Object.keys(ext).length
      if (extCount >= 3) {
        score += 20
        reasons.push(extCount + ' 个扩展')
      } else if (extCount >= 1) {
        score += 10
        reasons.push(extCount + ' 个扩展')
      }
      if (ext['ut_pex']) {
        score += 5
        reasons.push('PEX')
      }
      if (ext['ut_metadata']) {
        score += 5
        reasons.push('ut_metadata')
      }
    }

    const webSeeds = this.urlList
    if (webSeeds.length > 0) {
      score += 15
      reasons.push('Web Seed')
    }

    if (this.isPrivate) {
      score -= 10
      reasons.push('私有种子')
    }

    score = Math.max(0, Math.min(100, score))
    return { score, reasons }
  }

  private _infoBytes(): ArrayBuffer {
    const data = new Uint8Array(this._buffer)

    const readString = (pos: number) => {
      if (pos >= data.length || data[pos] < 0x30 || data[pos] > 0x39) {
        throw new Error('Expected bencode string at offset ' + pos)
      }
      const colon = data.indexOf(0x3a, pos)
      if (colon === -1) throw new Error('Unterminated string at offset ' + pos)
      const lenStr = this._decoder.decode(data.slice(pos, colon))
      if (!/^[0-9]+$/.test(lenStr)) {
        throw new Error('Invalid string length at offset ' + pos)
      }
      const length = parseInt(lenStr, 10)
      const start = colon + 1
      const end = start + length
      if (end > data.length) {
        throw new Error('String length exceeds data size at offset ' + pos)
      }
      return { start, end, next: end }
    }

    const skipValue = (pos: number): number => {
      if (pos >= data.length) throw new Error('Unexpected end of data')
      const b = data[pos]
      if (b === 0x69) {
        const iend = data.indexOf(0x65, pos + 1)
        if (iend === -1) throw new Error('Unterminated integer at offset ' + pos)
        return iend + 1
      }
      if (b >= 0x30 && b <= 0x39) {
        return readString(pos).next
      }
      if (b === 0x6c) {
        pos++
        while (true) {
          if (pos >= data.length) throw new Error('Unterminated list')
          if (data[pos] === 0x65) return pos + 1
          pos = skipValue(pos)
        }
      }
      if (b === 0x64) {
        pos++
        while (true) {
          if (pos >= data.length) throw new Error('Unterminated dictionary')
          if (data[pos] === 0x65) return pos + 1
          const key = readString(pos)
          pos = skipValue(key.next)
        }
      }
      throw new Error(`Invalid bencode byte at offset ${pos}: ${b}`)
    }

    if (data.length === 0 || data[0] !== 0x64) {
      throw new Error('Top-level bencode value must be a dictionary')
    }

    let pos = 1
    while (pos < data.length) {
      if (data[pos] === 0x65) break
      const key = readString(pos)
      const keyName = this._decoder.decode(data.slice(key.start, key.end))
      pos = key.next
      if (keyName === 'info') {
        if (pos >= data.length || data[pos] !== 0x64) {
          throw new Error('info value must be a dictionary')
        }
        const end = skipValue(pos)
        return data.slice(pos, end).buffer
      }
      pos = skipValue(pos)
    }

    throw new Error('Cannot locate info dictionary in torrent file')
  }

  private _trackerUrls(): string[] {
    const result: string[] = []

    const add = (raw: BencodeValue | undefined) => {
      const url = this._strFromBytes(raw)
      if (url && result.indexOf(url) === -1) result.push(url)
    }

    add(this.raw['announce'])

    const al = this.announceList
    if (Array.isArray(al)) {
      for (const tier of al) {
        if (Array.isArray(tier)) {
          for (const t of tier) add(t)
        } else {
          add(tier)
        }
      }
    } else {
      add(al)
    }

    return result
  }

  magnetLink(hashes?: { v1?: string | null; v2?: string | null } | string): string {
    let v1: string | null = null
    let v2: string | null = null
    if (typeof hashes === 'string') {
      v1 = hashes
    } else if (hashes && typeof hashes === 'object') {
      v1 = hashes.v1 || null
      v2 = hashes.v2 || null
    }

    const params: string[] = []
    if (v1) params.push('xt=urn:btih:' + v1)
    if (v2) params.push('xt=urn:btmh:1220' + v2)

    const trackers = this._trackerUrls()
    for (const tracker of trackers) {
      params.push('tr=' + encodeURIComponent(tracker))
    }
    if (this.name) params.push('dn=' + encodeURIComponent(this.name))
    return 'magnet:?' + params.join('&')
  }

  toDict(): ParsedTorrent {
    const allTrackers = this._trackerUrls()
    const health = this.healthScore()

    return {
      filepath: this.filename,
      name: this.name,
      info_hash: null,
      info_hash_v1: null,
      info_hash_v2: null,
      total_size: this.totalSize,
      is_single_file: this.isSingleFile,
      is_private: this.isPrivate,
      meta_version: this.metaVersion,
      is_hybrid: this.isHybrid,
      announce: this.announce,
      announce_list: allTrackers,
      web_seeds: this.urlList,
      comment: this.comment,
      created_by: this.createdBy,
      creation_date: this.creationDate,
      creation_date_str: this._formatTimestamp(this.creationDate),
      encoding: this.encoding,
      piece_length: this.pieceLength,
      piece_count: this.pieceCount,
      piece_hashes: this.pieceHashes,
      piece_layers: this.pieceLayers,
      files: this.files,
      extensions: this.extensions,
      dht_nodes: this.dhtNodes,
      health_score: health.score,
      health_reasons: health.reasons,
      magnet_link: '',
    }
  }
}
