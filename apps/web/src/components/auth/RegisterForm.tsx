"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input, Button } from "@/components/ui";
import { useRegister } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/validators";

import { PasswordStrength } from "./PasswordStrength";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useRegister();
  const password = watch("password", "");

  return (
    <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
      <Input
        label="Name"
        type="text"
        placeholder="Your name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div>
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {password && <PasswordStrength password={password} />}
      </div>
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" loading={registerMutation.isPending} className="w-full">
        Create account
      </Button>
    </form>
  );
}
