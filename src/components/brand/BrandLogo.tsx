type BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Keep logo on a white plate so it reads clearly in dark mode */
  framed?: boolean;
};

const sizeMap = {
  sm: 'h-10 max-w-[120px]',
  md: 'h-16 max-w-[180px]',
  lg: 'h-40 max-w-[280px]',
  xl: 'h-48 max-w-[320px]',
};

const framePad = {
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
  xl: 'p-4',
};

export function BrandLogo({ className = '', size = 'md', framed = true }: BrandLogoProps) {
  const img = (
    <img
      src="/brand/star-autos-logo.png"
      alt="STAR AUTOS — Suzuki Spare Parts Wholesale & Retail"
      className={`${sizeMap[size]} w-auto object-contain ${framed ? '' : className}`}
      draggable={false}
    />
  );

  if (!framed) return img;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${framePad[size]} ${className}`}
    >
      {img}
    </div>
  );
}
