/**
 * Hash a plaintext answer with SHA-256 via the Web Crypto API.
 * Normalises to UPPERCASE, trimmed, with internal whitespace collapsed.
 */
export async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.trim().toUpperCase().replace(/\s+/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Returns true if input (after normalisation) matches the stored hash. */
export async function checkAnswer(input: string, hash: string): Promise<boolean> {
  return (await hashAnswer(input)) === hash;
}
