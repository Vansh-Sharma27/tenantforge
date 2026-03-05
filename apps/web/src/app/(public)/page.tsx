import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@/components/ui";

const ShaderBackground = dynamic(
  () => import("@/components/landing/ShaderBackground").then((mod) => mod.ShaderBackground),
  {
    ssr: false,
  }
);

// Lazy load animated components to improve initial page load
const AnimatedNavbar = dynamic(
  () => import("@/components/landing/AnimatedHero").then((mod) => mod.AnimatedNavbar),
  {
    ssr: true,
    loading: () => <NavbarFallback />,
  }
);

const AnimatedHeroContent = dynamic(
  () => import("@/components/landing/AnimatedHero").then((mod) => mod.AnimatedHeroContent),
  {
    ssr: true,
    loading: () => <HeroFallback />,
  }
);

const AnimatedFeatures = dynamic(
  () => import("@/components/landing/AnimatedHero").then((mod) => mod.AnimatedFeatures),
  {
    ssr: true,
    loading: () => <FeaturesFallback />,
  }
);

const AnimatedTechStack = dynamic(
  () => import("@/components/landing/AnimatedHero").then((mod) => mod.AnimatedTechStack),
  {
    ssr: true,
  }
);

const AnimatedCTA = dynamic(
  () => import("@/components/landing/AnimatedHero").then((mod) => mod.AnimatedCTA),
  {
    ssr: true,
  }
);

const AnimatedFooter = dynamic(
  () => import("@/components/landing/AnimatedHero").then((mod) => mod.AnimatedFooter),
  {
    ssr: true,
  }
);

// Static fallback components for SSR
function NavbarFallback() {
  return (
    <nav className="relative z-50">
      <div className="flex items-center justify-between px-6 py-5 max-w-content mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">TF</span>
          </div>
          <span className="text-subtitle text-gray-900 font-bold tracking-tight">TenantForge</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-small text-gray-500 hover:text-gray-900 transition-default"
          >
            Features
          </Link>
          <Link
            href="#stack"
            className="text-small text-gray-500 hover:text-gray-900 transition-default"
          >
            Stack
          </Link>
          <Link
            href="https://github.com/Vansh-Sharma27/tenantforge"
            className="text-small text-gray-500 hover:text-gray-900 transition-default"
          >
            GitHub
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <Link
            href="/login"
            className="text-small text-gray-500 hover:text-gray-900 transition-default"
          >
            Sign in
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroFallback() {
  return (
    <section className="px-6 pt-20 pb-24 max-w-3xl mx-auto text-center">
      <h1 className="text-display leading-tight tracking-tight text-black">
        Stop rebuilding auth. Start shipping.
      </h1>
      <p className="mt-6 text-body text-gray-600 max-w-lg mx-auto leading-relaxed">
        A full-stack SaaS boilerplate with workspaces, RBAC, Stripe billing, and email — so you can
        focus on what makes your product different.
      </p>
      <div className="mt-10 flex items-center justify-center gap-4">
        <Link href="/register">
          <Button size="lg">Start Building</Button>
        </Link>
        <Link href="https://github.com/Vansh-Sharma27/tenantforge" target="_blank" rel="noopener">
          <Button variant="secondary" size="lg">
            View Source
          </Button>
        </Link>
      </div>
    </section>
  );
}

function FeaturesFallback() {
  return (
    <section id="features" className="px-6 pt-20 pb-24">
      <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Auth that ships", "Real multi-tenancy", "Stripe billing"].map((title, i) => (
          <div
            key={title}
            className={`p-8 ${i === 0 ? "bg-gray-900 text-white md:col-span-2" : "bg-white border border-gray-200"}`}
          >
            <div className={`mb-4 w-10 h-10 ${i === 0 ? "bg-emerald-500/20" : "bg-gray-100"}`} />
            <h3 className={`text-subtitle mb-2 ${i === 0 ? "text-white" : "text-gray-900"}`}>
              {title}
            </h3>
            <p
              className={`text-small leading-relaxed ${i === 0 ? "text-gray-300" : "text-gray-500"}`}
            >
              Loading\u2026
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Skip to content link for accessibility */}
      <a
        href="#features"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-small focus:font-medium focus:text-accent focus:border focus:border-accent"
      >
        Skip to content
      </a>

      <ShaderBackground />
      <div className="relative z-10">
        <AnimatedNavbar />
        <AnimatedHeroContent />
        <AnimatedFeatures />
        <AnimatedTechStack />
        <AnimatedCTA />
        <AnimatedFooter />
      </div>
    </div>
  );
}
