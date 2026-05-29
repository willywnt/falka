export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildUniqueSlug(base: string, existingSlugs: string[]): string {
  const normalized = slugify(base) || 'product';
  if (!existingSlugs.includes(normalized)) {
    return normalized;
  }

  let suffix = 2;
  while (existingSlugs.includes(`${normalized}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalized}-${suffix}`;
}
