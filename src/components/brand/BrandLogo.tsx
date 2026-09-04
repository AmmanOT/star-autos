type BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Keep logo on a white plate so it reads clearly in dark mode */
  framed?: boolean;
  /** Show “Auto Spare Parts” under the mark */
  showTagline?: boolean;
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

const taglineSize = {
  sm: 'text-[9px]',
  md: 'text-[10px]',
  lg: 'text-sm',
  xl: 'text-base',
};

export function BrandLogo({
  className = '',
  size = 'md',
  framed = true,
  showTagline = false,
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex flex-col items-center gap-1 ${framed ? '' : className}`}>
      <img
        src="/brand/madina-traders-logo.png"
        alt="Madina Traders"
        className={`${sizeMap[size]} w-auto object-contain`}
        draggable={false}
      />
      {showTagline ? (
        <p
          className={`${taglineSize[size]} font-semibold tracking-[0.18em] uppercase text-[#0B2545]`}
        >
          Auto Spare Parts
        </p>
      ) : null}
    </div>
  );

  if (!framed) return content;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${framePad[size]} ${className}`}
    >
      {content}
    </div>
  );
}
