import { UNIT_BY_KIND, type LinkPacket } from './types'

/**
 * HMAC-SHA256 de demostración para el enlace simulado.
 * La clave está en el cliente a propósito: no hay una frontera de confianza.
 * Sirve para rechazar mensajes alterados dentro del simulador, no para
 * proteger datos frente a quien controla el navegador.
 */
export const DEMO_MAC_KEY = 'vitalink-demo-link-key'

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0
}

function sha256(bytes: Uint8Array): Uint8Array {
  const bitLen = bytes.length * 8
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLen)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  const hi = Math.floor(bitLen / 0x100000000)
  view.setUint32(paddedLen - 8, hi, false)
  view.setUint32(paddedLen - 4, bitLen >>> 0, false)

  const h0 = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  const w = new Uint32Array(64)

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let t = 0; t < 16; t += 1) w[t] = view.getUint32(offset + t * 4, false)
    for (let t = 16; t < 64; t += 1) {
      const w15 = w[t - 15] ?? 0
      const w2 = w[t - 2] ?? 0
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3)
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10)
      w[t] = (((w[t - 16] ?? 0) + s0 + (w[t - 7] ?? 0) + s1) >>> 0)
    }
    let a = h0[0] ?? 0
    let b = h0[1] ?? 0
    let c = h0[2] ?? 0
    let d = h0[3] ?? 0
    let e = h0[4] ?? 0
    let f = h0[5] ?? 0
    let g = h0[6] ?? 0
    let h = h0[7] ?? 0
    for (let t = 0; t < 64; t += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + s1 + ch + (K[t] ?? 0) + (w[t] ?? 0)) >>> 0
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (s0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }
    h0[0] = ((h0[0] ?? 0) + a) >>> 0
    h0[1] = ((h0[1] ?? 0) + b) >>> 0
    h0[2] = ((h0[2] ?? 0) + c) >>> 0
    h0[3] = ((h0[3] ?? 0) + d) >>> 0
    h0[4] = ((h0[4] ?? 0) + e) >>> 0
    h0[5] = ((h0[5] ?? 0) + f) >>> 0
    h0[6] = ((h0[6] ?? 0) + g) >>> 0
    h0[7] = ((h0[7] ?? 0) + h) >>> 0
  }

  const out = new Uint8Array(32)
  const outView = new DataView(out.buffer)
  for (let i = 0; i < 8; i += 1) outView.setUint32(i * 4, h0[i] ?? 0, false)
  return out
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const block = 64
  let normalized = key
  if (normalized.length > block) normalized = sha256(normalized)
  if (normalized.length < block) {
    const padded = new Uint8Array(block)
    padded.set(normalized)
    normalized = padded
  }
  const outer = new Uint8Array(block)
  const inner = new Uint8Array(block)
  for (let i = 0; i < block; i += 1) {
    const byte = normalized[i] ?? 0
    outer[i] = byte ^ 0x5c
    inner[i] = byte ^ 0x36
  }
  return sha256(concat(outer, sha256(concat(inner, message))))
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Versión 2. La representación incluye todos los campos del paquete. */
export function canonicalPacket(input: Omit<LinkPacket, 'mac' | 'unit'> & { unit?: LinkPacket['unit'] }): string {
  return JSON.stringify([
    'v2', input.messageId, input.sequence, input.crewId, input.sensorId,
    input.kind, input.value, input.unit ?? UNIT_BY_KIND[input.kind],
    input.measuredAt, input.receivedAt, input.signalQuality, input.context,
  ])
}

export function signPayload(payload: string, key = DEMO_MAC_KEY): string {
  const enc = new TextEncoder()
  return toHex(hmacSha256(enc.encode(key), enc.encode(payload)))
}

export function verifyPayload(payload: string, mac: string, key = DEMO_MAC_KEY): boolean {
  const expected = signPayload(payload, key)
  if (expected.length !== mac.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i)
  }
  return diff === 0
}
