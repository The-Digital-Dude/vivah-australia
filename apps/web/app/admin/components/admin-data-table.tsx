'use client';

import { ReactNode, useState } from 'react';
import { Search } from 'lucide-react';
import { AdminEmptyState } from './admin-primitives';

export interface Column<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
}

export function AdminDataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  statusKey,
  statusOptions,
  actions,
  loading = false,
  emptyTitle = 'No items found',
  emptyDescription = 'There are no items matching the criteria.',
}: {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  statusKey?: keyof T;
  statusOptions?: string[];
  actions?: ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtering logic
  const filteredData = data.filter((item) => {
    const matchesSearch =
      !searchKey ||
      !search ||
      String(item[searchKey] ?? '')
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      !statusKey ||
      statusFilter === 'ALL' ||
      String(item[statusKey] ?? '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {searchKey && (
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-neutral-250 bg-white py-2 pl-9 pr-4 text-sm text-neutral-800 placeholder-neutral-400 outline-none ring-1 ring-transparent focus:border-[#7A1F2B] focus:ring-[#7A1F2B]/10"
              />
            </div>
          )}

          {statusKey && statusOptions && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-neutral-250 bg-white px-3 py-2 text-sm text-neutral-700 outline-none focus:border-[#7A1F2B]"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-neutral-700">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-6 py-4 ${col.className ?? ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-6 py-4">
                        <div className="h-4 rounded bg-neutral-100 w-2/3" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-neutral-50/50 transition">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 ${col.className ?? ''}`}>
                        {col.accessor(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <AdminEmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-4 text-xs font-semibold text-neutral-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent"
                type="button"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
