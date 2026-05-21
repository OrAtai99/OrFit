"use client";

import { ToastProvider } from "@/components/ui";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <PWAInstallPrompt />
    </ToastProvider>
  );
}
