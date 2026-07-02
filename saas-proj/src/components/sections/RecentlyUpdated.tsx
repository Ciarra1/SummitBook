import Link from 'next/link';

// Updated interface to match your new users table
interface RecentUpdate {
  id: string;
  updated_at: string;
  booking_status: string;
  payment_status: string;
  expeditions: {
    mountain_name: string;
  };
  participant_name: string;
}

export default function RecentlyUpdated({ updates }: { updates: RecentUpdate[] }) {
  if (!updates || updates.length === 0) {
    return null; // Hide the section if there's no activity
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-stone-800">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-stone-100">
        {updates.map((update) => {
          // Format the date (e.g., "2 hours ago" or "Oct 24")
          const date = new Date(update.updated_at).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          });
          
          const isCancelled = update.booking_status === 'cancelled';
          const isNew = update.payment_status === 'paid' && !isCancelled;

          const fullName = update.participant_name || 'A Hiker';

          return (
            <div key={update.id} className="p-4 sm:px-6 hover:bg-stone-50 transition-colors flex items-start gap-4">
              
              {/* Activity Icon */}
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isCancelled ? 'bg-red-500' : isNew ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-800">
                  <span className="font-semibold">{fullName}</span>
                  {isCancelled ? ' cancelled their booking for ' : ' updated their booking for '}
                  <span className="font-semibold">{update.expeditions?.mountain_name}</span>.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-stone-400 font-medium">{date}</span>
                  <span className="text-stone-300 text-xs">•</span>
                  <Link 
                    href={`/organizer/manage-booking/${update.id}`}
                    className="text-xs text-stone-500 hover:text-stone-800 font-medium underline-offset-2 hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}