import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          {title && <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, icon, trend, className = '' }: {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{value}</p>
          {trend && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{trend}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-800/60 text-brand-600 dark:text-brand-300">{icon}</div>
      </div>
    </div>
  );
}
