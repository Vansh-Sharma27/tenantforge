"use client";

import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button, Badge } from "@/components/ui";
import { useInvitationDetails, useAcceptInvitation } from "@/hooks/useInvitations";
import { useAuthStore } from "@/stores/authStore";

export default function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { data: invitation, isLoading, isError } = useInvitationDetails(token);
  const accept = useAcceptInvitation();

  if (isLoading) {
    return (
      <AuthLayout title="Loading invitation">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </AuthLayout>
    );
  }

  if (isError || !invitation) {
    return (
      <AuthLayout title="Invalid invitation">
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-small text-gray-600">
            This invitation link is invalid or has expired.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const handleAccept = async () => {
    await accept.mutateAsync(token);
    router.push(`/w/${invitation.workspace?.slug || "dashboard"}`);
  };

  return (
    <AuthLayout title="You're invited">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-body text-gray-900">You&apos;ve been invited to join</p>
          <p className="mt-1 text-title text-black">
            {invitation.workspace?.name || "a workspace"}
          </p>
          <div className="mt-2">
            <Badge>{invitation.role}</Badge>
          </div>
          {invitation.invitedBy && (
            <p className="mt-3 text-small text-gray-500">
              Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
            </p>
          )}
        </div>

        {isAuthenticated ? (
          <Button onClick={handleAccept} loading={accept.isPending} className="w-full">
            Accept Invitation
          </Button>
        ) : (
          <div className="space-y-3">
            <Link href={`/login?redirect=/invitations/${token}`}>
              <Button className="w-full">Sign in to accept</Button>
            </Link>
            <Link href={`/register?redirect=/invitations/${token}`}>
              <Button variant="secondary" className="w-full">
                Create account to accept
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
