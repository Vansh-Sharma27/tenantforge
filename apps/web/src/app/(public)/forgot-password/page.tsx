"use client";

import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email and we'll send a reset link"
      footer={
        <>
          Remember your password?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-default">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
