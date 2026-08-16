"use client";

import React, { useEffect, useState } from "react";
import { Scan, Cpu, CheckCircle2, ShieldAlert } from "lucide-react";

interface ScanHUDProps {
  isScanning: boolean;
  imagePreviewUrl: string | null;
}

export default function ScanHUD({ isScanning, imagePreviewUrl }: ScanHUDProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Normalizing Image & Applying CLAHE Contrast Enhancement...",
    "Re-compressing JPEG at 90% & Computing ELA Heatmap...",
    "Extracting OCR Text & Querying Verified Name Database...",
    "Executing SSIM Feature & Circular Seal Emblem Matcher...",
    "Analyzing Typography Baseline Tilt & Aggregating Trust Score..."
  ];

  useEffect(() => {
    if (!isScanning) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden cyber-glass border border-cyan-400/50 p-6 space-y-4 shadow-2xl">
      {/* Sci-Fi Target Reticle & Image Scan Container */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-cyan-500/30 scanline-overlay">
        
        {/* Background Image Preview */}
        {imagePreviewUrl ? (
          <img src={imagePreviewUrl} alt="Scanning target" className="w-full h-full object-contain opacity-70 filter brightness-90" />
        ) : (
          <div className="text-cyan-500/40 text-center font-mono">
            <Scan className="w-16 h-16 mx-auto animate-pulse" />
            <p className="mt-2 text-xs">PROCESSING IMAGE MATRIX...</p>
          </div>
        )}

        {/* Laser Sweep Line */}
        <div className="animate-laser-sweep"></div>

        {/* Sci-Fi Corner Markers */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

        {/* Center Target HUD Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border border-cyan-400/30 flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
            <div className="w-20 h-20 rounded-full border border-dashed border-cyan-400/60"></div>
          </div>
        </div>

        {/* Top Status Banner */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-mono text-xs flex items-center space-x-2 cyber-glow-cyan">
          <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>CYBER-FORENSIC SCAN ACTIVE</span>
        </div>
      </div>

      {/* Real-time Step Logger */}
      <div className="space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span>PROGRESS: STEP {currentStep + 1} OF {steps.length}</span>
          <span className="text-cyan-400">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 cyber-glow-cyan"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-cyan-300 flex items-center space-x-3">
          <Scan className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-glow-cyan">{steps[currentStep]}</span>
        </div>
      </div>
    </div>
  );
}
