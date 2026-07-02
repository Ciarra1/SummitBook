import Image from "next/image";
import Link from "next/link";
import { Expedition, ExpeditionStatus } from "@/types/expedition";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { EditIcon, EyeIcon, PublishIcon, UnpublishIcon, SpinnerIcon, MountainIcon } from "../Icons";

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

// 👇 Updated props to reflect Cancellation instead of Deletion
interface ExpeditionCardProps {
  expedition: Expedition;
  isPending: boolean;
  confirmingCancel: boolean;
  onTogglePublish: () => void;
  onRequestCancel: () => void;
  onDismissCancel: () => void;
  onConfirmCancel: () => void;
}

export default function ExpeditionCard({
  expedition,
  isPending,
  confirmingCancel,
  onTogglePublish,
  onRequestCancel,
  onDismissCancel,
  onConfirmCancel,
}: ExpeditionCardProps) {
  
  const booked = expedition.booked_slots || 0;
  const seatsLeft = expedition.total_van_slots - booked;
  const isFull = seatsLeft <= 0;
  
  const isNonPublishable = expedition.status === "completed" || expedition.status === "cancelled";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      
      {/* 1. Hero Image */}
      <div className="relative h-40 w-full bg-stone-100 sm:h-48">
        {expedition.mountain_img_url ? (
          <Image
            src={expedition.mountain_img_url}
            alt={expedition.mountain_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <MountainIcon className="h-10 w-10 text-stone-300" />
          </div>
        )}
      </div>

      {/* 2. Content Body */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Header: Title & Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 overflow-hidden">
            <h3 className="truncate text-base font-semibold text-stone-900">
              {expedition.title || expedition.mountain_name}
            </h3>
            <p className="mt-0.5 truncate text-sm text-stone-500">
              {expedition.mountain_name}
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={expedition.status} />
          </div>
        </div>

        {/* Metrics Box */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
          <div>
            <p className="text-xs font-medium text-stone-500">Dates</p>
            <p className="mt-0.5 font-medium text-stone-900">
              {expedition.start_date ? formatDate(expedition.start_date) : "TBD"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Price</p>
            <p className="mt-0.5 font-medium text-stone-900">
              ${expedition.price_per_person.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">Seats</p>
            <p className={`mt-0.5 font-medium ${isFull ? "text-red-600" : "text-stone-900"}`}>
              {booked} / {expedition.total_van_slots}
            </p>
          </div>
        </div>

        {/* Footer: Actions */}
        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-center justify-between text-xs text-stone-400">
            <p>Updated {formatRelativeTime(expedition.updated_at)}</p>
            {/* 👇 Only show Cancel button if it's not already cancelled or completed */}
            {!confirmingCancel && !isNonPublishable && (
              <button onClick={onRequestCancel} className="font-medium hover:text-red-600">
                Cancel Trip
              </button>
            )}
          </div>

          {/* 👇 Updated Confirmation UI */}
          {confirmingCancel ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-2">
              <p className="flex-1 px-1 text-xs font-medium text-red-700">Cancel Trip?</p>
              <button
                onClick={onDismissCancel}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-white"
              >
                No
              </button>
              <button
                onClick={onConfirmCancel}
                disabled={isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "..." : "Yes"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href={`/organizer/manage-expedition/${expedition.id}/bookings`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              >
                <UsersIcon className="h-4 w-4" />
                Manage Bookings
              </Link>

              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/organizer/manage-expedition/${expedition.id}/edit`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-2 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:text-sm"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  Edit
                </Link>

                <Link
                  href={`/expeditions/${expedition.id}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-2 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:text-sm"
                >
                  <EyeIcon className="h-3.5 w-3.5" />
                  View
                </Link>

                <button
                  onClick={onTogglePublish}
                  disabled={isPending || isNonPublishable}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${
                    expedition.status === "published"
                      ? "border border-stone-200 text-stone-700 hover:bg-stone-50"
                      : "bg-emerald-700 text-white hover:bg-emerald-800"
                  }`}
                >
                  {isPending ? (
                    <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : expedition.status === "published" ? (
                    <UnpublishIcon className="h-3.5 w-3.5" />
                  ) : (
                    <PublishIcon className="h-3.5 w-3.5" />
                  )}
                  {expedition.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// StatusBadge
function StatusBadge({ status }: { status: ExpeditionStatus }) {
  const styles: Record<ExpeditionStatus, string> = {
    published: "bg-emerald-100 text-emerald-800 border-emerald-200",
    draft: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  
  const labels: Record<ExpeditionStatus, string> = {
    published: "Published",
    draft: "Draft",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}