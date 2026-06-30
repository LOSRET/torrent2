import type { BencodeDict, BencodeValue } from './types'

export class BencodeDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BencodeDecodeError'
  }
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export class BencodeDecoder {
  private _data: Uint8Array
  private _index = 0
  private _decoder: TextDecoder
  private _fatalDecoder: TextDecoder

  constructor(data: ArrayBuffer | Uint8Array) {
    this._data = new Uint8Array(data)
    this._decoder = new TextDecoder('utf-8')
    this._fatalDecoder = new TextDecoder('utf-8', { fatal: true })
  }

  decode(): BencodeValue {
    return this._decodeNext()
  }

  private _decodeNext(): BencodeValue {
    if (this._index >= this._data.length) {
      throw new BencodeDecodeError('Unexpected end of data')
    }

    const char = this._data[this._index]

    if (char === 0x69) return this._decodeInt() // 'i'
    if (char === 0x6c) return this._decodeList() // 'l'
    if (char === 0x64) return this._decodeDict() // 'd'
    if (char >= 0x30 && char <= 0x39) return this._decodeString() // '0'-'9'

    throw new BencodeDecodeError(
      `Invalid bencode at index ${this._index}: unexpected byte ${char}`
    )
  }

  private _decodeInt(): number {
    this._index++ // skip 'i'
    const end = this._data.indexOf(0x65, this._index) // find 'e'
    if (end === -1) throw new BencodeDecodeError('Unterminated integer')
    const numStr = this._decoder.decode(this._data.slice(this._index, end))

    if (!/^-?(0|[1-9][0-9]*)$/.test(numStr) || numStr === '-0') {
      throw new BencodeDecodeError(`Invalid integer: ${numStr}`)
    }

    this._index = end + 1
    return parseInt(numStr, 10)
  }

  private _decodeString(): Uint8Array {
    const colon = this._data.indexOf(0x3a, this._index) // find ':'
    if (colon === -1) throw new BencodeDecodeError('Unterminated string length')
    const lenStr = this._decoder.decode(this._data.slice(this._index, colon))
    if (!/^[0-9]+$/.test(lenStr)) {
      throw new BencodeDecodeError(`Invalid string length: ${lenStr}`)
    }
    const length = parseInt(lenStr, 10)
    const start = colon + 1
    const end = start + length
    if (end > this._data.length) {
      throw new BencodeDecodeError('String length exceeds data size')
    }
    this._index = end
    return this._data.slice(start, end) // returns Uint8Array (raw bytes)
  }

  private _decodeList(): BencodeValue[] {
    this._index++ // skip 'l'
    const result: BencodeValue[] = []
    while (true) {
      if (this._index >= this._data.length) {
        throw new BencodeDecodeError('Unterminated list')
      }
      if (this._data[this._index] === 0x65) break // 'e'
      result.push(this._decodeNext())
    }
    this._index++ // skip 'e'
    return result
  }

  private _decodeDict(): BencodeDict {
    this._index++ // skip 'd'
    const result = Object.create(null) as BencodeDict
    Object.defineProperty(result, '__keyBytes', {
      value: Object.create(null) as Record<string, Uint8Array>,
      enumerable: false,
    })

    while (true) {
      if (this._index >= this._data.length) {
        throw new BencodeDecodeError('Unterminated dictionary')
      }
      if (this._data[this._index] === 0x65) break // 'e'

      const keyBytes = this._decodeString()
      let key: string
      try {
        key = this._fatalDecoder.decode(keyBytes)
      } catch {
        key = '$hex$' + bytesToHex(keyBytes)
      }
      ;(result as any).__keyBytes[key] = keyBytes
      result[key] = this._decodeNext()
    }
    this._index++ // skip 'e'
    return result
  }
}

export function bdecode(data: ArrayBuffer | Uint8Array): BencodeValue {
  const decoder = new BencodeDecoder(data)
  const result = decoder.decode()
  if (decoder['_index'] !== decoder['_data'].length) {
    throw new BencodeDecodeError('Trailing data after bencode value')
  }
  return result
}
