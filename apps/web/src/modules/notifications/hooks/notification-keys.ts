export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, pageSize: number) => ['notifications', 'list', page, pageSize] as const,
};
