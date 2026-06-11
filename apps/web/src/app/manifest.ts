import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Falka',
    short_name: 'Falka',
    description: 'Stok akurat di semua channel, kasir, dan bukti packing untuk pedagang online.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfcf8',
    theme_color: '#262b38',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
