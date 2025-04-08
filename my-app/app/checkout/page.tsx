// app/checkout/page.tsx
"use client";

import React, { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
