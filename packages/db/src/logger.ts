import type { Prisma } from '@prisma/client';

export function getPrismaLogLevels(): Prisma.LogLevel[] | Prisma.LogDefinition[] {
  if (process.env.NODE_ENV === 'development') {
    return [
      { emit: 'stdout', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ];
  }

  return [{ emit: 'stdout', level: 'error' }];
}
