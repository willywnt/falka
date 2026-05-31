/** Browsers only expose getUserMedia in a secure context (HTTPS or localhost). */
export function isSecureCameraContext(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}

export function isCameraApiAvailable(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.mediaDevices?.getUserMedia === 'function';
}

/** HTTPS URL the phone should use (env pairing URL or current host upgraded). */
export function getSuggestedSecureOrigin(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_PAIRING_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/^http:\/\//i, 'https://').replace(/\/$/, '');
  }

  if (typeof window === 'undefined') return null;

  const { hostname, port, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  if (protocol === 'https:') {
    return window.location.origin;
  }

  const portSuffix = port ? `:${port}` : '';
  return `https://${hostname}${portSuffix}`;
}

/**
 * Returns an operator-friendly message when the camera cannot start, or null if OK.
 */
export function getCameraUnavailableMessage(): string | null {
  if (typeof window === 'undefined') return null;

  if (!isSecureCameraContext()) {
    const secureUrl = getSuggestedSecureOrigin();
    if (secureUrl) {
      return (
        `Camera requires HTTPS. Open ${secureUrl} (not http on your LAN IP). ` +
        'On first visit, accept the self-signed certificate warning, then allow camera access.'
      );
    }

    return (
      'Camera requires a secure connection (HTTPS). ' +
      'Open the app via the https:// link from the dev server (not http:// on your LAN IP). ' +
      'On first visit, accept the self-signed certificate warning, then allow camera access.'
    );
  }

  if (!isCameraApiAvailable()) {
    return 'Camera is not available in this browser. Try Safari or Chrome on your phone.';
  }

  return null;
}
