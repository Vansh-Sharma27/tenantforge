"use client";

import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ShaderBackground = dynamic(
  () => import("@/components/landing/ShaderBackground").then((mod) => mod.ShaderBackground),
  { ssr: false }
);

/* ─── Eye-tracking primitives ────────────────────────────────── */

function calcTrack(
  ref: React.RefObject<HTMLDivElement | null>,
  mx: number,
  my: number,
  max: number
) {
  if (!ref.current) return { x: 0, y: 0 };
  const r = ref.current.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = mx - cx;
  const dy = my - cy;
  const d = Math.min(Math.sqrt(dx * dx + dy * dy), max);
  const a = Math.atan2(dy, dx);
  return { x: Math.cos(a) * d, y: Math.sin(a) * d };
}

interface EyeBallProps {
  mouseX: number;
  mouseY: number;
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

function EyeBall({
  mouseX,
  mouseY,
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const ref = useRef<HTMLDivElement>(null);
  const forced = forceLookX !== undefined && forceLookY !== undefined;
  const pos = forced
    ? { x: forceLookX!, y: forceLookY! }
    : calcTrack(ref, mouseX, mouseY, maxDistance);

  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
}

interface PupilProps {
  mouseX: number;
  mouseY: number;
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

function Pupil({
  mouseX,
  mouseY,
  size = 12,
  maxDistance = 5,
  pupilColor = "#2D2D2D",
  forceLookX,
  forceLookY,
}: PupilProps) {
  const ref = useRef<HTMLDivElement>(null);
  const forced = forceLookX !== undefined && forceLookY !== undefined;
  const pos = forced
    ? { x: forceLookX!, y: forceLookY! }
    : calcTrack(ref, mouseX, mouseY, maxDistance);

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <div
        className="rounded-full absolute inset-0"
        style={{
          backgroundColor: pupilColor,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />
    </div>
  );
}

/* ─── Blink hook ─────────────────────────────────────────────── */

function useBlink() {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          setBlinking(true);
          setTimeout(() => {
            setBlinking(false);
            schedule();
          }, 150);
        },
        Math.random() * 4000 + 3000
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, []);
  return blinking;
}

/* ─── Character helpers ──────────────────────────────────────── */

function calcBodyPos(ref: React.RefObject<HTMLDivElement | null>, mx: number, my: number) {
  if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
  const r = ref.current.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 3;
  const dx = mx - cx;
  const dy = my - cy;
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  };
}

/* ─── Main layout ────────────────────────────────────────────── */

interface AnimatedAuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AnimatedAuthLayout({
  title,
  description,
  children,
  footer,
}: AnimatedAuthLayoutProps) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [_isFormFocused, setIsFormFocused] = useState(false);

  const tallRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const tallBlink = useBlink();
  const darkBlink = useBlink();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const tallPos = calcBodyPos(tallRef, mouseX, mouseY);
  const darkPos = calcBodyPos(darkRef, mouseX, mouseY);
  const roundPos = calcBodyPos(roundRef, mouseX, mouseY);
  const pillPos = calcBodyPos(pillRef, mouseX, mouseY);

  const handleFormFocus = (e: React.FocusEvent) => {
    setIsFormFocused(true);
    const t = e.target as HTMLInputElement;
    setIsPasswordFocused(
      t.type === "password" || t.id?.includes("password") || t.autocomplete?.includes("password")
    );
  };

  const handleFormBlur = () => {
    setIsFormFocused(false);
    setIsPasswordFocused(false);
  };

  const pwFocused = isPasswordFocused;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <ShaderBackground />
      {/* ── Left: Animated characters ── */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between bg-[#0A0A0B]/80 backdrop-blur-2xl p-12 text-white overflow-hidden">
        {/* Logo */}
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-4" />
            <span>TenantForge</span>
          </Link>
        </div>

        {/* Characters */}
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
            {/* Tall emerald character */}
            <div
              ref={tallRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 70,
                width: 180,
                height: pwFocused ? 440 : 400,
                backgroundColor: "#10B981",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform: pwFocused
                  ? `skewX(${(tallPos.bodySkew || 0) - 12}deg) translateX(40px)`
                  : `skewX(${tallPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: pwFocused ? 55 : `${45 + tallPos.faceX}px`,
                  top: pwFocused ? 65 : `${40 + tallPos.faceY}px`,
                }}
              >
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={tallBlink}
                  forceLookX={pwFocused ? 3 : undefined}
                  forceLookY={pwFocused ? 4 : undefined}
                />
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={tallBlink}
                  forceLookX={pwFocused ? 3 : undefined}
                  forceLookY={pwFocused ? 4 : undefined}
                />
              </div>
            </div>

            {/* Dark character */}
            <div
              ref={darkRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 240,
                width: 120,
                height: 310,
                backgroundColor: "#1C1C1C",
                borderRadius: "8px 8px 0 0",
                zIndex: 2,
                transform: pwFocused
                  ? `skewX(${(darkPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                  : `skewX(${darkPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: pwFocused ? 32 : `${26 + darkPos.faceX}px`,
                  top: pwFocused ? 12 : `${32 + darkPos.faceY}px`,
                }}
              >
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={darkBlink}
                  forceLookX={pwFocused ? 0 : undefined}
                  forceLookY={pwFocused ? -4 : undefined}
                />
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={darkBlink}
                  forceLookX={pwFocused ? 0 : undefined}
                  forceLookY={pwFocused ? -4 : undefined}
                />
              </div>
            </div>

            {/* Round emerald semicircle */}
            <div
              ref={roundRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 0,
                width: 240,
                height: 200,
                zIndex: 3,
                backgroundColor: "#059669",
                borderRadius: "120px 120px 0 0",
                transform: `skewX(${roundPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: `${82 + (roundPos.faceX || 0)}px`,
                  top: `${90 + (roundPos.faceY || 0)}px`,
                }}
              >
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                />
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                />
              </div>
            </div>

            {/* Pill-shaped light emerald */}
            <div
              ref={pillRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 310,
                width: 140,
                height: 230,
                backgroundColor: "#6EE7B7",
                borderRadius: "70px 70px 0 0",
                zIndex: 4,
                transform: `skewX(${pillPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: `${52 + (pillPos.faceX || 0)}px`,
                  top: `${40 + (pillPos.faceY || 0)}px`,
                }}
              >
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                />
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                />
              </div>
              {/* Mouth */}
              <div
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: `${40 + (pillPos.faceX || 0)}px`,
                  top: `${88 + (pillPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="relative z-20 flex items-center gap-8 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 bg-[size:24px_24px] bg-[image:linear-gradient(to_right,rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.04)_1px,transparent_1px)]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 size-96 bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 size-80 bg-emerald-600/6 rounded-full blur-3xl" />
      </div>

      {/* ── Right: Form ── */}
      <div className="relative z-10 flex items-center justify-center p-8 bg-white/50 backdrop-blur-2xl min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
            <Sparkles className="size-4 text-accent" />
            <span>TenantForge</span>
          </div>

          <div className="mb-8">
            <Link
              href="/"
              className="hidden lg:block text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-default mb-6"
            >
              TenantForge
            </Link>
            <h1 className="text-heading text-black">{title}</h1>
            {description && <p className="mt-2 text-body text-gray-500">{description}</p>}
          </div>

          <div onFocusCapture={handleFormFocus} onBlurCapture={handleFormBlur}>
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-small text-gray-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
