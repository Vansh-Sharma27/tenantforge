import { cn } from "@/lib/cn";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+-]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak" };
  if (score <= 3) return { score, label: "Fair" };
  if (score <= 4) return { score, label: "Good" };
  return { score, label: "Strong" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label } = getStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 transition-default",
              i < score
                ? score <= 2
                  ? "bg-red-400"
                  : score <= 3
                    ? "bg-amber-400"
                    : "bg-accent"
                : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "mt-1 text-xs",
          score <= 2 ? "text-red-500" : score <= 3 ? "text-amber-600" : "text-accent"
        )}
      >
        {label}
      </p>
    </div>
  );
}
