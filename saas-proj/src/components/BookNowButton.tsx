// components/BookNowButton.tsx
'use client';

import { useState } from "react";
import BookingModal from "./BookingModal"; // Adjust this path to where your modal is

interface BookNowButtonProps {
  availableSlots: number;
  expedition: {
    id: string;
    mountain_name: string;
    date: string;
    price: number;
    pickup_location: string;
    booked_slots: number;
  };
  hiker: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
}

export default function BookNowButton({ availableSlots, expedition, hiker }: BookNowButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        disabled={availableSlots <= 0}
        onClick={(e) => {
          e.stopPropagation();
          if (!hiker) {
            alert("Please log in to book an expedition.");
            return;
          }
          setIsModalOpen(true);
        }}
        className={`w-full text-white text-sm font-bold px-5 py-3 rounded-xl transition-all ${
          availableSlots <= 0 
            ? 'bg-slate-400 cursor-not-allowed' 
            : 'bg-green-800 hover:bg-green-700 active:scale-95 shadow-sm'
        }`}
      >
        {availableSlots <= 0 ? 'Fully Booked' : 'Book Now'}
      </button>

      {/* Render the modal here, passing the data we received */}
      {hiker && (
        <BookingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          expedition={expedition}
          hiker={hiker}
        />
      )}
    </>
  );
}