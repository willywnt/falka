import type { UserRole } from '@falka/types';

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface UsersModuleConfig {
  defaultRole: UserRole;
}

export const usersModuleConfig: UsersModuleConfig = {
  defaultRole: 'member',
};
