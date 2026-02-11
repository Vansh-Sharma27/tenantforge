"use client";

import Link from "next/link";

import { AnimatedAuthLayout } from "@/components/auth/AnimatedAuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AnimatedAuthLayout
      title="Create an account"
      description="Get started with TenantForge"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-default">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AnimatedAuthLayout>
  );
}
