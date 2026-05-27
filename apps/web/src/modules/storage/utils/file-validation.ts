/** WebM files begin with EBML header 0x1A45DFA3 */
const WEBM_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];

export function hasWebmMagicBytes(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < WEBM_MAGIC.length) return false;

  return WEBM_MAGIC.every((value, index) => bytes[index] === value);
}

export function validateUploadFilename(filename: string): boolean {
  const normalized = filename.trim().toLowerCase();
  if (!normalized.endsWith('.webm')) return false;
  if (normalized.includes('..') || normalized.includes('/') || normalized.includes('\\')) {
    return false;
  }

  return /^[\w.\- ()]+$/.test(normalized);
}

export function detectDangerousFilename(filename: string): boolean {
  const normalized = filename.toLowerCase();
  const blockedExtensions = ['.exe', '.php', '.js', '.html', '.svg', '.sh', '.bat', '.cmd'];
  return blockedExtensions.some((ext) => normalized.endsWith(ext));
}
