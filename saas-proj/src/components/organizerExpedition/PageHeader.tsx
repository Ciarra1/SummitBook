import Link from "next/link";
import { PlusIcon } from "../Icons";
export default function PageHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Organizer dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
            Your expeditions
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Create, edit, and publish the trips travelers can book.
          </p>
        </div>

        <Link
          href="/organizer/manage-expedition/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <PlusIcon className="h-4 w-4" />
          New expedition
        </Link>
      </div>
    </header>
  );
}