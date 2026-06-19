'use client';

import { Mail } from 'lucide-react';

/** Footer email capture (visual-only — wire to your list provider). */
export function FooterSignup() {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="mt-5.5 flex max-w-[340px] gap-2">
      <span className="bg-sidebar-foreground/8 border-sidebar-foreground/15 flex flex-1 items-center gap-2 rounded-lg border px-3">
        <Mail className="text-sidebar-foreground/60 size-4 shrink-0" />
        <input
          type="email"
          placeholder="email kamu"
          aria-label="email"
          className="text-sidebar-foreground w-full min-w-0 bg-transparent py-2.75 text-[0.86rem] outline-none"
        />
      </span>
      <button
        type="submit"
        className="bg-primary text-primary-foreground rounded-lg px-3.75 text-[0.86rem] font-semibold"
      >
        Kabari saya
      </button>
    </form>
  );
}
