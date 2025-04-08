// app/flights/results/page.tsx
"use client";

import React, { Suspense } from "react";
import FlightsResultsContent from "./FlightsResultContent";

export default function FlightsResultsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading flight results...</div>}>
      <FlightsResultsContent />
    </Suspense>
  );
}
