"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

interface TrustGaugeProps {
  score: number; // 0-100
  verdict: "AUTHENTIC" | "SUSPICIOUS" | "FORGED" | string;
  verdictColor: string;
  summary: string;
}

export default function TrustGauge({ score, verdict, verdictColor, summary }: TrustGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = Math.min(100, Math.max(0, score));
    const step = target / 30;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  // Radial calculation (radius = 70, circumference = 2 * pi * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const isAuthentic = verdict === "AUTHENTIC";
  const isForged = verdict === "FORGED";

  return (
    <div className="w-full cyber-glass rounded-2xl p-6 border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-4">
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
        AI VERIFIED TRUST INDEX SCORE
      </div>

      {/* SVG Radial Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
          {/* Background Track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="14"
            fill="transparent"
          />
          {/* Animated Glow Circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke={verdictColor}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px ${verdictColor})`
            }}
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="text-4xl font-black font-mono tracking-tighter"
            style={{ color: verdictColor, textShadow: `0 0 15px ${verdictColor}` }}
          >
            {animatedScore.toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
            CONFIDENCE RATING
          </span>
        </div>
      </div>

      {/* Verdict Badge */}
      <div
        className="px-6 py-2 rounded-xl font-mono text-sm font-black tracking-widest uppercase flex items-center space-x-2 border transition-all duration-300"
        style={{
          backgroundColor: `${verdictColor}20`,
          borderColor: verdictColor,
          color: verdictColor,
          boxShadow: `0 0 20px ${verdictColor}40`
        }}
      >
        {isAuthentic ? (
          <ShieldCheck className="w-5 h-5" />
        ) : isForged ? (
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}
        <span>VERDICT: {verdict}</span>
      </div>

      {/* Explication Summary */}
      <p className="text-xs text-slate-300 max-w-md font-mono leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        {summary}
      </p>
    </div>
  );
}
