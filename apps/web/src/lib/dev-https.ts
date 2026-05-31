/** Whether the custom dev server uses HTTPS (mobile camera needs https on LAN). */
export function isDevHttpsEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const value = process.env.DEV_HTTPS?.trim().toLowerCase();

  if (value === 'false' || value === '0' || value === 'no') {
    return false;
  }

  if (value === 'true' || value === '1' || value === 'yes') {
    return true;
  }

  // Default: HTTPS in dev (required for phone camera on LAN IP)
  return true;
}
