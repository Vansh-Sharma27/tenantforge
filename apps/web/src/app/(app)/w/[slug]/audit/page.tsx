"use client";

import { FileText } from "lucide-react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui";

export default function AuditLogPage() {
  const _params = useParams<{ slug: string }>();

  // Audit log read endpoint doesn't exist yet in the backend.
  // This page is prepared for when the API is ready.

  return (
    <div>
      <PageHeader title="Audit Log" description="Track workspace activity and changes" />

      <Card className="text-center py-16">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
        <p className="text-body text-gray-500">Audit log viewer coming soon.</p>
        <p className="mt-1 text-small text-gray-400">
          All workspace activity is being recorded. A read API endpoint is being built to display
          logs here.
        </p>
      </Card>
    </div>
  );
}
