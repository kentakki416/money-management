"use client"

type PaginationProps = {
  currentPage: number
  onPageChange: (page: number) => void
  totalPages: number
}

export default function Pagination({
  currentPage,
  onPageChange,
  totalPages,
}: PaginationProps) {
  const pagesAroundCurrent = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + Math.max(currentPage - 1, 1)
  )

  return (
    <div className="flex items-center">
      <button
        className="mr-2.5 flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <div className="flex items-center gap-2">
        {currentPage > 3 && <span className="px-2">...</span>}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/8 hover:text-brand-500 dark:hover:text-brand-500 ${
              currentPage === page
                ? "bg-brand-500 text-white"
                : "text-gray-700 dark:text-gray-400"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages - 2 && <span className="px-2">...</span>}
      </div>
      <button
        className="ml-2.5 flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  )
}
