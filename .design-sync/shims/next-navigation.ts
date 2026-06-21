// /design-sync bundle shim for `next/navigation` — inert hooks that resolve to
// neutral values so a component reading the router/pathname renders statically
// instead of throwing outside a Next app. Wired via the bundle tsconfig's paths.
const noop = () => {};

export function useRouter() {
  return { push: noop, replace: noop, back: noop, forward: noop, refresh: noop, prefetch: noop };
}
export function usePathname() {
  return '/';
}
export function useSearchParams() {
  return new URLSearchParams();
}
export function useParams() {
  return {} as Record<string, string | string[]>;
}
export function useSelectedLayoutSegment() {
  return null;
}
export function useSelectedLayoutSegments() {
  return [] as string[];
}
export function redirect() {}
export function notFound() {}
