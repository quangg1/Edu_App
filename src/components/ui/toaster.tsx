"use client";

import { Toaster as HotToaster } from "sonner";

export function Toaster() {
  return (
    <HotToaster
      richColors
      position="top-right"
      closeButton
      theme="system" 
    />
  );
}
