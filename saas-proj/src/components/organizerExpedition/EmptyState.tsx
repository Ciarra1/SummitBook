import { SearchIcon, MountainIcon, PlusIcon } from "../Icons";
import Link from "next/link";
export default function EmptyState({
  hasAnyExpeditions,
  onClearFilters,
}: {
  hasAnyExpeditions: boolean;
  onClearFilters: () => void;
}) {
  if (hasAnyExpeditions) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center">
        <SearchIcon className="h-8 w-8 text-stone-300" />
        <p className="mt-3 text-sm font-medium text-stone-700">No expeditions match</p>
        <p className="mt-1 text-sm text-stone-500">
          Try a different search term or clear your filters.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-4 rounded-lg border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white py-24 text-center">
      <MountainIcon className="h-10 w-10 text-stone-300" />
      <p className="mt-4 text-base font-semibold text-stone-900">
        No expeditions yet
      </p>
      <p className="mt-1 max-w-sm text-sm text-stone-500">
        Create your first expedition to start accepting bookings from travelers.
      </p>
      <Link
        href="/organizer/manage-expedition/new"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        <PlusIcon className="h-4 w-4" />
        New expedition
      </Link>
    </div>
  );
}