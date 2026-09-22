import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

const ADD_VALUE = '__add_new__';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: { value: string; label: string }[];
}

function isTypeaheadKey(e: KeyboardEvent | globalThis.KeyboardEvent) {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ';
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
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pendingQuery = useRef('');
  const autoId = useId();
  const selectId = id ?? autoId;
  const current = String(value ?? '');
  const selected = options.find((o) => o.value === current) ?? options[0];
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.value === ADD_VALUE ||
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const gap = 4;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(320, openUp ? spaceAbove : spaceBelow));
      setPos({
        top: openUp ? r.top - maxHeight - gap : r.bottom + gap,
        left: r.left,
        width: Math.max(r.width, 180),
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
    const seed = pendingQuery.current;
    pendingQuery.current = '';
    setQuery(seed);
    const q = seed.trim().toLowerCase();
    const list = !q
      ? options
      : options.filter(
          (o) =>
            o.value === ADD_VALUE ||
            o.label.toLowerCase().includes(q) ||
            o.value.toLowerCase().includes(q),
        );
    const selectedIdx = list.findIndex((o) => o.value === current);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
    requestAnimationFrame(() => {
      const el = searchRef.current;
      if (!el) return;
      el.focus();
      if (seed) el.setSelectionRange(seed.length, seed.length);
    });
    // Seed/focus only when the menu opens, not on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, filtered]);

  const pick = (val: string) => {
    onChange?.({
      target: { value: val },
      currentTarget: { value: val },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setQuery('');
    btnRef.current?.focus();
  };

  const move = (delta: number) => {
    setActiveIndex((i) => {
      if (filtered.length === 0) return 0;
      return (i + delta + filtered.length) % filtered.length;
    });
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) pick(item.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (isTypeaheadKey(e)) {
      e.preventDefault();
      pendingQuery.current = `${pendingQuery.current}${e.key}`;
      setOpen(true);
    }
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
        aria-controls={`${selectId}-list`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
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
          <div
            ref={listRef}
            style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
            className="fixed z-[70] flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
          >
            <div className="shrink-0 p-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
                <input
                  ref={searchRef}
                  type="text"
                  className="select-search w-full ps-8 pe-2 py-1.5 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  placeholder="Search..."
                  value={query}
                  aria-autocomplete="list"
                  aria-controls={`${selectId}-list`}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                />
              </div>
            </div>
            <ul
              id={`${selectId}-list`}
              role="listbox"
              className="overflow-auto py-1 min-h-0 flex-1"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">No matches</li>
              )}
              {filtered.map((o, i) => {
                const isSel = o.value === current;
                const isActive = i === activeIndex;
                return (
                  <li key={`${o.value || '__empty__'}-${i}`} role="none">
                    <button
                      type="button"
                      role="option"
                      data-active={isActive ? 'true' : undefined}
                      aria-selected={isSel}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => pick(o.value)}
                      className={`w-full text-start px-3 py-2 text-sm ${
                        isSel
                          ? 'bg-brand-600 text-white dark:bg-[#4d6d8c] dark:text-white font-medium'
                          : isActive
                            ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)]'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                      }`}
                    >
                      {o.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
