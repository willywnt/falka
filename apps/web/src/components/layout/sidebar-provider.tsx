'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const COLLAPSED_COOKIE = 'sidebar_collapsed';
const SECTIONS_COOKIE = 'sidebar_sections';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

type SidebarContextValue = {
  /** Whole-sidebar rail collapse (icons only). */
  collapsed: boolean;
  toggle: () => void;
  /** Section labels whose items are hidden (accordion). */
  collapsedSections: Set<string>;
  toggleSection: (label: string) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Holds the sidebar's collapse state. Both the rail-collapse and the per-section
 * accordion are seeded from server-read cookies, so the first paint already matches
 * the saved state (no open-then-close flash on refresh) and the choice persists.
 */
export function SidebarProvider({
  defaultCollapsed,
  defaultCollapsedSections,
  children,
}: {
  defaultCollapsed: boolean;
  defaultCollapsedSections: string[];
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(defaultCollapsedSections),
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCookie(COLLAPSED_COOKIE, next ? '1' : '0');
      return next;
    });
  }, []);

  const toggleSection = useCallback((label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      writeCookie(SECTIONS_COOKIE, [...next].join(','));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggle, collapsedSections, toggleSection }),
    [collapsed, toggle, collapsedSections, toggleSection],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}
