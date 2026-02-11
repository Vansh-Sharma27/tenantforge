import { Lock } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#10B981_0%,#059669_50%,#047857_100%)] opacity-10" />
        <div className="relative z-10 px-16 max-w-lg">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-white/10 bg-white/5 mb-8">
            <Lock className="h-6 w-6 text-accent" strokeWidth={1.5} />
          </div>
          <h2 className="text-heading text-white mb-4">
            Multi-tenant SaaS.
            <br />
            Built right.
          </h2>
          <p className="text-body text-gray-400 leading-relaxed">
            Authentication, workspaces, team management, and billing — production-ready from day
            one.
          </p>
          <div className="mt-12 flex gap-6">
            {["TypeScript", "Next.js", "Prisma"].map((tech) => (
              <span key={tech} className="text-xs uppercase tracking-widest text-gray-500">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-default"
            >
              TenantForge
            </Link>
            <h1 className="mt-6 text-heading text-black">{title}</h1>
            {description && <p className="mt-2 text-body text-gray-400">{description}</p>}
          </div>

          <div className="border border-gray-200 bg-white p-8">{children}</div>

          {footer && <div className="mt-6 text-center text-small text-gray-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
