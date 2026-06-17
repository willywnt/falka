import type { NotificationCategory } from '@prisma/client';

import type { PermissionKey } from '@/modules/users/permissions/catalog';

/**
 * Categories a member must NOT see in the tray when they lack the matching VIEW
 * permission — mirrors the nav hiding (a STAFF without `purchasing.view` can't open
 * the Pembelian section, so they shouldn't get its notifications either). OWNER's
 * permission set has every key, so nothing is hidden for them.
 */
export function hiddenNotificationCategories(permissions: {
  has: (key: PermissionKey) => boolean;
}): NotificationCategory[] {
  const hidden: NotificationCategory[] = [];
  if (!permissions.has('purchasing.view')) hidden.push('PURCHASING');
  if (!permissions.has('marketplace.view')) hidden.push('MARKETPLACE');
  return hidden;
}
