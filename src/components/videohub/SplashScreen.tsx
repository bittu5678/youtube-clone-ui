import React, { useEffect, useRef, useState, useCallback } from "react";
import { FacetubeLogoIcon } from "./FacetubeLogoIcon";

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  maxLife: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  color: string;
}

export function SplashScreen({ onComplete, durationMs = 3000 }: SplashScreenProps) {
  const [playCount, setPlayCount] = useState(1);
  const [stage, setStage] = useState<"initial" | "scaling" | "shockwave" | "ready" | "exiting">(
    "initial",
  );
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const shockwavesRef = useRef<
    Array<{ r: number; maxR: number; alpha: number; speed: number; color: string }>
  >([]);
  const burstParticlesRef = useRef<Particle[]>([]);
  const ambientParticlesRef = useRef<AmbientParticle[]>([]);
  const ringAngleRef = useRef(0);

  const handleDismiss = useCallback(() => {
    setStage("exiting");
    setTimeout(() => {
      setIsDismissed(true);
      if (onComplete) onComplete();
    }, 650);
  }, [onComplete]);

  // Support replaying via custom event or global helper
  useEffect(() => {
    const handleReplayEvent = () => {
      setIsDismissed(false);
      setStage("initial");
      setProgress(0);
      shockwavesRef.current = [];
      burstParticlesRef.current = [];
      setPlayCount((c) => c + 1);
    };

    window.addEventListener("facetube:replay-splash", handleReplayEvent);
    (window as unknown as { replayFaceTubeSplash?: () => void }).replayFaceTubeSplash =
      handleReplayEvent;

    return () => {
      window.removeEventListener("facetube:replay-splash", handleReplayEvent);
      delete (window as unknown as { replayFaceTubeSplash?: () => void }).replayFaceTubeSplash;
    };
  }, []);

  // Main timeline controller triggered on mount and on replay
  useEffect(() => {
    if (isDismissed) return;

    // Reset initial states
    setStage("initial");
    setProgress(0);

    // 1. Initial scale up start
    const scaleTimer = setTimeout(() => {
      setStage("scaling");
    }, 120);

    // 2. Shockwave / particle wave burst trigger around 850ms
    const shockTimer = setTimeout(() => {
      setStage("shockwave");

      // Spawn energetic shockwave rings and dynamic particle explosion
      if (canvasRef.current) {
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        const cx = w / 2;
        const cy = h / 2 - 24;

        // Primary glowing white shockwave
        shockwavesRef.current.push({
          r: 25,
          maxR: Math.max(w, h) * 0.72,
          alpha: 1,
          speed: 8.5,
          color: "rgba(255, 255, 255, 0.95)",
        });

        // Secondary cyan tech energy wave
        setTimeout(() => {
          shockwavesRef.current.push({
            r: 35,
            maxR: Math.max(w, h) * 0.65,
            alpha: 0.9,
            speed: 7.2,
            color: "rgba(56, 189, 248, 0.9)",
          });
        }, 110);

        // Third red brand energy wave
        setTimeout(() => {
          shockwavesRef.current.push({
            r: 30,
            maxR: Math.max(w, h) * 0.55,
            alpha: 0.8,
            speed: 6.0,
            color: "rgba(244, 6, 0, 0.85)",
          });
        }, 220);

        // Dynamic burst particles spreading in 360 degrees
        const count = 75;
        const colors = [
          "#ffffff",
          "#ffffff",
          "#38bdf8",
          "#7dd3fc",
          "#f40600",
          "#ff4d4d",
          "#bae6fd",
        ];

        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.8 + Math.random() * 7.5;
          burstParticlesRef.current.push({
            x: cx + Math.cos(angle) * 40,
            y: cy + Math.sin(angle) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.2 + Math.random() * 2.6,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            decay: 0.012 + Math.random() * 0.02,
            life: 0,
            maxLife: 65 + Math.random() * 45,
          });
        }
      }
    }, 850);

    // 3. Ready stage (revealing full FaceTube wordmark & status) around 1300ms
    const readyTimer = setTimeout(() => {
      setStage("ready");
    }, 1300);

    // Progress bar ticker
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / (durationMs - 450)) * 100));
      setProgress(pct);
    }, 28);

    // 4. Auto transition when duration finishes
    const autoExitTimer = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    return () => {
      clearTimeout(scaleTimer);
      clearTimeout(shockTimer);
      clearTimeout(readyTimer);
      clearTimeout(autoExitTimer);
      clearInterval(progressInterval);
    };
  }, [playCount, durationMs, handleDismiss, isDismissed]);

  // Keyboard shortcut (Escape / Space / Enter to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDismiss]);

  // High performance Canvas rendering loop
  useEffect(() => {
    if (isDismissed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initAmbient();
    };

    window.addEventListener("resize", handleResize);

    const initAmbient = () => {
      ambientParticlesRef.current = [];
      const count = Math.min(60, Math.floor((width * height) / 16000));
      for (let i = 0; i < count; i++) {
        ambientParticlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -0.25 - Math.random() * 0.55,
          radius: 0.9 + Math.random() * 2.0,
          alpha: 0.2 + Math.random() * 0.65,
          baseAlpha: 0.2 + Math.random() * 0.65,
          color: Math.random() > 0.35 ? "#38bdf8" : "#ffffff",
        });
      }
    };

    initAmbient();

    let running = true;

    const render = () => {
      if (!running || !ctx) return;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 24;

      // 1. Draw glowing ambient floating particles
      for (let i = 0; i < ambientParticlesRef.current.length; i++) {
        const p = ambientParticlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -15) p.y = height + 15;
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw dynamic glowing white & cyan particle ring around the center logo
      ringAngleRef.current += 0.024;
      const ringRadius = width < 640 ? 64 : 88;
      const ringPoints = 32;

      ctx.save();
      for (let i = 0; i < ringPoints; i++) {
        const theta = ringAngleRef.current + (i * Math.PI * 2) / ringPoints;
        const pulse = Math.sin(theta * 3 + Date.now() * 0.006) * 5;
        const r = ringRadius + pulse;
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;

        const isSpark = i % 4 === 0;
        const ptRadius = isSpark ? 2.4 : 1.3;
        const ptAlpha = 0.35 + Math.sin(theta * 2 + Date.now() * 0.004) * 0.35;

        ctx.beginPath();
        ctx.arc(px, py, ptRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSpark ? "#ffffff" : "#38bdf8";
        ctx.globalAlpha = Math.max(0.12, ptAlpha);
        ctx.shadowBlur = isSpark ? 12 : 5;
        ctx.shadowColor = isSpark ? "#ffffff" : "#38bdf8";
        ctx.fill();
      }
      ctx.restore();

      // 3. Draw expanding shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.r += sw.speed;
        sw.alpha -= 0.013;

        if (sw.alpha <= 0 || sw.r >= sw.maxR) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = Math.max(1.5, 4.5 * (1 - sw.r / sw.maxR));
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.shadowBlur = 18;
        ctx.shadowColor = sw.color;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw burst particles spreading dynamically
      for (let i = burstParticlesRef.current.length - 1; i >= 0; i--) {
        const p = burstParticlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.965;
        p.vy *= 0.965;
        p.life += 1;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.life >= p.maxLife) {
          burstParticlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDismissed, playCount]);

  if (isDismissed) return null;

  const isExiting = stage === "exiting";
  const isScaled = stage !== "initial";
  const isShock = stage === "shockwave" || stage === "ready" || stage === "exiting";
  const isReady = stage === "ready" || stage === "exiting";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="FaceTube App Launch"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        backgroundColor: "#030714",
      }}
    >
      {/* 1. Futuristic Dark Navy Background with Radial Gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, #0f1c3f 0%, #080f26 40%, #030614 85%, #01030a 100%)",
        }}
      />

      {/* 2. Glowing Digital Tech Grid (Floor & Ceiling Perspective) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        {/* Top subtle ceiling grid */}
        <div
          className="absolute top-0 inset-x-0 h-1/3"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(56, 189, 248, 0.14) 1px, transparent 1px), linear-gradient(to right, rgba(56, 189, 248, 0.09) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        {/* 3D Perspective Digital Floor Grid */}
        <div
          className="absolute bottom-0 inset-x-0 h-1/2"
          style={{
            perspective: "500px",
            perspectiveOrigin: "50% 0%",
          }}
        >
          <div
            className="w-full h-full origin-top"
            style={{
              transform: "rotateX(62deg)",
              backgroundImage:
                "linear-gradient(to right, rgba(56, 189, 248, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.22) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              boxShadow: "inset 0 0 100px rgba(5, 10, 30, 0.9)",
              maskImage: "linear-gradient(to top, black 30%, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 95%)",
            }}
          />
        </div>

        {/* Central glowing horizontal horizon laser line */}
        <div
          className="absolute top-1/2 inset-x-0 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.2) 20%, rgba(255, 255, 255, 0.8) 50%, rgba(56, 189, 248, 0.2) 80%, transparent 100%)",
            boxShadow: "0 0 16px rgba(56, 189, 248, 0.6)",
          }}
        />
      </div>

      {/* 3. Central Ambient Blue & Red Energy Aura */}
      <div
        className={`absolute pointer-events-none rounded-full transition-all duration-1000 ease-out ${
          isShock ? "opacity-90 scale-125" : "opacity-40 scale-75"
        }`}
        style={{
          width: "480px",
          height: "480px",
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(244, 6, 0, 0.16) 45%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* 4. Canvas for dynamic particle wave, shockwaves, and sparks */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 w-full h-full" />

      {/* 5. Center Core: Animated FaceTube Logo & Branding */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 -mt-6">
        {/* Logo Container with Smooth Scale Animation */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Energy Pulse Ring */}
          <div
            className={`absolute rounded-full border border-cyan-400/35 transition-all duration-1000 ease-out ${
              isScaled
                ? "w-36 h-36 sm:w-44 sm:h-44 opacity-80 scale-100 animate-pulse"
                : "w-12 h-12 opacity-0 scale-50"
            }`}
            style={{
              boxShadow:
                "0 0 35px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(56, 189, 248, 0.15)",
            }}
          />

          {/* Secondary Red Glow Halo */}
          <div
            className={`absolute rounded-full transition-all duration-700 ease-out ${
              isShock ? "w-40 h-40 sm:w-48 sm:h-48 opacity-65" : "w-16 h-16 opacity-0"
            }`}
            style={{
              background: "radial-gradient(circle, rgba(244, 6, 0, 0.35) 0%, transparent 75%)",
              filter: "blur(20px)",
            }}
          />

          {/* High-Fidelity 3D FaceTube Logo */}
          <div
            className={`transform transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isScaled
                ? "scale-100 opacity-100 drop-shadow-[0_12px_36px_rgba(244,6,0,0.6)]"
                : "scale-[0.32] opacity-0 blur-[2px]"
            }`}
          >
            <div className="relative group">
              {/* Responsive size: 92px on mobile, 122px on desktop */}
              <div className="sm:hidden">
                <FacetubeLogoIcon size={94} />
              </div>
              <div className="hidden sm:block">
                <FacetubeLogoIcon size={124} />
              </div>

              {/* Specular light flash across the logo */}
              <div
                className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700 ${
                  isShock ? "opacity-35" : "opacity-0"
                }`}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, transparent 60%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* 6. FaceTube Brand Typography underneath the logo */}
        <div
          className={`mt-6 sm:mt-7 flex flex-col items-center transition-all duration-700 ease-out ${
            isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* FaceTube Brand Wordmark */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight flex items-center gap-0.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">Face</span>
            <span
              className="text-[#f40600]"
              style={{
                textShadow: "0 0 20px rgba(244, 6, 0, 0.75), 0 0 45px rgba(244, 6, 0, 0.4)",
              }}
            >
              Tube
            </span>
          </h1>

          {/* Futuristic Slogan / Tagline */}
          <p className="mt-2 text-[10px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-cyan-200/80 drop-shadow-[0_1px_6px_rgba(56,189,248,0.5)]">
            Stream · Discover · Create
          </p>

          {/* Glowing Cyber Loading Progress Bar */}
          <div className="mt-5 w-36 sm:w-48 h-1 rounded-full bg-slate-800/80 overflow-hidden relative border border-slate-700/60 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #38bdf8 0%, #f40600 80%, #ffffff 100%)",
                boxShadow: "0 0 10px rgba(56, 189, 248, 0.8)",
              }}
            />
          </div>

          {/* Loading status micro-text */}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono tracking-wider">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{progress < 100 ? "CONNECTING..." : "LAUNCHING..."}</span>
          </div>
        </div>
      </div>

      {/* 7. Minimal Skip Control (Top Right) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-5 right-5 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md shadow-lg group"
        aria-label="Skip splash screen"
      >
        <span>Skip</span>
        <span className="text-cyan-400 transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </button>

      {/* 8. Tap anywhere hint for mobile accessibility */}
      <div className="absolute bottom-5 inset-x-0 text-center pointer-events-none z-20">
        <span className="text-[10px] text-slate-500/70 font-mono tracking-wide">
          Tap anywhere to continue
        </span>
      </div>
    </div>
  );
}
