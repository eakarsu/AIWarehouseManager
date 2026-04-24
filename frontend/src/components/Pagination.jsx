import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const baseBtn =
    'inline-flex items-center justify-center h-9 min-w-[2.25rem] px-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500';

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {/* First page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`${baseBtn} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        title="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${baseBtn} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center h-9 min-w-[2.25rem] text-sm text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${baseBtn} ${
              page === currentPage
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${baseBtn} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Last page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`${baseBtn} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
