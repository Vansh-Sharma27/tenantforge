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
        <Link href="/" className="text-subtitle text-gray-900 font-bold tracking-tight">
          TenantForge
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-small text-gray-600 hover:text-gray-900 transition-default"
          >
            Features
          </Link>
          <Link
            href="https://github.com/Vansh-Sharma27/tenantforge"
            className="text-small text-gray-600 hover:text-gray-900 transition-default"
          >
            GitHub
          </Link>
          <Link
            href="/login"
            className="text-small text-gray-600 hover:text-gray-900 transition-default"
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
        Multi-tenant SaaS. Built right.
      </h1>
      <p className="mt-6 text-body text-gray-600 max-w-lg mx-auto leading-relaxed">
        Production-ready foundation for your next SaaS product. Authentication, workspaces, team
        management, and billing — already done.
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
        {["Authentication", "Multi-Tenancy", "Billing"].map((title) => (
          <div key={title} className="p-8 bg-white/60 backdrop-blur-xl border border-white/80">
            <div className="mb-4 w-10 h-10 bg-white/60 border border-white/80" />
            <h3 className="text-subtitle text-gray-900 mb-2">{title}</h3>
            <p className="text-small text-gray-600 leading-relaxed">Loading...</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ShaderBackground />
      <div className="relative z-10">
        <AnimatedNavbar />
        <AnimatedHeroContent />
        <AnimatedFeatures />
        <AnimatedFooter />
      </div>
    </div>
  );
}
