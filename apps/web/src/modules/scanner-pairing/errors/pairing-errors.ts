export const PAIRING_ERROR_CODES = {
  PAIRING_EXPIRED: 'PAIRING_EXPIRED',
  PAIRING_NOT_FOUND: 'PAIRING_NOT_FOUND',
  PAIRING_NOT_PENDING: 'PAIRING_NOT_PENDING',
  PAIRING_NOT_CONNECTED: 'PAIRING_NOT_CONNECTED',
  PAIRING_FORBIDDEN: 'PAIRING_FORBIDDEN',
  PAIRING_ALREADY_ACTIVE: 'PAIRING_ALREADY_ACTIVE',
  SCANNER_DISCONNECTED: 'SCANNER_DISCONNECTED',
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  RECORDING_ALREADY_ACTIVE: 'RECORDING_ALREADY_ACTIVE',
  WEBCAM_UNAVAILABLE: 'WEBCAM_UNAVAILABLE',
  RECOVERY_MODAL_ACTIVE: 'RECOVERY_MODAL_ACTIVE',
  UPLOAD_IN_PROGRESS: 'UPLOAD_IN_PROGRESS',
  TAB_LOCK_CONFLICT: 'TAB_LOCK_CONFLICT',
  DUPLICATE_SCAN: 'DUPLICATE_SCAN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type PairingErrorCode = (typeof PAIRING_ERROR_CODES)[keyof typeof PAIRING_ERROR_CODES];

export const PAIRING_ERROR_MESSAGES: Record<PairingErrorCode, string> = {
  PAIRING_EXPIRED:
    'This pairing session has expired. Generate a new QR code on the desktop station.',
  PAIRING_NOT_FOUND: 'Pairing session not found. Scan a fresh QR code from the recording station.',
  PAIRING_NOT_PENDING: 'This pairing session is no longer waiting for a mobile scanner.',
  PAIRING_NOT_CONNECTED: 'Mobile scanner is not connected. Reconnect from your phone.',
  PAIRING_FORBIDDEN: 'You do not have access to this pairing session.',
  PAIRING_ALREADY_ACTIVE:
    'A mobile scanner is already connected. Disconnect it before pairing again.',
  SCANNER_DISCONNECTED: 'Mobile scanner disconnected. Reconnect by scanning the QR code again.',
  CAMERA_PERMISSION_DENIED:
    'Camera permission is required to scan barcodes. Allow camera access in your browser settings.',
  RECORDING_ALREADY_ACTIVE:
    'A recording is already in progress. Stop it before scanning a new barcode.',
  WEBCAM_UNAVAILABLE: 'Webcam is not ready. Check camera permissions on the recording station.',
  RECOVERY_MODAL_ACTIVE:
    'Finish or dismiss pending recording recovery before auto-starting a new recording.',
  UPLOAD_IN_PROGRESS: 'Wait for the current upload to finish before starting another recording.',
  TAB_LOCK_CONFLICT: 'Recording is active in another browser tab on this station.',
  DUPLICATE_SCAN: 'This barcode was just scanned. Wait a moment before scanning again.',
  VALIDATION_ERROR: 'Invalid barcode or pairing data.',
  UNKNOWN: 'An unexpected scanner pairing error occurred.',
};

export class PairingError extends Error {
  readonly code: PairingErrorCode;
  readonly statusCode: number;

  constructor(code: PairingErrorCode, message?: string, statusCode = 400) {
    super(message ?? PAIRING_ERROR_MESSAGES[code]);
    this.name = 'PairingError';
    this.code = code;
    this.statusCode = statusCode;
  }

  static expired() {
    return new PairingError(PAIRING_ERROR_CODES.PAIRING_EXPIRED);
  }

  static notFound() {
    return new PairingError(PAIRING_ERROR_CODES.PAIRING_NOT_FOUND, undefined, 404);
  }

  static forbidden() {
    return new PairingError(PAIRING_ERROR_CODES.PAIRING_FORBIDDEN, undefined, 403);
  }

  static notConnected() {
    return new PairingError(PAIRING_ERROR_CODES.PAIRING_NOT_CONNECTED);
  }

  static duplicateScan() {
    return new PairingError(PAIRING_ERROR_CODES.DUPLICATE_SCAN);
  }

  static validation(message: string) {
    return new PairingError(PAIRING_ERROR_CODES.VALIDATION_ERROR, message);
  }
}
