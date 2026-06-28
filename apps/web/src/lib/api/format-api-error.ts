import type { ApiError } from '@palka/types';

export function formatApiErrorMessage(error: ApiError): string {
  if (error.details && typeof error.details === 'object') {
    const fieldMessages = Object.entries(error.details).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) return [];
      return messages.map((message) => `${field}: ${message}`);
    });

    if (fieldMessages.length > 0) {
      return fieldMessages.join('. ');
    }
  }

  return error.message;
}
