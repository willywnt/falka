export const notificationKeys = {
  all: ['notifications'] as const,
  /** The navbar tray (page 1). */
  list: (page: number, pageSize: number) => ['notifications', 'list', page, pageSize] as const,
  /** The full paginated history page. Distinct branch so its shape never collides with the tray. */
  history: (page: number, pageSize: number) =>
    ['notifications', 'history', page, pageSize] as const,
};
