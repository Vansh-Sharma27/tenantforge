"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

export function ShaderBackground() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none" style={{ zIndex: 0 }}>
      <MeshGradient
        width={dimensions.width}
        height={dimensions.height}
        colors={["#e2e8f0", "#d1fae5", "#f1f5f9", "#ecfdf5", "#f8fafc", "#a7f3d0"]}
        distortion={0.5}
        swirl={0.3}
        grainMixer={0}
        grainOverlay={0}
        speed={0.3}
        offsetX={0.08}
      />
      <div className="absolute inset-0 bg-white/50" />
    </div>
  );
}
