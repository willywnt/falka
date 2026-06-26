export const expenseKeys = {
  all: ['expenses'] as const,
  list: (from: string, to: string, category: string) =>
    ['expenses', 'list', from, to, category] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
};
