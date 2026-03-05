"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Code2,
  CreditCard,
  GitBranch,
  Layers,
  Lock,
  Mail,
  Menu,
  ScrollText,
  Shield,
  Terminal,
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
  { title: "Stack", href: "#stack" },
  { title: "GitHub", href: "https://github.com/Vansh-Sharma27/tenantforge" },
];

const heroLabels = [
  { icon: Lock, label: "Auth + RBAC included" },
  { icon: Building2, label: "Workspace isolation" },
  { icon: Zap, label: "Deploy in minutes" },
];

const techStack = [
  { name: "TypeScript", color: "#3178C6" },
  { name: "Next.js 14", color: "#000000" },
  { name: "Express", color: "#000000" },
  { name: "Prisma", color: "#2D3748" },
  { name: "PostgreSQL", color: "#4169E1" },
  { name: "Redis", color: "#DC382D" },
  { name: "Stripe", color: "#635BFF" },
  { name: "Docker", color: "#2496ED" },
];

const features = [
  {
    icon: Shield,
    title: "Auth that ships",
    description:
      "JWT with RS256, refresh token rotation, email verification, password reset. Rate limiting and security headers on every endpoint. Not a tutorial — battle-tested middleware.",
    tags: ["JWT", "RS256", "OAuth"],
    featured: true,
  },
  {
    icon: Layers,
    title: "Layered API",
    description:
      "Express + TypeScript. Repository pattern, service layer, middleware chain, structured error handling. The architecture you'd eventually refactor toward — already done.",
    tags: ["Express", "REST"],
  },
  {
    icon: Users,
    title: "Real multi-tenancy",
    description:
      "Workspace isolation, four-tier RBAC, team invitations, ownership transfer. Not a permissions library — a complete tenant system with data boundaries.",
    tags: ["RBAC", "Workspaces"],
  },
  {
    icon: Code2,
    title: "Monorepo DX",
    description:
      "Shared types between frontend and backend. ESLint, Prisma ORM, Docker Compose. One command boots the entire stack. Types flow end-to-end.",
    tags: ["TypeScript", "Monorepo"],
    featured: true,
  },
  {
    icon: CreditCard,
    title: "Stripe billing",
    description:
      "Checkout sessions, customer portal, webhook handling. Free / Pro / Enterprise tiers ready to customize. Skip the three-week Stripe integration sprint.",
    tags: ["Stripe", "Webhooks"],
  },
  {
    icon: Mail,
    title: "Transactional email",
    description:
      "Resend + BullMQ job queue. Verification, invitations, password resets — with retry logic and dead letter handling already wired up.",
    tags: ["Resend", "BullMQ"],
  },
  {
    icon: ScrollText,
    title: "Audit trail",
    description:
      "Structured audit logs for every workspace action. Filterable, searchable, and ready for SOC 2 conversations.",
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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-7 w-7 bg-gray-900 flex items-center justify-center group-hover:bg-accent transition-default">
            <span className="text-white text-xs font-bold">TF</span>
          </div>
          <span className="text-subtitle text-gray-900 font-bold tracking-tight">TenantForge</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="text-small text-gray-500 hover:text-gray-900 transition-default"
            >
              {item.title}
            </Link>
          ))}
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
  const titleWords = ["Stop", "rebuilding", "auth.", "Start", "shipping."];

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
        className="mt-6 text-body text-gray-600 max-w-lg mx-auto leading-relaxed"
      >
        A full-stack SaaS boilerplate with workspaces, RBAC, Stripe billing, and email — so you can
        focus on what makes your product different.
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
            <span className="text-small text-gray-600">{item.label}</span>
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
            <GitBranch className="h-4 w-4" />
            View Source
          </Button>
        </Link>
      </motion.div>

      {/* Terminal preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="mt-16 max-w-lg mx-auto"
      >
        <div className="bg-gray-900 border border-gray-800 overflow-hidden text-left">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-800">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
            <span className="ml-2 text-[11px] text-gray-500 font-mono">terminal</span>
          </div>
          <div className="px-4 py-3 font-mono text-[13px] leading-relaxed">
            <p className="text-gray-500">
              <span className="text-emerald-400">$</span> git clone tenantforge && cd tenantforge
            </p>
            <p className="text-gray-500">
              <span className="text-emerald-400">$</span> docker compose up -d
            </p>
            <p className="text-gray-500">
              <span className="text-emerald-400">$</span> npm run dev
            </p>
            <p className="mt-1 text-emerald-400 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />
              Ready on localhost:3000 — auth, billing, teams included
            </p>
          </div>
        </div>
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
          What&apos;s Included
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-heading text-black text-center mb-4"
        >
          Weeks of boilerplate, already written
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-body text-gray-500 text-center mb-16 max-w-lg mx-auto"
        >
          Every feature is production-tested, not tutorial-grade. Fork it, customize it, ship it.
        </motion.p>

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
              <div
                className={`h-full p-8 group transition-all duration-200 ${
                  feature.featured
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white border border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-sm"
                }`}
              >
                <div
                  className={`mb-4 inline-flex items-center justify-center w-10 h-10 ${
                    feature.featured ? "bg-emerald-500/20" : "bg-gray-100 group-hover:bg-accent/10"
                  } transition-colors duration-200`}
                >
                  <feature.icon
                    className={`h-5 w-5 ${feature.featured ? "text-emerald-400" : "text-gray-700 group-hover:text-accent"} transition-colors duration-200`}
                    strokeWidth={1.5}
                  />
                </div>
                <h3
                  className={`text-subtitle mb-2 ${feature.featured ? "text-white" : "text-gray-900"}`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-small leading-relaxed mb-4 ${feature.featured ? "text-gray-300" : "text-gray-500"}`}
                >
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 ${
                        feature.featured
                          ? "border border-white/20 text-gray-400"
                          : "border border-gray-200 text-gray-500"
                      }`}
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

export function AnimatedTechStack() {
  return (
    <section id="stack" className="px-6 py-20 border-t border-gray-100">
      <div className="max-w-content mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="text-xs uppercase tracking-widest text-gray-400 font-medium text-center mb-3"
        >
          Built With
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-heading text-black text-center mb-12"
        >
          Tools you already know
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {techStack.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tech.color }}
              />
              <span className="text-small font-medium text-gray-900">{tech.name}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mt-8 text-xs text-gray-400"
        >
          Full TypeScript end-to-end. Monorepo with shared types between frontend and backend.
        </motion.p>
      </div>
    </section>
  );
}

export function AnimatedCTA() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-content mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 px-8 py-16 md:px-16 text-center"
        >
          <h2 className="text-heading text-white mb-4">Your SaaS, minus the setup</h2>
          <p className="text-body text-gray-400 max-w-md mx-auto mb-8">
            Fork the repo, swap the branding, deploy. You keep the clean architecture — we did the
            boring parts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="https://github.com/Vansh-Sharma27/tenantforge"
              target="_blank"
              rel="noopener"
            >
              <Button
                variant="ghost"
                size="lg"
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <GitBranch className="h-4 w-4" />
                Star on GitHub
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            MIT Licensed &middot; No vendor lock-in &middot; Self-hosted
          </p>
        </motion.div>
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
      className="px-6 py-16 border-t border-gray-200 bg-gray-50/50"
    >
      <div className="max-w-content mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 bg-gray-900 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">TF</span>
              </div>
              <p className="text-small font-semibold text-gray-900">TenantForge</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Open-source SaaS starter template. Skip the boilerplate, keep the architecture. Fork
              it and make it yours.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-3">
                Product
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="#features"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-default"
                >
                  Features
                </Link>
                <Link
                  href="#stack"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-default"
                >
                  Tech Stack
                </Link>
                <Link
                  href="https://github.com/Vansh-Sharma27/tenantforge"
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-default"
                >
                  GitHub
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-3">
                Account
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-default"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-default"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-gray-400">
            TypeScript &middot; Express &middot; Next.js &middot; Prisma &middot; PostgreSQL
            &middot; Redis &middot; Stripe
          </p>
          <span className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} TenantForge
          </span>
        </div>
      </div>
    </motion.footer>
  );
}
