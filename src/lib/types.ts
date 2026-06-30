export type BencodeValue = number | Uint8Array | BencodeValue[] | BencodeDict

export interface BencodeDict {
  [key: string]: BencodeValue
}

export interface TorrentFileItem {
  index: number
  path: string
  length: number
}

export interface DhtNode {
  host: string
  port: number
}

export interface HealthResult {
  score: number
  reasons: string[]
}

export interface ParsedTorrent {
  filepath: string
  name: string
  info_hash: string | null
  info_hash_v1: string | null
  info_hash_v2: string | null
  total_size: number
  is_single_file: boolean
  is_private: boolean
  meta_version: number
  is_hybrid: boolean
  announce: string
  announce_list: string[]
  web_seeds: string[]
  comment: string
  created_by: string
  creation_date: number | undefined
  creation_date_str: string
  encoding: string
  piece_length: number
  piece_count: number
  piece_hashes: string[]
  piece_layers: Record<string, Uint8Array> | null
  files: TorrentFileItem[]
  extensions: Record<string, number> | null
  dht_nodes: DhtNode[]
  health_score: number
  health_reasons: string[]
  magnet_link: string
}
