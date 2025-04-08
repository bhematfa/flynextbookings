// app/invoice/page.tsx
import React, { Suspense } from "react";
import InvoiceContent from "./InvoiceContent";

export default function InvoicePage() {
  return (
    <Suspense fallback={<p className="text-black dark:text-gray-100">Loading invoice...</p>}>
      <InvoiceContent />
    </Suspense>
  );
}
