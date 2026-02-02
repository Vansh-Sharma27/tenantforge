import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TenantForge",
  description: "Multi-tenant SaaS Starter Template",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
