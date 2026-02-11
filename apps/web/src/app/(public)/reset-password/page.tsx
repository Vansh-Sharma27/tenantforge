"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <AuthLayout
        title="Invalid link"
        description="This password reset link is invalid or has expired."
      >
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-accent hover:text-accent-hover text-small transition-default"
          >
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Enter your new password"
      footer={
        <>
          Remember your password?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-default">
            Sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
