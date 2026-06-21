// /design-sync bundle shim for `next/link`. The Next runtime (router, prefetch,
// process.env.__NEXT_* reads) must not enter the design-system bundle — in the
// claude.ai/design preview environment there is no Next, and those reads throw
// "process is not defined". A plain anchor is the correct render for a static
// design preview. Wired via the bundle tsconfig's paths (see build-inputs.mjs).
import * as React from 'react';

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href?: string | { pathname?: string };
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, ...props },
  ref,
) {
  const resolved = typeof href === 'string' ? href : (href?.pathname ?? '#');
  return (
    <a ref={ref} href={resolved} {...props}>
      {children}
    </a>
  );
});

export default Link;
