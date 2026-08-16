"use client";

import React from "react";
import { Building2, Shield, Flame, Type, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface DiagnosticsData {
  institution: {
    score: number;
    details: {
      name: string;
      code: string;
      status: string;
      message: string;
    };
  };
  ela_compression: {
    score: number;
    mean_error: number;
    anomalies_found: number;
    flags: string[];
  };
  seal_emblem: {
    score: number;
    detected: boolean;
    flags: string[];
  };
  layout_typography: {
    score: number;
    flags: string[];
  };
}

interface DiagnosticCardsProps {
  diagnostics: DiagnosticsData;
}

export default function DiagnosticCards({ diagnostics }: DiagnosticCardsProps) {
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center space-x-1">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{score.toFixed(0)} / 100</span>
        </span>
      );
    } else if (score >= 55) {
      return (
        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{score.toFixed(0)} / 100</span>
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center space-x-1">
          <XCircle className="w-3.5 h-3.5" />
          <span>{score.toFixed(0)} / 100</span>
        </span>
      );
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2 font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
        <span>GRANULAR FORENSIC AUDIT BREAKDOWN</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: Database Name Registry Check */}
        <div className="cyber-glass rounded-2xl p-5 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold text-slate-200">1. Name Registry Match</h4>
                <p className="text-[11px] text-slate-400 font-mono">SQLite Name Whitelist Match</p>
              </div>
            </div>
            {getScoreBadge(diagnostics.institution.score)}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Verified Individual:</span>
              <span className="font-bold text-cyan-300">{diagnostics.institution.details.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registry Status:</span>
              <span className="text-slate-200">{diagnostics.institution.details.code}</span>
            </div>
            <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
              {diagnostics.institution.details.message}
            </p>
          </div>
        </div>

        {/* CARD 2: Seal & Emblem Authenticity */}
        <div className="cyber-glass rounded-2xl p-5 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold text-slate-200">2. Seal & Emblem SSIM</h4>
                <p className="text-[11px] text-slate-400 font-mono">Geometry & Feature Vector</p>
              </div>
            </div>
            {getScoreBadge(diagnostics.seal_emblem.score)}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Emblem Detected:</span>
              <span className="font-bold text-purple-300">
                {diagnostics.seal_emblem.detected ? "YES (Hough Verified)" : "PARTIAL"}
              </span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px]">
              {diagnostics.seal_emblem.flags.map((flag, idx) => (
                <div key={idx} className="text-slate-300">
                  • {flag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: ELA Compression Variance */}
        <div className="cyber-glass rounded-2xl p-5 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold text-slate-200">3. Error Level Analysis</h4>
                <p className="text-[11px] text-slate-400 font-mono">JPEG 90% Re-compression Delta</p>
              </div>
            </div>
            {getScoreBadge(diagnostics.ela_compression.score)}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Mean Compression Delta:</span>
              <span className="font-bold text-amber-300">{diagnostics.ela_compression.mean_error}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tamper Anomaly Boxes:</span>
              <span className="font-bold text-amber-300">{diagnostics.ela_compression.anomalies_found}</span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px]">
              {diagnostics.ela_compression.flags.map((flag, idx) => (
                <div key={idx} className="text-slate-300">
                  • {flag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 4: Layout & Font Alignment */}
        <div className="cyber-glass rounded-2xl p-5 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                <Type className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-bold text-slate-200">4. Layout & Font Alignment</h4>
                <p className="text-[11px] text-slate-400 font-mono">Baseline Tilt & Patch Variance</p>
              </div>
            </div>
            {getScoreBadge(diagnostics.layout_typography.score)}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="space-y-1 text-[11px]">
              {diagnostics.layout_typography.flags.map((flag, idx) => (
                <div key={idx} className="text-slate-300">
                  • {flag}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
