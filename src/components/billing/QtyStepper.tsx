import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QtyStepperProps {
  value: number;
  max: number;
  min?: number;
  onChange: (qty: number) => void;
  onDecrementToZero?: () => void;
}

export function QtyStepper({ value, max, min = 1, onChange, onDecrementToZero }: QtyStepperProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setText(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
        onClick={() => {
          if (value <= min) {
            onDecrementToZero?.();
            return;
          }
          onChange(value - 1);
        }}
      >
        <Minus size={14} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Quantity"
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={() => commit(text)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(text);
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(max, value + 1));
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (value <= min) onDecrementToZero?.();
            else onChange(value - 1);
          }
        }}
        className="h-8 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-center text-sm font-medium text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
