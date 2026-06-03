'use client';

import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { AdminEmptyState } from './admin-primitives';

export interface Column<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
  sortKey?: keyof T;
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
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Filtering & Sorting logic combined
  const processedData = useMemo(() => {
    // 1. Filter
    let result = data.filter((item) => {
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

    // 2. Sort
    if (sortField) {
      result = [...result].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        return sortDirection === 'asc'
          ? strA.localeCompare(strB, undefined, { numeric: true })
          : strB.localeCompare(strA, undefined, { numeric: true });
      });
    }

    return result;
  }, [data, search, searchKey, statusFilter, statusKey, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(processedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    return processedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [processedData, currentPage]);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-[#2F2F2F]/10 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
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
                className="w-full rounded-xl border border-neutral-250 bg-neutral-50 py-2.5 pl-9 pr-4 text-xs text-neutral-800 placeholder-neutral-400 outline-none focus:border-[#A10E4D] focus:bg-white transition"
              />
            </div>
          )}

          {statusKey && statusOptions && (
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-xl border border-neutral-250 bg-neutral-50 pl-3 pr-8 py-2.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#A10E4D] focus:bg-white transition"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3.5 h-3 w-3 text-neutral-500 pointer-events-none" />
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#2F2F2F]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-neutral-700">
            <thead className="border-b border-[#2F2F2F]/10 bg-neutral-50/75 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                {columns.map((col, idx) => {
                  const isSortable = !!col.sortKey;
                  const isSorted = sortField === col.sortKey;
                  return (
                    <th
                      key={idx}
                      onClick={() => isSortable && col.sortKey && handleSort(col.sortKey)}
                      className={`px-6 py-4 select-none ${col.className ?? ''} ${isSortable ? 'cursor-pointer hover:bg-neutral-100/80 transition-colors' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {isSortable && (
                          isSorted ? (
                            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 text-[#A10E4D]" /> : <ChevronDown className="h-3 w-3 text-[#A10E4D]" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-neutral-450" />
                          )
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
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
                  <tr key={rowIdx} className="hover:bg-[#FFF9F5]/30 transition-colors duration-150">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 text-xs ${col.className ?? ''}`}>
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
          <div className="flex items-center justify-between border-t border-[#2F2F2F]/10 bg-white px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-neutral-250 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                type="button"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-600" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-neutral-250 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                type="button"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4 text-neutral-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
