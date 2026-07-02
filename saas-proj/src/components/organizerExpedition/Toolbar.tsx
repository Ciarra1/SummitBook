import { StatusFilter, SortKey } from "@/types/expedition";
import { SearchIcon } from "../Icons";

export default function Toolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  onSortKeyChange,
  counts,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  sortKey: SortKey;
  onSortKeyChange: (v: SortKey) => void;
  // 👇 1. Updated the counts interface to match your new schema
  counts: { all: number; draft: number; published: number; completed: number; cancelled: number };
}) {
  // 👇 2. Updated the filter buttons to match your new schema
  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "published", label: `Published (${counts.published})` },
    { key: "draft", label: `Draft (${counts.draft})` },
    { key: "completed", label: `Completed (${counts.completed})` },
    { key: "cancelled", label: `Cancelled (${counts.cancelled})` },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onStatusFilterChange(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              statusFilter === f.key
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by title or mountain"
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <select
          value={sortKey}
          onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
        >
          <option value="updated">Recently updated</option>
          <option value="start_date">Start date</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </div>
    </div>
  );
}