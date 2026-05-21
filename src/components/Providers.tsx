"use client";

import { ToastProvider } from "@/components/ui";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ProfileProvider } from "@/contexts/ProfileContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <ToastProvider>
        {children}
        <PWAInstallPrompt />
      </ToastProvider>
    </ProfileProvider>
  );
}
