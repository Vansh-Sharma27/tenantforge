"use client";

import Link from "next/link";

import { AnimatedAuthLayout } from "@/components/auth/AnimatedAuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AnimatedAuthLayout
      title="Welcome back"
      description="Enter your credentials to continue"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:text-accent-hover transition-default">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm />
      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-small text-gray-500 hover:text-gray-700 transition-default"
        >
          Forgot password?
        </Link>
      </div>
    </AnimatedAuthLayout>
  );
}
