import { Agentation } from "agentation";
import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TenantForge",
  description: "Multi-tenant SaaS Starter Template",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </QueryProvider>
        <Agentation />
      </body>
    </html>
  );
}
