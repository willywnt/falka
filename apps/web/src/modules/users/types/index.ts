import type { OrgRole } from '@falka/types';

/** What the shell needs to know about "my organization": name + my role. */
export interface OrgSummary {
  id: string;
  name: string;
  role: OrgRole;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: OrgRole;
  createdAt: string;
}

export interface UsersModuleConfig {
  defaultRole: OrgRole;
}

export const usersModuleConfig: UsersModuleConfig = {
  defaultRole: 'STAFF',
};
