import type { SVGProps } from 'react';

const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  arrowDown: 'M12 5v14m-6-6 6 6 6-6',
  file: 'M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 13h8m-8 4h5',
  folder: 'M3 6h7l2 3h9v11H3V6Z',
  image: 'M3 3h18v18H3V3Zm0 13 6-6 5 5 3-3 4 4M16 7h.01',
  link: 'm10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
  download: 'M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4',
  check: 'm5 12 4 4L19 6',
  copy: 'M8 8h13v13H8V8ZM16 4V2H2v14h2',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  refresh: 'M20 10a8 8 0 1 0 0 6M20 4v6h-6',
} as const;

export function Icon({
  name,
  ...props
}: { name: keyof typeof paths } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
