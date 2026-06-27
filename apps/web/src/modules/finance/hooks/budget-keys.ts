export const budgetKeys = {
  all: ['budgets'] as const,
  list: () => ['budgets', 'list'] as const,
  report: (month: string) => ['budgets', 'report', month] as const,
};
