/**
 * PATIENT: BOOK A VISIT
 * The same slip as the landing page, picking up any draft held in memory from before sign-in.
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BookingSlip from '../../components/BookingSlip';
import PageHead from '../../components/PageHead';

export default function PatientBook() {
  const { pendingBooking } = useAuth();
  // Read the held draft once; the slip clears it from memory after booking.
  const [draft] = useState(pendingBooking);

  return (
    <div className="page page--slip">
      <PageHead
        title="Book a visit"
        lede="Choose a doctor, a day and an open time. The stub under the perforation is your copy."
      />
      <div className="slip-holder">
        <BookingSlip initialDraft={draft} />
      </div>
    </div>
  );
}
