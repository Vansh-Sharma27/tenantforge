import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/Toast";
import { api, getApiError } from "@/lib/api";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validators";
import { useAuthStore } from "@/stores/authStore";

export function useLogin() {
  const { login } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post("/auth/login", input);
      return data;
    },
    onSuccess: (data) => {
      const { accessToken, refreshToken } = data.data;
      // Decode user from token
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      login(
        {
          id: payload.sub,
          email: payload.email,
          name: null,
          avatarUrl: null,
          status: "ACTIVE",
          emailVerified: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken,
        refreshToken
      );
      router.push("/dashboard");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useRegister() {
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { confirmPassword: _, ...body } = input;
      const { data } = await api.post("/auth/register", body);
      return data;
    },
    onSuccess: () => {
      toast("success", "Account created. Check your email for verification.");
      router.push("/login");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useForgotPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: ForgotPasswordInput) => {
      const { data } = await api.post("/auth/forgot-password", input);
      return data;
    },
    onSuccess: () => {
      toast("success", "If an account exists, you'll receive a reset email.");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useResetPassword() {
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ token, ...input }: ResetPasswordInput & { token: string }) => {
      const { confirmPassword: _, ...body } = input;
      const { data } = await api.post("/auth/reset-password", { ...body, token });
      return data;
    },
    onSuccess: () => {
      toast("success", "Password reset successfully. Please sign in.");
      router.push("/login");
    },
    onError: (error) => {
      toast("error", getApiError(error));
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post("/auth/verify-email", { token });
      return data;
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return () => {
    logout();
    router.push("/login");
  };
}
