"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input, Button } from "@/components/ui";
import { useForgotPassword } from "@/hooks/useAuth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPassword = useForgotPassword();

  if (forgotPassword.isSuccess) {
    return (
      <div className="text-center py-4">
        <p className="text-body text-gray-900">Check your email</p>
        <p className="mt-2 text-small text-gray-500">
          If an account exists with that email, we sent a password reset link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => forgotPassword.mutate(data))} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" loading={forgotPassword.isPending} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
