import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  options,
  className = '',
  value,
  onChange,
  disabled,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const selectId = id ?? autoId;
  const current = String(value ?? '');
  const selected = options.find((o) => o.value === current) ?? options[0];
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const gap = 4;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(280, openUp ? spaceAbove : spaceBelow));
      setPos({
        top: openUp ? r.top - maxHeight - gap : r.bottom + gap,
        left: r.left,
        width: r.width,
        maxHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (val: string) => {
    onChange?.({
      target: { value: val },
      currentTarget: { value: val },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={wrapRef}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-text-muted)]">
          {label}
        </label>
      )}
      <button
        ref={btnRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate text-start">{selected?.label ?? ''}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
            className="fixed z-[70] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl py-1"
          >
            {options.map((o) => {
              const isSel = o.value === current;
              return (
                <li key={o.value || '__empty__'} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onClick={() => pick(o.value)}
                    className={`w-full text-start px-3 py-2 text-sm ${
                      isSel
                        ? 'bg-brand-600 text-white dark:bg-[#4d6d8c] dark:text-white font-medium'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    {o.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
