"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input, Button } from "@/components/ui";
import { useResetPassword } from "@/hooks/useAuth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators";

import { PasswordStrength } from "./PasswordStrength";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPassword = useResetPassword();
  const password = watch("password", "");

  return (
    <form
      onSubmit={handleSubmit((data) => resetPassword.mutate({ ...data, token }))}
      className="space-y-4"
    >
      <div>
        <Input
          label="New Password"
          type="password"
          placeholder="Create a new password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {password && <PasswordStrength password={password} />}
      </div>
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" loading={resetPassword.isPending} className="w-full">
        Reset password
      </Button>
    </form>
  );
}
