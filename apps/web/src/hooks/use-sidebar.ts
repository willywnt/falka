'use client';

import { useUiStore } from '@/store/ui-store';

export function useSidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return { sidebarOpen, toggleSidebar, setSidebarOpen };
}

export function useMobileNav() {
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return { mobileNavOpen, setMobileNavOpen };
}
