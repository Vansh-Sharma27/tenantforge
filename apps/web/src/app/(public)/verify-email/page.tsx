"use client";

import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense, useRef } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { useVerifyEmail } from "@/hooks/useAuth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const verify = useVerifyEmail();

  const hasRun = useRef(false);
  useEffect(() => {
    if (token && !hasRun.current) {
      hasRun.current = true;
      verify.mutate(token);
    }
  }, [token]);

  useEffect(() => {
    if (verify.isSuccess) {
      const timeout = setTimeout(() => router.push("/login"), 3000);
      return () => clearTimeout(timeout);
    }
  }, [verify.isSuccess, router]);

  if (!token) {
    return (
      <AuthLayout title="Invalid link">
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-small text-gray-600">This verification link is invalid.</p>
        </div>
      </AuthLayout>
    );
  }

  if (verify.isPending) {
    return (
      <AuthLayout title="Verifying email">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </AuthLayout>
    );
  }

  if (verify.isError) {
    return (
      <AuthLayout title="Verification failed">
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-small text-gray-600">This link is invalid or has expired.</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-small text-accent hover:text-accent-hover transition-default"
          >
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email verified">
      <div className="text-center py-4">
        <CheckCircle className="h-8 w-8 text-accent mx-auto mb-3" />
        <p className="text-small text-gray-600">
          Your email has been verified. Redirecting to sign in...
        </p>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
