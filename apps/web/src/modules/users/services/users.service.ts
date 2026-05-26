import type { UserListItem } from '../types';
import { appLogger } from '@/lib/logger';

export class UsersService {
  async list(_organizationId: string): Promise<UserListItem[]> {
    appLogger.info('UsersService.list called');
    return [];
  }

  async invite(_input: { email: string; role: string; organizationId: string }): Promise<void> {
    throw new Error('UsersService.invite not implemented');
  }

  async updateRole(_input: { userId: string; role: string }): Promise<void> {
    throw new Error('UsersService.updateRole not implemented');
  }
}

export const usersService = new UsersService();
