import { createHmac, timingSafeEqual } from 'crypto'

export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Strip "sha256=" prefix if present
  const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}
