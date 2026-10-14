interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  shown: number;
  onPage: (page: number) => void;
  unit?: string;
}

export function Pagination({ page, pageSize, total, shown, onPage, unit }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + shown;
  const suffix = unit ? ` ${unit}` : '';

  return (
    <p className="text-xs text-[var(--color-text-muted)] mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>
        {total === 0 ? `0 of 0${suffix}` : `${start}–${end} of ${total}${suffix}`}
      </span>
      {pageCount > 1 && (
        <span className="inline-flex items-center gap-2">
          <button
            type="button"
            className="underline disabled:no-underline disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            className="underline disabled:no-underline disabled:opacity-40"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
          >
            Next
          </button>
        </span>
      )}
    </p>
  );
}
