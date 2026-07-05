'use client'
import React, { useState } from 'react';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  expedition: {
    mountain_name: string;
    date: string;
    price: number;
    pickup_location: string; 
    id: string;
    booked_slots: number;
  };
  hiker: {
    id: string,
    name: string;
    email: string;
    phone: string;
  };
}

export default function BookingModal({ isOpen, onClose, expedition, hiker}: BookingModalProps) {
      const router = useRouter();
  // 1. Changed state to track the hiker's phone number, pre-filled if available
  const [phoneNumber, setPhoneNumber] = useState(hiker.phone || '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    // 2. Updated validation

    if (!agreedToTerms || !phoneNumber) {
        alert("Please fill out your phone number and agree to the terms.");
        return;
    }

    setIsSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    
    // 3. Updated Payload: Mapped the input directly to participant_phone
    const bookingData = {
        hiker_id: hiker.id,
        expedition_id: expedition.id,
        booking_status: 'confirmed',
        payment_status: 'paid',
        final_price: expedition.price,
        participant_name: hiker.name,
        participant_email: hiker.email,
        participant_phone: phoneNumber, // Saved here!
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select();

      if (error) throw error;

     // 2. Safely trigger the database function to increment the slot
      const { error: updateError } = await supabase
        .rpc('book_expedition_slot', { 
            target_expedition_id: expedition.id 
        });

      if (updateError) throw updateError;
      
      console.log('Booking successful:', data);
      alert('Booking Confirmed!');
      
      // Reset state and close modal ONLY on success
      setPhoneNumber(hiker.phone || ''); 
      setAgreedToTerms(false);

      onClose();

      router.refresh();

      const bookingId = data[0].id; 
      router.push(`/hiker/manage-booking/${bookingId}`);
      
    } catch (err){
      console.error('Failed to insert data:', err);
      alert('Failed to process booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-black text-green-950 mb-1">Confirm Your Adventure</h2>
        <p className="text-sm text-slate-500 mb-5">Booking as <span className="font-semibold text-slate-700">{hiker.name}</span></p>

        {/* Read-Only Summary */}
        <div className="bg-slate-50 p-4 rounded-xl mb-5 border border-slate-100">
          <p className="font-bold text-green-900">{expedition.mountain_name}</p>
          <p className="text-sm text-slate-500">{expedition.date}</p>
          <div className="border-t border-slate-200 my-3"></div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">Total (1 Slot)</span>
            <span className="font-black text-green-800 text-lg">
                ₱{expedition.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Required Inputs & Details */}
        <div className="space-y-4 mb-6">
          <div>
            {/* 4. Updated Label and Input binding */}
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Mobile Number</label>
            <input 
              type="text" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full mt-1.5 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none transition-all" 
              placeholder="e.g. +63 912 345 6789" 
            />
          </div>
          
          {/* Read-Only Display */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Location</label>
            <div className="w-full mt-1.5 p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-700">
              {expedition.pickup_location || "To be announced by organizer"}
            </div>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input 
              type="checkbox" 
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-green-600 focus:outline-none checked:border-green-700 checked:bg-green-700 transition-colors cursor-pointer" 
            />
            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs text-slate-500 leading-tight group-hover:text-slate-700 transition-colors">
            I have read and agree to the organizer's Cancellation Policy and Assumption of Risk waiver.
          </span>
        </label>

        {/* Action Button */}
        <button 
          onClick={handleConfirm}
          disabled={!agreedToTerms || !phoneNumber || isSubmitting}
          className="w-full bg-green-800 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
        >
          {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
        </button>

      </div>
    </div>
  );
}