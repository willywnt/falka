// /design-sync bundle shim for `next/image` — a plain <img>. The Next image
// optimizer/loader can't run in the design preview environment; a bare img is
// the right static render. Wired via the bundle tsconfig's paths.
import * as React from 'react';

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
};

const Image = React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, fill, priority, quality, style, alt = '', ...props },
  ref,
) {
  const resolved = typeof src === 'string' ? src : (src?.src ?? '');
  const fillStyle = fill ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', ...style } : style;
  return <img ref={ref} src={resolved} alt={alt} style={fillStyle} {...props} />;
});

export default Image;
