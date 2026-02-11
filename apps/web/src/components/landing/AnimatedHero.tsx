"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Code2,
  CreditCard,
  Layers,
  Lock,
  Mail,
  Menu,
  ScrollText,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import {
  Button,
  MovingBorderButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";

const navigationItems = [
  { title: "Features", href: "#features" },
  { title: "GitHub", href: "https://github.com/Vansh-Sharma27/tenantforge" },
];

const heroLabels = [
  { icon: Lock, label: "Secure by Default" },
  { icon: Zap, label: "Production Ready" },
  { icon: Building2, label: "Multi-Tenant" },
];

// Reordered: featured cards placed for bento grid layout
// Row 1 (lg): Auth(span-2) + API | Row 2: MultiTenancy + DevExp(span-2) | Row 3: Billing + Email + Audit
const features = [
  {
    icon: Shield,
    title: "Authentication",
    description:
      "JWT with RS256 signing, refresh token rotation, password reset, and email verification. Rate limiting and security headers baked into every endpoint.",
    tags: ["JWT", "RS256", "OAuth"],
    featured: true,
  },
  {
    icon: Layers,
    title: "API Architecture",
    description:
      "Express + TypeScript with layered architecture. Repository pattern, service layer, middleware chain, and comprehensive error handling.",
    tags: ["Express", "REST"],
  },
  {
    icon: Users,
    title: "Multi-Tenancy",
    description:
      "Workspace isolation, role-based access control, team invitations, ownership transfer. Four-tier permission model with granular controls.",
    tags: ["RBAC", "Workspaces"],
  },
  {
    icon: Code2,
    title: "Developer Experience",
    description:
      "Full TypeScript across the stack. ESLint, Prisma ORM, Docker Compose, shared types between frontend and backend. One command to start.",
    tags: ["TypeScript", "Monorepo"],
    featured: true,
  },
  {
    icon: CreditCard,
    title: "Billing",
    description:
      "Stripe subscriptions, checkout sessions, customer portal, and webhooks. Free, Pro, and Enterprise plans ready to ship.",
    tags: ["Stripe", "Subscriptions"],
  },
  {
    icon: Mail,
    title: "Email System",
    description:
      "Transactional emails via Resend with BullMQ job queue. Verification, invitations, and password reset flows built-in.",
    tags: ["Resend", "BullMQ"],
  },
  {
    icon: ScrollText,
    title: "Audit Logging",
    description:
      "Track every action with structured audit logs. Searchable, filterable, and ready for compliance requirements.",
    tags: ["Compliance"],
  },
];

export function AnimatedNavbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-50"
    >
      <div className="flex items-center justify-between px-6 py-5 max-w-content mx-auto">
        <Link href="/" className="text-subtitle text-gray-900 font-bold tracking-tight">
          TenantForge
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="text-small text-gray-600 hover:text-gray-900 transition-default"
            >
              {item.title}
            </Link>
          ))}
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation links</SheetDescription>
              <nav className="flex flex-col gap-6 mt-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="text-body text-gray-900 hover:text-accent transition-default"
                  >
                    {item.title}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="text-body text-gray-900 hover:text-accent transition-default"
                >
                  Sign in
                </Link>
                <Link href="/register" className="mt-4">
                  <Button className="w-full">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}

export function AnimatedHeroContent() {
  const titleWords = ["Multi-tenant", "SaaS.", "Built", "right."];

  return (
    <section className="px-6 pt-16 pb-8 max-w-3xl mx-auto text-center">
      {/* Animated Title */}
      <motion.h1
        initial={{ filter: "blur(8px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-display leading-tight tracking-tight text-black"
      >
        {titleWords.map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + index * 0.12,
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="inline-block mr-3 md:mr-4"
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-6 text-body text-gray-800 max-w-lg mx-auto leading-relaxed"
      >
        Production-ready foundation for your next SaaS product. Authentication, workspaces, team
        management, and billing — already done.
      </motion.p>

      {/* Labels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-6"
      >
        {heroLabels.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.0 + index * 0.1,
              duration: 0.4,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            className="flex items-center gap-2"
          >
            <item.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <span className="text-small text-gray-700">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 1.4,
          duration: 0.5,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <MovingBorderButton
          as={Link}
          href="/register"
          borderRadius="0.25rem"
          className="bg-accent text-white hover:bg-accent-hover h-11 px-8 text-body font-medium"
          containerClassName="h-11"
          borderClassName="bg-[radial-gradient(var(--accent-500)_40%,transparent_60%)]"
          duration={3000}
        >
          <span className="flex items-center gap-2">
            Start Building
            <ArrowRight className="h-4 w-4" />
          </span>
        </MovingBorderButton>
        <Link href="https://github.com/Vansh-Sharma27/tenantforge" target="_blank" rel="noopener">
          <Button variant="secondary" size="lg">
            View Source
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}

export function AnimatedFeatures() {
  return (
    <section id="features" className="px-6 pt-20 pb-24">
      <div className="max-w-content mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="text-xs uppercase tracking-widest text-accent font-medium text-center mb-3"
        >
          Features
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-heading text-black text-center mb-16"
        >
          Everything you need to ship
        </motion.h2>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
              }}
              className={feature.featured ? "md:col-span-2" : ""}
            >
              <div className="h-full bg-white/60 backdrop-blur-xl border border-white/80 p-8 group hover:bg-white/70 hover:border-white transition-all duration-300">
                <div
                  className={`mb-4 inline-flex items-center justify-center w-10 h-10 border transition-all duration-300 ${
                    feature.featured
                      ? "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30"
                      : "bg-white/60 border-white/80 group-hover:bg-white/80 group-hover:border-white"
                  }`}
                >
                  <feature.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-subtitle text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-small text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 border border-gray-300/60 text-gray-500 bg-white/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AnimatedFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4 }}
      className="px-6 py-10 border-t border-white/40"
    >
      <div className="max-w-content mx-auto flex flex-col items-center gap-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          TypeScript &middot; Express &middot; Next.js &middot; Prisma &middot; PostgreSQL &middot;
          Redis &middot; Stripe
        </p>
        <span className="text-xs text-gray-600">TenantForge &copy; {new Date().getFullYear()}</span>
      </div>
    </motion.footer>
  );
}
