'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

/** Landing header light/dark toggle (uses the app's next-themes provider). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === 'dark';
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Ganti tema"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {mounted ? dark ? <Sun className="size-4" /> : <Moon className="size-4" /> : null}
    </Button>
  );
}
