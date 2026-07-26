import React, { useEffect, useRef } from "react";

interface LiveBackgroundProps {
  theme?: "dark" | "light";
  className?: string;
}

type ParticleColorType = "indigo" | "teal" | "purple" | "rose" | "amber" | "cyan";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  colorType: ParticleColorType;
}

export function LiveBackground({ theme = "dark", className = "" }: LiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const orbsContainerRef = useRef<HTMLDivElement | null>(null);

  // Mouse tracking state using refs for 60fps canvas performance
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    active: false,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      
      // Calculate local mouse coordinates relative to canvas
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;

      // Smooth clamped parallax effect on background atmospheric orbs
      // Clamped to [-20px, 20px] to strictly avoid screen bleeding or horizontal scrolling
      if (orbsContainerRef.current) {
        const moveX = Math.max(-20, Math.min(20, ((e.clientX / window.innerWidth) - 0.5) * 30));
        const moveY = Math.max(-20, Math.min(20, ((e.clientY / window.innerHeight) - 0.5) * 30));
        orbsContainerRef.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(1.1)`;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
      if (orbsContainerRef.current) {
        orbsContainerRef.current.style.transform = `translate3d(0px, 0px, 0) scale(1.1)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const isLight = theme === "light";
      
      // Higher density in Light Mode as requested ("dots a little more")
      const particleCount = isLight 
        ? Math.floor(Math.min(width, height) / 8) + 48   // ~100-150 colorful dots
        : Math.floor(Math.min(width, height) / 14) + 28;  // ~50-80 dots in Dark Mode

      particles = [];
      const colorTypes: ParticleColorType[] = ["indigo", "teal", "purple", "rose", "amber", "cyan"];
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.48,
          vy: (Math.random() - 0.5) * 0.48,
          // Highly defined, colorful dots in light mode
          radius: isLight ? Math.random() * 2.8 + 1.8 : Math.random() * 2.2 + 1.2,
          // High opacity base in light mode so colorful dots pop out vibrantly
          baseAlpha: isLight ? Math.random() * 0.45 + 0.45 : Math.random() * 0.35 + 0.20,
          pulseSpeed: Math.random() * 0.025 + 0.012,
          pulsePhase: Math.random() * Math.PI * 2,
          colorType: colorTypes[i % colorTypes.length],
        });
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const isLight = theme === "light";

      // Smoothly interpolate mouse position for fluid movement
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.14;
      mouse.y += (mouse.targetY - mouse.y) * 0.14;

      // Rich colorful theme palette map
      const colorPalette: Record<ParticleColorType, { r: number; g: number; b: number }> = isLight
        ? {
            indigo: { r: 79, g: 70, b: 229 },  // #4F46E5 - Deep Indigo
            teal: { r: 13, g: 148, b: 136 },   // #0D9488 - Emerald Teal
            purple: { r: 147, g: 51, b: 234 }, // #9333EA - Vibrant Purple
            rose: { r: 225, g: 29, b: 72 },    // #E11D48 - Vibrant Rose
            amber: { r: 217, g: 119, b: 6 },   // #D97706 - Warm Gold/Amber
            cyan: { r: 2, g: 132, b: 199 },    // #0284C7 - Bright Cyan
          }
        : {
            indigo: { r: 129, g: 140, b: 248 }, // #818CF8
            teal: { r: 45, g: 212, b: 191 },   // #2DD4BF
            purple: { r: 192, g: 132, b: 252 }, // #C084FC
            rose: { r: 251, g: 113, b: 133 },   // #FB7185
            amber: { r: 251, g: 191, b: 36 },   // #FBBF24
            cyan: { r: 56, g: 189, b: 248 },    // #38BDF8
          };

      const lineRGB = isLight ? "79, 70, 229" : "129, 140, 248";
      const lineMaxDist = isLight ? 115 : 130;
      const lineAlphaMultiplier = isLight ? 0.32 : 0.18;
      const mouseAuraRGB = isLight ? "79, 70, 229" : "129, 140, 248";
      const mouseLineRGB = isLight ? "67, 56, 202" : "165, 180, 252";

      // Draw subtle mouse cursor aura if active inside window
      if (mouse.active && mouse.x > -100 && mouse.x < width + 100) {
        const auraGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, isLight ? 150 : 170
        );
        auraGrad.addColorStop(0, `rgba(${mouseAuraRGB}, ${isLight ? "0.22" : "0.16"})`);
        auraGrad.addColorStop(0.5, `rgba(${mouseAuraRGB}, ${isLight ? "0.08" : "0.05"})`);
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, isLight ? 150 : 170, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();
      }

      // Update and render colorful dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fluid mouse dispersion & attraction logic
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const maxMouseDist = 160;

          if (mdist < maxMouseDist && mdist > 0.1) {
            const force = (1 - mdist / maxMouseDist) * 0.85;
            // Repel particles smoothly away from active cursor
            p.x += (mdx / mdist) * force * 2.4;
            p.y += (mdy / mdist) * force * 2.4;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += p.pulseSpeed;

        // Soft bounce at canvas edges
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        const currentAlpha = isLight
          ? Math.max(0.35, p.baseAlpha + Math.sin(p.pulsePhase) * 0.22)
          : Math.max(0.12, p.baseAlpha + Math.sin(p.pulsePhase) * 0.18);

        const rgb = colorPalette[p.colorType];

        // Draw particle body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha.toFixed(3)})`;
        ctx.fill();

        // Draw outer glow/ring halo around colorful dots
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(currentAlpha * 0.32).toFixed(3)})`
          : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(currentAlpha * 0.20).toFixed(3)})`;
        ctx.fill();

        // Draw interactive connection beams directly to nearby mouse position
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const mouseConnectDist = 150;

          if (mdist < mouseConnectDist) {
            const mouseLineAlpha = (1 - mdist / mouseConnectDist) * (isLight ? 0.42 : 0.32);
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${mouseLineAlpha.toFixed(3)})`;
            ctx.lineWidth = isLight ? 1.3 : 1.0;
            ctx.stroke();
          }
        }
      }

      // Draw constellation threads between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < lineMaxDist) {
            const lineAlpha = (1 - dist / lineMaxDist) * lineAlphaMultiplier;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            // Mix particle color for colorful line connections in Light Mode
            const c1 = colorPalette[p1.colorType];
            ctx.strokeStyle = isLight 
              ? `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${lineAlpha.toFixed(3)})`
              : `rgba(${lineRGB}, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = isLight ? 1.0 : 0.8;
            ctx.stroke();
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [theme]);

  const isLight = theme === "light";

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-700 ${className}`}>
      
      {/* Dynamic Theme Atmospheric Background Gradient Base */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          background: isLight 
            ? "radial-gradient(circle at 50% 0%, #FFFFFF 0%, #F5F5ED 60%, #EAEAE0 100%)"
            : "radial-gradient(circle at 50% 0%, #0F172A 0%, #090D16 65%, #05070A 100%)"
        }}
      />

      {/* Atmospheric Theme-Aware Soft Floating Orbs with Scale & Clamped Mouse Parallax Container */}
      <div 
        ref={orbsContainerRef}
        className="absolute -top-12 -bottom-12 -left-12 -right-12 pointer-events-none overflow-hidden transition-transform duration-300 ease-out origin-center"
        style={{ transform: "scale(1.1)" }}
      >
        
        {/* Top-Right Orb - Rich indigo/violet in light mode */}
        <div 
          className={`absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full blur-[100px] transition-all duration-1000 ease-in-out ${
            isLight
              ? "bg-indigo-300/60 opacity-90"
              : "bg-indigo-600/20 opacity-90"
          }`}
        />

        {/* Bottom-Left Orb - Vibrant teal/emerald in light mode */}
        <div 
          className={`absolute -bottom-32 -left-32 w-[700px] h-[700px] rounded-full blur-[120px] transition-all duration-1000 ease-in-out ${
            isLight
              ? "bg-teal-300/55 opacity-85"
              : "bg-teal-500/15 opacity-80"
          }`}
        />

        {/* Center-Left Pulse Orb - Deep purple/rose accent in light mode */}
        <div 
          className={`absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[90px] animate-pulse transition-all duration-1000 ease-in-out ${
            isLight
              ? "bg-rose-200/50 opacity-80"
              : "bg-purple-600/12 opacity-80"
          }`}
        />

        {/* Top Center Highlight */}
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[110px] transition-all duration-1000 ease-in-out ${
            isLight
              ? "bg-sky-200/50 opacity-80"
              : "bg-indigo-500/10 opacity-70"
          }`}
        />
      </div>

      {/* HTML5 Canvas Particles & Interactive Constellation Web Layer */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block transition-opacity duration-700 opacity-95" 
      />

      {/* Subtle Grid / Structural Mesh Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          isLight ? "opacity-[0.08]" : "opacity-[0.06]"
        }`}
        style={{
          backgroundImage: isLight
            ? "radial-gradient(#334155 1.4px, transparent 1.4px)"
            : "radial-gradient(#818CF8 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />
    </div>
  );
}
