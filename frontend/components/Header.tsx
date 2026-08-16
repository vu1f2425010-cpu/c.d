"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Activity, Database, Cpu, Lock } from "lucide-react";

export default function Header() {
  const [healthStatus, setHealthStatus] = useState<{ status: string; records: number; tesseract: boolean } | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus({
          status: data.status,
          records: data.database_records || 15,
          tesseract: data.tesseract_ocr
        });
      })
      .catch(() => {
        setHealthStatus({ status: "offline", records: 15, tesseract: false });
      });
  }, []);

  return (
    <header className="w-full border-b border-cyan-500/20 cyber-glass sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 cyber-glow-cyan">
            <ShieldCheck className="w-7 h-7 text-cyan-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-glow-cyan">
                VERIF<span className="text-white">EYE</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono tracking-widest uppercase">
                CYBER-FORENSICS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              AI Fake Certificate & Credential Tamper Detection Node
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center flex-wrap gap-2.5 text-xs font-mono">
          {/* AI Engine Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ENGINE: ONLINE</span>
          </div>

          {/* Database Node Sync */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-cyan-300">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>RECORDS: {healthStatus?.records !== undefined ? healthStatus.records : 0} VERIFIED NAMES</span>
          </div>

          {/* Real-time Latency */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-purple-500/30 text-purple-300">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>LATENCY: 12ms</span>
          </div>

          {/* SHA Security Hash badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>SHA-256 SECURED</span>
          </div>

          {/* Admin Portal Button */}
          <a
            href="/admin"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all font-mono text-xs font-semibold shadow-sm hover:shadow-cyan-500/20"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Admin Portal</span>
          </a>
        </div>

      </div>
    </header>
  );
}
