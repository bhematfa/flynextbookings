import React, { Suspense } from "react";
import MyBookingsContent from "./MyBookingsContent";

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<div>Loading bookings...</div>}>
      <MyBookingsContent />
    </Suspense>
  );
}
